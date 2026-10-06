import { nochesEntre } from '../../_domain/reservas/dateRange.ts';
import type { RespuestaCotizacion, SolicitudCotizacion } from '../../_domain/reservas/models.ts';
import { calcularPrecio, calcularSena, mensajePrivacidad } from '../../_domain/reservas/pricing.ts';
import type { RepositorioDisponibilidad } from './ports.ts';

export async function cotizarEstadia(
  solicitud: SolicitudCotizacion,
  disponibilidad: RepositorioDisponibilidad
): Promise<RespuestaCotizacion> {
  const noches = nochesEntre(solicitud.fechaEntrada, solicitud.fechaSalida);
  if (noches === null) {
    return {
      ok: false,
      error: {
        codigo: 'FECHAS_INVALIDAS',
        mensaje: 'Fechas inválidas: fecha_salida debe ser posterior a fecha_entrada.',
      },
    };
  }

  const desglose = calcularPrecio(solicitud.tipo, solicitud.personas, noches);
  if ('error' in desglose) {
    return {
      ok: false,
      error: { codigo: 'OCUPACION_INVALIDA', mensaje: desglose.error },
    };
  }

  const estado = await disponibilidad.consultar(solicitud);
  const sena = calcularSena(desglose.subtotal);

  return {
    ok: true,
    valor: {
      disponibilidad: estado,
      desglose,
      sena,
      saldoCheckin: desglose.subtotal - sena.monto,
      mensajePrivacidad: mensajePrivacidad(solicitud.tipo, solicitud.personas),
    },
  };
}
