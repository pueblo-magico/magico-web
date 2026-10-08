import type { RepositorioIntencionesComunicacion } from './ports.ts';

export async function consultarEstadoComunicaciones(
  repositorio: RepositorioIntencionesComunicacion,
  limite = 100,
  ahora: () => Date = () => new Date()
) {
  return repositorio.consultarEstado({
    limite: Math.max(1, Math.min(200, Math.trunc(limite) || 100)),
    ahora: ahora().toISOString(),
  });
}

export async function reprocesarIntencionComunicacion(
  entrada: {
    intencionUid: string;
    motivo: string;
    actorEmail: string;
    correlationId: string;
  },
  repositorio: RepositorioIntencionesComunicacion,
  ahora: () => Date = () => new Date()
): Promise<boolean> {
  const intencionUid = entrada.intencionUid.trim();
  const motivo = entrada.motivo.trim();
  if (!intencionUid || intencionUid.length > 200 || motivo.length < 8 || motivo.length > 500) {
    throw Object.assign(new Error('La solicitud de reproceso es inválida.'), {
      codigo: 'DATOS_INVALIDOS', status: 400,
    });
  }
  return repositorio.reprocesar({
    ...entrada, intencionUid, motivo, ahora: ahora().toISOString(),
  });
}
