import { RESERVAS_BASE_URL } from './config';

export type ReservasAccommodationType = 'domo' | 'refugio' | 'camping';
export type ReservasBookingMode = 'cualquiera' | 'compartida' | 'privada' | 'camping';

export type ReservasPublicPriceRule = {
  temporada_codigo: string;
  fecha_desde: string;
  fecha_hasta: string;
  dias_semana: number[];
  modalidad: ReservasBookingMode;
  ocupacion_min: number;
  ocupacion_max: number;
  base_calculo: 'unidad_noche' | 'persona_noche';
  importe_centavos: number;
};

export type ReservasPublicPricingSummary = {
  fecha_referencia: string;
  plan: { codigo: string; version: number; moneda: string };
  alimentacion: {
    pension_completa: null | {
      adicional_por_persona_noche_centavos: number;
      precio_comida_centavos: number;
      precio_almuerzo_centavos?: number;
      precio_cena_centavos?: number;
    };
  };
  opciones: Array<{
    tipo_alojamiento: ReservasAccommodationType;
    nombres_modalidades?: Partial<Record<ReservasBookingMode, string>>;
    tarifas: ReservasPublicPriceRule[];
  }>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function isPriceRule(value: unknown): value is ReservasPublicPriceRule {
  if (!isRecord(value)) return false;
  return typeof value.temporada_codigo === 'string' &&
    typeof value.fecha_desde === 'string' &&
    typeof value.fecha_hasta === 'string' &&
    Array.isArray(value.dias_semana) && value.dias_semana.every(day => Number.isInteger(day)) &&
    ['cualquiera', 'compartida', 'privada', 'camping'].includes(String(value.modalidad)) &&
    Number.isSafeInteger(value.ocupacion_min) && Number(value.ocupacion_min) > 0 &&
    Number.isSafeInteger(value.ocupacion_max) && Number(value.ocupacion_max) >= Number(value.ocupacion_min) &&
    ['unidad_noche', 'persona_noche'].includes(String(value.base_calculo)) &&
    Number.isSafeInteger(value.importe_centavos) && Number(value.importe_centavos) >= 0;
}

function isPricingSummary(value: unknown): value is ReservasPublicPricingSummary {
  if (!isRecord(value) || !isRecord(value.plan) || !isRecord(value.alimentacion) ||
      !Array.isArray(value.opciones)) return false;
  const pension = value.alimentacion.pension_completa;
  if (pension !== null && (!isRecord(pension) ||
      !Number.isSafeInteger(pension.adicional_por_persona_noche_centavos) ||
      !Number.isSafeInteger(pension.precio_comida_centavos))) return false;
  return typeof value.fecha_referencia === 'string' &&
    typeof value.plan.codigo === 'string' &&
    Number.isSafeInteger(value.plan.version) &&
    typeof value.plan.moneda === 'string' &&
    value.opciones.every(option => isRecord(option) &&
      ['domo', 'refugio', 'camping'].includes(String(option.tipo_alojamiento)) &&
      Array.isArray(option.tarifas) && option.tarifas.every(isPriceRule));
}

export function argentinaTodayIso(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Cordoba',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export async function fetchReservasPublicPricing(
  fecha = argentinaTodayIso(),
  signal?: AbortSignal,
): Promise<ReservasPublicPricingSummary | null> {
  const response = await fetch(
    `${RESERVAS_BASE_URL}/api/v1/public/precios?fecha=${encodeURIComponent(fecha)}`,
    { headers: { Accept: 'application/json' }, signal },
  );
  if (!response.ok) throw new Error(`Reservas pricing responded ${response.status}`);
  const payload: unknown = await response.json();
  if (!isRecord(payload)) {
    throw new Error('Reservas pricing returned an invalid contract');
  }
  if (payload.data === null) return null;
  if (!isPricingSummary(payload.data)) throw new Error('Reservas pricing returned an invalid contract');
  return payload.data;
}
