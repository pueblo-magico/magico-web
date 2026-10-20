import type {
  ConsultaIdempotenteGuardada,
  RepositorioCreacionConsultaIntegracion,
} from '../../_application/reservas/ports.ts';
import type { ConsultaIntegracionCreada } from '../../_domain/reservas/inquiryCreation.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
};
type Database = {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<unknown[]>;
};

function parseRespuesta(valor: unknown): ConsultaIntegracionCreada | null {
  if (typeof valor !== 'string') return null;
  try { return JSON.parse(valor) as ConsultaIntegracionCreada; } catch { return null; }
}

export class D1RepositorioCreacionConsultaIntegracion implements RepositorioCreacionConsultaIntegracion {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async buscarIdempotencia(clave: string): Promise<ConsultaIdempotenteGuardada | null> {
    const row = await this.db.prepare(`
      SELECT request_hash, response_json FROM solicitudes_idempotentes
      WHERE alcance = 'crear_consulta_n8n' AND clave = ? LIMIT 1
    `).bind(clave).first();
    return row ? { requestHash: String(row.request_hash), respuesta: parseRespuesta(row.response_json) } : null;
  }

  async buscarCotizacionId(codigo: string): Promise<number | null> {
    const row = await this.db.prepare('SELECT id FROM cotizaciones WHERE codigo = ? LIMIT 1')
      .bind(codigo).first();
    return row ? Number(row.id) : null;
  }

  async crearAtomica(entrada: Parameters<RepositorioCreacionConsultaIntegracion['crearAtomica']>[0]) {
    const { solicitud } = entrada;
    await this.db.batch([
      this.db.prepare(`
        INSERT INTO solicitudes_idempotentes (alcance, clave, request_hash)
        VALUES ('crear_consulta_n8n', ?, ?)
      `).bind(solicitud.idempotencyKey, entrada.requestHash),
      this.db.prepare(`
        INSERT INTO consultas (
          cliente_nombre, cliente_telefono, cliente_email, alojamiento_interes,
          fecha_desde, fecha_hasta, cantidad_personas, monto_estimado,
          monto_estimado_centavos, subscriber_id, fecha_consulta, canal_origen,
          consulta_uid, codigo, cotizacion_id, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 'n8n', ?, ?, ?,
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      `).bind(
        solicitud.clienteNombre, solicitud.clienteTelefono, solicitud.clienteEmail,
        solicitud.alojamientoInteres, solicitud.fechaDesde, solicitud.fechaHasta,
        solicitud.cantidadPersonas,
        solicitud.montoEstimadoCentavos === null ? null : solicitud.montoEstimadoCentavos / 100,
        solicitud.montoEstimadoCentavos, solicitud.contactoRef,
        entrada.consultaUid, entrada.consultaCodigo, entrada.cotizacionId
      ),
      this.db.prepare(`
        INSERT INTO consulta_integracion_referencias (
          consulta_id, integracion, contacto_ref, conversacion_ref
        )
        SELECT id, 'n8n', ?, ? FROM consultas WHERE consulta_uid = ?
      `).bind(solicitud.contactoRef, solicitud.conversacionRef, entrada.consultaUid),
      this.db.prepare(`
        UPDATE solicitudes_idempotentes
        SET consulta_id = c.id, status_code = 201,
            response_json = json_object(
              'consultaId', c.id, 'codigo', c.codigo, 'estado', 'registrada',
              'createdAt', c.created_at, 'cotizacionCodigo', ?, 'idempotente', json('false')
            ),
            estado = 'completada', completed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        FROM consultas c
        WHERE alcance = 'crear_consulta_n8n' AND clave = ? AND c.consulta_uid = ?
      `).bind(solicitud.cotizacionCodigo, solicitud.idempotencyKey, entrada.consultaUid),
    ]);
    const guardada = await this.buscarIdempotencia(solicitud.idempotencyKey);
    if (!guardada?.respuesta) throw new Error('No se pudo recuperar la consulta creada.');
    return guardada.respuesta;
  }
}
