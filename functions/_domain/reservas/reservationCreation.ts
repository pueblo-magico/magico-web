import type { RegimenAlimentacion } from './alimentacion.ts';

export type SolicitudCrearReservaPublica = {
  cotizacionCodigo: string;
  espacioCodigo: string;
  clienteNombre: string;
  clienteTelefono: string | null;
  clienteEmail: string | null;
  idempotencyKey: string;
};

export type CotizacionAceptada = {
  id: number;
  codigo: string;
  tipo: 'domo' | 'refugio';
  modalidad: 'privada' | 'compartida';
  contexto: 'general' | 'retiro';
  regimenAlimentacion: RegimenAlimentacion;
  fechaCheckin: string;
  fechaCheckout: string;
  personas: number;
  moneda: string;
  totalCentavos: number;
  senaCentavos: number;
  expiresAt: string;
};

export type ReservaPublicaCreada = {
  reservaId: number;
  codigo: string;
  estado: 'pendiente_pago';
  expiresAt: string;
  cotizacionCodigo: string;
  idempotente: boolean;
};

export type ErrorCreacionReserva =
  | 'SOLICITUD_INVALIDA'
  | 'IDEMPOTENCY_KEY_REQUERIDA'
  | 'IDEMPOTENCY_KEY_REUTILIZADA'
  | 'COTIZACION_NO_ENCONTRADA'
  | 'COTIZACION_VENCIDA'
  | 'INVENTARIO_NO_DISPONIBLE';

export type ResultadoCreacionReservaPublica =
  | { ok: true; valor: ReservaPublicaCreada }
  | { ok: false; error: { codigo: ErrorCreacionReserva; mensaje: string } };
