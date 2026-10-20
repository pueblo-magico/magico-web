import type {
  ConversionManyChat,
  MetricasPanelReservas,
  PendienteVieja,
  ReservaPanel,
} from './models.ts';
import { ventanaOperativaCordoba } from './operationalDate.ts';

export function calcularMetricasPanelReservas(
  reservasOperativas: ReservaPanel[],
  pendientesViejas: PendienteVieja[],
  conversion: ConversionManyChat,
  umbralDias: number,
  ahora = new Date()
): MetricasPanelReservas {
  const { desde: hoy, hastaExclusivo: en7dias } = ventanaOperativaCordoba(ahora, 7);
  const confirmadas = reservasOperativas.filter((reserva) => reserva.estado === 'confirmada');
  const pendientes = reservasOperativas.filter((reserva) => reserva.estado === 'pendiente_pago');
  const totalManyChat = Number(conversion.total) || 0;
  const confirmadasManyChat = Number(conversion.confirmadas) || 0;

  return {
    total_confirmadas: confirmadas.length,
    ingresos_senas: confirmadas.reduce((total, reserva) => total + (Number(reserva.monto_sena) || 0), 0),
    checkins_hoy: confirmadas.filter((reserva) => reserva.fecha_checkin.slice(0, 10) === hoy).length,
    checkins_semana: confirmadas.filter((reserva) => {
      const checkin = reserva.fecha_checkin.slice(0, 10);
      return checkin >= hoy && checkin < en7dias;
    }).length,
    checkouts_hoy: confirmadas.filter((reserva) => reserva.fecha_checkout.slice(0, 10) === hoy).length,
    saldo_pendiente_total: confirmadas.reduce(
      (total, reserva) => total + Number(reserva.monto_total) - (Number(reserva.monto_sena) || 0),
      0
    ),
    total_a_facturar: [...confirmadas, ...pendientes].reduce(
      (total, reserva) => total + Number(reserva.monto_total),
      0
    ),
    pendientes_viejas: {
      cantidad: pendientesViejas.length,
      umbral_dias: umbralDias,
      items: pendientesViejas,
    },
    conversion_manychat: {
      total: totalManyChat,
      confirmadas: confirmadasManyChat,
      pct: totalManyChat > 0 ? Math.round((confirmadasManyChat / totalManyChat) * 1000) / 10 : null,
    },
  };
}
