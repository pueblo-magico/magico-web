import type {
  AccommodationType,
  BookingMode,
  MealPlan,
  PublicPriceRule,
  PublicPricingSummary,
} from './bookingApi';

export type BookingPricePreview = {
  currency: string;
  totalCentavos: number;
  perPersonCentavos: number;
  type: AccommodationType;
  mode: BookingMode;
};

export function stayNightDates(checkIn: string, checkOut: string): string[] {
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut) ||
      !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];

  const dates: string[] = [];
  for (let cursor = start; cursor < end; cursor += 86_400_000) {
    dates.push(new Date(cursor).toISOString().slice(0, 10));
  }
  return dates;
}

function applicableRule(
  rules: PublicPriceRule[],
  people: number,
  mode: BookingMode,
): PublicPriceRule | null {
  const candidates = rules
    .filter(rule =>
      (rule.modalidad === 'cualquiera' || rule.modalidad === mode) &&
      people >= rule.ocupacion_min && people <= rule.ocupacion_max
    )
    .sort((a, b) => (b.prioridad ?? 0) - (a.prioridad ?? 0));
  if (candidates.length === 0) return null;
  if (candidates.length > 1 && (candidates[0].prioridad ?? 0) === (candidates[1].prioridad ?? 0)) return null;
  return candidates[0];
}

function priceCandidate(
  summaries: PublicPricingSummary[],
  people: number,
  type: AccommodationType,
  mode: BookingMode,
  mealPlan: MealPlan,
): BookingPricePreview | null {
  let totalCentavos = 0;
  let currency = '';

  for (const summary of summaries) {
    if (currency && currency !== summary.plan.moneda) return null;
    currency = summary.plan.moneda;
    const option = summary.opciones.find(item =>
      item.tipo_alojamiento === type &&
      item.modalidades.includes(mode) &&
      item.capacidad_comercial >= people
    );
    if (!option) return null;
    const rule = applicableRule(option.tarifas, people, mode);
    if (!rule) return null;
    totalCentavos += rule.importe_centavos * (rule.base_calculo === 'persona_noche' ? people : 1);

    if (mealPlan === 'pension_completa') {
      const supplement = summary.alimentacion.pension_completa?.adicional_por_persona_noche_centavos;
      if (supplement === undefined) return null;
      totalCentavos += supplement * people;
    }
  }

  return {
    currency: currency || 'ARS',
    totalCentavos,
    perPersonCentavos: Math.round(totalCentavos / people),
    type,
    mode,
  };
}

export function estimateBookingPrice(
  summaries: PublicPricingSummary[],
  input: {
    people: number;
    type?: AccommodationType;
    mode?: BookingMode;
    mealPlan?: MealPlan;
  },
): BookingPricePreview | null {
  if (summaries.length === 0 || !Number.isSafeInteger(input.people) || input.people < 1) return null;
  const mealPlan = input.mealPlan || 'desayuno_incluido';
  const first = summaries[0];
  const candidates = first.opciones.flatMap(option => option.modalidades.map(mode => ({
    type: option.tipo_alojamiento,
    mode,
  }))).filter(candidate =>
    (!input.type || candidate.type === input.type) &&
    (!input.mode || candidate.mode === input.mode)
  );

  return candidates
    .map(candidate => priceCandidate(summaries, input.people, candidate.type, candidate.mode, mealPlan))
    .filter((candidate): candidate is BookingPricePreview => candidate !== null)
    .reduce<BookingPricePreview | null>(
      (lowest, candidate) => !lowest || candidate.totalCentavos < lowest.totalCentavos ? candidate : lowest,
      null,
    );
}
