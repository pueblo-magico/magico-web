import { registrarPagoManual } from '../../../../../_application/reservas/registrarPagoManual.ts';
import { D1RepositorioPagosManualesReserva } from '../../../../../_infrastructure/d1/D1RepositorioPagosManualesReserva.ts';
import { observarSolicitud } from '../../../../../_interfaces/http/observability.ts';
import { programarDespachoOutbox } from '../../../../../_interfaces/http/backgroundOutboxDispatch.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../../../../_interfaces/http/requestSecurity.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../../../_lib/authGuard.ts';

async function ejecutar(
  request: Request,
  env: any,
  params: Record<string, string>,
  correlationId: string,
  waitUntil?: (promise: Promise<unknown>) => void
): Promise<Response> {
  const auth = await requirePermission(request, env, 'reservas.pagos.gestionar');
  if (auth instanceof Response) return auth;

  let body: Record<string, any>;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }

  try {
    const resultado = await registrarPagoManual({
      reservaId: Number(params.id),
      expectedVersion: Number(body.expected_version),
      tipo: body.tipo,
      metodo: body.metodo,
      montoCentavos: Number(body.monto_centavos),
      moneda: String(body.moneda || 'ARS'),
      referencia: body.referencia ?? null,
      pagadoAt: body.pagado_at,
      motivo: body.motivo,
      idempotencyKey: String(body.idempotency_key || ''),
      actorEmail: auth.email,
      correlationId,
    }, new D1RepositorioPagosManualesReserva(env.DB));

    if (resultado.reservaConfirmada) {
      programarDespachoOutbox(env, waitUntil, 'admin.reservations.payment', {
        reservationId: resultado.reservaId,
        communicationIntentTypes: ['pago_aprobado'],
      });
    }

    return json({ data: resultado, meta: { version: 'v1' } }, 201);
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo registrar el pago.', status: 500,
    });
  }
}

export async function onRequestPost({ request, env, params, waitUntil }: any): Promise<Response> {
  return observarSolicitud(
    request,
    'admin.reservations.payment.create',
    contexto => ejecutar(request, env, params, contexto.requestId, waitUntil)
  );
}
