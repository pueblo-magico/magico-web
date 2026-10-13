import { despacharEventosIntegracion } from '../../_application/reservas/despacharEventosIntegracion.ts';
import { D1RepositorioOutboxIntegracion } from '../../_infrastructure/d1/D1RepositorioOutboxIntegracion.ts';
import { HttpEntregadorEventosIntegracion } from '../../_infrastructure/integrations/HttpEntregadorEventosIntegracion.ts';

type WaitUntil = (promise: Promise<unknown>) => void;

type DependenciasDespacho = {
  despachar?: (env: Record<string, any>) => Promise<{
    reclamados: number;
    entregados: number;
    reprogramados: number;
    deadLetter: number;
  }>;
  logger?: Pick<Console, 'info' | 'error'>;
};

function habilitado(valor: unknown): boolean {
  return typeof valor === 'string' && valor.trim().toLowerCase() === 'true';
}

async function despacharPorDefecto(env: Record<string, any>) {
  return despacharEventosIntegracion(
    new D1RepositorioOutboxIntegracion(env.DB),
    new HttpEntregadorEventosIntegracion({
      url: env.INTEGRATION_EVENTS_WEBHOOK_URL,
      secret: env.INTEGRATION_EVENTS_WEBHOOK_SECRET,
    }),
    { consumer: 'integration_webhook_live', limite: 25 }
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
  const tarea = Promise.resolve()
    .then(() => ejecutar(env))
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
