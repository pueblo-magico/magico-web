import {
  reclamarNotificacionArrepentimiento,
  registrarResultadoNotificacionArrepentimiento,
} from '../../../../_application/reservas/gestionarNotificacionesArrepentimiento.ts';
import { D1RepositorioNotificacionesArrepentimiento } from '../../../../_infrastructure/d1/D1RepositorioNotificacionesArrepentimiento.ts';
import {
  autenticarIntegracionReservas,
  errorIntegracion,
  respuestaIntegracion,
} from '../../../../_interfaces/http/integrationApiV1.ts';
import { observarSolicitud } from '../../../../_interfaces/http/observability.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../../../_interfaces/http/requestSecurity.ts';

async function procesar(request: Request, env: any): Promise<Response> {
  const identidad = autenticarIntegracionReservas(request, env, 'comunicaciones:entregar');
  if (identidad instanceof Response) return identidad;
  let body: Record<string, any>;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }
  const repositorio = new D1RepositorioNotificacionesArrepentimiento(env.DB);
  try {
    if (body.accion === 'reclamar') {
      const entrega = await reclamarNotificacionArrepentimiento(String(body.notificacion_uid || ''), repositorio);
      if (!entrega) return errorIntegracion('NOTIFICACION_NO_DISPONIBLE', 'La notificación no está disponible para entrega.', 409, false);
      const response = respuestaIntegracion(identidad, {
        notificacion_uid: entrega.notificacionUid,
        claim_uid: entrega.claimUid,
        delivery_uid: entrega.deliveryUid,
        canal: 'email',
        destinatario: entrega.destinatario,
        asunto: entrega.asunto,
        cuerpo: entrega.cuerpo,
        idioma: entrega.idioma,
        plantilla_version: entrega.plantillaVersion,
      });
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }
    if (body.accion === 'resultado') {
      const resultado = String(body.resultado || '');
      if (!['entregada', 'retry', 'dead_letter'].includes(resultado)) {
        return errorIntegracion('DATOS_INVALIDOS', 'El resultado no es válido.', 400, false);
      }
      const actualizado = await registrarResultadoNotificacionArrepentimiento({
        notificacionUid: String(body.notificacion_uid || ''),
        claimUid: String(body.claim_uid || ''),
        deliveryUid: String(body.delivery_uid || ''),
        resultado: resultado as 'entregada' | 'retry' | 'dead_letter',
        errorCode: body.error_code ? String(body.error_code) : null,
      }, repositorio);
      if (!actualizado) return errorIntegracion('ENTREGA_DESACTUALIZADA', 'La entrega ya no está vigente.', 409, false);
      return respuestaIntegracion(identidad, { ok: true, estado: resultado });
    }
    return errorIntegracion('DATOS_INVALIDOS', 'La acción no es válida.', 400, false);
  } catch (error: any) {
    if (error?.codigo === 'DATOS_INVALIDOS') {
      return errorIntegracion('DATOS_INVALIDOS', error.message, 400, false);
    }
    throw error;
  }
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
  return observarSolicitud(
    request,
    'integration.withdrawal_notifications.deliver',
    () => procesar(request, env)
  );
}
