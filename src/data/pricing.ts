/**
 * Precio de una estadía noche por noche — compartido por el BookingWidget y
 * el cotizador del servidor (functions/_lib/cotizador.ts), para que la web y
 * el bot de ManyChat nunca coticen distinto.
 *
 * Días de semana: con desayuno o pensión completa, según elija la persona.
 * Fin de semana (noches de viernes y sábado): siempre pensión completa.
 */
import { getEstadiaPrices, type PricingLanguage } from './retreats';

export type AlojamientoTarifa = 'carpa' | 'compartida' | 'domoPrivado' | 'refugioPrivado';

export type NochePrecio = { iso: string; finde: boolean; precio: number };

// Refugio privado para 1-2 personas (de 3 en adelante es tarifa compartida).
function sumarDias(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Noche de viernes o sábado. */
export function esNocheFinde(iso: string): boolean {
  const dia = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return dia === 5 || dia === 6;
}

/** Noches de la estadía: desde la llegada hasta el día anterior a la salida. */
export function nochesDeEstadia(llegada: string, salida: string): string[] {
  const noches: string[] = [];
  for (let iso = llegada; iso < salida; iso = sumarDias(iso, 1)) noches.push(iso);
  return noches;
}

function precioSemana(aloj: AlojamientoTarifa, conPension: boolean, language: PricingLanguage): number {
  const prices = getEstadiaPrices(language);
  const refugioPrivado = language === 'en' ? 50 : 75_000;
  const extraPension = prices.pensionCompletaEcoRefugio - prices.ecoRefugioDesde;
  switch (aloj) {
    case 'carpa':          return conPension ? prices.pensionCompletaCarpa : prices.carpaDesde;
    case 'compartida':     return conPension ? prices.pensionCompletaEcoRefugio : prices.ecoRefugioDesde;
    case 'domoPrivado':    return conPension ? prices.pensionCompletaDomoPrivado : prices.domoPrivado;
    case 'refugioPrivado': return refugioPrivado + (conPension ? extraPension : 0);
  }
}

// Domo privado el finde: $120.000 si es una sola noche, $95.000 c/u si la
// estadía incluye viernes y sábado del mismo finde.
function precioFinde(aloj: AlojamientoTarifa, iso: string, noches: Set<string>, language: PricingLanguage): number {
  const prices = getEstadiaPrices(language);
  const refugioPrivado = language === 'en' ? 50 : 75_000;
  const extraPension = prices.pensionCompletaEcoRefugio - prices.ecoRefugioDesde;
  switch (aloj) {
    case 'carpa':      return prices.pensionFinde.carpa;
    case 'compartida': return prices.pensionFinde.ecoRefugio;
    case 'domoPrivado': {
      const pareja = new Date(`${iso}T00:00:00Z`).getUTCDay() === 5 ? sumarDias(iso, 1) : sumarDias(iso, -1);
      return noches.has(pareja) ? prices.pensionFinde.domoPrivadoDosNoches : prices.pensionFinde.domoPrivadoUnaNoche;
    }
    // Sin tarifa de finde propia: se mantiene la de pensión completa de semana
    // (ya está por encima de la compartida de finde).
    case 'refugioPrivado': return refugioPrivado + extraPension;
  }
}

/** Precio por persona de cada noche de la estadía. */
export function preciosPorNoche(aloj: AlojamientoTarifa, llegada: string, salida: string, conPension: boolean, language: PricingLanguage = 'es'): NochePrecio[] {
  const noches = nochesDeEstadia(llegada, salida);
  const set = new Set(noches);
  return noches.map(iso => {
    const finde = esNocheFinde(iso);
    return { iso, finde, precio: finde ? precioFinde(aloj, iso, set, language) : precioSemana(aloj, conPension, language) };
  });
}
