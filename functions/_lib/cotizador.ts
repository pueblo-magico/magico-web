// Fachada de compatibilidad para los endpoints legacy. La implementación vive
// en capas explícitas; los consumidores pueden migrar sin un corte coordinado.

import { cotizarEstadia as ejecutarCotizacion } from '../_application/reservas/cotizarEstadia.ts';
import type { RepositorioDisponibilidad } from '../_application/reservas/ports.ts';
import type { Disponibilidad, SolicitudCotizacion, TipoAlojamiento } from '../_domain/reservas/models.ts';
import { nochesEntre } from '../_domain/reservas/dateRange.ts';
import { calcularPrecio, mensajePrivacidad } from '../_domain/reservas/pricing.ts';
import { D1RepositorioDisponibilidad } from '../_infrastructure/d1/D1RepositorioDisponibilidad.ts';

export type { Cotizacion, Disponibilidad, TipoAlojamiento } from '../_domain/reservas/models.ts';
export { calcularPrecio, mensajePrivacidad, nochesEntre };

export async function chequearDisponibilidad(
  db: any,
  tipo: TipoAlojamiento,
  personas: number,
  fechaEntrada: string,
  fechaSalida: string
): Promise<Disponibilidad> {
  return new D1RepositorioDisponibilidad(db).consultar({
    tipo,
    personas,
    fechaEntrada,
    fechaSalida,
  });
}

export async function cotizarEstadia(
  db: any,
  solicitud: SolicitudCotizacion,
  repositorio?: RepositorioDisponibilidad
) {
  return ejecutarCotizacion(solicitud, repositorio || new D1RepositorioDisponibilidad(db));
}
