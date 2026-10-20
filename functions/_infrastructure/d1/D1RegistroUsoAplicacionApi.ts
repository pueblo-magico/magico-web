export type AplicacionApiCodigo =
  | 'n8n'
  | 'manychat'
  | 'outbox'
  | 'cucuru'
  | 'mercado_pago'
  | 'accounting'
  | 'stock';

type Statement = {
  bind(...values: unknown[]): Statement;
  run(): Promise<unknown>;
};

type Database = {
  prepare(query: string): Statement;
};

export async function registrarUsoAplicacionApi(
  db: Database | undefined,
  aplicacion: AplicacionApiCodigo,
  method: string,
  endpoint: string
): Promise<boolean> {
  if (!db) return false;
  try {
    await db.prepare(`
      INSERT INTO api_application_endpoint_usage (
        application_codigo, method, endpoint, first_used_at, last_used_at, request_count
      ) VALUES (?, ?, ?,
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 1)
      ON CONFLICT(application_codigo, method, endpoint) DO UPDATE SET
        last_used_at = excluded.last_used_at,
        request_count = api_application_endpoint_usage.request_count + 1
    `).bind(aplicacion, method.toUpperCase(), endpoint).run();
    return true;
  } catch {
    // La telemetría administrativa nunca debe interrumpir una integración válida.
    return false;
  }
}
