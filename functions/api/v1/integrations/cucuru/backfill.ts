import { ejecutarBackfillCucuru } from '../../../../_application/reservas/ejecutarBackfillCucuru.ts';
import { procesarCollectionCucuru } from '../../../../_application/reservas/procesarCollectionCucuru.ts';
import { cucuruHabilitado } from '../../../../_domain/reservas/collectionAccounts.ts';
import { CucuruClienteHttp } from '../../../../_infrastructure/cucuru/CucuruProveedorCuentasCobro.ts';
import { resolverModoCuentasCobro } from '../../../../_infrastructure/cucuru/CucuruProveedorCuentasCobroMock.ts';
import { D1RepositorioBackfillCucuru } from '../../../../_infrastructure/d1/D1RepositorioBackfillCucuru.ts';
import { D1RepositorioConciliacionCucuru } from '../../../../_infrastructure/d1/D1RepositorioConciliacionCucuru.ts';
import { crearNotificadorManyChat } from '../../../../_infrastructure/manychat/ManyChatNotificadorReserva.ts';
import { jsonReserva as json } from '../../../../_interfaces/http/reservasHttp.ts';
import { autenticarServicio } from '../../../../_interfaces/http/serviceAuth.ts';

export async function onRequestPost({ request, env }: any) {
  const secreto = request.headers.get('X-Service-Secret') ||
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || null;
  if (!autenticarServicio('n8n', secreto, env, 'pagos:conciliar')) {
    return json({ error: 'No autorizado.' }, 401);
  }
  if (!cucuruHabilitado(env.CUCURU_TRANSFER_ENABLED)) {
    return json({ error: 'Cucuru está desactivado.' }, 409);
  }
  if (resolverModoCuentasCobro(env) !== 'real') {
    return json({ error: 'El backfill real no está disponible en modo mock.' }, 409);
  }
  if (typeof env.CUCURU_COLLECTOR_ID !== 'string' || !env.CUCURU_COLLECTOR_ID.trim()) {
    return json({ error: 'Integración no configurada.' }, 503);
  }

  const proveedor = new CucuruClienteHttp({
    apiKey: env.CUCURU_API_KEY,
    collectorId: env.CUCURU_COLLECTOR_ID,
    baseUrl: env.CUCURU_API_BASE_URL,
  });
  const conciliacion = new D1RepositorioConciliacionCucuru(env.DB);
  const notificador = crearNotificadorManyChat({
    apiKey: env.MANYCHAT_API_KEY,
    flowNs: env.MANYCHAT_CONFIRMATION_FLOW_NS,
    habilitado: env.MANYCHAT_NOTIFICATIONS_ENABLED,
  });

  try {
    const resultado = await ejecutarBackfillCucuru(
      new D1RepositorioBackfillCucuru(env.DB),
      proveedor,
      {
        procesar: collection => procesarCollectionCucuru(
          collection,
          env.CUCURU_COLLECTOR_ID.trim(),
          conciliacion,
          notificador,
          `cucuru-backfill:${collection.collectionId}`
        ).then(() => undefined),
      }
    );
    return json({ ok: true, resultado }, 200);
  } catch {
    return json({ error: 'Backfill temporalmente no disponible.' }, 503);
  }
}
