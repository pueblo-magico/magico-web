// Cloudflare Pages Function — datos para el Dashboard interno (/admin/reservas).
//
// Protegido por sesión propia (login de usuario/contraseña en D1) — ver
// functions/_lib/authGuard.ts y functions/api/admin/login.ts. Reemplaza al
// One-Time PIN de Cloudflare Access que protegía esta ruta antes.
//
// Dos vistas, mismo endpoint:
//   GET /api/admin/reservas                 -> vista operativa (default)
//   GET /api/admin/reservas?vista=historial -> todas las reservas, cualquier
//                                               estado/fecha, para búsqueda
//
// La vista operativa trae 'confirmada'/'pendiente' cuya estadía todavía no
// terminó (fecha_checkout >= hoy) — es la que alimenta la Grilla de Ocupación.
// Las métricas de las tarjetas SIEMPRE se calculan sobre esa vista operativa,
// sin importar qué vista se pidió — son números de "ahora", no un acumulado
// histórico. También devuelve el listado completo de alojamientos, para que
// el frontend pueda dibujar las filas de la grilla aunque un día esté vacío.

import { requirePermission } from '../../_lib/authGuard';
import { consultarPanelReservas } from '../../_application/reservas/consultarPanelReservas.ts';
import { D1RepositorioPanelReservas } from '../../_infrastructure/d1/D1RepositorioPanelReservas.ts';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet({ request, env }: any) {
  const auth = await requirePermission(request, env, 'reservas.leer');
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const vistaHistorial = url.searchParams.get('vista') === 'historial';
  const panel = await consultarPanelReservas(
    vistaHistorial ? 'historial' : 'operativa',
    new D1RepositorioPanelReservas(env.DB)
  );

  return json(panel);
}
