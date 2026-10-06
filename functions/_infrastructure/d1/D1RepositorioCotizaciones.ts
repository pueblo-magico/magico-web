import type { RepositorioCotizaciones } from '../../_application/reservas/ports.ts';
import type { ResultadoCotizacion, SolicitudCotizacion } from '../../_domain/reservas/models.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
};
type Database = { prepare(query: string): Statement };

export class D1RepositorioCotizaciones implements RepositorioCotizaciones {
  private readonly db: Database;
  private readonly ahora: () => Date;
  private readonly crearCodigo: () => string;

  constructor(
    db: Database,
    ahora: () => Date = () => new Date(),
    crearCodigo: () => string = () => `COT-${crypto.randomUUID()}`
  ) {
    this.db = db;
    this.ahora = ahora;
    this.crearCodigo = crearCodigo;
  }

  async guardar(
    solicitud: SolicitudCotizacion,
    resultado: Omit<ResultadoCotizacion, 'referencia'>
  ): Promise<{ id: number; codigo: string; expiresAt: string }> {
    const codigo = this.crearCodigo();
    const expiresAt = new Date(this.ahora().getTime() + 15 * 60_000).toISOString();
    const requestCanonico = JSON.stringify({
      tipo: solicitud.tipo, personas: solicitud.personas,
      fechaEntrada: solicitud.fechaEntrada, fechaSalida: solicitud.fechaSalida,
      modalidad: solicitud.modalidad ?? null, contexto: solicitud.contexto ?? 'general',
      regimenAlimentacion: solicitud.regimenAlimentacion ?? 'desayuno_incluido',
    });
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(requestCanonico));
    const requestHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    const row = await this.db.prepare(`
      INSERT INTO cotizaciones (
        codigo, plan_tarifa_id, plan_codigo, plan_version, moneda,
        fecha_checkin, fecha_checkout, cantidad_personas,
        subtotal_centavos, sena_centavos, total_centavos, alojamiento_centavos,
        alimentacion_centavos, regimen_alimentacion, tarifa_alimentacion_version,
        desglose_json, request_hash, expires_at,
        politica_cancelacion_codigo, politica_cancelacion_version,
        politica_cancelacion_estado, politica_cancelacion_json
      )
      SELECT ?, p.id, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
             pc.codigo, pc.version, pc.estado, pc.reglas_json
      FROM planes_tarifa p
      CROSS JOIN (
        SELECT codigo, version, estado, reglas_json
        FROM politicas_cancelacion
        WHERE codigo = 'reservas-general'
          AND (
            (estado = 'publicada' AND vigencia_desde <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            OR estado = 'pendiente_configuracion'
          )
        ORDER BY CASE estado WHEN 'publicada' THEN 0 ELSE 1 END, version DESC
        LIMIT 1
      ) pc
      WHERE p.codigo = ? AND p.version = ?
      RETURNING id
    `).bind(
      codigo, resultado.desglose.plan_codigo, resultado.desglose.plan_version,
      resultado.desglose.moneda, solicitud.fechaEntrada, solicitud.fechaSalida,
      solicitud.personas, resultado.desglose.subtotal_centavos,
      resultado.sena.monto_centavos, resultado.desglose.subtotal_centavos,
      resultado.desglose.alojamiento_centavos, resultado.desglose.alimentacion_centavos,
      resultado.desglose.regimen_alimentacion, resultado.desglose.tarifa_alimentacion_version,
      JSON.stringify(resultado.desglose), requestHash, expiresAt,
      resultado.desglose.plan_codigo, resultado.desglose.plan_version
    ).first();
    const id = Number(row?.id);
    if (!Number.isInteger(id) || id <= 0) throw new Error('No se pudo persistir la cotización.');
    return { id, codigo, expiresAt };
  }
}
