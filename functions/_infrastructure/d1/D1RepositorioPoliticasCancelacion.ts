import type {
  RepositorioPoliticasCancelacion,
  ResumenPoliticaCancelacion,
} from '../../_application/reservas/ports.ts';
import type { BorradorPoliticaCancelacion } from '../../_domain/reservas/refundPolicies.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<{ results?: Record<string, unknown>[] }>;
};
type Database = {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<Array<{ results?: Record<string, unknown>[] }>>;
};

const CAMPOS = 'id, codigo, nombre, version, estado, reglas_json, vigencia_desde, publicado_at';

function mapear(row: Record<string, unknown>): ResumenPoliticaCancelacion {
  return {
    id: Number(row.id),
    codigo: String(row.codigo),
    nombre: String(row.nombre),
    version: Number(row.version),
    estado: row.estado as ResumenPoliticaCancelacion['estado'],
    vigenciaDesde: row.vigencia_desde == null ? null : String(row.vigencia_desde),
    publicadoAt: row.publicado_at == null ? null : String(row.publicado_at),
    reglas: JSON.parse(String(row.reglas_json)),
  };
}

export class D1RepositorioPoliticasCancelacion implements RepositorioPoliticasCancelacion {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async listar(): Promise<ResumenPoliticaCancelacion[]> {
    const result = await this.db.prepare(`
      SELECT ${CAMPOS} FROM politicas_cancelacion ORDER BY codigo, version DESC
    `).all();
    return (result.results || []).map(mapear);
  }

  async crearBorrador(politica: BorradorPoliticaCancelacion): Promise<ResumenPoliticaCancelacion> {
    const reglasJson = JSON.stringify({
      estado: 'configurada',
      reglas: politica.reglas.map(regla => ({
        horas_minimas_antes: regla.horasMinimasAntes,
        porcentaje_devolucion_bps: regla.porcentajeDevolucionBps,
      })),
    });
    const row = await this.db.prepare(`
      INSERT INTO politicas_cancelacion (
        codigo, nombre, version, estado, reglas_json, vigencia_desde
      ) VALUES (
        ?, ?,
        (SELECT COALESCE(MAX(version), 0) + 1 FROM politicas_cancelacion WHERE codigo = ?),
        'borrador', ?, ?
      )
      RETURNING ${CAMPOS}
    `).bind(
      politica.codigo, politica.nombre, politica.codigo, reglasJson, politica.vigenciaDesde
    ).first();
    if (!row) throw new Error('D1 no devolvió la política creada.');
    return mapear(row);
  }

  async publicar(id: number): Promise<ResumenPoliticaCancelacion | null> {
    const resultados = await this.db.batch([
      this.db.prepare(`
        UPDATE politicas_cancelacion SET estado = 'retirada'
        WHERE estado = 'publicada' AND codigo = (
          SELECT codigo FROM politicas_cancelacion WHERE id = ? AND estado = 'borrador'
        )
      `).bind(id),
      this.db.prepare(`
        UPDATE politicas_cancelacion
        SET estado = 'publicada', publicado_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND estado = 'borrador'
          AND json_array_length(json_extract(reglas_json, '$.reglas')) > 0
        RETURNING ${CAMPOS}
      `).bind(id),
    ]);
    const row = resultados[1]?.results?.[0];
    return row ? mapear(row) : null;
  }
}
