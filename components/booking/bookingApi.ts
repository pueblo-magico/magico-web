export type AccommodationType = 'domo' | 'refugio' | 'camping';
export type BookingMode = 'compartida' | 'privada' | 'camping';
export type MealPlan = 'desayuno_incluido' | 'pension_completa';
export type PaymentMethod = 'mercado_pago_checkout' | 'transferencia_mp';

export interface PublicAccommodation {
  codigo: string;
  nombre: string;
  tipo: AccommodationType;
  capacidad_comercial: number;
  servicios: Array<{
    codigo: string;
    nombre: string;
    disponibilidad: 'incluido' | 'no_disponible';
    detalle?: string;
  }>;
  opciones_preparacion: Array<{
    modalidad: BookingMode;
    cantidad_personas: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
  }>;
  modalidades: Array<{
    codigo: BookingMode;
    nombre?: string;
    descripcion?: string;
    unidad_venta: string;
  }>;
}

export interface PublicPriceRule {
  temporada_codigo: string;
  fecha_desde: string;
  fecha_hasta: string;
  prioridad: number;
  dias_semana: number[];
  modalidad: 'cualquiera' | BookingMode;
  ocupacion_min: number;
  ocupacion_max: number;
  base_calculo: 'unidad_noche' | 'persona_noche';
  importe_centavos: number;
}

export interface PublicPricingSummary {
  fecha_referencia: string;
  plan: { codigo: string; version: number; moneda: string };
  horarios_comidas: {
    version: number;
    desayuno: { desde: string; hasta: string };
    almuerzo: { desde: string; hasta: string };
    cena: { desde: string; hasta: string };
  };
  alimentacion: {
    desayuno_incluido: null | {
      version: number;
      precio_comida_centavos: number;
      comidas_adicionales_por_persona_noche: number;
      precio_desayuno_centavos?: number;
    };
    pension_completa: null | {
      version: number;
      precio_comida_centavos: number;
      comidas_adicionales_por_persona_noche: number;
      adicional_por_persona_noche_centavos: number;
      precio_desayuno_centavos?: number;
      precio_almuerzo_centavos?: number;
      precio_cena_centavos?: number;
      ajuste_paquete_centavos?: number;
    };
  };
  ajustes?: Array<{
    codigo: string;
    nombre: string;
    anticipacion_desde_dias: number;
    anticipacion_hasta_dias: number | null;
    direccion: 'descuento' | 'recargo';
    tipo: 'porcentaje_bps' | 'importe_fijo';
    valor: number;
  }>;
  opciones: Array<{
    tipo_alojamiento: AccommodationType;
    modalidades: BookingMode[];
    nombres_modalidades?: Partial<Record<BookingMode, string>>;
    capacidad_comercial: number;
    tarifas: PublicPriceRule[];
  }>;
}

export interface QuoteRequest {
  check_in: string;
  check_out: string;
  personas: number;
  tipo_alojamiento: AccommodationType;
  modalidad: BookingMode;
  contexto: 'general';
  regimen_alimentacion: MealPlan;
}

export interface QuoteResponse {
  estado: string;
  motivo_codigo: string;
  opcion: null | { espacio_codigo: string; modalidad: BookingMode; capacidad_disponible: number };
  cotizacion: { id: number; codigo: string; expiresAt: string };
  metodos_pago: PaymentMethod[];
  recargos_metodo_pago?: Partial<Record<PaymentMethod, { porcentaje_bps: number }>>;
  precio: {
    moneda: string;
    regimen_alimentacion: MealPlan;
    alojamiento_centavos: number;
    alimentacion_centavos: number;
    ajustes_precio?: Array<{ codigo: string; nombre: string; importeCentavos: number }>;
    subtotal_antes_ajustes_centavos?: number;
    ajuste_total_centavos?: number;
    subtotal_centavos: number;
    sena_centavos: number;
    saldo_centavos: number;
    plan_codigo: string;
    plan_version: number;
  };
}

export function applyPaymentSurcharge(amountCentavos: number, porcentajeBps: number): number {
  return amountCentavos + Math.round(amountCentavos * porcentajeBps / 10_000);
}

export interface ReservationResponse {
  reserva: { codigo: string; estado: string; expires_at: string | null };
  cotizacion_codigo: string;
  pago?: {
    proveedor: 'mercado_pago';
    estado: 'disabled' | 'pending' | 'expired' | 'failed' | 'ready';
    checkout_url?: string;
  };
  transferencia?: {
    proveedor: 'mercado_pago_cuenta';
    estado: 'disabled' | 'ready';
    confirmacion?: 'webhook_dni';
    destino?: { cvu?: string; alias?: string; titular?: string; moneda: 'ARS' };
  };
  cuenta_cobro: {
    proveedor: string;
    estado: string;
    simulado?: boolean;
    destino?: { cvu?: string; alias?: string; moneda?: string };
  };
}

export interface PublicReservationStatus {
  reserva: { codigo: string; estado: string; expires_at: string | null };
  pago: {
    proveedor: 'mercado_pago';
    estado: string;
    metodo: PaymentMethod | null;
    monto_centavos: number;
    moneda: string;
    checkout_url?: string;
  };
  transferencia: {
    estado: 'disabled' | 'ready';
    destino?: { cvu?: string; alias?: string; titular?: string; moneda: string };
  };
  cuenta_cobro: {
    proveedor: string;
    estado: string;
    simulado?: boolean;
    destino?: { cvu?: string; alias?: string; moneda?: string };
  };
}

export class BookingApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;

  constructor(
    status: number,
    code: string,
    message: string,
    retryable = false,
  ) {
    super(message);
    this.name = 'BookingApiError';
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new BookingApiError(0, 'RED_NO_DISPONIBLE', 'No pudimos conectarnos. Revisá tu conexión e intentá nuevamente.', true);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const apiError = body?.error || {};
    throw new BookingApiError(
      response.status,
      String(apiError.codigo || 'ERROR_SOLICITUD'),
      String(apiError.mensaje || 'No pudimos completar la solicitud.'),
      Boolean(apiError.reintentable),
    );
  }
  return body as T;
}

export async function listPublicAccommodations(): Promise<PublicAccommodation[]> {
  const response = await requestJson<{ data: PublicAccommodation[] }>('/api/v1/public/alojamientos?contexto=general');
  if (!Array.isArray(response.data)) {
    throw new BookingApiError(502, 'RESPUESTA_INVALIDA', 'No pudimos cargar los alojamientos.', true);
  }
  return response.data;
}

export async function getPublicPricingSummary(fecha = localTodayIso()): Promise<PublicPricingSummary | null> {
  const response = await requestJson<{ data: PublicPricingSummary | null }>(
    `/api/v1/public/precios?fecha=${encodeURIComponent(fecha)}`
  );
  return response.data;
}

export async function checkPublicAvailability(input: QuoteRequest): Promise<boolean> {
  const query = new URLSearchParams({
    check_in: input.check_in,
    check_out: input.check_out,
    personas: String(input.personas),
    tipo_alojamiento: input.tipo_alojamiento,
    modalidad: input.modalidad,
    contexto: input.contexto,
  });
  const response = await requestJson<{ data: { estado: string } }>(`/api/v1/public/disponibilidad?${query}`);
  return response.data.estado === 'disponible';
}

export async function createPublicQuote(input: QuoteRequest): Promise<QuoteResponse> {
  const response = await requestJson<{ data: QuoteResponse }>('/api/v1/public/cotizaciones', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  return response.data;
}

export async function createPublicReservation(input: {
  quoteCode: string;
  spaceCode: string;
  guest: { name: string; phone: string; email: string };
  paymentMethod: PaymentMethod;
  payerDni?: string;
  bedPreparationCode?: string | null;
  idempotencyKey: string;
}): Promise<{ data: ReservationResponse; idempotent: boolean }> {
  const response = await requestJson<{ data: ReservationResponse; meta: { idempotente: boolean } }>('/api/v1/public/reservas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': input.idempotencyKey },
    body: JSON.stringify({
      cotizacion_codigo: input.quoteCode,
      espacio_codigo: input.spaceCode,
      cliente: { nombre: input.guest.name, telefono: input.guest.phone, email: input.guest.email },
      pago: {
        metodo: input.paymentMethod,
        ...(input.paymentMethod === 'transferencia_mp' ? {
          pagador: { documento_tipo: 'DNI', documento_numero: input.payerDni || '' },
        } : {}),
      },
      ...(input.bedPreparationCode
        ? { preferencias: { preparacion_cama: input.bedPreparationCode } }
        : {}),
    }),
  });
  return { data: response.data, idempotent: response.meta.idempotente };
}

export async function getPublicReservationStatus(code: string): Promise<PublicReservationStatus> {
  const response = await requestJson<{ data: PublicReservationStatus }>(
    `/api/v1/public/reservas/${encodeURIComponent(code)}`
  );
  return response.data;
}

export function createBookingAttemptKey(): string {
  const uuid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `web-reserva-${uuid}`;
}

export function localTodayIso(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function remainingSeconds(expiresAt: string, now = Date.now()): number {
  const expiry = Date.parse(expiresAt);
  return Number.isFinite(expiry) ? Math.max(0, Math.ceil((expiry - now) / 1000)) : 0;
}

export function formatRemaining(totalSeconds: number): string {
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}
