import { crearSolicitudArrepentimiento } from '../../../_application/reservas/gestionarArrepentimientos.ts';
import { D1RepositorioSolicitudesArrepentimiento } from '../../../_infrastructure/d1/D1RepositorioSolicitudesArrepentimiento.ts';
import { jsonPublico, leerJsonPublico, optionsPublico } from '../../../_interfaces/http/publicApiV1.ts';
import { consumirLimite, respuestaLimite } from '../../../_interfaces/http/rateLimit.ts';
import { observarSolicitud } from '../../../_interfaces/http/observability.ts';

export const onRequestOptions = ({ request }: any) => optionsPublico(request, 'POST');

const STATUS: Record<string, number> = {
  IDEMPOTENCY_KEY_REQUERIDA: 400,
  IDEMPOTENCY_KEY_REUTILIZADA: 409,
  EMAIL_INVALIDO: 400,
  CODIGO_RESERVA_INVALIDO: 400,
  DETALLE_INVALIDO: 400,
};

async function crear(request: Request, env: any, requestId: string): Promise<Response> {
  const limitada = respuestaLimite(await consumirLimite(request, env, 'publico.v1.arrepentimientos', 5, 3600));
  if (limitada) return limitada;
  const lectura = await leerJsonPublico(request, 'POST');
  if (!lectura.ok) return lectura.response;
  const body: any = lectura.body;
  const resultado = await crearSolicitudArrepentimiento({
    reservaCodigo: body.reserva_codigo ? String(body.reserva_codigo) : null,
    email: String(body.email || ''),
    detalle: String(body.detalle || ''),
    idempotencyKey: request.headers.get('Idempotency-Key') || '',
    correlationId: requestId,
  }, new D1RepositorioSolicitudesArrepentimiento(env.DB));

  if (!resultado.ok) {
    return jsonPublico(request, 'POST', {
      error: { codigo: resultado.codigo, mensaje: resultado.mensaje, reintentable: false },
      meta: { version: 'v1' },
    }, STATUS[resultado.codigo] || 400);
  }

  return jsonPublico(request, 'POST', {
    data: {
      solicitud: {
        codigo: resultado.valor.codigo,
        estado: resultado.valor.estado,
        recibida_at: resultado.valor.acknowledgedAt,
      },
    },
    meta: { version: 'v1', idempotente: resultado.idempotente },
  }, resultado.idempotente ? 200 : 201);
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
  return observarSolicitud(
    request,
    'public.v1.withdrawal_requests.create',
    contexto => crear(request, env, contexto.requestId)
  );
}
