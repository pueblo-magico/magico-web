import {
  reclamarNotificacionReserva,
  registrarResultadoNotificacionReserva,
} from '../../../../_application/reservas/gestionarNotificacionesReserva.ts';
import { D1RepositorioIntencionesComunicacion } from '../../../../_infrastructure/d1/D1RepositorioIntencionesComunicacion.ts';
import {
  autenticarIntegracionReservas,
  errorIntegracion,
  registrarUsoIntegracionReservas,
  respuestaIntegracion,
} from '../../../../_interfaces/http/integrationApiV1.ts';
import { observarSolicitud } from '../../../../_interfaces/http/observability.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../../../_interfaces/http/requestSecurity.ts';

async function procesar(request: Request, env: any): Promise<Response> {
  const identidad = autenticarIntegracionReservas(request, env, 'comunicaciones:entregar');
  if (identidad instanceof Response) return identidad;
  await registrarUsoIntegracionReservas(request, env, identidad);
  let body: Record<string, any>;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }

  const repositorio = new D1RepositorioIntencionesComunicacion(env.DB);
  try {
    if (body.accion === 'reclamar') {
      const entrega = await reclamarNotificacionReserva({
        intencionUid: String(body.intencion_uid || ''),
        publicSiteUrl: env.RESERVAS_PUBLIC_SITE_URL || new URL(request.url).origin,
      }, repositorio);
      if (!entrega) {
        return errorIntegracion(
          'NOTIFICACION_NO_DISPONIBLE',
          'La notificación no está disponible para entrega.',
          409,
          false
        );
      }
      if (entrega.estado === 'sin_canal') {
        return respuestaIntegracion(identidad, {
          intencion_uid: entrega.intencionUid,
          estado: entrega.estado,
          canal: entrega.canal,
        });
      }
      const response = respuestaIntegracion(identidad, {
        intencion_uid: entrega.intencionUid,
        claim_uid: entrega.claimUid,
        delivery_uid: entrega.deliveryUid,
        intento: entrega.intento,
        max_intentos: entrega.maxIntentos,
        estado: entrega.estado,
        canal: entrega.canal,
        destinatario: entrega.destinatario,
        asunto: entrega.asunto,
        cuerpo: entrega.cuerpo,
        idioma: entrega.idioma,
      });
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    if (body.accion === 'resultado') {
      const resultado = String(body.resultado || '');
      if (!['entregada', 'retry', 'dead_letter'].includes(resultado)) {
        return errorIntegracion('DATOS_INVALIDOS', 'El resultado no es válido.', 400, false);
      }
      const actualizado = await registrarResultadoNotificacionReserva({
        intencionUid: String(body.intencion_uid || ''),
        claimUid: String(body.claim_uid || ''),
        deliveryUid: String(body.delivery_uid || ''),
        resultado: resultado as 'entregada' | 'retry' | 'dead_letter',
        errorCode: body.error_code ? String(body.error_code) : null,
      }, repositorio);
      if (!actualizado) {
        return errorIntegracion(
          'ENTREGA_DESACTUALIZADA',
          'La entrega ya no está vigente.',
          409,
          false
        );
      }
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
    'integration.reservation_notifications.deliver',
    () => procesar(request, env)
  );
}
