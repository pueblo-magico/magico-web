import type { RepositorioExportacionReservasAdmin } from '../../_application/reservas/ports.ts';
import type {
  FilaExportacionReserva,
  FiltrosExportacionReservas,
} from '../../_domain/reservas/adminReservationExport.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  all(): Promise<{ results?: Record<string, unknown>[] }>;
  run(): Promise<unknown>;
};
type Database = { prepare(query: string): Statement };

function filtrosSql(filtros: FiltrosExportacionReservas): { where: string; valores: unknown[] } {
  const condiciones: string[] = [];
  const valores: unknown[] = [];
  const agregar = (sql: string, valor: unknown) => { condiciones.push(sql); valores.push(valor); };
  if (filtros.fechaDesde) agregar('re.fecha_checkout > ?', filtros.fechaDesde);
  if (filtros.fechaHasta) agregar('re.fecha_checkin < ?', filtros.fechaHasta);
  if (filtros.estado) agregar('r.estado_flujo = ?', filtros.estado);
  if (filtros.origen) agregar("LOWER(COALESCE(r.canal_origen, '')) = LOWER(?)", filtros.origen);
  if (filtros.espacioCodigo) agregar('e.codigo = ?', filtros.espacioCodigo);
  if (filtros.titular) agregar('LOWER(r.cliente_nombre) LIKE LOWER(?)', `%${filtros.titular}%`);
  return { where: condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '', valores };
}

function mapear(row: Record<string, unknown>, incluirPii: boolean): FilaExportacionReserva {
  return {
    codigo: String(row.codigo),
    titular: incluirPii ? String(row.cliente_nombre) : null,
    telefono: incluirPii && row.cliente_telefono != null ? String(row.cliente_telefono) : null,
    email: incluirPii && row.cliente_email != null ? String(row.cliente_email) : null,
    fechaCheckin: String(row.fecha_checkin), fechaCheckout: String(row.fecha_checkout),
    cantidadPersonas: Number(row.cantidad_personas), estado: String(row.estado_flujo),
    tipoEstadia: String(row.tipo_estadia),
    canalOrigen: row.canal_origen == null ? null : String(row.canal_origen),
    espacioCodigo: row.espacio_codigo == null ? null : String(row.espacio_codigo),
    espacioNombre: row.espacio_nombre == null ? null : String(row.espacio_nombre),
    modalidad: String(row.modalidad), moneda: String(row.moneda),
    montoTotalCentavos: Number(row.monto_total_centavos),
    montoSenaCentavos: row.monto_sena_centavos == null ? null : Number(row.monto_sena_centavos),
  };
}

export class D1RepositorioExportacionReservasAdmin implements RepositorioExportacionReservasAdmin {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async listarParaExportar(
    filtros: FiltrosExportacionReservas,
    limite: number
  ): Promise<{ filas: FilaExportacionReserva[]; truncada: boolean }> {
    const { where, valores } = filtrosSql(filtros);
    const resultado = await this.db.prepare(`
      SELECT COALESCE(r.codigo, printf('RES-%08d', r.id)) codigo,
        r.cliente_nombre, r.cliente_telefono, r.cliente_email,
        re.fecha_checkin, re.fecha_checkout, re.cantidad_huespedes cantidad_personas,
        r.estado_flujo, r.tipo_estadia, r.canal_origen, e.codigo espacio_codigo,
        e.nombre espacio_nombre, re.modalidad, r.moneda,
        r.monto_total_centavos, r.monto_sena_centavos
      FROM reservas r
      JOIN reserva_estadias re ON re.reserva_id = r.id AND re.tramo = 1
      LEFT JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
      LEFT JOIN espacios e ON e.id = ree.espacio_id
      ${where}
      ORDER BY re.fecha_checkin DESC, r.id DESC
      LIMIT ?
    `).bind(...valores, limite + 1).all();
    const filas = resultado.results || [];
    return {
      filas: filas.slice(0, limite).map(row => mapear(row, filtros.incluirPii)),
      truncada: filas.length > limite,
    };
  }

  async registrarExportacion(
    entrada: Parameters<RepositorioExportacionReservasAdmin['registrarExportacion']>[0]
  ): Promise<void> {
    await this.db.prepare(`
      INSERT INTO auditoria_admin (
        email, accion, actor_tipo, entidad_tipo, correlation_id, metadata_json
      ) VALUES (?, 'exportar_reservas', 'usuario', 'reservas', ?, json(?))
    `).bind(
      entrada.actorEmail,
      entrada.correlationId,
      JSON.stringify({
        cantidad: entrada.cantidad,
        truncada: entrada.truncada,
        incluir_pii: entrada.incluirPii,
        filtros: entrada.filtros,
      })
    ).run();
  }
}
