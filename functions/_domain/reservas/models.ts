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

export type VistaPanelReservas = 'operativa' | 'historial';

export type AlojamientoPanel = {
  id: number;
  nombre: string;
  tipo: string;
  capacidad_total: number;
};

export type ReservaPanel = {
  id: number;
  cliente_nombre: string;
  cliente_telefono: string | null;
  cliente_email: string | null;
  alojamiento_id: number;
  alojamiento_nombre: string;
  alojamiento_tipo: string;
  fecha_checkin: string;
  fecha_checkout: string;
  cantidad_personas: number;
  monto_total: number;
  monto_sena: number | null;
  estado: string;
  unidad_asignada: string | null;
  canal_origen: string | null;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  manychat_user_id: string | null;
  created_at: string;
  excepcion_capacidad?: {
    id: number;
    capacidad_autorizada: number;
    motivo: string;
    plan_camas: string;
    fecha_desde: string | null;
    fecha_hasta: string | null;
    estado: 'solicitada' | 'aprobada' | 'rechazada' | 'revocada';
    solicitada_por: string;
    decidida_por: string | null;
    solicitada_at: string;
    decidida_at: string | null;
  } | null;
};

export type PendienteVieja = Pick<
  ReservaPanel,
  'id' | 'cliente_nombre' | 'cliente_telefono' | 'monto_sena' | 'created_at' | 'alojamiento_nombre'
>;

export type ConversionManyChat = {
  total: number;
  confirmadas: number;
};

export type MetricasPanelReservas = {
  total_confirmadas: number;
  ingresos_senas: number;
  checkins_hoy: number;
  checkins_semana: number;
  checkouts_hoy: number;
  saldo_pendiente_total: number;
  total_a_facturar: number;
  pendientes_viejas: {
    cantidad: number;
    umbral_dias: number;
    items: PendienteVieja[];
  };
  conversion_manychat: {
    total: number;
    confirmadas: number;
    pct: number | null;
  };
};

export type PanelReservas = {
  metricas: MetricasPanelReservas;
  alojamientos: AlojamientoPanel[];
  reservas: ReservaPanel[];
  vista: VistaPanelReservas;
};
