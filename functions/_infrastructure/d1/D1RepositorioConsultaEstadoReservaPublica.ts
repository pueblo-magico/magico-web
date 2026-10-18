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
             r.created_at, r.updated_at, r.idioma_comunicacion,
             (SELECT MIN(evento.created_at) FROM reserva_eventos evento
              WHERE evento.reserva_id = r.id AND evento.tipo = 'reserva.confirmada') confirmada_at,
             re.fecha_checkin, re.fecha_checkout, re.cantidad_huespedes,
             CAST(julianday(re.fecha_checkout) - julianday(re.fecha_checkin) AS INTEGER) noches,
             re.modalidad,
             e.codigo espacio_codigo, COALESCE(e.nombre, a.nombre) alojamiento_nombre,
             COALESCE(e.tipo, a.tipo) alojamiento_tipo,
             COALESCE(c.regimen_alimentacion,
               json_extract(c.desglose_json, '$.regimen_alimentacion'),
               'desayuno_incluido') regimen_alimentacion,
             rp.opcion_codigo preparacion_codigo,
             rp.opcion_nombre preparacion_nombre,
             rp.opcion_descripcion preparacion_descripcion,
             COALESCE(r.monto_total_centavos, CAST(round(r.monto_total * 100) AS INTEGER), 0)
               monto_total_centavos,
             COALESCE(r.monto_sena_centavos, CAST(round(r.monto_sena * 100) AS INTEGER), 0)
               monto_sena_centavos,
             r.moneda,
             rpm.metodo,
             p.estado pago_estado,
             json_extract(p.metadata_json, '$.checkout_url') checkout_url,
             ccr.estado cuenta_estado, ccr.cvu cuenta_cvu, ccr.alias cuenta_alias,
             ccr.moneda cuenta_moneda, ccr.simulada cuenta_simulada
      FROM reservas r
      JOIN reserva_estadias re ON re.reserva_id = r.id AND re.tramo = 1
      LEFT JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
      LEFT JOIN espacios e ON e.id = ree.espacio_id
      LEFT JOIN alojamientos a ON a.id = r.alojamiento_id
      LEFT JOIN cotizaciones c ON c.id = r.cotizacion_id
      LEFT JOIN reserva_preferencias rp
        ON rp.reserva_id = r.id AND rp.categoria = 'preparacion_cama'
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
      createdAt: String(row.created_at),
      confirmedAt: row.estado_flujo === 'confirmada'
        ? String(row.confirmada_at || row.updated_at || row.created_at) : null,
      idioma: row.idioma_comunicacion === 'en' ? 'en' : 'es',
      estadia: {
        fechaCheckin: String(row.fecha_checkin),
        fechaCheckout: String(row.fecha_checkout),
        noches: Number(row.noches),
        cantidadHuespedes: Number(row.cantidad_huespedes),
        alojamiento: {
          codigo: row.espacio_codigo ? String(row.espacio_codigo) : null,
          nombre: String(row.alojamiento_nombre),
          tipo: String(row.alojamiento_tipo),
        },
        modalidad: String(row.modalidad),
        regimenAlimentacion: String(row.regimen_alimentacion),
        preparacion: row.preparacion_codigo ? {
          codigo: String(row.preparacion_codigo),
          nombre: String(row.preparacion_nombre),
          descripcion: String(row.preparacion_descripcion || ''),
        } : null,
      },
      precio: {
        totalCentavos: Number(row.monto_total_centavos),
        senaCentavos: Number(row.monto_sena_centavos),
        saldoCentavos: Math.max(0, Number(row.monto_total_centavos) - Number(row.monto_sena_centavos)),
        moneda: String(row.moneda || 'ARS'),
      },
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
