const JSON_MAX_BYTES = 32 * 1024;

export async function leerJsonSeguro(request: Request, maxBytes = JSON_MAX_BYTES): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') throw new Error('CONTENT_TYPE');
  const announced = Number(request.headers.get('Content-Length') || '0');
  if (Number.isFinite(announced) && announced > maxBytes) throw new Error('BODY_TOO_LARGE');
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new Error('BODY_TOO_LARGE');
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('INVALID_JSON'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('INVALID_JSON');
  return parsed as Record<string, unknown>;
}

export function respuestaJsonInvalido(error: unknown, extraHeaders: Record<string, string> = {}): Response {
  const code = error instanceof Error ? error.message : '';
  if (code === 'BODY_TOO_LARGE') {
    return new Response(JSON.stringify({ error: 'La solicitud supera el tamaño permitido.' }), {
      status: 413, headers: { 'Content-Type': 'application/json', ...extraHeaders },
    });
  }
  return new Response(JSON.stringify({ error: 'Body inválido — se espera JSON.' }), {
    status: 400, headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}
