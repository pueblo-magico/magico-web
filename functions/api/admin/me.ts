// Cloudflare Pages Function — chequeo de sesión del Panel de Reservas. El
// frontend lo llama al montar para decidir si muestra el login o el
// dashboard, sin disparar una carga completa de datos primero.

import { requireAuth } from '../../_lib/authGuard.ts';
import { observarSolicitud } from '../../_interfaces/http/observability.ts';

export async function onRequestGet({ request, env }: any) {
  return observarSolicitud(request, 'admin.session.read', async () => {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    return new Response(JSON.stringify({ email: auth.email, rol: auth.rol }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}
