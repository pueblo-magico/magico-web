import { autenticarServicio, type AlcanceServicio } from './serviceAuth.ts';
import { jsonReserva } from './reservasHttp.ts';

export type IdentidadIntegracionReservas = 'manychat' | 'n8n';

export function autenticarIntegracionReservas(
  request: Request,
  env: Record<string, unknown>,
  alcance: AlcanceServicio
): IdentidadIntegracionReservas | Response {
  const identidad = request.headers.get('X-Integration-Id')?.trim().toLowerCase();
  const secreto = request.headers.get('X-Service-Secret') ||
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || null;
  if ((identidad !== 'manychat' && identidad !== 'n8n') ||
      !autenticarServicio(identidad, secreto, env, alcance)) {
    return errorIntegracion('NO_AUTORIZADO', 'La identidad o credencial no es válida.', 401, false);
  }
  return identidad;
}

export function respuestaIntegracion(
  identidad: IdentidadIntegracionReservas,
  data: unknown,
  status = 200,
  meta: Record<string, unknown> = {}
): Response {
  return jsonReserva({ data, meta: { version: 'v1', integracion: identidad, ...meta } }, status);
}

export function errorIntegracion(
  codigo: string,
  mensaje: string,
  status: number,
  reintentable: boolean
): Response {
  return jsonReserva({ error: { codigo, mensaje, reintentable }, meta: { version: 'v1' } }, status);
}
