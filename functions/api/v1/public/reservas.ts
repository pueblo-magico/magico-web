import { crearReservaPublica } from '../../../_application/reservas/crearReservaPublica.ts';
import { provisionarCuentaCobroReserva } from '../../../_application/reservas/provisionarCuentaCobro.ts';
import { cucuruHabilitado } from '../../../_domain/reservas/collectionAccounts.ts';
import { CucuruClienteHttp } from '../../../_infrastructure/cucuru/CucuruProveedorCuentasCobro.ts';
import { D1RepositorioCuentasCobroReserva } from '../../../_infrastructure/d1/D1RepositorioCuentasCobroReserva.ts';
import { D1RepositorioCreacionReservaPublica } from '../../../_infrastructure/d1/D1RepositorioCreacionReservaPublica.ts';
import { D1RepositorioDisponibilidad } from '../../../_infrastructure/d1/D1RepositorioDisponibilidad.ts';
import { D1RepositorioConfiguracionBaseReservas } from '../../../_infrastructure/d1/D1RepositorioConfiguracionBaseReservas.ts';
import { jsonPublico, leerJsonPublico, optionsPublico } from '../../../_interfaces/http/publicApiV1.ts';
import { consumirLimite, respuestaLimite } from '../../../_interfaces/http/rateLimit.ts';

export const onRequestOptions = ({ request }: any) => optionsPublico(request, 'POST');

const statusPorCodigo: Record<string, number> = {
  SOLICITUD_INVALIDA: 400,
  IDEMPOTENCY_KEY_REQUERIDA: 400,
  IDEMPOTENCY_KEY_REUTILIZADA: 409,
  COTIZACION_NO_ENCONTRADA: 404,
  COTIZACION_VENCIDA: 410,
  INVENTARIO_NO_DISPONIBLE: 409,
};

export async function onRequestPost({ request, env }: any) {
  const limitada = respuestaLimite(await consumirLimite(request, env, 'publico.v1.reservas', 30, 60));
  if (limitada) return limitada;
  const lectura = await leerJsonPublico(request, 'POST');
  if (!lectura.ok) return lectura.response;
  const body: any = lectura.body;
  const cliente = body.cliente || {};

  const resultado = await crearReservaPublica({
    cotizacionCodigo: String(body.cotizacion_codigo || ''),
    espacioCodigo: String(body.espacio_codigo || ''),
    clienteNombre: String(cliente.nombre || ''),
    clienteTelefono: cliente.telefono ? String(cliente.telefono) : null,
    clienteEmail: cliente.email ? String(cliente.email) : null,
    idempotencyKey: request.headers.get('Idempotency-Key') || '',
  }, new D1RepositorioCreacionReservaPublica(env.DB), new D1RepositorioDisponibilidad(env.DB),
  new D1RepositorioConfiguracionBaseReservas(env.DB));

  if (resultado.ok === false) {
    return jsonPublico(
      request,
      'POST',
      { error: resultado.error },
      statusPorCodigo[resultado.error.codigo] || 400
    );
  }
  let cuentaCobro: Record<string, unknown> = { proveedor: 'cucuru', estado: 'no_disponible' };
  try {
    const provisionamiento = await provisionarCuentaCobroReserva({
      reservaId: resultado.valor.reservaId,
      habilitada: cucuruHabilitado(env.CUCURU_TRANSFER_ENABLED),
      aliasPrefix: env.CUCURU_ALIAS_PREFIX,
    }, new D1RepositorioCuentasCobroReserva(env.DB), new CucuruClienteHttp({
      apiKey: env.CUCURU_API_KEY,
      collectorId: env.CUCURU_COLLECTOR_ID,
      baseUrl: env.CUCURU_API_BASE_URL,
    }));
    cuentaCobro = {
      proveedor: 'cucuru',
      estado: provisionamiento.estado,
      ...(provisionamiento.estado === 'ready' ? {
        destino: {
          cvu: provisionamiento.cuenta.cvu,
          alias: provisionamiento.cuenta.alias,
          moneda: provisionamiento.cuenta.moneda,
        },
      } : {}),
    };
  } catch {
    // La reserva durable conserva su respuesta aunque falle la integración externa.
  }
  return jsonPublico(request, 'POST', {
    data: {
      reserva: {
        id: resultado.valor.reservaId,
        codigo: resultado.valor.codigo,
        estado: resultado.valor.estado,
        expires_at: resultado.valor.expiresAt,
      },
      cotizacion_codigo: resultado.valor.cotizacionCodigo,
      cuenta_cobro: cuentaCobro,
    },
    meta: { version: 'v1', idempotente: resultado.valor.idempotente },
  }, resultado.valor.idempotente ? 200 : 201);
}
