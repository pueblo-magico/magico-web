import { listarAlojamientosPublicos } from '../../../_application/reservas/listarAlojamientosPublicos.ts';
import { D1RepositorioInventarioAlojamiento } from '../../../_infrastructure/d1/D1RepositorioInventarioAlojamiento.ts';
import { jsonPublico, optionsPublico } from '../../../_interfaces/http/publicApiV1.ts';
import { consumirLimite, respuestaLimite } from '../../../_interfaces/http/rateLimit.ts';

export const onRequestOptions = ({ request }: any) => optionsPublico(request, 'GET');

export async function onRequestGet({ request, env }: any) {
  const limitada = respuestaLimite(await consumirLimite(request, env, 'publico.v1.alojamientos', 60, 60));
  if (limitada) return limitada;
  const contexto = new URL(request.url).searchParams.get('contexto') || 'general';
  if (contexto !== 'general' && contexto !== 'retiro') {
    return jsonPublico(request, 'GET', { error: { codigo: 'CONTEXTO_INVALIDO', mensaje: 'El contexto es inválido.' } }, 400);
  }
  const alojamientos = await listarAlojamientosPublicos(
    contexto,
    new D1RepositorioInventarioAlojamiento(env.DB)
  );
  return jsonPublico(request, 'GET', { data: alojamientos, meta: { version: 'v1', contexto } });
}
