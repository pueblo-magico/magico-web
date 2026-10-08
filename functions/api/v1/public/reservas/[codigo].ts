import { D1RepositorioConsultaEstadoReservaPublica } from '../../../../_infrastructure/d1/D1RepositorioConsultaEstadoReservaPublica.ts';
import { jsonPublico, optionsPublico } from '../../../../_interfaces/http/publicApiV1.ts';
import { consumirLimite, respuestaLimite } from '../../../../_interfaces/http/rateLimit.ts';

export const onRequestOptions = ({ request }: any) => optionsPublico(request, 'GET');

export async function onRequestGet({ request, env, params }: any) {
  const limitada = respuestaLimite(await consumirLimite(request, env, 'publico.v1.estado-reserva', 60, 60));
  if (limitada) return limitada;
  const codigo = String(params?.codigo || '').trim();
  if (!/^RES-[0-9a-f-]{36}$/i.test(codigo)) {
    return jsonPublico(request, 'GET', {
      error: { codigo: 'RESERVA_NO_ENCONTRADA', mensaje: 'No encontramos la reserva.' },
    }, 404);
  }

  const estado = await new D1RepositorioConsultaEstadoReservaPublica(env.DB).obtenerPorCodigo(codigo);
  if (!estado) {
    return jsonPublico(request, 'GET', {
      error: { codigo: 'RESERVA_NO_ENCONTRADA', mensaje: 'No encontramos la reserva.' },
    }, 404);
  }
  return jsonPublico(request, 'GET', {
    data: {
      reserva: {
        codigo: estado.codigo,
        estado: estado.estado,
        expires_at: estado.expiresAt,
      },
      pago: { proveedor: 'mercado_pago', estado: estado.pagoEstado || 'pendiente' },
    },
    meta: { version: 'v1' },
  });
}
