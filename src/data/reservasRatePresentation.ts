import type {
  ReservasAccommodationType,
  ReservasPublicPricingSummary,
} from './reservasPricing';

export type ReservasDisplayRate = {
  tipo: ReservasAccommodationType;
  importeCentavos: number;
};

const ACCOMMODATION_ORDER: ReservasAccommodationType[] = ['domo', 'refugio', 'camping'];

export function selectLowestPerPersonRates(
  pricing: ReservasPublicPricingSummary,
): ReservasDisplayRate[] {
  const lowestByAccommodation = new Map<ReservasAccommodationType, number>();

  for (const option of pricing.opciones) {
    for (const rule of option.tarifas) {
      if (rule.base_calculo !== 'persona_noche') continue;
      const current = lowestByAccommodation.get(option.tipo_alojamiento);
      if (current === undefined || rule.importe_centavos < current) {
        lowestByAccommodation.set(option.tipo_alojamiento, rule.importe_centavos);
      }
    }
  }

  return ACCOMMODATION_ORDER.flatMap(tipo => {
    const importeCentavos = lowestByAccommodation.get(tipo);
    return importeCentavos === undefined ? [] : [{ tipo, importeCentavos }];
  });
}
