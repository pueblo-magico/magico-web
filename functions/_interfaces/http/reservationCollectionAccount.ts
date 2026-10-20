import { provisionarCuentaCobroReserva } from '../../_application/reservas/provisionarCuentaCobro.ts';
import { CucuruClienteHttp } from '../../_infrastructure/cucuru/CucuruProveedorCuentasCobro.ts';
import {
  CucuruProveedorCuentasCobroMock,
  resolverModoCuentasCobro,
} from '../../_infrastructure/cucuru/CucuruProveedorCuentasCobroMock.ts';
import { D1RepositorioCuentasCobroReserva } from '../../_infrastructure/d1/D1RepositorioCuentasCobroReserva.ts';

export async function prepararCuentaCobroReservaHttp(
  env: any,
  reservaId: number
): Promise<Record<string, unknown>> {
  let cuentaCobro: Record<string, unknown> = { proveedor: 'cucuru', estado: 'no_disponible' };
  try {
    const modo = resolverModoCuentasCobro(env);
    const proveedor = modo === 'mock'
      ? new CucuruProveedorCuentasCobroMock()
      : new CucuruClienteHttp({
        apiKey: env.CUCURU_API_KEY,
        collectorId: env.CUCURU_COLLECTOR_ID,
        baseUrl: env.CUCURU_API_BASE_URL,
      });
    const provisionamiento = await provisionarCuentaCobroReserva({
      reservaId,
      habilitada: modo !== 'disabled',
      simulada: modo === 'mock',
      aliasPrefix: env.CUCURU_ALIAS_PREFIX,
    }, new D1RepositorioCuentasCobroReserva(env.DB), proveedor);
    cuentaCobro = {
      proveedor: modo === 'mock' ? 'cucuru_mock' : 'cucuru',
      estado: provisionamiento.estado,
      ...(modo === 'mock' ? { simulado: true } : {}),
      ...(provisionamiento.estado === 'ready' ? {
        destino: {
          cvu: provisionamiento.cuenta.cvu,
          alias: provisionamiento.cuenta.alias,
          moneda: provisionamiento.cuenta.moneda,
        },
      } : {}),
    };
  } catch (error) {
    // La reserva durable no se revierte por una falla del proveedor externo.
    const codigo = error && typeof error === 'object' && 'codigo' in error
      ? String((error as { codigo?: unknown }).codigo || '')
      : error instanceof Error ? error.name : 'ERROR_DESCONOCIDO';
    console.error(JSON.stringify({
      evento: 'cuenta_cobro_provisionamiento_error',
      codigo: /^[A-Z0-9_]{3,80}$/.test(codigo) ? codigo : 'ERROR_PROVISIONAMIENTO',
    }));
  }
  return cuentaCobro;
}
