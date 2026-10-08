import type { HistorialReserva, RepositorioHistorialReserva } from './ports.ts';

export async function consultarHistorialReserva(
  reservaId: number,
  repositorio: RepositorioHistorialReserva
): Promise<HistorialReserva | null> {
  if (!Number.isSafeInteger(reservaId) || reservaId < 1) return null;
  return repositorio.obtener(reservaId);
}
