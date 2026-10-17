// Lógica compartida de cotización, precios y disponibilidad — usada por
// functions/api/cotizar.ts y functions/api/manychat.ts. El prefijo "_" hace
// que Cloudflare Pages ignore esta carpeta como ruta (no es un endpoint).

import { preciosPorNoche } from '../../src/data/pricing';

export type TipoAlojamiento = 'domo' | 'refugio';

export type Cotizacion = {
  tipo_alojamiento: TipoAlojamiento;
  cantidad_personas: number;
  noches: number;
  precio_por_noche: number;
  subtotal: number;
  exclusividad_gratis: boolean;
  // true si alguna noche es viernes o sábado: esas noches van con pensión completa.
  incluye_pension_finde: boolean;
  desglose_noches: { fecha: string; finde: boolean; precio_por_persona: number }[];
};

export type Disponibilidad = {
  estado: 'disponible' | 'ocupado';
  // Alojamiento concreto a reservar si estado === 'disponible' (domo específico,
  // o el único registro del Refugio). null si no hay lugar.
  alojamiento_id: number | null;
};

const MENSAJE_PRIVACIDAD_REFUGIO =
  'Por la cantidad que son, podríamos ubicarlos en una habitación privada dentro del refugio sin cargo extra (sujeto a disponibilidad al momento de asignar camas).';

// El Refugio tiene 4 habitaciones (una de 3 camas, tres de 4 camas) dentro de
// las 15 camas totales. Grupos de exactamente 3 o 4 personas entran justo en
// una habitación propia — se lo avisamos, pero es un tema de asignación de
// camas al llegar, no una reserva exclusiva del espacio (ver chequearDisponibilidad).
export function mensajePrivacidad(tipo: TipoAlojamiento, personas: number): string {
  return tipo === 'refugio' && (personas === 3 || personas === 4) ? MENSAJE_PRIVACIDAD_REFUGIO : '';
}

// Reglas de precio — misma tabla que el BookingWidget (src/data/pricing.ts).
// Días de semana: con desayuno. Viernes y sábado: siempre pensión completa.
// precio_por_noche es el promedio para todo el grupo; el detalle va en desglose_noches.
export function calcularPrecio(tipo: TipoAlojamiento, personas: number, fechaEntrada: string, fechaSalida: string): Cotizacion | { error: string } {
  const FECHA = /^\d{4}-\d{2}-\d{2}$/;
  if (!FECHA.test(fechaEntrada) || !FECHA.test(fechaSalida)) return { error: 'Las fechas deben tener formato AAAA-MM-DD.' };
  if (tipo === 'refugio') {
    if (personas < 1 || personas > 15) return { error: 'El Refugio Compartido admite entre 1 y 15 personas.' };
  } else if (personas < 2 || personas > 7) {
    // Domo privado: de 2 a 7 personas (no se ofrece para 1 persona sola).
    return { error: 'El Domo privado admite entre 2 y 7 personas.' };
  }

  const noches = preciosPorNoche(tipo === 'refugio' ? 'compartida' : 'domoPrivado', fechaEntrada, fechaSalida, false);
  const subtotal = noches.reduce((acc, n) => acc + n.precio, 0) * personas;

  return {
    tipo_alojamiento: tipo,
    cantidad_personas: personas,
    noches: noches.length,
    precio_por_noche: Math.round(subtotal / noches.length),
    subtotal,
    exclusividad_gratis: tipo === 'refugio' ? personas >= 3 && personas <= 7 : personas >= 6, // domo lleno = exclusivo por definición
    incluye_pension_finde: noches.some(n => n.finde),
    desglose_noches: noches.map(n => ({ fecha: n.iso, finde: n.finde, precio_por_persona: n.precio })),
  };
}

export function nochesEntre(entrada: string, salida: string): number | null {
  const inMs = Date.parse(entrada);
  const outMs = Date.parse(salida);
  if (Number.isNaN(inMs) || Number.isNaN(outMs)) return null;
  const noches = Math.round((outMs - inMs) / 86400000);
  return noches > 0 ? noches : null;
}

export async function chequearDisponibilidad(
  db: any,
  tipo: TipoAlojamiento,
  personas: number,
  fechaEntrada: string,
  fechaSalida: string
): Promise<Disponibilidad> {
  if (tipo === 'domo') {
    // Un domo se alquila entero por grupo (aun 1 persona paga la tarifa fija
    // completa), así que alcanza con que exista AL MENOS un domo sin
    // solapamiento de fechas con una reserva 'pendiente' o 'confirmada'.
    const libre = await db
      .prepare(
        `SELECT a.id FROM alojamientos a
         WHERE a.tipo = 'domo'
         AND a.id NOT IN (
           SELECT r.alojamiento_id FROM reservas r
           WHERE r.estado IN ('pendiente', 'confirmada')
           AND r.fecha_checkin < ?2 AND r.fecha_checkout > ?1
         )
         LIMIT 1`
      )
      .bind(fechaEntrada, fechaSalida)
      .first();
    return { estado: libre ? 'disponible' : 'ocupado', alojamiento_id: libre ? Number(libre.id) : null };
  }

  // Refugio: compartido, NO se bloquea entero. Comparamos personas ya
  // ocupadas (con solapamiento de fechas) contra la capacidad total (15).
  // La habitación privada para grupos de 3-4 (ver mensajePrivacidad) es un
  // tema de asignación de camas, no de bloqueo de disponibilidad.
  const row = await db
    .prepare(
      `SELECT a.id AS id, a.capacidad_total AS capacidad_total,
              COALESCE(SUM(
                CASE WHEN r.estado IN ('pendiente', 'confirmada')
                  AND r.fecha_checkin < ?2 AND r.fecha_checkout > ?1
                THEN r.cantidad_personas ELSE 0 END
              ), 0) AS ocupadas
       FROM alojamientos a
       LEFT JOIN reservas r ON r.alojamiento_id = a.id
       WHERE a.tipo = 'refugio'
       GROUP BY a.id`
    )
    .bind(fechaEntrada, fechaSalida)
    .first();

  const capacidad = row ? Number(row.capacidad_total) : 15;
  const ocupadas = row ? Number(row.ocupadas) : 0;
  const disponible = ocupadas + personas <= capacidad;
  return { estado: disponible ? 'disponible' : 'ocupado', alojamiento_id: row ? Number(row.id) : null };
}
