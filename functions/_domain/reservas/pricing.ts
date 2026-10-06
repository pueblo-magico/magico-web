import type { Cotizacion, TipoAlojamiento } from './models.ts';

const MENSAJE_PRIVACIDAD_REFUGIO =
  'Por la cantidad que son, podríamos ubicarlos en una habitación privada dentro del refugio sin cargo extra (sujeto a disponibilidad al momento de asignar camas).';

export function mensajePrivacidad(tipo: TipoAlojamiento, personas: number): string {
  return tipo === 'refugio' && (personas === 3 || personas === 4) ? MENSAJE_PRIVACIDAD_REFUGIO : '';
}

// Reglas legacy preservadas durante la separación arquitectónica. WRESERV-25
// reemplazará estos valores por planes de tarifa versionados y administrables.
export function calcularPrecio(
  tipo: TipoAlojamiento,
  personas: number,
  noches: number
): Cotizacion | { error: string } {
  if (tipo === 'refugio') {
    if (personas < 1 || personas > 15) {
      return { error: 'El Refugio Compartido admite entre 1 y 15 personas.' };
    }

    const precioPorNoche = 35_000 * personas;
    return {
      tipo_alojamiento: tipo,
      cantidad_personas: personas,
      noches,
      precio_por_noche: precioPorNoche,
      subtotal: precioPorNoche * noches,
      exclusividad_gratis: personas >= 3 && personas <= 7,
    };
  }

  if (personas < 1 || personas > 7) {
    return { error: 'El Domo admite entre 1 y 7 personas.' };
  }

  let precioPorNoche: number;
  if (personas === 1) precioPorNoche = 150_000;
  else if (personas === 2) precioPorNoche = 75_000;
  else if (personas <= 5) precioPorNoche = 65_000 * personas;
  else precioPorNoche = 50_000 * personas;

  return {
    tipo_alojamiento: tipo,
    cantidad_personas: personas,
    noches,
    precio_por_noche: precioPorNoche,
    subtotal: precioPorNoche * noches,
    exclusividad_gratis: personas >= 6,
  };
}

export function calcularSena(subtotal: number): { porcentaje: number; monto: number } {
  const porcentaje = subtotal <= 100_000 ? 0.5 : 0.3;
  return { porcentaje, monto: Math.round(subtotal * porcentaje) };
}
