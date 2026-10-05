import { calcularMetricasPanelReservas } from '../../_domain/reservas/adminMetrics.ts';
import type { PanelReservas, VistaPanelReservas } from '../../_domain/reservas/models.ts';
import type { RepositorioPanelReservas } from './ports.ts';

export const DIAS_PENDIENTE_VIEJA = 3;

export async function consultarPanelReservas(
  vista: VistaPanelReservas,
  repository: RepositorioPanelReservas,
  ahora = new Date()
): Promise<PanelReservas> {
  const [alojamientos, reservasOperativas, pendientesViejas, conversion] = await Promise.all([
    repository.listarAlojamientos(),
    repository.listarReservasOperativas(),
    repository.listarPendientesViejas(DIAS_PENDIENTE_VIEJA),
    repository.obtenerConversionManyChat(),
  ]);

  const reservas = vista === 'historial' ? await repository.listarHistorial() : reservasOperativas;

  return {
    metricas: calcularMetricasPanelReservas(
      reservasOperativas,
      pendientesViejas,
      conversion,
      DIAS_PENDIENTE_VIEJA,
      ahora
    ),
    alojamientos,
    reservas,
    vista,
  };
}
