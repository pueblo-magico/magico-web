import { nochesEntre } from '../../_domain/reservas/dateRange.ts';
import type { RespuestaCotizacion, SolicitudCotizacion } from '../../_domain/reservas/models.ts';
import { mensajePrivacidad } from '../../_domain/reservas/pricing.ts';
import { cotizarConPlan } from '../../_domain/reservas/ratePlans.ts';
import type { RepositorioCotizaciones, RepositorioDisponibilidad, RepositorioTarifas } from './ports.ts';

export async function cotizarEstadia(
  solicitud: SolicitudCotizacion,
  disponibilidad: RepositorioDisponibilidad,
  tarifas: RepositorioTarifas,
  cotizaciones: RepositorioCotizaciones
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

  const capacidadMaxima = solicitud.tipo === 'domo' ? 7 : 15;
  if (solicitud.personas < 1 || solicitud.personas > capacidadMaxima) {
    return {
      ok: false,
      error: {
        codigo: 'OCUPACION_INVALIDA',
        mensaje: solicitud.tipo === 'domo'
          ? 'El Domo admite entre 1 y 7 personas.'
          : 'El Refugio Compartido admite entre 1 y 15 personas.',
      },
    };
  }

  const [estado, configuracion] = await Promise.all([
    disponibilidad.consultar(solicitud),
    tarifas.obtenerPublicada(),
  ]);
  if (!configuracion) {
    return { ok: false, error: { codigo: 'TARIFA_NO_CONFIGURADA', mensaje: 'No hay una tarifa publicada para la estadía.' } };
  }
  const calculada = cotizarConPlan(solicitud, configuracion);
  if ('error' in calculada) {
    return {
      ok: false,
      error: {
        codigo: calculada.error === 'TARIFA_AMBIGUA' ? 'TARIFA_AMBIGUA' : 'TARIFA_NO_CONFIGURADA',
        mensaje: calculada.error === 'TARIFA_AMBIGUA'
          ? 'La configuración tarifaria es ambigua para la estadía.'
          : 'No hay una tarifa aplicable para toda la estadía.',
      },
    };
  }

  const importesNocturnos = calculada.noches.map(noche => noche.importeCentavos);
  const precioUniforme = importesNocturnos.every(importe => importe === importesNocturnos[0]);
  const subtotal = calculada.subtotalCentavos / 100;
  const montoSena = calculada.senaCentavos / 100;
  const desglose = {
    tipo_alojamiento: solicitud.tipo,
    cantidad_personas: solicitud.personas,
    noches,
    precio_por_noche: precioUniforme ? importesNocturnos[0] / 100 : null,
    subtotal,
    exclusividad_gratis: calculada.exclusividadGratis,
    moneda: calculada.moneda,
    subtotal_centavos: calculada.subtotalCentavos,
    plan_codigo: calculada.plan.codigo,
    plan_version: calculada.plan.version,
    desglose_noches: calculada.noches.map(noche => ({
      fecha: noche.fecha,
      temporada: noche.temporada,
      importe_centavos: noche.importeCentavos,
    })),
  };

  const valorSinReferencia = {
      disponibilidad: estado,
      desglose,
      sena: {
        porcentaje: calculada.subtotalCentavos === 0 ? 0 : calculada.senaCentavos / calculada.subtotalCentavos,
        monto: montoSena,
        monto_centavos: calculada.senaCentavos,
      },
      saldoCheckin: calculada.saldoCentavos / 100,
      mensajePrivacidad: mensajePrivacidad(solicitud.tipo, solicitud.personas),
  };
  const referencia = await cotizaciones.guardar(solicitud, valorSinReferencia);

  return {
    ok: true,
    valor: { ...valorSinReferencia, referencia },
  };
}
