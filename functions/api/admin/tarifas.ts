import { crearBorradorTarifa, publicarPlanTarifa } from '../../_application/reservas/gestionarPlanTarifa.ts';
import type { PlanTarifaBorrador } from '../../_domain/reservas/ratePlanAdministration.ts';
import { D1RegistroAuditoriaReservas } from '../../_infrastructure/d1/D1RegistroAuditoriaReservas.ts';
import { D1RepositorioAdministracionTarifas } from '../../_infrastructure/d1/D1RepositorioAdministracionTarifas.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../_interfaces/http/reservasHttp.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../_interfaces/http/requestSecurity.ts';
import { requirePermission } from '../../_lib/authGuard.ts';

function mapearPlan(body: any): PlanTarifaBorrador {
  return {
    codigo: String(body?.codigo || ''),
    nombre: String(body?.nombre || ''),
    moneda: String(body?.moneda || ''),
    temporadas: Array.isArray(body?.temporadas) ? body.temporadas.map((temporada: any) => ({
      codigo: String(temporada?.codigo || ''), nombre: String(temporada?.nombre || ''),
      fechaDesde: String(temporada?.fecha_desde || ''), fechaHasta: String(temporada?.fecha_hasta || ''),
      prioridad: Number(temporada?.prioridad),
      reglas: Array.isArray(temporada?.reglas) ? temporada.reglas.map((regla: any) => ({
        tipoAlojamiento: regla?.tipo_alojamiento,
        modalidad: regla?.modalidad ?? 'cualquiera',
        ocupacionMin: Number(regla?.ocupacion_min), ocupacionMax: Number(regla?.ocupacion_max),
        baseCalculo: regla?.base_calculo, importeCentavos: Number(regla?.importe_centavos),
        exclusividadDesde: regla?.exclusividad_desde == null ? null : Number(regla.exclusividad_desde),
        exclusividadHasta: regla?.exclusividad_hasta == null ? null : Number(regla.exclusividad_hasta),
      })) : [],
    })) : [],
    senas: Array.isArray(body?.senas) ? body.senas.map((regla: any) => ({
      subtotalDesdeCentavos: Number(regla?.subtotal_desde_centavos),
      subtotalHastaCentavos: regla?.subtotal_hasta_centavos == null ? null : Number(regla.subtotal_hasta_centavos),
      tipo: regla?.tipo, valor: Number(regla?.valor),
    })) : [],
  };
}

export async function onRequestGet({ request, env }: any) {
  const auth = await requirePermission(request, env, 'reservas.tarifas.gestionar');
  if (auth instanceof Response) return auth;
  const planes = await new D1RepositorioAdministracionTarifas(env.DB).listar();
  return json({ planes });
}

export async function onRequestPost({ request, env }: any) {
  const auth = await requirePermission(request, env, 'reservas.tarifas.gestionar');
  if (auth instanceof Response) return auth;
  let body: any;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }

  const repositorio = new D1RepositorioAdministracionTarifas(env.DB);
  const auditoria = new D1RegistroAuditoriaReservas(env.DB);
  try {
    if (body.accion === 'crear_borrador') {
      const plan = await crearBorradorTarifa(mapearPlan(body.plan), auth.email, repositorio, auditoria);
      return json({ ok: true, plan }, 201);
    }
    if (body.accion === 'publicar') {
      const planId = Number(body.plan_id);
      if (!Number.isSafeInteger(planId) || planId < 1) return json({ error: 'plan_id inválido.' }, 400);
      const plan = await publicarPlanTarifa(planId, auth.email, repositorio, auditoria);
      return json({ ok: true, plan });
    }
    return json({ error: 'accion debe ser crear_borrador o publicar.' }, 400);
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo gestionar el plan tarifario.', status: 500,
    });
  }
}
