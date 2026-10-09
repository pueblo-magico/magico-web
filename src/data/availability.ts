/**
 * Fallback de disponibilidad — el BookingWidget consulta en vivo
 * GET /api/disponibilidad (functions/api/disponibilidad.ts), que calcula
 * estas mismas listas a partir de las reservas reales en D1. Estos arrays
 * solo se usan como respaldo mientras esa consulta está en curso o si falla
 * (por ejemplo en `npm run dev`, donde no corren las Pages Functions).
 * Empiezan vacíos a propósito: "sin lugar" solo lo puede afirmar el conteo
 * real de reservas, nunca una lista cargada a mano acá.
 * BLOCKED_DATES_DOMO / BLOCKED_DATES_REFUGIO: string[] de 'YYYY-MM-DD'.
 */

export const CAPACITY_PER_DAY = 30;

export const BLOCKED_DATES_DOMO: string[] = [];
export const BLOCKED_DATES_REFUGIO: string[] = [];

// Fechas de retiros/eventos (Pachamama Fest, Familion, Ciclo Vital Femenino,
// etc.) que usan domos o refugio pero se coordinan aparte y no quedan
// cargados como 'reserva' en D1 — por eso el chequeo en vivo no los ve.
// A diferencia de BLOCKED_DATES_*, estas fechas NO se muestran como "sin
// lugar": el calendario las marca aparte y deriva a WhatsApp para que el
// equipo confirme caso por caso si hay lugar (puede que solo se use un domo
// del evento, o ninguno, y quede libre igual).
// ⚠️ Manual por ahora — mantené esta lista al día con la agenda de eventos.
export const RETIRO_DATES_DOMO: string[] = [];
export const RETIRO_DATES_REFUGIO: string[] = [];

// Los domos recién se pueden reservar desde esta fecha (antes no están
// habilitados) — en el calendario los días anteriores salen como "sin lugar"
// solo para domo.
export const DOMO_DISPONIBLE_DESDE = '2026-10-12';

// Por ahora todos los findes (noches de viernes y sábado) en domo se marcan
// como "consultar disponibilidad": suele haber eventos que a veces se
// confirman y a veces se cancelan, así que no los bloqueamos ni los damos por
// libres — derivan a WhatsApp igual que RETIRO_DATES_*. Poner en false cuando
// la agenda de eventos esté cargada de verdad.
export const DOMO_FINDES_A_CONSULTAR = true;

// Última fecha para reservar y acceder a la Promo Parejas de domo privado
// (la estadía en sí puede ser más adelante, lo que vence es la reserva).
export const PROMO_PAREJAS_RESERVA_HASTA = '2026-07-31';

// Mensaje de urgencia manual por mes — lo activás vos por chat cuando un mes
// se está por llenar (no se calcula solo, es una etiqueta a mano).
// 'normal': no muestra nada. 'pocos-lugares' / 'ultimos-lugares': muestra un
// badge en el widget de reserva sobre ese mes.
export type MonthUrgency = 'normal' | 'pocos-lugares' | 'ultimos-lugares';
export const MONTHLY_URGENCY: Record<string, MonthUrgency> = {
  '2026-10': 'normal',
  '2026-11': 'normal',
  '2026-12': 'normal',
  '2027-01': 'normal',
  '2027-02': 'normal',
};

export const PRECIO_NOCHE_ARS = 35_000; // alojamiento + desayuno, habitación o domo compartido (Eco-Refugio)
