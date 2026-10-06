import type { RepositorioDisponibilidad } from '../../_application/reservas/ports.ts';
import type { Disponibilidad, SolicitudCotizacion } from '../../_domain/reservas/models.ts';

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first(): Promise<Record<string, unknown> | null>;
};
type D1Database = { prepare(query: string): D1Statement };

function alojamientoLegacy(codigo: string): number | null {
  if (codigo === 'domo-1') return 1;
  if (codigo === 'domo-2') return 2;
  if (codigo === 'refugio' || codigo === 'refugio-habitacion-4') return 3;
  return null;
}

function modalidadPorDefecto(solicitud: SolicitudCotizacion): 'privada' | 'compartida' | 'camping' {
  return solicitud.modalidad ?? (solicitud.tipo === 'domo' ? 'privada' : 'compartida');
}

export class D1RepositorioDisponibilidad implements RepositorioDisponibilidad {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async consultar(solicitud: SolicitudCotizacion): Promise<Disponibilidad> {
    const modalidad = modalidadPorDefecto(solicitud);
    const contexto = solicitud.contexto ?? 'general';
    if (modalidad === 'camping') return this.noDisponible(modalidad, 'MODALIDAD_NO_DISPONIBLE');
    return solicitud.tipo === 'domo'
      ? this.consultarDomos(solicitud, modalidad, contexto)
      : this.consultarRefugio(solicitud, modalidad, contexto);
  }

  private async consultarDomos(
    solicitud: SolicitudCotizacion,
    modalidad: 'privada' | 'compartida',
    contexto: 'general' | 'retiro'
  ): Promise<Disponibilidad> {
    const row = await this.db.prepare(`
      SELECT e.id espacio_id, e.codigo, e.capacidad_comercial,
        EXISTS (
          SELECT 1
          FROM reservas r
          JOIN reserva_estadias re ON re.reserva_id = r.id
          JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
          JOIN espacios reservado ON reservado.id = ree.espacio_id
          WHERE (
              r.estado = 'confirmada'
              OR (r.estado = 'pendiente' AND (r.hold_expires_at IS NULL OR r.hold_expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')))
            )
            AND re.fecha_checkin < ?2 AND re.fecha_checkout > ?1
            AND (reservado.id = e.id OR reservado.parent_id = e.id OR e.parent_id = reservado.id)
        ) OR EXISTS (
          SELECT 1
          FROM ocupacion_operativa oo
          LEFT JOIN unidades_inventario ui ON ui.id = oo.unidad_inventario_id
          JOIN espacios objetivo ON objetivo.id = COALESCE(oo.espacio_id, ui.espacio_id)
          WHERE oo.fecha_desde < ?2 AND oo.fecha_hasta > ?1
            AND (objetivo.id = e.id OR objetivo.parent_id = e.id OR e.parent_id = objetivo.id)
        ) ocupado
      FROM espacios e
      JOIN modalidades_espacio m ON m.espacio_id = e.id
      WHERE e.tipo = 'domo' AND e.estado = 'activo'
        AND e.capacidad_comercial >= ?3
        AND m.modalidad = ?4 AND m.contexto = ?5 AND m.habilitada = 1
        AND ((?5 = 'general' AND e.reservable_general = 1)
          OR (?5 = 'retiro' AND e.reservable_retiro = 1))
      ORDER BY ocupado ASC, e.codigo ASC
      LIMIT 1
    `).bind(
      solicitud.fechaEntrada, solicitud.fechaSalida, solicitud.personas, modalidad, contexto
    ).first();

    if (!row) return this.noDisponible(modalidad, 'CAPACIDAD_INSUFICIENTE');
    const codigo = String(row.codigo || '');
    const ocupado = Number(row.ocupado) === 1;
    return {
      estado: ocupado ? 'ocupado' : 'disponible',
      alojamiento_id: ocupado ? null : alojamientoLegacy(codigo),
      motivo_codigo: ocupado ? 'INVENTARIO_OCUPADO' : 'DISPONIBLE',
      espacio_id: Number(row.espacio_id),
      espacio_codigo: codigo,
      modalidad,
      capacidad_disponible: ocupado ? 0 : Number(row.capacidad_comercial),
    };
  }

  private async consultarRefugio(
    solicitud: SolicitudCotizacion,
    modalidad: 'privada' | 'compartida',
    contexto: 'general' | 'retiro'
  ): Promise<Disponibilidad> {
    const codigoObjetivo = modalidad === 'privada' ? 'refugio-habitacion-4' : 'refugio';
    const row = await this.db.prepare(`
      WITH RECURSIVE noches(fecha) AS (
        SELECT ?1
        UNION ALL SELECT date(fecha, '+1 day') FROM noches WHERE date(fecha, '+1 day') < ?2
      ), candidato AS (
        SELECT e.id, e.codigo, e.parent_id, e.capacidad_comercial
        FROM espacios e JOIN modalidades_espacio m ON m.espacio_id = e.id
        WHERE e.codigo = ?3 AND e.estado = 'activo'
          AND m.modalidad = ?4 AND m.contexto = ?5 AND m.habilitada = 1
          AND ((?5 = 'general' AND e.reservable_general = 1)
            OR (?5 = 'retiro' AND e.reservable_retiro = 1))
        LIMIT 1
      )
      SELECT c.id espacio_id, c.codigo, c.capacidad_comercial,
        COALESCE(MAX((
          SELECT SUM(re.cantidad_huespedes)
          FROM reservas r
          JOIN reserva_estadias re ON re.reserva_id = r.id
          JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
          JOIN espacios reservado ON reservado.id = ree.espacio_id
          WHERE (
              r.estado = 'confirmada'
              OR (r.estado = 'pendiente' AND (r.hold_expires_at IS NULL OR r.hold_expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')))
            )
            AND re.fecha_checkin <= n.fecha AND re.fecha_checkout > n.fecha
            AND (reservado.id = c.id OR reservado.parent_id = c.id OR c.parent_id = reservado.id)
        )), 0) reservas_ocupadas,
        COALESCE(MAX((
          SELECT SUM(CASE
            WHEN oo.origen_tipo = 'estadia_no_comercial' THEN oo.cantidad_personas
            WHEN oo.unidad_inventario_id IS NOT NULL THEN ui.capacidad
            ELSE objetivo.capacidad_comercial
          END)
          FROM ocupacion_operativa oo
          LEFT JOIN unidades_inventario ui ON ui.id = oo.unidad_inventario_id
          JOIN espacios objetivo ON objetivo.id = COALESCE(oo.espacio_id, ui.espacio_id)
          WHERE oo.fecha_desde <= n.fecha AND oo.fecha_hasta > n.fecha
            AND (objetivo.id = c.id OR objetivo.parent_id = c.id OR c.parent_id = objetivo.id)
        )), 0) operativas
      FROM candidato c CROSS JOIN noches n
      GROUP BY c.id, c.codigo, c.parent_id, c.capacidad_comercial
    `).bind(
      solicitud.fechaEntrada, solicitud.fechaSalida, codigoObjetivo, modalidad, contexto
    ).first();

    if (!row) return this.noDisponible(modalidad, 'MODALIDAD_NO_DISPONIBLE');
    const capacidad = Number(row.capacidad_comercial);
    const ocupadas = Number(row.reservas_ocupadas || 0) + Number(row.operativas || 0);
    // La venta privada ocupa la habitación completa. Hasta que WRESERV-15
    // asigne camas de forma definitiva, cualquier ocupación relacionada con
    // el refugio bloquea de manera conservadora la habitación privada.
    const capacidadDisponible = modalidad === 'privada' && ocupadas > 0
      ? 0
      : Math.max(0, capacidad - ocupadas);
    const disponible = solicitud.personas <= capacidadDisponible;
    const codigo = String(row.codigo);
    return {
      estado: disponible ? 'disponible' : 'ocupado',
      alojamiento_id: alojamientoLegacy(codigo),
      motivo_codigo: disponible
        ? 'DISPONIBLE'
        : solicitud.personas > capacidad ? 'CAPACIDAD_INSUFICIENTE' : 'INVENTARIO_OCUPADO',
      espacio_id: Number(row.espacio_id),
      espacio_codigo: codigo,
      modalidad,
      capacidad_disponible: capacidadDisponible,
    };
  }

  private noDisponible(
    modalidad: 'privada' | 'compartida' | 'camping',
    motivo: 'CAPACIDAD_INSUFICIENTE' | 'MODALIDAD_NO_DISPONIBLE'
  ): Disponibilidad {
    return {
      estado: 'ocupado', alojamiento_id: null, motivo_codigo: motivo,
      espacio_id: null, espacio_codigo: null, modalidad, capacidad_disponible: 0,
    };
  }
}
