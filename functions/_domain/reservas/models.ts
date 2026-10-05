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
