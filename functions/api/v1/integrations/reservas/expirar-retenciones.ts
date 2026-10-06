import { expirarRetenciones } from '../../../../_application/reservas/expirarRetenciones.ts';
import { D1RepositorioRetencionesReserva } from '../../../../_infrastructure/d1/D1RepositorioRetencionesReserva.ts';
import { autenticarServicio } from '../../../../_interfaces/http/serviceAuth.ts';
import { jsonReserva as json } from '../../../../_interfaces/http/reservasHttp.ts';

export async function onRequestPost({ request, env }: any) {
  const secreto = request.headers.get('X-Service-Secret') ||
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || null;
  if (!autenticarServicio('n8n', secreto, env, 'reservas:expirar')) {
    return json({ error: 'No autorizado.' }, 401);
  }
  const resultado = await expirarRetenciones(new D1RepositorioRetencionesReserva(env.DB));
  return json({ ok: true, expiradas: resultado.expiradas }, 200);
}
