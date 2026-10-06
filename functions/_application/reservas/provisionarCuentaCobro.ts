import {
  aliasCuentaCobro,
  ErrorProvisionamientoDesconocido,
  customerIdCuentaCobro,
  validarDestinoCobro,
  type CuentaCobroReserva,
  type DestinoCobroProveedor,
} from '../../_domain/reservas/collectionAccounts.ts';
import type {
  ProveedorCuentasCobro,
  RepositorioCuentasCobroReserva,
} from './ports.ts';

export type ResultadoProvisionamientoCuenta =
  | { estado: 'reserva_no_encontrada' | 'reserva_no_elegible' }
  | { estado: 'disabled' | 'pending' | 'provisioning' | 'ready' | 'failed' | 'unknown_outcome'; cuenta: CuentaCobroReserva };

function codigoError(error: unknown): string {
  if (error instanceof ErrorProvisionamientoDesconocido) return 'RESULTADO_DESCONOCIDO';
  const codigo = error && typeof error === 'object' && 'codigo' in error
    ? String((error as { codigo?: unknown }).codigo || '')
    : '';
  if (/^[A-Z0-9_]{3,80}$/.test(codigo)) return codigo;
  return error instanceof Error && error.name ? error.name.slice(0, 80).toUpperCase() : 'ERROR_PROVEEDOR';
}

function siguienteReintento(ahora: Date, intentos: number): string {
  const minutos = Math.min(360, 5 * (2 ** Math.min(Math.max(intentos - 1, 0), 6)));
  return new Date(ahora.getTime() + minutos * 60_000).toISOString();
}

function asegurarCustomerId(destino: DestinoCobroProveedor, esperado: string): DestinoCobroProveedor {
  const validado = validarDestinoCobro(destino);
  if (validado.customerId !== esperado) throw new Error('CUSTOMER_ID_INCONSISTENTE');
  return validado;
}

export async function provisionarCuentaCobroReserva(
  entrada: { reservaId: number; habilitada: boolean; aliasPrefix?: unknown },
  repositorio: RepositorioCuentasCobroReserva,
  proveedor: ProveedorCuentasCobro,
  ahora: () => Date = () => new Date(),
  crearUuid: () => string = () => crypto.randomUUID()
): Promise<ResultadoProvisionamientoCuenta> {
  const contexto = await repositorio.obtenerContexto(entrada.reservaId);
  if (!contexto) return { estado: 'reserva_no_encontrada' };
  if (contexto.estadoFlujo !== 'pendiente_pago') return { estado: 'reserva_no_elegible' };

  const customerId = customerIdCuentaCobro(contexto.reservaUid);
  const preparada = await repositorio.preparar({
    reservaId: contexto.reservaId,
    customerId,
    habilitada: entrada.habilitada,
    operacionUid: crearUuid(),
  });
  if (!entrada.habilitada || preparada.estado === 'disabled') return { estado: 'disabled', cuenta: preparada };
  if (preparada.estado === 'ready') return { estado: 'ready', cuenta: preparada };
  if (preparada.estado === 'provisioning') return { estado: 'provisioning', cuenta: preparada };

  const operacionUid = crearUuid();
  const reclamada = await repositorio.reclamarProvisionamiento(preparada.id, operacionUid);
  if (!reclamada) return { estado: preparada.estado, cuenta: preparada };

  let intentoUid = crearUuid();
  try {
    const aliasEsperado = aliasCuentaCobro(contexto.reservaId, entrada.aliasPrefix);
    await repositorio.registrarIntento({ cuentaId: reclamada.id, operacionUid: intentoUid, tipo: 'lookup' });
    const existente = await proveedor.buscarPorCustomerId(customerId);
    let destino: DestinoCobroProveedor;
    if (existente) {
      await repositorio.completarIntento(intentoUid, 'succeeded');
      destino = asegurarCustomerId(existente, customerId);
    } else {
      await repositorio.completarIntento(intentoUid, 'not_found');
      intentoUid = crearUuid();
      await repositorio.registrarIntento({ cuentaId: reclamada.id, operacionUid: intentoUid, tipo: 'create' });
      destino = asegurarCustomerId(await proveedor.crear({
        customerId,
        idempotencyKey: operacionUid,
      }), customerId);
      await repositorio.completarIntento(intentoUid, 'succeeded');
    }

    if (!destino.alias) {
      intentoUid = crearUuid();
      await repositorio.registrarIntento({ cuentaId: reclamada.id, operacionUid: intentoUid, tipo: 'alias' });
      destino = asegurarCustomerId(await proveedor.asignarAlias({
        cuenta: destino,
        alias: aliasEsperado,
        idempotencyKey: operacionUid,
      }), customerId);
      await repositorio.completarIntento(intentoUid, 'succeeded');
    }

    const cuenta = await repositorio.marcarLista(reclamada.id, operacionUid, destino);
    return { estado: 'ready', cuenta };
  } catch (error) {
    const desconocido = error instanceof ErrorProvisionamientoDesconocido;
    const resultado = desconocido ? 'unknown_outcome' as const : 'failed' as const;
    const errorCodigo = codigoError(error);
    await repositorio.completarIntento(intentoUid, resultado, errorCodigo);
    const cuenta = await repositorio.marcarFalla({
      cuentaId: reclamada.id,
      operacionUid,
      resultado,
      errorCodigo,
      nextRetryAt: siguienteReintento(ahora(), reclamada.intentos + 1),
    });
    return { estado: resultado, cuenta };
  }
}
