import { agregarDiasIso } from '../../_domain/reservas/dateRange.ts';
import { fechaOperativaCordoba } from '../../_domain/reservas/operationalDate.ts';
import type { RepositorioRecordatoriosLlegadaEquipo } from './ports.ts';

export function normalizarDiasAnticipacionLlegada(valor: unknown): number {
  const dias = Number(valor);
  return Number.isSafeInteger(dias) && dias >= 1 && dias <= 30 ? dias : 1;
}

export async function programarRecordatoriosLlegadaEquipo(
  entrada: { diasAnticipacion?: unknown; limite?: number },
  repositorio: RepositorioRecordatoriosLlegadaEquipo,
  ahora: () => Date = () => new Date()
) {
  const instante = ahora();
  const diasAnticipacion = normalizarDiasAnticipacionLlegada(entrada.diasAnticipacion);
  const limite = Number.isSafeInteger(entrada.limite) && Number(entrada.limite) > 0
    ? Math.min(Number(entrada.limite), 500)
    : 100;
  const fechaObjetivo = agregarDiasIso(fechaOperativaCordoba(instante), diasAnticipacion);
  const eventIds = await repositorio.programar({
    fechaObjetivo,
    diasAnticipacion,
    creadoAt: instante.toISOString(),
    limite,
  });
  return {
    programadas: eventIds.length,
    fechaObjetivo,
    diasAnticipacion,
    eventIds,
  };
}
