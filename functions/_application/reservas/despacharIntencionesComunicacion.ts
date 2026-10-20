import {
  codigoErrorComunicacionSeguro,
  proximoIntentoComunicacion,
} from '../../_domain/reservas/communicationIntents.ts';
import type {
  CanalComunicacion,
  RepositorioIntencionesComunicacion,
} from './ports.ts';

export type ResultadoDespachoComunicaciones = {
  reclamadas: number;
  entregadas: number;
  sinCanal: number;
  reprogramadas: number;
  deadLetter: number;
};

export async function despacharIntencionesComunicacion(
  repositorio: RepositorioIntencionesComunicacion,
  canal: CanalComunicacion | null,
  opciones: {
    limite?: number;
    maxIntentos?: number;
    ahora?: () => Date;
    aleatorio?: () => number;
    generarClaimUid?: () => string;
  } = {}
): Promise<ResultadoDespachoComunicaciones> {
  const ahora = opciones.ahora?.() ?? new Date();
  const maxIntentos = opciones.maxIntentos ?? 8;
  const claimUid = opciones.generarClaimUid?.() ?? crypto.randomUUID();
  const intenciones = await repositorio.reclamarLote({
    claimUid,
    limite: Math.max(1, Math.min(100, opciones.limite ?? 25)),
    ahora: ahora.toISOString(),
    claimExpiresAt: new Date(ahora.getTime() + 5 * 60_000).toISOString(),
  });
  const resultado: ResultadoDespachoComunicaciones = {
    reclamadas: intenciones.length,
    entregadas: 0,
    sinCanal: 0,
    reprogramadas: 0,
    deadLetter: 0,
  };

  for (const intencion of intenciones) {
    const completedAt = () => (opciones.ahora?.() ?? new Date()).toISOString();
    if (!canal) {
      await repositorio.marcarSinCanal({
        intencionUid: intencion.intencionUid,
        claimUid,
        completedAt: completedAt(),
      });
      resultado.sinCanal++;
      continue;
    }

    try {
      await canal.entregar(intencion);
      await repositorio.marcarEntregada({
        intencionUid: intencion.intencionUid,
        claimUid,
        canal: canal.codigo,
        completedAt: completedAt(),
      });
      resultado.entregadas++;
    } catch (error) {
      const agotada = intencion.attempts >= maxIntentos;
      await repositorio.marcarFalla({
        intencionUid: intencion.intencionUid,
        claimUid,
        canal: canal.codigo,
        errorCode: codigoErrorComunicacionSeguro(error),
        deadLetter: agotada,
        nextAttemptAt: agotada
          ? null
          : proximoIntentoComunicacion(intencion.attempts, ahora, opciones.aleatorio),
        completedAt: completedAt(),
      });
      if (agotada) resultado.deadLetter++;
      else resultado.reprogramadas++;
    }
  }

  return resultado;
}
