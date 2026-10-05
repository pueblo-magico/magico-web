export type TipoAlojamiento = 'domo' | 'refugio';

export type Cotizacion = {
  tipo_alojamiento: TipoAlojamiento;
  cantidad_personas: number;
  noches: number;
  precio_por_noche: number;
  subtotal: number;
  exclusividad_gratis: boolean;
};

export type Disponibilidad = {
  estado: 'disponible' | 'ocupado';
  alojamiento_id: number | null;
};

export type SolicitudCotizacion = {
  tipo: TipoAlojamiento;
  personas: number;
  fechaEntrada: string;
  fechaSalida: string;
};

export type ResultadoCotizacion = {
  disponibilidad: Disponibilidad;
  desglose: Cotizacion;
  sena: {
    porcentaje: number;
    monto: number;
  };
  saldoCheckin: number;
  mensajePrivacidad: string;
};

export type ErrorCotizacion = {
  codigo: 'FECHAS_INVALIDAS' | 'OCUPACION_INVALIDA';
  mensaje: string;
};

export type RespuestaCotizacion =
  | { ok: true; valor: ResultadoCotizacion }
  | { ok: false; error: ErrorCotizacion };

export type AlojamientoCalendario = {
  id: number;
  nombre: string;
  tipo: TipoAlojamiento;
  capacidad_total: number;
};

export type ReservaCalendario = {
  alojamiento_id: number;
  fecha_checkin: string;
  fecha_checkout: string;
  cantidad_personas: number;
};

export type CalendarioDisponibilidad = {
  desde: string;
  hasta: string;
  domo: { blocked: string[] };
  refugio: { blocked: string[] };
  unidades: Array<{
    id: number;
    nombre: string;
    tipo: TipoAlojamiento;
    blocked: string[];
  }>;
};

export type RespuestaCalendario =
  | { ok: true; valor: CalendarioDisponibilidad }
  | { ok: false; error: { codigo: 'RANGO_INVALIDO'; mensaje: string } };
