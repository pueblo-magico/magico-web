import type {
  RepositorioCreacionReservaPublica,
  SolicitudIdempotenteGuardada,
} from '../../_application/reservas/ports.ts';
import type {
  CotizacionAceptada,
  ReservaPublicaCreada,
} from '../../_domain/reservas/reservationCreation.ts';
import { esRegimenAlimentacion } from '../../_domain/reservas/alimentacion.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
};
type Database = {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<unknown[]>;
};

function parseRespuesta(valor: unknown): ReservaPublicaCreada | null {
  if (typeof valor !== 'string') return null;
  try {
    return JSON.parse(valor) as ReservaPublicaCreada;
  } catch {
    return null;
  }
}

export class D1RepositorioCreacionReservaPublica implements RepositorioCreacionReservaPublica {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async buscarIdempotencia(clave: string): Promise<SolicitudIdempotenteGuardada | null> {
    const row = await this.db.prepare(`
      SELECT request_hash, response_json
      FROM solicitudes_idempotentes
      WHERE alcance = 'crear_reserva_publica' AND clave = ?
      LIMIT 1
    `).bind(clave).first();
    return row ? {
      requestHash: String(row.request_hash),
      respuesta: parseRespuesta(row.response_json),
    } : null;
  }

  async obtenerCotizacion(codigo: string): Promise<CotizacionAceptada | null> {
    const row = await this.db.prepare(`
      SELECT id, codigo, fecha_checkin, fecha_checkout, cantidad_personas,
             moneda, subtotal_centavos, sena_centavos, expires_at, desglose_json
      FROM cotizaciones WHERE codigo = ? LIMIT 1
    `).bind(codigo).first();
    if (!row) return null;
    const desglose = JSON.parse(String(row.desglose_json)) as Record<string, unknown>;
    const tipo = desglose.tipo_alojamiento;
    const modalidad = desglose.modalidad ?? (tipo === 'domo' ? 'privada' : 'compartida');
    const contexto = desglose.contexto ?? 'general';
    const regimen = desglose.regimen_alimentacion ?? 'desayuno_incluido';
    if ((tipo !== 'domo' && tipo !== 'refugio') ||
        (modalidad !== 'privada' && modalidad !== 'compartida') ||
        (contexto !== 'general' && contexto !== 'retiro') || !esRegimenAlimentacion(regimen)) {
      return null;
    }
    return {
      id: Number(row.id), codigo: String(row.codigo), tipo, modalidad, contexto,
      regimenAlimentacion: regimen,
      fechaCheckin: String(row.fecha_checkin), fechaCheckout: String(row.fecha_checkout),
      personas: Number(row.cantidad_personas), moneda: String(row.moneda),
      totalCentavos: Number(row.subtotal_centavos), senaCentavos: Number(row.sena_centavos),
      expiresAt: String(row.expires_at),
    };
  }

  async crearAtomica(entrada: Parameters<RepositorioCreacionReservaPublica['crearAtomica']>[0]) {
    const { solicitud, cotizacion } = entrada;
    const alojamientoLegacyId = solicitud.espacioCodigo === 'domo-1' ? 1
      : solicitud.espacioCodigo === 'domo-2' ? 2
        : solicitud.espacioCodigo.startsWith('refugio') ? 3 : null;
    if (alojamientoLegacyId === null) throw new Error('Espacio sin proyección legacy.');

    const statements = [
      this.db.prepare(`
        INSERT INTO solicitudes_idempotentes (alcance, clave, request_hash)
        VALUES ('crear_reserva_publica', ?, ?)
      `).bind(solicitud.idempotencyKey, entrada.requestHash),
      this.db.prepare(`
        INSERT INTO reservas (
          cliente_nombre, cliente_telefono, cliente_email, alojamiento_id,
          fecha_checkin, fecha_checkout, cantidad_personas, monto_total, monto_sena,
          estado, canal_origen, tipo_estadia, reserva_uid, codigo, moneda,
          monto_total_centavos, monto_sena_centavos, updated_at, cotizacion_id,
          estado_flujo, hold_expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', 'Web', 'huesped', ?, ?, ?, ?, ?,
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), ?, 'pendiente_pago', ?)
      `).bind(
        solicitud.clienteNombre, solicitud.clienteTelefono, solicitud.clienteEmail,
        alojamientoLegacyId, cotizacion.fechaCheckin, cotizacion.fechaCheckout,
        cotizacion.personas, cotizacion.totalCentavos / 100, cotizacion.senaCentavos / 100,
        entrada.reservaUid, entrada.reservaCodigo, cotizacion.moneda,
        cotizacion.totalCentavos, cotizacion.senaCentavos, cotizacion.id, entrada.holdExpiresAt
      ),
      this.db.prepare(`
        UPDATE reserva_estadias
        SET modalidad = ?, espacio_solicitado_ref = ?,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE reserva_id = (SELECT id FROM reservas WHERE reserva_uid = ?) AND tramo = 1
      `).bind(cotizacion.modalidad, `espacio:${solicitud.espacioCodigo}`, entrada.reservaUid),
      this.db.prepare(`
        UPDATE reserva_estadia_espacios
        SET espacio_id = (SELECT id FROM espacios WHERE codigo = ?),
            origen = 'solicitud', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE reserva_estadia_id = (
          SELECT re.id FROM reserva_estadias re JOIN reservas r ON r.id = re.reserva_id
          WHERE r.reserva_uid = ? AND re.tramo = 1
        )
      `).bind(solicitud.espacioCodigo, entrada.reservaUid),
      this.db.prepare(`
        INSERT INTO retenciones_reserva (reserva_id, expires_at)
        SELECT id, ? FROM reservas WHERE reserva_uid = ?
      `).bind(entrada.holdExpiresAt, entrada.reservaUid),
      this.db.prepare(`
        INSERT INTO reserva_metodos_pago (
          reserva_id, metodo, pagador_documento_tipo, pagador_documento_hash,
          pagador_documento_ultimos4, monto_esperado_centavos, moneda
        )
        SELECT id, ?, ?, ?, ?, ?, ? FROM reservas WHERE reserva_uid = ?
      `).bind(
        solicitud.metodoPago,
        solicitud.metodoPago === 'transferencia_mp' ? 'DNI' : null,
        solicitud.pagadorDocumentoHash,
        solicitud.pagadorDocumentoUltimos4,
        cotizacion.senaCentavos,
        cotizacion.moneda,
        entrada.reservaUid
      ),
      this.db.prepare(`
        INSERT INTO reserva_politica_snapshots (
          reserva_id, politica_id, codigo, version, estado_configuracion,
          reglas_json, aceptada_at
        )
        SELECT r.id, p.id, c.politica_cancelacion_codigo,
               c.politica_cancelacion_version,
               CASE WHEN c.politica_cancelacion_estado = 'publicada'
                 THEN 'configurada' ELSE 'pendiente_configuracion' END,
               c.politica_cancelacion_json,
               CASE WHEN c.politica_cancelacion_estado = 'publicada'
                 THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') ELSE NULL END
        FROM reservas r
        JOIN cotizaciones c ON c.id = r.cotizacion_id
        LEFT JOIN politicas_cancelacion p
          ON p.codigo = c.politica_cancelacion_codigo
         AND p.version = c.politica_cancelacion_version
        WHERE r.reserva_uid = ?
      `).bind(entrada.reservaUid),
      this.db.prepare(`
        INSERT INTO ocupacion_reserva_noches (
          reserva_estadia_id, espacio_id, fecha, cantidad_huespedes, modalidad
        )
        WITH RECURSIVE noches(fecha) AS (
          SELECT ? UNION ALL SELECT date(fecha, '+1 day') FROM noches WHERE date(fecha, '+1 day') < ?
        )
        SELECT re.id, e.id, noches.fecha, ?, ?
        FROM noches
        JOIN reservas r ON r.reserva_uid = ?
        JOIN reserva_estadias re ON re.reserva_id = r.id AND re.tramo = 1
        JOIN espacios e ON e.codigo = ?
      `).bind(
        cotizacion.fechaCheckin, cotizacion.fechaCheckout, cotizacion.personas,
        cotizacion.modalidad, entrada.reservaUid, solicitud.espacioCodigo
      ),
      this.db.prepare(`
        INSERT INTO reserva_eventos (
          reserva_id, tipo, actor_tipo, actor_ref, correlation_id, payload_json
        )
        SELECT id, 'reserva.creada', 'usuario', 'publico', ?,
               json_object('cotizacion_codigo', ?, 'espacio_codigo', ?)
        FROM reservas WHERE reserva_uid = ?
      `).bind(entrada.requestHash, cotizacion.codigo, solicitud.espacioCodigo, entrada.reservaUid),
      this.db.prepare(`
        INSERT INTO reserva_eventos (
          reserva_id, tipo, actor_tipo, actor_ref, correlation_id, payload_json
        )
        SELECT id, 'reserva.retencion_iniciada', 'sistema', 'reservas', ?,
               json_object('expires_at', ?)
        FROM reservas WHERE reserva_uid = ?
      `).bind(entrada.requestHash, entrada.holdExpiresAt, entrada.reservaUid),
      this.db.prepare(`
        UPDATE solicitudes_idempotentes
        SET reserva_id = r.id, status_code = 201,
            response_json = json_object(
              'reservaId', r.id, 'codigo', r.codigo, 'estado', 'pendiente_pago',
              'expiresAt', r.hold_expires_at, 'cotizacionCodigo', ?,
              'metodoPago', ?, 'idempotente', json('false')
            ),
            estado = 'completada', completed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        FROM reservas r
        WHERE alcance = 'crear_reserva_publica' AND clave = ? AND r.reserva_uid = ?
      `).bind(cotizacion.codigo, solicitud.metodoPago, solicitud.idempotencyKey, entrada.reservaUid),
    ];

    await this.db.batch(statements);
    const guardada = await this.buscarIdempotencia(solicitud.idempotencyKey);
    if (!guardada?.respuesta) throw new Error('No se pudo recuperar la reserva creada.');
    return guardada.respuesta;
  }
}
