type Result = { results?: Record<string, unknown>[] };
type Statement = { all(): Promise<Result> };
type Database = { prepare(query: string): Statement };

export type RegistroAplicacionApi = {
  codigo: string;
  nombre: string;
  tipo: string;
  estado: string;
  registradoAt: string;
};

export type UsoEndpointAplicacionApi = {
  aplicacionCodigo: string;
  method: string;
  endpoint: string;
  firstUsedAt: string;
  lastUsedAt: string;
  requestCount: number;
};

export class D1RepositorioAplicacionesApi {
  private readonly db: Database;

  constructor(db: Database) { this.db = db; }

  async listar(): Promise<{ aplicaciones: RegistroAplicacionApi[]; usos: UsoEndpointAplicacionApi[] }> {
    const [aplicaciones, usos] = await Promise.all([
      this.db.prepare(`
        SELECT codigo, nombre, tipo, estado, registrado_at
        FROM api_applications ORDER BY registrado_at, codigo
      `).all(),
      this.db.prepare(`
        SELECT application_codigo, method, endpoint, first_used_at, last_used_at, request_count
        FROM api_application_endpoint_usage
        ORDER BY application_codigo, endpoint, method
      `).all(),
    ]);
    return {
      aplicaciones: (aplicaciones.results || []).map(row => ({
        codigo: String(row.codigo), nombre: String(row.nombre), tipo: String(row.tipo),
        estado: String(row.estado), registradoAt: String(row.registrado_at),
      })),
      usos: (usos.results || []).map(row => ({
        aplicacionCodigo: String(row.application_codigo), method: String(row.method),
        endpoint: String(row.endpoint), firstUsedAt: String(row.first_used_at),
        lastUsedAt: String(row.last_used_at), requestCount: Number(row.request_count),
      })),
    };
  }
}
