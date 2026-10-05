import type { Disponibilidad, SolicitudCotizacion } from '../../_domain/reservas/models.ts';

export interface RepositorioDisponibilidad {
  consultar(solicitud: SolicitudCotizacion): Promise<Disponibilidad>;
}
