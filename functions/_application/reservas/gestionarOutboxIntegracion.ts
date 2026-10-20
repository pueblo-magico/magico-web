import type { RepositorioOutboxIntegracion } from './ports.ts';

export async function consultarEstadoOutbox(
  repositorio: RepositorioOutboxIntegracion,
  limite = 100,
  ahora: () => Date = () => new Date()
) {
  return repositorio.consultarEstado({
    limite: Math.max(1, Math.min(200, Math.trunc(limite) || 100)),
    ahora: ahora().toISOString(),
  });
}

export async function reprocesarEventoOutbox(
  entrada: {
    eventId: string;
    motivo: string;
    actorEmail: string;
    correlationId: string;
  },
  repositorio: RepositorioOutboxIntegracion,
  ahora: () => Date = () => new Date()
): Promise<boolean> {
  const eventId = entrada.eventId.trim();
  const motivo = entrada.motivo.trim();
  if (!eventId || eventId.length > 200 || motivo.length < 8 || motivo.length > 500) {
    throw Object.assign(new Error('La solicitud de reproceso es inválida.'), {
      codigo: 'DATOS_INVALIDOS', status: 400,
    });
  }
  return repositorio.reprocesarDeadLetter({
    ...entrada, eventId, motivo, ahora: ahora().toISOString(),
  });
}
