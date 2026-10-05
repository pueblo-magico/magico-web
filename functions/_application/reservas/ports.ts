import type {
  AlojamientoCalendario,
  AlojamientoPanel,
  ConversionManyChat,
  Disponibilidad,
  PendienteVieja,
  ReservaCalendario,
  ReservaPanel,
  SolicitudCotizacion,
} from '../../_domain/reservas/models.ts';

export interface RepositorioDisponibilidad {
  consultar(solicitud: SolicitudCotizacion): Promise<Disponibilidad>;
}

export interface RepositorioCalendarioDisponibilidad {
  listarAlojamientos(): Promise<AlojamientoCalendario[]>;
  listarReservasActivas(desde: string, hasta: string): Promise<ReservaCalendario[]>;
}

export interface RepositorioPanelReservas {
  listarAlojamientos(): Promise<AlojamientoPanel[]>;
  listarReservasOperativas(): Promise<ReservaPanel[]>;
  listarHistorial(): Promise<ReservaPanel[]>;
  listarPendientesViejas(umbralDias: number): Promise<PendienteVieja[]>;
  obtenerConversionManyChat(): Promise<ConversionManyChat>;
}

export type AsignacionUnidadGuardada = {
  id: number;
  unidad_asignada: string | null;
};

export interface RepositorioAsignacionesReserva {
  asignarUnidad(reservaId: number, unidadAsignada: string): Promise<AsignacionUnidadGuardada | null>;
}

export interface RegistroAuditoriaReservas {
  registrar(email: string, accion: string, detalle?: string): Promise<void>;
}

export type ReservaManualNueva = {
  clienteNombre: string;
  clienteTelefono: string | null;
  clienteEmail: string | null;
  alojamientoId: number;
  fechaCheckin: string;
  fechaCheckout: string;
  cantidadPersonas: number;
  montoTotal: number;
  montoSena: number | null;
  estado: string;
  canalOrigen: string;
  tipoEstadia: string;
};

export interface RepositorioCreacionReserva {
  contarSolapamientos(
    alojamientoId: number,
    fechaCheckin: string,
    fechaCheckout: string
  ): Promise<number>;
  crearManual(reserva: ReservaManualNueva): Promise<{ id: number | undefined }>;
}
