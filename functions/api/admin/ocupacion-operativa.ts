import {
  cancelarOcupacionOperativa,
  crearBloqueoInventario,
  crearEstadiaNoComercial,
} from '../../_application/reservas/gestionarOcupacionOperativa.ts';
import { D1RegistroAuditoriaReservas } from '../../_infrastructure/d1/D1RegistroAuditoriaReservas.ts';
import { D1RepositorioOcupacionOperativa } from '../../_infrastructure/d1/D1RepositorioOcupacionOperativa.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../_interfaces/http/requestSecurity.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../_lib/authGuard.ts';

function idONull(value: unknown): number | null {
  if (value == null || value === '') return null;
  return Number(value);
}

export async function onRequestGet({ request, env }: any) {
  const auth = await requirePermission(request, env, 'reservas.bloqueos.gestionar');
  if (auth instanceof Response) return auth;
  const repositorio = new D1RepositorioOcupacionOperativa(env.DB);
  const [registros, objetivos] = await Promise.all([repositorio.listar(), repositorio.listarObjetivos()]);
  return json({ registros, ...objetivos });
}

export async function onRequestPost({ request, env }: any) {
  const auth = await requirePermission(request, env, 'reservas.bloqueos.gestionar');
  if (auth instanceof Response) return auth;
  let body: any;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }

  const repositorio = new D1RepositorioOcupacionOperativa(env.DB);
  const auditoria = new D1RegistroAuditoriaReservas(env.DB);
  try {
    if (body.accion === 'crear_bloqueo') {
      const registro = await crearBloqueoInventario({
        espacioId: idONull(body.espacio_id), unidadInventarioId: idONull(body.unidad_inventario_id),
        fechaDesde: String(body.fecha_desde || ''), fechaHasta: String(body.fecha_hasta || ''),
        tipo: body.tipo, motivo: String(body.motivo || ''),
      }, auth.email, repositorio, auditoria);
      return json({ ok: true, registro }, 201);
    }
    if (body.accion === 'crear_estadia_no_comercial') {
      const registro = await crearEstadiaNoComercial({
        espacioId: idONull(body.espacio_id), unidadInventarioId: idONull(body.unidad_inventario_id),
        fechaCheckin: String(body.fecha_checkin || ''), fechaCheckout: String(body.fecha_checkout || ''),
        tipo: body.tipo, referenciaOperativa: String(body.referencia_operativa || ''),
        cantidadPersonas: Number(body.cantidad_personas),
      }, auth.email, repositorio, auditoria);
      return json({ ok: true, registro }, 201);
    }
    if (body.accion === 'cancelar_bloqueo' || body.accion === 'cancelar_estadia_no_comercial') {
      const clase = body.accion === 'cancelar_bloqueo' ? 'bloqueo' : 'estadia_no_comercial';
      const registro = await cancelarOcupacionOperativa(
        clase, Number(body.id), auth.email, repositorio, auditoria
      );
      return json({ ok: true, registro });
    }
    return json({ error: 'Acción de ocupación operativa inválida.' }, 400);
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo gestionar la ocupación operativa.', status: 500,
    });
  }
}
