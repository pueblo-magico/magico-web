import type { RepositorioIntencionesComunicacion } from '../../_application/reservas/ports.ts';
import type { IntencionComunicacion } from '../../_domain/reservas/communicationIntents.ts';
import type {
  EstadoIntencionComunicacion,
  EstadoOperativoComunicaciones,
} from '../../_domain/reservas/communicationIntents.ts';
import type {
  NotificacionReservaReclamada,
  RepositorioNotificacionesReserva,
} from '../../_application/reservas/gestionarNotificacionesReserva.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<{ results?: Record<string, unknown>[] }>;
  run(): Promise<unknown>;
};

type Database = {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<unknown[]>;
};

function mapear(row: Record<string, unknown>): IntencionComunicacion {
  return {
    intencionUid: String(row.intencion_uid),
    reservaId: Number(row.reserva_id),
    tipo: String(row.tipo) as IntencionComunicacion['tipo'],
    idioma: String(row.idioma) as IntencionComunicacion['idioma'],
    plantillaCodigo: String(row.plantilla_codigo),
    plantillaVersion: Number(row.plantilla_version),
    estado: String(row.estado) as IntencionComunicacion['estado'],
    attempts: Number(row.attempts),
    createdAt: String(row.created_at),
  };
}

export class D1RepositorioIntencionesComunicacion implements
  RepositorioIntencionesComunicacion,
  RepositorioNotificacionesReserva {
  private readonly db: Database;

  constructor(db: Database) { this.db = db; }

  async consultarEstado(
    entrada: Parameters<RepositorioIntencionesComunicacion['consultarEstado']>[0]
  ): Promise<EstadoOperativoComunicaciones> {
    const [conteos, intenciones, pendiente, entregas24h] = await Promise.all([
      this.db.prepare(`
        SELECT estado, COUNT(*) cantidad FROM comunicacion_intenciones GROUP BY estado
      `).all(),
      this.db.prepare(`
        SELECT intencion_uid, reserva_id, tipo, idioma, estado, attempts, canal,
          next_attempt_at, last_error_code, created_at, delivered_at,
          MAX(0, CAST((julianday(?) - julianday(created_at)) * 86400 AS INTEGER)) age_seconds
        FROM comunicacion_intenciones
        ORDER BY created_at DESC, id DESC LIMIT ?
      `).bind(entrada.ahora, entrada.limite).all(),
      this.db.prepare(`
        SELECT MAX(0, CAST((julianday(?) - julianday(MIN(created_at))) * 86400 AS INTEGER)) edad
        FROM comunicacion_intenciones WHERE estado IN ('pendiente', 'procesando')
      `).bind(entrada.ahora).first(),
      this.db.prepare(`
        SELECT COUNT(*) intentos,
          COALESCE(SUM(CASE WHEN resultado = 'entregada' THEN 0 ELSE 1 END), 0) fallas
        FROM comunicacion_intentos
        WHERE julianday(completed_at) >= julianday(?) - 1
      `).bind(entrada.ahora).first(),
    ]);
    const resumen: Record<EstadoIntencionComunicacion, number> = {
      pendiente: 0, procesando: 0, entregada: 0, sin_canal: 0, dead_letter: 0,
    };
    for (const row of conteos.results || []) {
      const estado = String(row.estado) as EstadoIntencionComunicacion;
      if (estado in resumen) resumen[estado] = Number(row.cantidad);
    }
    const attempts = Number(entregas24h?.intentos || 0);
    const failures = Number(entregas24h?.fallas || 0);
    return {
      resumen,
      oldestPendingAgeSeconds: pendiente?.edad == null ? null : Number(pendiente.edad),
      deliveryLast24h: { attempts, failures, failureRate: attempts === 0 ? 0 : failures / attempts },
      intenciones: (intenciones.results || []).map(row => ({
        intencionUid: String(row.intencion_uid),
        reservaId: Number(row.reserva_id),
        tipo: String(row.tipo) as IntencionComunicacion['tipo'],
        idioma: String(row.idioma) as IntencionComunicacion['idioma'],
        estado: String(row.estado) as EstadoIntencionComunicacion,
        attempts: Number(row.attempts),
        canal: row.canal == null ? null : String(row.canal),
        nextAttemptAt: String(row.next_attempt_at),
        lastErrorCode: row.last_error_code == null ? null : String(row.last_error_code),
        createdAt: String(row.created_at),
        deliveredAt: row.delivered_at == null ? null : String(row.delivered_at),
        ageSeconds: Number(row.age_seconds),
      })),
    };
  }

  async reclamarLote(
    entrada: Parameters<RepositorioIntencionesComunicacion['reclamarLote']>[0]
  ): Promise<IntencionComunicacion[]> {
    const resultado = await this.db.prepare(`
      UPDATE comunicacion_intenciones
      SET estado = 'procesando', claim_uid = ?, claimed_at = ?, claim_expires_at = ?,
        attempts = attempts + 1
      WHERE id IN (
        SELECT id FROM comunicacion_intenciones
        WHERE (
          (estado = 'pendiente' AND next_attempt_at <= ?)
          OR (estado = 'procesando' AND claim_expires_at <= ?)
        )
        ORDER BY created_at, id LIMIT ?
      )
      RETURNING intencion_uid, reserva_id, tipo, idioma, plantilla_codigo,
        plantilla_version, estado, attempts, created_at
    `).bind(
      entrada.claimUid, entrada.ahora, entrada.claimExpiresAt,
      entrada.ahora, entrada.ahora, entrada.limite
    ).all();
    return (resultado.results || []).map(mapear);
  }

  async reclamarPorUid(
    entrada: Parameters<RepositorioNotificacionesReserva['reclamarPorUid']>[0]
  ): Promise<NotificacionReservaReclamada | null> {
    await this.db.prepare(`
      UPDATE comunicacion_intenciones
      SET estado = 'procesando', claim_uid = ?, claimed_at = ?, claim_expires_at = ?,
          attempts = attempts + 1
      WHERE intencion_uid = ? AND (
        (estado = 'pendiente' AND julianday(next_attempt_at) <= julianday(?) + (1.0 / 86400.0))
        OR (estado = 'procesando' AND julianday(claim_expires_at) <= julianday(?))
      )
    `).bind(
      entrada.claimUid, entrada.ahora, entrada.claimExpiresAt,
      entrada.intencionUid, entrada.ahora, entrada.ahora
    ).run();
    const row = await this.db.prepare(`
      SELECT i.intencion_uid, i.reserva_id, i.tipo, i.idioma, i.attempts,
        r.cliente_email, r.codigo, r.estado_flujo, r.fecha_checkin, r.fecha_checkout,
        r.cantidad_personas,
        COALESCE(r.monto_sena_centavos, CAST(round(COALESCE(r.monto_sena, 0) * 100) AS INTEGER), 0)
          monto_sena_centavos,
        r.moneda, r.hold_expires_at, p.asunto_template, p.cuerpo_template,
        json_extract(pg.metadata_json, '$.checkout_url') checkout_url
      FROM comunicacion_intenciones i
      JOIN reservas r ON r.id = i.reserva_id
      JOIN comunicacion_plantillas p
        ON p.codigo = i.plantilla_codigo
       AND p.idioma = i.idioma
       AND p.version = i.plantilla_version
      LEFT JOIN pagos pg ON pg.id = (
        SELECT id FROM pagos
        WHERE reserva_id = r.id AND proveedor = 'mercado_pago'
        ORDER BY id DESC LIMIT 1
      )
      WHERE i.intencion_uid = ? AND i.estado = 'procesando' AND i.claim_uid = ?
      LIMIT 1
    `).bind(entrada.intencionUid, entrada.claimUid).first();
    if (!row) return null;
    return {
      intencionUid: String(row.intencion_uid),
      reservaId: Number(row.reserva_id),
      tipo: String(row.tipo) as NotificacionReservaReclamada['tipo'],
      idioma: String(row.idioma) as 'es' | 'en',
      attempts: Number(row.attempts),
      email: row.cliente_email == null || !String(row.cliente_email).trim()
        ? null
        : String(row.cliente_email).trim(),
      codigo: String(row.codigo),
      estadoFlujo: String(row.estado_flujo),
      fechaCheckin: String(row.fecha_checkin),
      fechaCheckout: String(row.fecha_checkout),
      cantidadPersonas: Number(row.cantidad_personas),
      montoSenaCentavos: Number(row.monto_sena_centavos),
      moneda: String(row.moneda),
      expiresAt: row.hold_expires_at == null ? null : String(row.hold_expires_at),
      checkoutUrl: row.checkout_url == null ? null : String(row.checkout_url),
      asuntoTemplate: String(row.asunto_template),
      cuerpoTemplate: String(row.cuerpo_template),
    };
  }

  async finalizarEntrega(
    entrada: Parameters<RepositorioNotificacionesReserva['finalizarEntrega']>[0]
  ): Promise<boolean> {
    const yaProcesada = await this.db.prepare(`
      SELECT id FROM comunicacion_intentos
      WHERE delivery_uid = ? AND intencion_uid = ?
    `).bind(entrada.deliveryUid, entrada.intencionUid).first();
    if (yaProcesada) return true;
    const existe = await this.db.prepare(`
      SELECT id FROM comunicacion_intenciones
      WHERE intencion_uid = ? AND claim_uid = ? AND estado = 'procesando'
    `).bind(entrada.intencionUid, entrada.claimUid).first();
    if (!existe) return false;
    const estado = entrada.resultado === 'entregada'
      ? 'entregada'
      : entrada.resultado === 'retry'
        ? 'pendiente'
        : entrada.resultado;
    const statements = [
      this.db.prepare(`
        INSERT OR IGNORE INTO comunicacion_intentos (
          intencion_uid, delivery_uid, canal, resultado, error_code,
          started_at, completed_at
        ) SELECT intencion_uid, ?, ?, ?, ?, claimed_at, ?
          FROM comunicacion_intenciones WHERE intencion_uid = ? AND claim_uid = ?
      `).bind(
        entrada.deliveryUid, entrada.canal, entrada.resultado, entrada.errorCode,
        entrada.completedAt, entrada.intencionUid, entrada.claimUid
      ),
      this.db.prepare(`
        UPDATE comunicacion_intenciones
        SET estado = ?, next_attempt_at = COALESCE(?, next_attempt_at),
          claim_uid = NULL, claimed_at = NULL, claim_expires_at = NULL,
          canal = ?, last_error_code = ?,
          delivered_at = CASE WHEN ? = 'entregada' THEN ? ELSE delivered_at END
        WHERE intencion_uid = ? AND claim_uid = ? AND estado = 'procesando'
      `).bind(
        estado, entrada.nextAttemptAt, entrada.canal, entrada.errorCode,
        entrada.resultado, entrada.completedAt, entrada.intencionUid, entrada.claimUid
      ),
    ];
    if (entrada.resultado === 'retry' && entrada.nextAttemptAt) {
      statements.push(this.db.prepare(`
        UPDATE integration_outbox
        SET estado = 'pending', next_attempt_at = ?, claimed_at = NULL,
          claim_uid = NULL, claim_expires_at = NULL, last_error_code = ?
        WHERE event_id = ?
      `).bind(entrada.nextAttemptAt, entrada.errorCode, entrada.intencionUid));
    }
    await this.db.batch(statements);
    return true;
  }

  async marcarEntregada(
    entrada: Parameters<RepositorioIntencionesComunicacion['marcarEntregada']>[0]
  ): Promise<void> {
    await this.finalizarIntento({
      ...entrada,
      resultado: 'entregada',
      estado: 'entregada',
      errorCode: null,
      nextAttemptAt: null,
    });
  }

  async marcarSinCanal(
    entrada: Parameters<RepositorioIntencionesComunicacion['marcarSinCanal']>[0]
  ): Promise<void> {
    await this.finalizarIntento({
      ...entrada,
      canal: null,
      resultado: 'sin_canal',
      estado: 'sin_canal',
      errorCode: 'COMMUNICATION_CHANNEL_DISABLED',
      nextAttemptAt: null,
    });
  }

  async marcarFalla(
    entrada: Parameters<RepositorioIntencionesComunicacion['marcarFalla']>[0]
  ): Promise<void> {
    await this.finalizarIntento({
      ...entrada,
      resultado: entrada.deadLetter ? 'dead_letter' : 'retry',
      estado: entrada.deadLetter ? 'dead_letter' : 'pendiente',
    });
  }

  async reprocesar(
    entrada: Parameters<RepositorioIntencionesComunicacion['reprocesar']>[0]
  ): Promise<boolean> {
    const existente = await this.db.prepare(`
      SELECT intencion_uid FROM comunicacion_intenciones
      WHERE intencion_uid = ? AND estado IN ('sin_canal', 'dead_letter')
    `).bind(entrada.intencionUid).first();
    if (!existente) return false;
    await this.db.batch([
      this.db.prepare(`
        INSERT INTO auditoria_admin (
          email, accion, detalle, actor_tipo, entidad_tipo, entidad_id,
          motivo, correlation_id, metadata_json
        )
        SELECT ?, 'reprocesar_intencion_comunicacion', NULL, 'usuario',
          'comunicacion_intencion', intencion_uid, ?, ?,
          json_object('estado_anterior', estado, 'intentos_anteriores', attempts,
            'error_anterior', last_error_code)
        FROM comunicacion_intenciones
        WHERE intencion_uid = ? AND estado IN ('sin_canal', 'dead_letter')
      `).bind(
        entrada.actorEmail, entrada.motivo, entrada.correlationId, entrada.intencionUid
      ),
      this.db.prepare(`
        UPDATE comunicacion_intenciones
        SET estado = 'pendiente', attempts = 0, next_attempt_at = ?,
          claim_uid = NULL, claimed_at = NULL, claim_expires_at = NULL,
          canal = NULL, last_error_code = NULL
        WHERE intencion_uid = ? AND estado IN ('sin_canal', 'dead_letter')
      `).bind(entrada.ahora, entrada.intencionUid),
    ]);
    return true;
  }

  private async finalizarIntento(entrada: {
    intencionUid: string;
    claimUid: string;
    canal: string | null;
    resultado: 'entregada' | 'retry' | 'sin_canal' | 'dead_letter';
    estado: 'entregada' | 'pendiente' | 'sin_canal' | 'dead_letter';
    errorCode: string | null;
    nextAttemptAt: string | null;
    completedAt: string;
  }): Promise<void> {
    await this.db.batch([
      this.db.prepare(`
        INSERT INTO comunicacion_intentos (
          intencion_uid, delivery_uid, canal, resultado, error_code,
          started_at, completed_at
        )
        SELECT intencion_uid, ? || ':' || intencion_uid, ?, ?, ?, claimed_at, ?
        FROM comunicacion_intenciones
        WHERE intencion_uid = ? AND estado = 'procesando' AND claim_uid = ?
      `).bind(
        entrada.claimUid, entrada.canal, entrada.resultado, entrada.errorCode,
        entrada.completedAt, entrada.intencionUid, entrada.claimUid
      ),
      this.db.prepare(`
        UPDATE comunicacion_intenciones
        SET estado = ?, next_attempt_at = COALESCE(?, next_attempt_at),
          claim_uid = NULL, claimed_at = NULL, claim_expires_at = NULL,
          canal = ?, last_error_code = ?,
          delivered_at = CASE WHEN ? = 'entregada' THEN ? ELSE delivered_at END
        WHERE intencion_uid = ? AND estado = 'procesando' AND claim_uid = ?
      `).bind(
        entrada.estado, entrada.nextAttemptAt, entrada.canal, entrada.errorCode,
        entrada.estado, entrada.completedAt, entrada.intencionUid, entrada.claimUid
      ),
    ]);
  }
}
