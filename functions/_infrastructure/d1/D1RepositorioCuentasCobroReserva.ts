import type { RepositorioCuentasCobroReserva } from '../../_application/reservas/ports.ts';
import type { CuentaCobroReserva } from '../../_domain/reservas/collectionAccounts.ts';

type Result = { results?: Record<string, unknown>[] };
type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  run(): Promise<unknown>;
};
type Database = {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<Result[]>;
};

function mapear(row: Record<string, unknown>): CuentaCobroReserva {
  return {
    id: Number(row.id),
    reservaId: Number(row.reserva_id),
    proveedor: 'cucuru',
    customerId: String(row.customer_id),
    estado: String(row.estado) as CuentaCobroReserva['estado'],
    externalAccountId: row.external_account_id == null ? null : String(row.external_account_id),
    cvu: row.cvu == null ? null : String(row.cvu),
    alias: row.alias == null ? null : String(row.alias),
    moneda: String(row.moneda),
    intentos: Number(row.intentos),
    operacionUid: String(row.ultima_operacion_uid),
    errorCodigo: row.ultimo_error_codigo == null ? null : String(row.ultimo_error_codigo),
    nextRetryAt: row.next_retry_at == null ? null : String(row.next_retry_at),
  };
}

const COLUMNAS = `id, reserva_id, proveedor, customer_id, estado, external_account_id,
  cvu, alias, moneda, intentos, ultima_operacion_uid, ultimo_error_codigo, next_retry_at`;

export class D1RepositorioCuentasCobroReserva implements RepositorioCuentasCobroReserva {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async obtenerContexto(reservaId: number) {
    const row = await this.db.prepare(`
      SELECT id, reserva_uid, estado_flujo, moneda, monto_sena_centavos
      FROM reservas WHERE id = ? LIMIT 1
    `).bind(reservaId).first();
    return row ? {
      reservaId: Number(row.id),
      reservaUid: String(row.reserva_uid),
      estadoFlujo: String(row.estado_flujo),
      moneda: String(row.moneda),
      montoEsperadoCentavos: Number(row.monto_sena_centavos),
    } : null;
  }

  async preparar(entrada: Parameters<RepositorioCuentasCobroReserva['preparar']>[0]) {
    const estado = entrada.habilitada ? 'pending' : 'disabled';
    const row = await this.db.prepare(`
      INSERT INTO cuentas_cobro_reserva (
        reserva_id, proveedor, customer_id, estado, ultima_operacion_uid
      ) VALUES (?, 'cucuru', ?, ?, ?)
      ON CONFLICT (reserva_id, proveedor) DO UPDATE SET
        estado = CASE
          WHEN cuentas_cobro_reserva.estado = 'disabled' AND excluded.estado = 'pending'
            THEN 'pending'
          ELSE cuentas_cobro_reserva.estado
        END,
        ultima_operacion_uid = CASE
          WHEN cuentas_cobro_reserva.estado = 'disabled' AND excluded.estado = 'pending'
            THEN excluded.ultima_operacion_uid
          ELSE cuentas_cobro_reserva.ultima_operacion_uid
        END,
        updated_at = CASE
          WHEN cuentas_cobro_reserva.estado = 'disabled' AND excluded.estado = 'pending'
            THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          ELSE cuentas_cobro_reserva.updated_at
        END
      RETURNING ${COLUMNAS}
    `).bind(entrada.reservaId, entrada.customerId, estado, entrada.operacionUid).first();
    if (!row) throw new Error('No se pudo preparar la cuenta de cobro.');
    return mapear(row);
  }

  async reclamarProvisionamiento(cuentaId: number, operacionUid: string) {
    const row = await this.db.prepare(`
      UPDATE cuentas_cobro_reserva
      SET estado = 'provisioning', intentos = intentos + 1,
          ultima_operacion_uid = ?, last_attempt_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
          ultimo_error_codigo = NULL, next_retry_at = NULL,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ? AND estado IN ('pending', 'failed', 'unknown_outcome')
        AND (next_retry_at IS NULL OR next_retry_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      RETURNING ${COLUMNAS}
    `).bind(operacionUid, cuentaId).first();
    return row ? mapear(row) : null;
  }

  async registrarIntento(entrada: Parameters<RepositorioCuentasCobroReserva['registrarIntento']>[0]) {
    await this.db.prepare(`
      INSERT INTO cuenta_cobro_intentos (cuenta_cobro_id, operacion_uid, tipo, resultado)
      VALUES (?, ?, ?, 'started')
    `).bind(entrada.cuentaId, entrada.operacionUid, entrada.tipo).run();
  }

  async completarIntento(
    operacionUid: string,
    resultado: 'succeeded' | 'not_found' | 'failed' | 'unknown_outcome',
    errorCodigo?: string
  ) {
    await this.db.prepare(`
      UPDATE cuenta_cobro_intentos
      SET resultado = ?, error_codigo = ?,
          completed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE operacion_uid = ? AND resultado = 'started'
    `).bind(resultado, errorCodigo || null, operacionUid).run();
  }

  async marcarLista(
    cuentaId: number,
    operacionUid: string,
    destino: Parameters<RepositorioCuentasCobroReserva['marcarLista']>[2]
  ) {
    const resultados = await this.db.batch([
      this.db.prepare(`
        UPDATE cuentas_cobro_reserva
        SET estado = 'ready', external_account_id = ?, cvu = ?, alias = ?, moneda = ?,
            ready_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), next_retry_at = NULL,
            ultimo_error_codigo = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND estado = 'provisioning' AND ultima_operacion_uid = ?
        RETURNING ${COLUMNAS}
      `).bind(
        destino.externalAccountId, destino.cvu, destino.alias, destino.moneda, cuentaId, operacionUid
      ),
      this.db.prepare(`
        INSERT INTO reserva_eventos (
          reserva_id, tipo, actor_tipo, actor_ref, evento_uid, agregado_tipo, agregado_id, payload_json
        )
        SELECT reserva_id, 'cuenta_cobro.lista', 'servicio', 'cucuru',
          'cuenta-cobro-ready:' || ultima_operacion_uid, 'integracion', CAST(id AS TEXT),
          json_object('proveedor', proveedor, 'moneda', moneda)
        FROM cuentas_cobro_reserva
        WHERE id = ? AND estado = 'ready' AND ultima_operacion_uid = ?
      `).bind(cuentaId, operacionUid),
    ]);
    const row = resultados[0]?.results?.[0];
    if (!row) throw new Error('El provisionamiento perdió su control de concurrencia.');
    return mapear(row);
  }

  async marcarFalla(entrada: Parameters<RepositorioCuentasCobroReserva['marcarFalla']>[0]) {
    const resultados = await this.db.batch([
      this.db.prepare(`
        UPDATE cuentas_cobro_reserva
        SET estado = ?, ultimo_error_codigo = ?, next_retry_at = ?,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND estado = 'provisioning' AND ultima_operacion_uid = ?
        RETURNING ${COLUMNAS}
      `).bind(
        entrada.resultado, entrada.errorCodigo, entrada.nextRetryAt,
        entrada.cuentaId, entrada.operacionUid
      ),
      this.db.prepare(`
        INSERT INTO reserva_eventos (
          reserva_id, tipo, actor_tipo, actor_ref, evento_uid, agregado_tipo, agregado_id, payload_json
        )
        SELECT reserva_id, 'cuenta_cobro.' || estado, 'servicio', 'cucuru',
          'cuenta-cobro-failure:' || ultima_operacion_uid, 'integracion', CAST(id AS TEXT),
          json_object('proveedor', proveedor, 'error_codigo', ultimo_error_codigo)
        FROM cuentas_cobro_reserva
        WHERE id = ? AND estado = ? AND ultima_operacion_uid = ?
      `).bind(entrada.cuentaId, entrada.resultado, entrada.operacionUid),
    ]);
    const row = resultados[0]?.results?.[0];
    if (!row) throw new Error('El fallo de provisionamiento perdió su control de concurrencia.');
    return mapear(row);
  }
}
