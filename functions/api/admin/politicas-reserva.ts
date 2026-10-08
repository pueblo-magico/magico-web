import {
  crearBorradorPoliticaCancelacion,
  publicarPoliticaCancelacion,
  resolverExcepcionPoliticaReserva,
  solicitarExcepcionPoliticaReserva,
} from '../../_application/reservas/gestionarPoliticasCancelacion.ts';
import type { BorradorPoliticaCancelacion } from '../../_domain/reservas/refundPolicies.ts';
import { D1RegistroAuditoriaReservas } from '../../_infrastructure/d1/D1RegistroAuditoriaReservas.ts';
import { D1RepositorioExcepcionesPoliticaReserva } from '../../_infrastructure/d1/D1RepositorioExcepcionesPoliticaReserva.ts';
import { D1RepositorioPoliticasCancelacion } from '../../_infrastructure/d1/D1RepositorioPoliticasCancelacion.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../_interfaces/http/reservasHttp.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../_interfaces/http/requestSecurity.ts';
import { requirePermission } from '../../_lib/authGuard.ts';

function mapearBorrador(body: any): BorradorPoliticaCancelacion {
  return {
    codigo: String(body?.codigo || ''),
    nombre: String(body?.nombre || ''),
    vigenciaDesde: String(body?.vigencia_desde || ''),
    reglas: Array.isArray(body?.reglas) ? body.reglas.map((regla: any) => ({
      horasMinimasAntes: Number(regla?.horas_minimas_antes),
      porcentajeDevolucionBps: Number(regla?.porcentaje_devolucion_bps),
    })) : [],
  };
}

export async function onRequestGet({ request, env }: any) {
  const auth = await requirePermission(request, env, 'reservas.politicas.gestionar');
  if (auth instanceof Response) return auth;
  return json({ politicas: await new D1RepositorioPoliticasCancelacion(env.DB).listar() });
}

export async function onRequestPost({ request, env }: any) {
  const auth = await requirePermission(request, env, 'reservas.politicas.gestionar');
  if (auth instanceof Response) return auth;
  let body: any;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }

  const repositorio = new D1RepositorioPoliticasCancelacion(env.DB);
  const excepciones = new D1RepositorioExcepcionesPoliticaReserva(env.DB);
  const auditoria = new D1RegistroAuditoriaReservas(env.DB);
  try {
    if (body.accion === 'crear_borrador') {
      const politica = await crearBorradorPoliticaCancelacion(
        mapearBorrador(body.politica), auth.email, repositorio, auditoria
      );
      return json({ ok: true, politica }, 201);
    }
    if (body.accion === 'publicar') {
      const id = Number(body.politica_id);
      if (!Number.isSafeInteger(id) || id < 1) return json({ error: 'politica_id inválido.' }, 400);
      const politica = await publicarPoliticaCancelacion(id, auth.email, repositorio, auditoria);
      return json({ ok: true, politica });
    }
    if (body.accion === 'solicitar_excepcion') {
      const excepcion = await solicitarExcepcionPoliticaReserva({
        reservaId: Number(body.reserva_id),
        tipo: body.tipo,
        montoDevolucionCentavos: body.monto_devolucion_centavos == null
          ? null : Number(body.monto_devolucion_centavos),
        motivo: String(body.motivo || ''),
      }, auth.email, excepciones, auditoria);
      return json({ ok: true, excepcion }, 201);
    }
    if (body.accion === 'resolver_excepcion') {
      const excepcion = await resolverExcepcionPoliticaReserva(
        Number(body.excepcion_id), body.estado, auth.email, excepciones, auditoria
      );
      return json({ ok: true, excepcion });
    }
    return json({
      error: 'accion debe ser crear_borrador, publicar, solicitar_excepcion o resolver_excepcion.',
    }, 400);
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo gestionar la política de cancelación.', status: 500,
    });
  }
}
