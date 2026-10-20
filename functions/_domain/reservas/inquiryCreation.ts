export type SolicitudCrearConsultaIntegracion = {
  clienteNombre: string;
  clienteTelefono: string | null;
  clienteEmail: string | null;
  alojamientoInteres: string | null;
  fechaDesde: string | null;
  fechaHasta: string | null;
  cantidadPersonas: number | null;
  montoEstimadoCentavos: number | null;
  cotizacionCodigo: string | null;
  contactoRef: string;
  conversacionRef: string | null;
  idempotencyKey: string;
};

export type ConsultaIntegracionCreada = {
  consultaId: number;
  codigo: string;
  estado: 'registrada';
  createdAt: string;
  cotizacionCodigo: string | null;
  idempotente: boolean;
};

export type ErrorCreacionConsulta =
  | 'SOLICITUD_INVALIDA'
  | 'IDEMPOTENCY_KEY_REQUERIDA'
  | 'IDEMPOTENCY_KEY_REUTILIZADA'
  | 'COTIZACION_NO_ENCONTRADA';

export type ResultadoCreacionConsulta =
  | { ok: true; valor: ConsultaIntegracionCreada }
  | { ok: false; error: { codigo: ErrorCreacionConsulta; mensaje: string } };
