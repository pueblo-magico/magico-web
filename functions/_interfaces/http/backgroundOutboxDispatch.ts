import { despacharEventosIntegracion } from '../../_application/reservas/despacharEventosIntegracion.ts';
import { D1RepositorioOutboxIntegracion } from '../../_infrastructure/d1/D1RepositorioOutboxIntegracion.ts';
import { HttpEntregadorEventosIntegracion } from '../../_infrastructure/integrations/HttpEntregadorEventosIntegracion.ts';

type WaitUntil = (promise: Promise<unknown>) => void;

type DependenciasDespacho = {
  despachar?: (env: Record<string, any>, eventIds: string[]) => Promise<{
    reclamados: number;
    entregados: number;
    reprogramados: number;
    deadLetter: number;
  }>;
  logger?: Pick<Console, 'info' | 'error'>;
  resolverEventIds?: (
    env: Record<string, any>,
    objetivo: ObjetivoDespachoOutbox
  ) => Promise<string[]>;
};

export type ObjetivoDespachoOutbox =
  | { eventIds: string[] }
  | { reservationId: number; communicationIntentTypes?: string[] };

function habilitado(valor: unknown): boolean {
  return typeof valor === 'string' && valor.trim().toLowerCase() === 'true';
}

async function resolverEventIdsPorDefecto(
  env: Record<string, any>,
  objetivo: ObjetivoDespachoOutbox
): Promise<string[]> {
  if ('eventIds' in objetivo) {
    return [...new Set(objetivo.eventIds.map(id => id.trim()).filter(Boolean))].slice(0, 100);
  }
  if (!Number.isSafeInteger(objetivo.reservationId) || objetivo.reservationId < 1) return [];
  const intentTypes = [...new Set(
    (objetivo.communicationIntentTypes || []).map(tipo => tipo.trim()).filter(Boolean)
  )].slice(0, 20);
  const filtroIntenciones = intentTypes.length > 0
    ? `AND event_type = 'comunicacion.intencion_creada'
       AND json_extract(payload_json, '$.intent_type') IN (${intentTypes.map(() => '?').join(', ')})`
    : '';
  const resultado = await env.DB.prepare(`
    SELECT event_id FROM integration_outbox
    WHERE estado = 'pending'
      AND CAST(json_extract(payload_json, '$.reservation_id') AS INTEGER) = ?
      ${filtroIntenciones}
    ORDER BY created_at, id LIMIT 100
  `).bind(objetivo.reservationId, ...intentTypes).all();
  return (resultado.results || []).map((row: Record<string, unknown>) => String(row.event_id));
}

async function despacharPorDefecto(env: Record<string, any>, eventIds: string[]) {
  return despacharEventosIntegracion(
    new D1RepositorioOutboxIntegracion(env.DB),
    new HttpEntregadorEventosIntegracion({
      url: env.INTEGRATION_EVENTS_WEBHOOK_URL,
      secret: env.INTEGRATION_EVENTS_WEBHOOK_SECRET,
    }),
    { consumer: 'integration_webhook_live', eventIds }
  );
}

/**
 * Inicia un despacho oportunista sin convertir a n8n en una dependencia de la
 * operación principal. El outbox sigue siendo la fuente durable y el job
 * programado conserva la responsabilidad de recuperar fallas o interrupciones.
 */
export function programarDespachoOutbox(
  env: Record<string, any>,
  waitUntil: WaitUntil | undefined,
  origen: string,
  objetivo: ObjetivoDespachoOutbox,
  dependencias: DependenciasDespacho = {}
): boolean {
  if (
    typeof waitUntil !== 'function' ||
    !habilitado(env?.INTEGRATION_OUTBOX_ENABLED) ||
    !env?.DB ||
    typeof env?.INTEGRATION_EVENTS_WEBHOOK_URL !== 'string' ||
    typeof env?.INTEGRATION_EVENTS_WEBHOOK_SECRET !== 'string'
  ) return false;

  const logger = dependencias.logger || console;
  const ejecutar = dependencias.despachar || despacharPorDefecto;
  const resolverEventIds = dependencias.resolverEventIds || resolverEventIdsPorDefecto;
  const tarea = Promise.resolve()
    .then(() => resolverEventIds(env, objetivo))
    .then(eventIds => eventIds.length > 0
      ? ejecutar(env, eventIds)
      : { reclamados: 0, entregados: 0, reprogramados: 0, deadLetter: 0 })
    .then(resultado => {
      logger.info(JSON.stringify({
        evento: 'outbox_despacho_inmediato_completado',
        origen,
        reclamados: resultado.reclamados,
        entregados: resultado.entregados,
        reprogramados: resultado.reprogramados,
        dead_letter: resultado.deadLetter,
      }));
    })
    .catch(error => {
      const codigo = error && typeof error === 'object' && 'codigo' in error
        ? String((error as { codigo?: unknown }).codigo || '')
        : error instanceof Error ? error.name : 'ERROR_DESCONOCIDO';
      logger.error(JSON.stringify({
        evento: 'outbox_despacho_inmediato_fallido',
        origen,
        codigo: /^[A-Z0-9_]{3,80}$/.test(codigo) ? codigo : 'ERROR_DESPACHO',
      }));
    });

  try {
    waitUntil(tarea);
    return true;
  } catch {
    // El lifecycle del runtime no debe cambiar la respuesta ya confirmada.
    return false;
  }
}
