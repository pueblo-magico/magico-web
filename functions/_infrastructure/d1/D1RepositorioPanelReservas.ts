import type { RepositorioPanelReservas } from '../../_application/reservas/ports.ts';
import type {
  AlojamientoPanel,
  ConversionManyChat,
  PendienteVieja,
  ReservaPanel,
} from '../../_domain/reservas/models.ts';

type D1Result = { results?: Record<string, unknown>[] };

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  all(): Promise<D1Result>;
  first(): Promise<Record<string, unknown> | null>;
};

type D1Database = {
  prepare(query: string): D1Statement;
};

const CAMPOS_RESERVA = `
  r.id, r.cliente_nombre, r.cliente_telefono, r.cliente_email,
  r.alojamiento_id, a.nombre AS alojamiento_nombre, a.tipo AS alojamiento_tipo,
  r.fecha_checkin, r.fecha_checkout, r.cantidad_personas,
  r.monto_total, r.monto_sena, r.estado, r.unidad_asignada, r.canal_origen,
  r.mp_preference_id, r.mp_payment_id, r.manychat_user_id, r.created_at,
  ec.id AS excepcion_capacidad_id,
  ec.capacidad_autorizada AS excepcion_capacidad_autorizada,
  ec.motivo AS excepcion_motivo,
  ec.plan_camas AS excepcion_plan_camas,
  ec.fecha_desde AS excepcion_fecha_desde,
  ec.fecha_hasta AS excepcion_fecha_hasta,
  ec.estado AS excepcion_estado,
  ec.solicitada_por AS excepcion_solicitada_por,
  ec.decidida_por AS excepcion_decidida_por,
  ec.solicitada_at AS excepcion_solicitada_at,
  ec.decidida_at AS excepcion_decidida_at
`;

const JOINS_EXCEPCION = `
  LEFT JOIN reserva_estadias re ON re.reserva_id = r.id AND re.tramo = 1
  LEFT JOIN excepciones_capacidad ec
    ON ec.reserva_estadia_id = re.id
   AND ec.id = (
     SELECT ec2.id
     FROM excepciones_capacidad ec2
     WHERE ec2.reserva_estadia_id = re.id
     ORDER BY ec2.id DESC
     LIMIT 1
   )
`;

function mapearReserva(fila: Record<string, unknown>): ReservaPanel {
  const {
    excepcion_capacidad_id,
    excepcion_capacidad_autorizada,
    excepcion_motivo,
    excepcion_plan_camas,
    excepcion_fecha_desde,
    excepcion_fecha_hasta,
    excepcion_estado,
    excepcion_solicitada_por,
    excepcion_decidida_por,
    excepcion_solicitada_at,
    excepcion_decidida_at,
    ...reserva
  } = fila;

  return {
    ...reserva,
    excepcion_capacidad: excepcion_capacidad_id == null ? null : {
      id: Number(excepcion_capacidad_id),
      capacidad_autorizada: Number(excepcion_capacidad_autorizada),
      motivo: String(excepcion_motivo),
      plan_camas: String(excepcion_plan_camas),
      fecha_desde: excepcion_fecha_desde == null ? null : String(excepcion_fecha_desde),
      fecha_hasta: excepcion_fecha_hasta == null ? null : String(excepcion_fecha_hasta),
      estado: excepcion_estado as NonNullable<ReservaPanel['excepcion_capacidad']>['estado'],
      solicitada_por: String(excepcion_solicitada_por),
      decidida_por: excepcion_decidida_por == null ? null : String(excepcion_decidida_por),
      solicitada_at: String(excepcion_solicitada_at),
      decidida_at: excepcion_decidida_at == null ? null : String(excepcion_decidida_at),
    },
  } as ReservaPanel;
}

export class D1RepositorioPanelReservas implements RepositorioPanelReservas {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async listarAlojamientos(): Promise<AlojamientoPanel[]> {
    const result = await this.db
      .prepare('SELECT id, nombre, tipo, capacidad_total FROM alojamientos ORDER BY id ASC')
      .all();
    return (result.results || []) as AlojamientoPanel[];
  }

  async listarReservasOperativas(): Promise<ReservaPanel[]> {
    const result = await this.db
      .prepare(
        `SELECT ${CAMPOS_RESERVA}
         FROM reservas r
         JOIN alojamientos a ON a.id = r.alojamiento_id
         ${JOINS_EXCEPCION}
         WHERE r.estado IN ('confirmada', 'pendiente')
           AND DATE(r.fecha_checkout) >= DATE('now')
         ORDER BY r.fecha_checkin ASC`
      )
      .all();
    return (result.results || []).map(mapearReserva);
  }

  async listarHistorial(): Promise<ReservaPanel[]> {
    const result = await this.db
      .prepare(
        `SELECT ${CAMPOS_RESERVA}
         FROM reservas r
         JOIN alojamientos a ON a.id = r.alojamiento_id
         ${JOINS_EXCEPCION}
         ORDER BY r.fecha_checkin DESC`
      )
      .all();
    return (result.results || []).map(mapearReserva);
  }

  async listarPendientesViejas(umbralDias: number): Promise<PendienteVieja[]> {
    const result = await this.db
      .prepare(
        `SELECT r.id, r.cliente_nombre, r.cliente_telefono, r.monto_sena, r.created_at,
                a.nombre AS alojamiento_nombre
         FROM reservas r
         JOIN alojamientos a ON a.id = r.alojamiento_id
         WHERE r.estado = 'pendiente' AND r.created_at < datetime('now', ?)
         ORDER BY r.created_at ASC`
      )
      .bind(`-${umbralDias} days`)
      .all();
    return (result.results || []) as PendienteVieja[];
  }

  async obtenerConversionManyChat(): Promise<ConversionManyChat> {
    const row = await this.db
      .prepare(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN estado = 'confirmada' THEN 1 ELSE 0 END) AS confirmadas
         FROM reservas
         WHERE manychat_user_id IS NOT NULL`
      )
      .first();

    return {
      total: Number(row?.total) || 0,
      confirmadas: Number(row?.confirmadas) || 0,
    };
  }
}
