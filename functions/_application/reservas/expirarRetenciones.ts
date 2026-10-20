import type { RepositorioRetencionesReserva } from './ports.ts';

export async function expirarRetenciones(
  repositorio: RepositorioRetencionesReserva,
  ahora: () => Date = () => new Date(),
  limite = 100
) {
  const limiteSeguro = Number.isInteger(limite) && limite > 0 ? Math.min(limite, 500) : 100;
  const reservas = await repositorio.expirarVencidas(ahora().toISOString(), limiteSeguro);
  return { expiradas: reservas.length, reservaIds: reservas };
}
