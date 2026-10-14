import type {
  EstadoReservaPublica,
  RepositorioConsultaEstadoReservaPublica,
} from '../../_application/reservas/ports.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
};

type Database = { prepare(query: string): Statement };

export class D1RepositorioConsultaEstadoReservaPublica implements RepositorioConsultaEstadoReservaPublica {
  private readonly db: Database;

  constructor(db: Database) { this.db = db; }

  async obtenerPorCodigo(codigo: string): Promise<EstadoReservaPublica | null> {
    const row = await this.db.prepare(`
      SELECT r.codigo, r.estado_flujo, r.hold_expires_at,
             COALESCE(r.monto_sena_centavos, CAST(round(r.monto_sena * 100) AS INTEGER), 0)
               monto_sena_centavos,
             r.moneda,
             rpm.metodo,
             p.estado pago_estado,
             json_extract(p.metadata_json, '$.checkout_url') checkout_url,
             ccr.estado cuenta_estado, ccr.cvu cuenta_cvu, ccr.alias cuenta_alias,
             ccr.moneda cuenta_moneda, ccr.simulada cuenta_simulada
      FROM reservas r
      LEFT JOIN reserva_metodos_pago rpm ON rpm.reserva_id = r.id
      LEFT JOIN pagos p ON p.id = (
        SELECT id FROM pagos
        WHERE reserva_id = r.id AND proveedor = 'mercado_pago'
        ORDER BY CASE estado WHEN 'aprobado' THEN 0 ELSE 1 END, id DESC
        LIMIT 1
      )
      LEFT JOIN cuentas_cobro_reserva ccr
        ON ccr.reserva_id = r.id AND ccr.proveedor = 'cucuru'
      WHERE r.codigo = ?
      LIMIT 1
    `).bind(codigo).first();
    return row ? {
      codigo: String(row.codigo),
      estado: String(row.estado_flujo),
      expiresAt: row.hold_expires_at ? String(row.hold_expires_at) : null,
      pagoEstado: row.pago_estado ? String(row.pago_estado) : null,
      metodoPago: row.metodo === 'mercado_pago_checkout' || row.metodo === 'transferencia_mp'
        ? row.metodo : null,
      montoSenaCentavos: Number(row.monto_sena_centavos),
      moneda: String(row.moneda || 'ARS'),
      checkoutUrl: row.checkout_url ? String(row.checkout_url) : null,
      cuentaCobro: row.cuenta_estado ? {
        estado: String(row.cuenta_estado),
        cvu: row.cuenta_cvu ? String(row.cuenta_cvu) : null,
        alias: row.cuenta_alias ? String(row.cuenta_alias) : null,
        moneda: String(row.cuenta_moneda || 'ARS'),
        simulada: Boolean(row.cuenta_simulada),
      } : null,
    } : null;
  }
}
