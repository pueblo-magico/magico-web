export type AccommodationType = 'domo' | 'refugio';
export type BookingMode = 'compartida' | 'privada';
export type MealPlan = 'desayuno_incluido' | 'pension_completa';
export type PaymentMethod = 'mercado_pago_checkout' | 'transferencia_mp';

export interface PublicAccommodation {
  codigo: string;
  nombre: string;
  tipo: AccommodationType;
  capacidad_comercial: number;
  modalidades: Array<{ codigo: BookingMode; unidad_venta: string }>;
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
  precio: {
    moneda: string;
    regimen_alimentacion: MealPlan;
    alojamiento_centavos: number;
    alimentacion_centavos: number;
    subtotal_centavos: number;
    sena_centavos: number;
    saldo_centavos: number;
    plan_codigo: string;
    plan_version: number;
  };
}

export interface ReservationResponse {
  reserva: { codigo: string; estado: string; expires_at: string };
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
  pago: { proveedor: 'mercado_pago'; estado: string };
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
  guest: { name: string; phone: string; email?: string };
  paymentMethod: PaymentMethod;
  payerDni?: string;
  idempotencyKey: string;
}): Promise<{ data: ReservationResponse; idempotent: boolean }> {
  const response = await requestJson<{ data: ReservationResponse; meta: { idempotente: boolean } }>('/api/v1/public/reservas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': input.idempotencyKey },
    body: JSON.stringify({
      cotizacion_codigo: input.quoteCode,
      espacio_codigo: input.spaceCode,
      cliente: { nombre: input.guest.name, telefono: input.guest.phone, email: input.guest.email || null },
      pago: {
        metodo: input.paymentMethod,
        ...(input.paymentMethod === 'transferencia_mp' ? {
          pagador: { documento_tipo: 'DNI', documento_numero: input.payerDni || '' },
        } : {}),
      },
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
