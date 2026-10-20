import type { RepositorioExcepcionesCapacidad } from '../../_application/reservas/ports.ts';
import type {
  ContextoCapacidadReserva,
  EstadoExcepcionCapacidad,
  ExcepcionCapacidad,
  SolicitudExcepcionCapacidadValidada,
} from '../../_domain/reservas/capacityExceptions.ts';

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first(): Promise<Record<string, unknown> | null>;
};

type D1Database = {
  prepare(query: string): D1Statement;
};

function mapearExcepcion(fila: Record<string, unknown>): ExcepcionCapacidad {
  return {
    id: Number(fila.id),
    reservaId: Number(fila.reserva_id),
    reservaEstadiaId: Number(fila.reserva_estadia_id),
    capacidadAutorizada: Number(fila.capacidad_autorizada),
    motivo: String(fila.motivo),
    planCamas: String(fila.plan_camas),
    fechaDesde: fila.fecha_desde == null ? null : String(fila.fecha_desde),
    fechaHasta: fila.fecha_hasta == null ? null : String(fila.fecha_hasta),
    estado: fila.estado as EstadoExcepcionCapacidad,
    solicitadaPor: String(fila.solicitada_por),
    decididaPor: fila.decidida_por == null ? null : String(fila.decidida_por),
    solicitadaAt: String(fila.solicitada_at),
    decididaAt: fila.decidida_at == null ? null : String(fila.decidida_at),
  };
}

const CAMPOS_EXCEPCION = `
  ec.id, re.reserva_id, ec.reserva_estadia_id, ec.capacidad_autorizada,
  ec.motivo, ec.plan_camas, ec.fecha_desde, ec.fecha_hasta, ec.estado,
  ec.solicitada_por, ec.decidida_por, ec.solicitada_at, ec.decidida_at
`;

export class D1RepositorioExcepcionesCapacidad implements RepositorioExcepcionesCapacidad {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async obtenerContextoPorReserva(reservaId: number): Promise<ContextoCapacidadReserva | null> {
    const fila = await this.db.prepare(
      `SELECT
         r.id AS reserva_id, re.id AS reserva_estadia_id,
         re.fecha_checkin, re.fecha_checkout, re.cantidad_huespedes,
         e.codigo AS espacio_codigo, e.tipo AS espacio_tipo,
         e.capacidad_comercial, e.capacidad_operativa_maxima,
         COALESCE((
           SELECT SUM(ai.cantidad_huespedes)
           FROM asignaciones_inventario ai
           WHERE ai.reserva_estadia_id = re.id AND ai.estado = 'activa'
         ), 0) AS capacidad_asignada
       FROM reservas r
       JOIN reserva_estadias re ON re.reserva_id = r.id AND re.tramo = 1
       JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
       JOIN espacios e ON e.id = ree.espacio_id
       WHERE r.id = ?1`
    ).bind(reservaId).first();

    if (!fila) return null;
    return {
      reservaId: Number(fila.reserva_id),
      reservaEstadiaId: Number(fila.reserva_estadia_id),
      fechaCheckin: String(fila.fecha_checkin),
      fechaCheckout: String(fila.fecha_checkout),
      espacioCodigo: String(fila.espacio_codigo),
      espacioTipo: String(fila.espacio_tipo),
      capacidadComercial: Number(fila.capacidad_comercial),
      capacidadOperativaMaxima: Number(fila.capacidad_operativa_maxima),
      cantidadHuespedes: Number(fila.cantidad_huespedes),
      capacidadAsignada: Number(fila.capacidad_asignada),
    };
  }

  async obtenerPorId(excepcionId: number): Promise<ExcepcionCapacidad | null> {
    const fila = await this.db.prepare(
      `SELECT ${CAMPOS_EXCEPCION}
       FROM excepciones_capacidad ec
       JOIN reserva_estadias re ON re.id = ec.reserva_estadia_id
       WHERE ec.id = ?1`
    ).bind(excepcionId).first();
    return fila ? mapearExcepcion(fila) : null;
  }

  async crearSolicitud(
    solicitud: SolicitudExcepcionCapacidadValidada,
    actorEmail: string
  ): Promise<ExcepcionCapacidad> {
    const fila = await this.db.prepare(
      `INSERT INTO excepciones_capacidad (
         reserva_estadia_id, capacidad_autorizada, motivo, plan_camas,
         fecha_desde, fecha_hasta, solicitada_por
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
       RETURNING id, reserva_estadia_id, capacidad_autorizada, motivo, plan_camas,
                 fecha_desde, fecha_hasta, estado, solicitada_por, decidida_por,
                 solicitada_at, decidida_at`
    ).bind(
      solicitud.reservaEstadiaId,
      solicitud.capacidadAutorizada,
      solicitud.motivo,
      solicitud.planCamas,
      solicitud.fechaDesde,
      solicitud.fechaHasta,
      actorEmail
    ).first();

    if (!fila) throw new Error('D1 no devolvió la excepción creada.');
    return mapearExcepcion({ ...fila, reserva_id: solicitud.reservaId });
  }

  async cambiarEstado(
    excepcionId: number,
    estadoActual: EstadoExcepcionCapacidad,
    estadoNuevo: EstadoExcepcionCapacidad,
    actorEmail: string
  ): Promise<ExcepcionCapacidad | null> {
    const fila = await this.db.prepare(
      `UPDATE excepciones_capacidad
       SET estado = ?1,
           decidida_por = ?2,
           decidida_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?3 AND estado = ?4
       RETURNING id`
    ).bind(estadoNuevo, actorEmail, excepcionId, estadoActual).first();

    if (!fila) return null;
    return this.obtenerPorId(Number(fila.id));
  }
}
