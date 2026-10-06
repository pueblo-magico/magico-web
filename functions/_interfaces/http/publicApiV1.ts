import { leerJsonSeguro, respuestaJsonInvalido } from './requestSecurity.ts';

const ORIGENES = ['https://experienciamagico.com'];
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function headersPublicos(request: Request, metodos: string): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const permitido = ORIGENES.includes(origin) || LOCAL.test(origin);
  return {
    'Access-Control-Allow-Origin': permitido ? origin : ORIGENES[0],
    'Access-Control-Allow-Methods': `${metodos}, OPTIONS`,
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

export function jsonPublico(request: Request, metodos: string, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headersPublicos(request, metodos) },
  });
}

export async function leerJsonPublico(request: Request, metodos: string) {
  try {
    return { ok: true as const, body: await leerJsonSeguro(request) };
  } catch (error) {
    return { ok: false as const, response: respuestaJsonInvalido(error, headersPublicos(request, metodos)) };
  }
}

export function optionsPublico(request: Request, metodos: string) {
  return new Response(null, { status: 204, headers: headersPublicos(request, metodos) });
}
