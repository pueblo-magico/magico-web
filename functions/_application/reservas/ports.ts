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
import type {
  ContextoAlojamiento,
  EspacioInventario,
  ModalidadAlojamiento,
  ModalidadEspacio,
  UnidadAsignable,
} from '../../_domain/reservas/accommodationInventory.ts';
import type {
  ContextoCapacidadReserva,
  EstadoExcepcionCapacidad,
  ExcepcionCapacidad,
  SolicitudExcepcionCapacidadValidada,
} from '../../_domain/reservas/capacityExceptions.ts';

export interface RepositorioExcepcionesCapacidad {
  obtenerContextoPorReserva(reservaId: number): Promise<ContextoCapacidadReserva | null>;
  obtenerPorId(excepcionId: number): Promise<ExcepcionCapacidad | null>;
  crearSolicitud(
    solicitud: SolicitudExcepcionCapacidadValidada,
    actorEmail: string
  ): Promise<ExcepcionCapacidad>;
  cambiarEstado(
    excepcionId: number,
    estadoActual: EstadoExcepcionCapacidad,
    estadoNuevo: EstadoExcepcionCapacidad,
    actorEmail: string
  ): Promise<ExcepcionCapacidad | null>;
}

export interface RepositorioInventarioAlojamiento {
  listarEspaciosReservables(
    contexto: ContextoAlojamiento,
    modalidad?: ModalidadAlojamiento
  ): Promise<EspacioInventario[]>;
  listarModalidades(espacioId: number): Promise<ModalidadEspacio[]>;
  listarUnidadesAsignables(espacioId: number): Promise<UnidadAsignable[]>;
}

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
  registrar(entrada: {
    email: string;
    accion: string;
    entidadTipo?: string;
    entidadId?: string | number;
    motivo?: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
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

export type CampoEditableReserva =
  | 'cliente_nombre'
  | 'cliente_telefono'
  | 'cliente_email'
  | 'alojamiento_id'
  | 'fecha_checkin'
  | 'fecha_checkout'
  | 'cantidad_personas'
  | 'monto_total'
  | 'monto_sena'
  | 'estado'
  | 'canal_origen'
  | 'unidad_asignada';

export type CambiosReserva = Partial<Record<CampoEditableReserva, unknown>>;

export interface RepositorioEdicionReserva {
  actualizarParcial(reservaId: number, cambios: CambiosReserva): Promise<{ id: number } | null>;
}

export type ReservaPendienteManyChat = {
  clienteNombre: string;
  alojamientoId: number;
  fechaCheckin: string;
  fechaCheckout: string;
  cantidadPersonas: number;
  montoTotal: number;
  montoSena: number;
  manyChatUserId: string;
};

export interface RepositorioReservasManyChat {
  crearPendiente(reserva: ReservaPendienteManyChat): Promise<{ id: number | undefined }>;
  guardarPreferenciaPago(reservaId: number, preferenciaId: string): Promise<void>;
}

export type SolicitudPreferenciaPago = {
  reservaId: number;
  tipoAlojamiento: 'domo' | 'refugio';
  montoSena: number;
};

export interface ProveedorCheckoutReserva {
  crearPreferencia(solicitud: SolicitudPreferenciaPago): Promise<{
    preferenciaId: string;
    checkoutUrl: string | null;
  }>;
}

export type PagoExternoReserva = {
  id: string;
  estado: string;
  referenciaExterna: unknown;
};

export type ReservaConfirmadaParaNotificar = {
  manyChatUserId: string | null;
  fechaCheckin: string;
  fechaCheckout: string;
};

export interface ProveedorPagosReserva {
  obtenerPago(pagoId: string): Promise<PagoExternoReserva | null>;
}

export interface RepositorioEstadoPagoReserva {
  confirmar(
    reservaId: number,
    pagoId: string
  ): Promise<ReservaConfirmadaParaNotificar | null>;
  cancelarPendiente(reservaId: number, pagoId: string): Promise<void>;
}

export interface NotificadorReservaConfirmada {
  notificar(reserva: ReservaConfirmadaParaNotificar): Promise<void>;
}

export type DatosPersonalesReserva = {
  id: number;
  codigo: string | null;
  cliente_nombre: string;
  cliente_telefono: string | null;
  cliente_email: string | null;
  manychat_user_id: string | null;
  fecha_checkin: string;
  fecha_checkout: string;
  cantidad_personas: number;
  estado: string;
  canal_origen: string | null;
  created_at: string;
  updated_at: string | null;
};

export interface RepositorioDatosPersonalesReserva {
  obtener(reservaId: number): Promise<DatosPersonalesReserva | null>;
  anonimizar(reservaId: number): Promise<void>;
  registrarSolicitud(entrada: {
    reservaId: number;
    tipo: 'exportacion' | 'anonimizacion';
    actorEmail: string;
    motivo: string;
    correlationId: string;
  }): Promise<void>;
}
