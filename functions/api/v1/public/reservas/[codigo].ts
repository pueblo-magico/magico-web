import { D1RepositorioConsultaEstadoReservaPublica } from '../../../../_infrastructure/d1/D1RepositorioConsultaEstadoReservaPublica.ts';
import { jsonPublico, optionsPublico } from '../../../../_interfaces/http/publicApiV1.ts';
import { consumirLimite, respuestaLimite } from '../../../../_interfaces/http/rateLimit.ts';
import { configuracionTransferenciaMp } from '../../../../_lib/paymentMethods.ts';

export const onRequestOptions = ({ request }: any) => optionsPublico(request, 'GET');

export async function onRequestGet({ request, env, params }: any) {
  const limitada = respuestaLimite(await consumirLimite(request, env, 'publico.v1.estado-reserva', 60, 60));
  if (limitada) return limitada;
  const codigo = String(params?.codigo || '').trim();
  if (!/^RES-[0-9a-f-]{36}$/i.test(codigo)) {
    return jsonPublico(request, 'GET', {
      error: { codigo: 'RESERVA_NO_ENCONTRADA', mensaje: 'No encontramos la reserva.' },
    }, 404);
  }

  const estado = await new D1RepositorioConsultaEstadoReservaPublica(env.DB).obtenerPorCodigo(codigo);
  if (!estado) {
    return jsonPublico(request, 'GET', {
      error: { codigo: 'RESERVA_NO_ENCONTRADA', mensaje: 'No encontramos la reserva.' },
    }, 404);
  }
  const transferenciaConfigurada = configuracionTransferenciaMp(env);
  const transferencia = estado.metodoPago === 'transferencia_mp' && transferenciaConfigurada.habilitada
    ? {
        estado: 'ready',
        destino: {
          ...(transferenciaConfigurada.alias ? { alias: transferenciaConfigurada.alias } : {}),
          ...(transferenciaConfigurada.cvu ? { cvu: transferenciaConfigurada.cvu } : {}),
          ...(transferenciaConfigurada.titular ? { titular: transferenciaConfigurada.titular } : {}),
          moneda: 'ARS',
        },
      }
    : { estado: 'disabled' };
  return jsonPublico(request, 'GET', {
    data: {
      reserva: {
        codigo: estado.codigo,
        estado: estado.estado,
        expires_at: estado.expiresAt,
      },
      pago: {
        proveedor: 'mercado_pago',
        estado: estado.pagoEstado || 'pendiente',
        metodo: estado.metodoPago,
        monto_centavos: estado.montoSenaCentavos,
        moneda: estado.moneda,
        ...(estado.checkoutUrl ? { checkout_url: estado.checkoutUrl } : {}),
      },
      transferencia,
      cuenta_cobro: estado.cuentaCobro ? {
        proveedor: estado.cuentaCobro.simulada ? 'cucuru_mock' : 'cucuru',
        estado: estado.cuentaCobro.estado,
        simulado: estado.cuentaCobro.simulada,
        ...(estado.cuentaCobro.estado === 'ready' ? {
          destino: {
            ...(estado.cuentaCobro.alias ? { alias: estado.cuentaCobro.alias } : {}),
            ...(estado.cuentaCobro.cvu ? { cvu: estado.cuentaCobro.cvu } : {}),
            moneda: estado.cuentaCobro.moneda,
          },
        } : {}),
      } : { proveedor: 'cucuru', estado: 'no_disponible' },
    },
    meta: { version: 'v1' },
  });
}
