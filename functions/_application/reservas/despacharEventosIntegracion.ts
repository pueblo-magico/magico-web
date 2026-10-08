import {
  codigoErrorEntregaSeguro,
  proximoIntentoOutbox,
} from '../../_domain/reservas/integrationOutbox.ts';
import type {
  EntregadorEventoIntegracion,
  RepositorioOutboxIntegracion,
} from './ports.ts';

export type ResultadoDespachoOutbox = {
  reclamados: number;
  entregados: number;
  reprogramados: number;
  deadLetter: number;
};

export async function despacharEventosIntegracion(
  repositorio: RepositorioOutboxIntegracion,
  entregador: EntregadorEventoIntegracion,
  opciones: {
    consumer: string;
    limite?: number;
    maxIntentos?: number;
    ahora?: () => Date;
    aleatorio?: () => number;
    generarClaimUid?: () => string;
  }
): Promise<ResultadoDespachoOutbox> {
  const ahora = opciones.ahora?.() ?? new Date();
  const maxIntentos = opciones.maxIntentos ?? 8;
  const claimUid = opciones.generarClaimUid?.() ?? crypto.randomUUID();
  const eventos = await repositorio.reclamarLote({
    claimUid,
    limite: Math.max(1, Math.min(100, opciones.limite ?? 25)),
    ahora: ahora.toISOString(),
    claimExpiresAt: new Date(ahora.getTime() + 5 * 60_000).toISOString(),
  });
  const resultado: ResultadoDespachoOutbox = {
    reclamados: eventos.length, entregados: 0, reprogramados: 0, deadLetter: 0,
  };

  for (const evento of eventos) {
    try {
      await entregador.entregar(evento);
      await repositorio.marcarEntregado({
        eventId: evento.eventId, claimUid, consumer: opciones.consumer,
        completedAt: (opciones.ahora?.() ?? new Date()).toISOString(),
      });
      resultado.entregados++;
    } catch (error) {
      const agotado = evento.attempts >= maxIntentos;
      await repositorio.marcarFalla({
        eventId: evento.eventId,
        claimUid,
        consumer: opciones.consumer,
        errorCode: codigoErrorEntregaSeguro(error),
        deadLetter: agotado,
        nextAttemptAt: agotado ? null : proximoIntentoOutbox(
          evento.attempts, ahora, opciones.aleatorio
        ),
        completedAt: (opciones.ahora?.() ?? new Date()).toISOString(),
      });
      if (agotado) resultado.deadLetter++;
      else resultado.reprogramados++;
    }
  }
  return resultado;
}
