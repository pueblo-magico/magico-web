import { crearSolicitudArrepentimiento } from '../../../_application/reservas/gestionarArrepentimientos.ts';
import { D1RepositorioSolicitudesArrepentimiento } from '../../../_infrastructure/d1/D1RepositorioSolicitudesArrepentimiento.ts';
import { jsonPublico, leerJsonPublico, optionsPublico } from '../../../_interfaces/http/publicApiV1.ts';
import { consumirLimite, respuestaLimite } from '../../../_interfaces/http/rateLimit.ts';
import { observarSolicitud } from '../../../_interfaces/http/observability.ts';

const METODOS = 'GET, POST';
export const onRequestOptions = ({ request }: any) => optionsPublico(request, METODOS);

const STATUS: Record<string, number> = {
  IDEMPOTENCY_KEY_REQUERIDA: 400,
  IDEMPOTENCY_KEY_REUTILIZADA: 409,
  EMAIL_INVALIDO: 400,
  CODIGO_RESERVA_INVALIDO: 400,
  DETALLE_INVALIDO: 400,
  IDIOMA_INVALIDO: 400,
};

async function crear(request: Request, env: any, requestId: string): Promise<Response> {
  const limitada = respuestaLimite(await consumirLimite(request, env, 'publico.v1.arrepentimientos', 5, 3600));
  if (limitada) return limitada;
  const lectura = await leerJsonPublico(request, METODOS);
  if (!lectura.ok) return lectura.response;
  const body: any = lectura.body;
  const resultado = await crearSolicitudArrepentimiento({
    reservaCodigo: body.reserva_codigo ? String(body.reserva_codigo) : null,
    email: String(body.email || ''),
    detalle: String(body.detalle || ''),
    idioma: body.idioma === undefined ? undefined : String(body.idioma) as 'es' | 'en',
    idempotencyKey: request.headers.get('Idempotency-Key') || '',
    correlationId: requestId,
  }, new D1RepositorioSolicitudesArrepentimiento(env.DB));

  if (!resultado.ok) {
    return jsonPublico(request, METODOS, {
      error: { codigo: resultado.codigo, mensaje: resultado.mensaje, reintentable: false },
      meta: { version: 'v1' },
    }, STATUS[resultado.codigo] || 400);
  }

  return jsonPublico(request, METODOS, {
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

async function consultar(request: Request, env: any): Promise<Response> {
  const limitada = respuestaLimite(await consumirLimite(request, env, 'publico.v1.arrepentimientos.estado', 10, 3600));
  if (limitada) return limitada;
  const url = new URL(request.url);
  const codigo = (url.searchParams.get('codigo') || '').trim().toUpperCase();
  const email = (url.searchParams.get('email') || '').trim().toLowerCase();
  if (!/^ARR-[A-Za-z0-9-]{8,100}$/.test(codigo) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonPublico(request, METODOS, {
      error: { codigo: 'SOLICITUD_NO_ENCONTRADA', mensaje: 'No pudimos verificar una solicitud con esos datos.', reintentable: false },
      meta: { version: 'v1' },
    }, 404);
  }
  const item = await new D1RepositorioSolicitudesArrepentimiento(env.DB).buscarPublica(codigo, email);
  if (!item) {
    return jsonPublico(request, METODOS, {
      error: { codigo: 'SOLICITUD_NO_ENCONTRADA', mensaje: 'No pudimos verificar una solicitud con esos datos.', reintentable: false },
      meta: { version: 'v1' },
    }, 404);
  }
  const response = jsonPublico(request, METODOS, {
    data: {
      solicitud: {
        codigo: item.codigo,
        estado: item.estado,
        recibida_at: item.acknowledgedAt,
        actualizada_at: item.updatedAt,
        mensaje: item.mensajeCliente,
      },
    },
    meta: { version: 'v1' },
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
  return observarSolicitud(
    request,
    'public.v1.withdrawal_requests.create',
    contexto => crear(request, env, contexto.requestId)
  );
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
  return observarSolicitud(
    request,
    'public.v1.withdrawal_requests.read',
    () => consultar(request, env)
  );
}
