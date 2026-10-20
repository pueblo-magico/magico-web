import { ErrorReserva } from '../../_domain/reservas/errors.ts';
import {
  validarRegistroPagoManual,
  type RegistroPagoManual,
  type ResumenPagoManual,
} from '../../_domain/reservas/manualPayments.ts';
import type { RepositorioPagosManualesReserva } from './ports.ts';

export async function registrarPagoManual(
  entrada: Omit<RegistroPagoManual, 'motivo' | 'pagadoAt'> & { motivo: unknown; pagadoAt: unknown },
  repositorio: RepositorioPagosManualesReserva
): Promise<ResumenPagoManual> {
  const validada = validarRegistroPagoManual(entrada);
  const resultado = await repositorio.registrar(validada);
  if (!resultado) {
    throw new ErrorReserva(
      'CONFLICTO_RESERVA',
      'La reserva cambió, no admite pagos o el importe supera el saldo pendiente.'
    );
  }
  return resultado;
}
