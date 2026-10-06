import type { RepositorioGestionReservasAdmin } from '../../_application/reservas/ports.ts';
import type {
  DetalleReservaAdmin,
  FiltrosReservasAdmin,
  PaginaReservasAdmin,
  ResumenReservaAdmin,
} from '../../_domain/reservas/adminReservationManagement.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<{ results?: Record<string, unknown>[] }>;
};
type Database = { prepare(query: string): Statement };

const SELECT_RESUMEN = `
  r.id, COALESCE(r.codigo, printf('RES-%08d', r.id)) codigo, r.version,
  r.cliente_nombre titular, re.fecha_checkin, re.fecha_checkout,
  re.cantidad_huespedes cantidad_personas, r.estado, r.estado_flujo,
  r.canal_origen, e.codigo espacio_codigo, e.nombre espacio_nombre,
  re.modalidad, r.updated_at
`;

const FROM_RESERVA = `
  FROM reservas r
  JOIN reserva_estadias re ON re.reserva_id = r.id AND re.tramo = 1
  LEFT JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
  LEFT JOIN espacios e ON e.id = ree.espacio_id
`;

function mapearResumen(row: Record<string, unknown>): ResumenReservaAdmin {
  return {
    id: Number(row.id), codigo: String(row.codigo), version: Number(row.version),
    titular: String(row.titular), fechaCheckin: String(row.fecha_checkin),
    fechaCheckout: String(row.fecha_checkout), cantidadPersonas: Number(row.cantidad_personas),
    estado: String(row.estado), estadoFlujo: String(row.estado_flujo),
    canalOrigen: row.canal_origen == null ? null : String(row.canal_origen),
    espacioCodigo: row.espacio_codigo == null ? null : String(row.espacio_codigo),
    espacioNombre: row.espacio_nombre == null ? null : String(row.espacio_nombre),
    modalidad: String(row.modalidad), updatedAt: String(row.updated_at),
  };
}

function consultaFiltros(filtros: FiltrosReservasAdmin): { where: string; valores: unknown[] } {
  const condiciones: string[] = [];
  const valores: unknown[] = [];
  const agregar = (sql: string, valor: unknown) => { condiciones.push(sql); valores.push(valor); };
  if (filtros.fechaDesde) agregar('re.fecha_checkout > ?', filtros.fechaDesde);
  if (filtros.fechaHasta) agregar('re.fecha_checkin < ?', filtros.fechaHasta);
  if (filtros.estado) agregar('r.estado_flujo = ?', filtros.estado);
  if (filtros.origen) agregar('LOWER(COALESCE(r.canal_origen, \'\')) = LOWER(?)', filtros.origen);
  if (filtros.espacioCodigo) agregar('e.codigo = ?', filtros.espacioCodigo);
  if (filtros.titular) agregar('LOWER(r.cliente_nombre) LIKE LOWER(?)', `%${filtros.titular}%`);
  return { where: condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '', valores };
}

export class D1RepositorioGestionReservasAdmin implements RepositorioGestionReservasAdmin {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async listar(filtros: FiltrosReservasAdmin): Promise<PaginaReservasAdmin> {
    const { where, valores } = consultaFiltros(filtros);
    const offset = (filtros.pagina - 1) * filtros.limite;
    const [totalRow, result] = await Promise.all([
      this.db.prepare(`SELECT COUNT(*) total ${FROM_RESERVA} ${where}`).bind(...valores).first(),
      this.db.prepare(`
        SELECT ${SELECT_RESUMEN} ${FROM_RESERVA} ${where}
        ORDER BY re.fecha_checkin DESC, r.id DESC LIMIT ? OFFSET ?
      `).bind(...valores, filtros.limite, offset).all(),
    ]);
    const total = Number(totalRow?.total) || 0;
    return {
      items: (result.results || []).map(mapearResumen),
      pagina: filtros.pagina,
      limite: filtros.limite,
      total,
      totalPaginas: Math.ceil(total / filtros.limite),
    };
  }

  async obtenerDetalle(reservaId: number): Promise<DetalleReservaAdmin | null> {
    const [row, estadias, excepciones] = await Promise.all([
      this.db.prepare(`
        SELECT ${SELECT_RESUMEN}, r.cliente_telefono, r.cliente_email,
          r.moneda, r.monto_total_centavos, r.monto_sena_centavos
        ${FROM_RESERVA} WHERE r.id = ?
      `).bind(reservaId).first(),
      this.db.prepare(`
        SELECT re.id, re.tramo, re.fecha_checkin, re.fecha_checkout,
          re.cantidad_huespedes, re.modalidad, e.codigo espacio_codigo, e.nombre espacio_nombre
        FROM reserva_estadias re
        LEFT JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
        LEFT JOIN espacios e ON e.id = ree.espacio_id
        WHERE re.reserva_id = ? ORDER BY re.tramo
      `).bind(reservaId).all(),
      this.db.prepare(`
        SELECT ec.id, ec.capacidad_autorizada, ec.motivo, ec.plan_camas,
          ec.fecha_desde, ec.fecha_hasta, ec.estado, ec.solicitada_por,
          ec.decidida_por, ec.solicitada_at, ec.decidida_at
        FROM excepciones_capacidad ec
        JOIN reserva_estadias re ON re.id = ec.reserva_estadia_id
        WHERE re.reserva_id = ? ORDER BY ec.id DESC
      `).bind(reservaId).all(),
    ]);
    if (!row) return null;
    return {
      ...mapearResumen(row),
      clienteTelefono: row.cliente_telefono == null ? null : String(row.cliente_telefono),
      clienteEmail: row.cliente_email == null ? null : String(row.cliente_email),
      moneda: String(row.moneda),
      montoTotalCentavos: Number(row.monto_total_centavos),
      montoSenaCentavos: row.monto_sena_centavos == null ? null : Number(row.monto_sena_centavos),
      estadias: estadias.results || [],
      excepciones: excepciones.results || [],
    };
  }
}
