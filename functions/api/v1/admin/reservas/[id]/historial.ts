import { consultarHistorialReserva } from '../../../../../_application/reservas/consultarHistorialReserva.ts';
import { D1RepositorioHistorialReserva } from '../../../../../_infrastructure/d1/D1RepositorioHistorialReserva.ts';
import { requirePermission } from '../../../../../_lib/authGuard.ts';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet({ request, env, params }: any): Promise<Response> {
  const auth = await requirePermission(request, env, 'reservas.leer');
  if (auth instanceof Response) return auth;

  const reservaId = Number(params?.id);
  if (!Number.isSafeInteger(reservaId) || reservaId < 1) {
    return json({ error: 'Reserva inválida.', codigo: 'DATOS_INVALIDOS' }, 400);
  }
  const historial = await consultarHistorialReserva(
    reservaId,
    new D1RepositorioHistorialReserva(env.DB)
  );
  if (!historial) return json({ error: 'La reserva no existe.', codigo: 'NO_ENCONTRADO' }, 404);
  return json({ data: historial, meta: { version: 'v1' } });
}
