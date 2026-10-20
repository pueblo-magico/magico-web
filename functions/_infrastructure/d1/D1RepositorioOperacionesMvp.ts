import type { RepositorioOperacionesMvp } from '../../_application/reservas/consultarOperacionesMvp.ts';
import { D1RepositorioIntencionesComunicacion } from './D1RepositorioIntencionesComunicacion.ts';
import { D1RepositorioOutboxIntegracion } from './D1RepositorioOutboxIntegracion.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<{ results?: Record<string, unknown>[] }>;
  run(): Promise<unknown>;
};
type Database = { prepare(query: string): Statement; batch(statements: Statement[]): Promise<unknown[]> };

export class D1RepositorioOperacionesMvp implements RepositorioOperacionesMvp {
  private readonly db: Database;

  constructor(db: Database) { this.db = db; }

  async consultar(entrada: Parameters<RepositorioOperacionesMvp['consultar']>[0]) {
    const [reservas, pagos, eventos, tendenciaOutbox, tendenciaComunicaciones, outbox, comunicaciones] = await Promise.all([
      this.db.prepare(`
        SELECT
          SUM(CASE WHEN estado_flujo = 'pendiente_pago' THEN 1 ELSE 0 END) pendientes,
          SUM(CASE WHEN estado_flujo = 'pendiente_pago' AND EXISTS (
            SELECT 1 FROM retenciones_reserva rr
            WHERE rr.reserva_id = reservas.id AND rr.estado = 'activa' AND rr.expires_at <= ?
          ) THEN 1 ELSE 0 END) vencidas,
          MAX(0, CAST((julianday(?) - julianday(MIN(CASE
            WHEN estado_flujo = 'pendiente_pago' THEN created_at END))) * 86400 AS INTEGER)) edad
        FROM reservas
      `).bind(entrada.ahora, entrada.ahora).first(),
      this.db.prepare(`
        SELECT COUNT(*) total,
          COALESCE(SUM(CASE WHEN resultado = 'aplicado' THEN 1 ELSE 0 END), 0) aplicados,
          COALESCE(SUM(CASE WHEN resultado = 'inconsistente' THEN 1 ELSE 0 END), 0) inconsistentes
        FROM pago_eventos_externos
        WHERE proveedor = 'mercado_pago' AND julianday(created_at) >= julianday(?) - 1
      `).bind(entrada.ahora).first(),
      this.db.prepare(`
        SELECT proveedor, reserva_id, resultado, motivo_codigo, correlation_id,
          created_at, processed_at
        FROM pago_eventos_externos WHERE proveedor = 'mercado_pago'
        ORDER BY created_at DESC, id DESC LIMIT ?
      `).bind(entrada.limite).all(),
      this.consultarTendenciaCola('integration_outbox', "'pending', 'processing'", entrada.ahora),
      this.consultarTendenciaCola('comunicacion_intenciones', "'pendiente', 'procesando'", entrada.ahora),
      new D1RepositorioOutboxIntegracion(this.db).consultarEstado(entrada),
      new D1RepositorioIntencionesComunicacion(this.db).consultarEstado(entrada),
    ]);
    return {
      reservas: {
        pendientesPago: Number(reservas?.pendientes || 0),
        retencionesVencidasSinProcesar: Number(reservas?.vencidas || 0),
        oldestPendingAgeSeconds: reservas?.edad == null ? null : Number(reservas.edad),
      },
      pagos: {
        webhooksLast24h: Number(pagos?.total || 0),
        aplicadosLast24h: Number(pagos?.aplicados || 0),
        inconsistentesLast24h: Number(pagos?.inconsistentes || 0),
        eventos: (eventos.results || []).map(row => ({
          proveedor: String(row.proveedor),
          reservaId: row.reserva_id == null ? null : Number(row.reserva_id),
          resultado: String(row.resultado),
          motivoCodigo: row.motivo_codigo == null ? null : String(row.motivo_codigo),
          correlationId: row.correlation_id == null ? null : String(row.correlation_id),
          createdAt: String(row.created_at),
          processedAt: row.processed_at == null ? null : String(row.processed_at),
        })),
      },
      outbox,
      comunicaciones,
      tendenciaColas: {
        outbox: tendenciaOutbox,
        comunicaciones: tendenciaComunicaciones,
      },
    };
  }

  private async consultarTendenciaCola(tabla: string, estados: string, ahora: string) {
    const row = await this.db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN julianday(created_at) > julianday(?) - (15.0 / 1440)
          THEN 1 ELSE 0 END), 0) actuales,
        COALESCE(SUM(CASE WHEN julianday(created_at) > julianday(?) - (30.0 / 1440)
          AND julianday(created_at) <= julianday(?) - (15.0 / 1440)
          THEN 1 ELSE 0 END), 0) anteriores
      FROM ${tabla} WHERE estado IN (${estados})
        AND julianday(created_at) > julianday(?) - (30.0 / 1440)
    `).bind(ahora, ahora, ahora, ahora).first();
    const actuales = Number(row?.actuales || 0);
    const anteriores = Number(row?.anteriores || 0);
    return {
      creadosPendientesUltimos15m: actuales,
      creadosPendientes15mAnteriores: anteriores,
      crecimiento: Math.max(0, actuales - anteriores),
    };
  }
}
