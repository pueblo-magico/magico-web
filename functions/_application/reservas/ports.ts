import type {
  AlojamientoCalendario,
  AlojamientoPanel,
  ConversionManyChat,
  Disponibilidad,
  PendienteVieja,
  ReservaCalendario,
  ReservaPanel,
  ResultadoCotizacion,
  SolicitudCotizacion,
} from '../../_domain/reservas/models.ts';
import type { ConfiguracionTarifa } from '../../_domain/reservas/ratePlans.ts';
import type { ConfiguracionTarifaAlimentacion, RegimenAlimentacion } from '../../_domain/reservas/alimentacion.ts';
import type { PlanTarifaBorrador } from '../../_domain/reservas/ratePlanAdministration.ts';
import type {
  NuevaEstadiaNoComercial,
  NuevoBloqueoInventario,
  ObjetivosOcupacionOperativa,
  RegistroOcupacionOperativa,
} from '../../_domain/reservas/operationalOccupancy.ts';
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
import type {
  CotizacionAceptada,
  ReservaPublicaCreada,
} from '../../_domain/reservas/reservationCreation.ts';
import type { BorradorPoliticaCancelacion } from '../../_domain/reservas/refundPolicies.ts';
import type { EstadoPagoReserva } from '../../_domain/reservas/paymentLifecycle.ts';
import type {
  ContextoAsignacionInventario,
  PlanAsignacionInventario,
} from '../../_domain/reservas/inventoryAssignment.ts';
import type {
  AccionEstadoReservaAdmin,
  CambiosReservaAdmin,
  DetalleReservaAdmin,
  FiltrosReservasAdmin,
  NuevaReservaAdmin,
  PaginaReservasAdmin,
  ResumenReservaAdmin,
} from '../../_domain/reservas/adminReservationManagement.ts';
import type {
  FilaExportacionReserva,
  FiltrosExportacionReservas,
} from '../../_domain/reservas/adminReservationExport.ts';
import type {
  CollectionCucuruNormalizada,
  CuentaCobroReserva,
  DestinoCobroProveedor,
} from '../../_domain/reservas/collectionAccounts.ts';
import type {
  CambioParametroOperativo,
  ConfiguracionBaseReservas,
  ParametroOperativoReserva,
} from '../../_domain/reservas/baseConfiguration.ts';

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

export type AsignacionInventarioGuardada = {
  reservaId: number;
  reservaVersion: number;
  estadiaId: number;
  espacioCodigo: string;
  modalidad: ModalidadAlojamiento;
  capacidadRestante: number;
  unidades: Array<{
    codigo: string;
    capacidad: number;
    cantidadHuespedes: number;
  }>;
};

export interface RepositorioAsignacionInventario {
  obtenerActual(reservaId: number): Promise<AsignacionInventarioGuardada | null>;
  obtenerContexto(
    reservaId: number,
    espacioCodigo: string,
    modalidad: ModalidadAlojamiento
  ): Promise<ContextoAsignacionInventario | null>;
  reemplazar(entrada: {
    contexto: ContextoAsignacionInventario;
    plan: PlanAsignacionInventario;
    operacionUid: string;
    actorEmail: string;
    correlationId: string;
  }): Promise<AsignacionInventarioGuardada | null>;
  liberar(entrada: {
    reservaId: number;
    expectedVersion: number;
    operacionUid: string;
    actorEmail: string;
    correlationId: string;
  }): Promise<AsignacionInventarioGuardada | null>;
}

export interface RepositorioGestionReservasAdmin {
  listar(filtros: FiltrosReservasAdmin): Promise<PaginaReservasAdmin>;
  obtenerDetalle(reservaId: number): Promise<DetalleReservaAdmin | null>;
  crear(entrada: {
    reserva: NuevaReservaAdmin;
    reservaUid: string;
    reservaCodigo: string;
    actorEmail: string;
    correlationId: string;
  }): Promise<ResumenReservaAdmin>;
  editar(entrada: {
    reservaId: number;
    expectedVersion: number;
    cambios: CambiosReservaAdmin;
    operacionUid: string;
    actorEmail: string;
    correlationId: string;
  }): Promise<ResumenReservaAdmin | null>;
  cambiarEstado(entrada: {
    reservaId: number;
    expectedVersion: number;
    accion: AccionEstadoReservaAdmin;
    motivo: string;
    operacionUid: string;
    actorEmail: string;
    correlationId: string;
  }): Promise<ResumenReservaAdmin | null>;
}

export interface RepositorioExportacionReservasAdmin {
  listarParaExportar(
    filtros: FiltrosExportacionReservas,
    limite: number
  ): Promise<{ filas: FilaExportacionReserva[]; truncada: boolean }>;
  registrarExportacion(entrada: {
    actorEmail: string;
    correlationId: string;
    cantidad: number;
    truncada: boolean;
    incluirPii: boolean;
    filtros: Omit<FiltrosExportacionReservas, 'titular'> & { filtroTitularAplicado: boolean };
  }): Promise<void>;
}

export interface RepositorioDisponibilidad {
  consultar(solicitud: SolicitudCotizacion): Promise<Disponibilidad>;
}

export interface RepositorioTarifas {
  obtenerPublicada(): Promise<ConfiguracionTarifa | null>;
}

export interface RepositorioTarifasAlimentacion {
  obtenerPublicada(regimen: RegimenAlimentacion): Promise<ConfiguracionTarifaAlimentacion | null>;
}

export interface RepositorioCotizaciones {
  guardar(
    solicitud: SolicitudCotizacion,
    resultado: Omit<ResultadoCotizacion, 'referencia'>
  ): Promise<{ id: number; codigo: string; expiresAt: string }>;
}

export type SolicitudIdempotenteGuardada = {
  requestHash: string;
  respuesta: ReservaPublicaCreada | null;
};

export interface RepositorioCreacionReservaPublica {
  buscarIdempotencia(clave: string): Promise<SolicitudIdempotenteGuardada | null>;
  obtenerCotizacion(codigo: string): Promise<CotizacionAceptada | null>;
  crearAtomica(entrada: {
    solicitud: {
      cotizacionCodigo: string;
      espacioCodigo: string;
      clienteNombre: string;
      clienteTelefono: string | null;
      clienteEmail: string | null;
      idempotencyKey: string;
    };
    cotizacion: CotizacionAceptada;
    requestHash: string;
    reservaUid: string;
    reservaCodigo: string;
    holdExpiresAt: string;
  }): Promise<ReservaPublicaCreada>;
}

export interface RepositorioConfiguracionBaseReservas {
  obtenerPaymentHoldMinutes(): Promise<number>;
  obtenerEfectiva(): Promise<ConfiguracionBaseReservas>;
  actualizarParametro(entrada: CambioParametroOperativo & {
    actorEmail: string;
    correlationId: string;
    operacionUid: string;
  }): Promise<ParametroOperativoReserva | null>;
}

export interface RepositorioRetencionesReserva {
  expirarVencidas(ahoraIso: string, limite?: number): Promise<number[]>;
}

export type ResumenPoliticaCancelacion = {
  id: number;
  codigo: string;
  nombre: string;
  version: number;
  estado: 'pendiente_configuracion' | 'borrador' | 'publicada' | 'retirada';
  vigenciaDesde: string | null;
  publicadoAt: string | null;
  reglas: unknown;
};

export interface RepositorioPoliticasCancelacion {
  listar(): Promise<ResumenPoliticaCancelacion[]>;
  crearBorrador(politica: BorradorPoliticaCancelacion): Promise<ResumenPoliticaCancelacion>;
  publicar(id: number): Promise<ResumenPoliticaCancelacion | null>;
}

export type ExcepcionPoliticaReserva = {
  id: number;
  reservaId: number;
  tipo: 'cancelacion' | 'devolucion' | 'vencimiento';
  estado: 'solicitada' | 'aprobada' | 'rechazada';
  montoDevolucionCentavos: number | null;
  motivo: string;
  solicitadaPor: string;
  resueltaPor: string | null;
};

export interface RepositorioExcepcionesPoliticaReserva {
  solicitar(entrada: {
    reservaId: number;
    tipo: ExcepcionPoliticaReserva['tipo'];
    montoDevolucionCentavos: number | null;
    motivo: string;
    actorEmail: string;
  }): Promise<ExcepcionPoliticaReserva | null>;
  resolver(
    id: number,
    estado: 'aprobada' | 'rechazada',
    actorEmail: string
  ): Promise<ExcepcionPoliticaReserva | null>;
}

export type ResumenPlanTarifa = {
  id: number; codigo: string; nombre: string; moneda: string; version: number;
  estado: 'borrador' | 'publicado' | 'retirado'; publicadoAt: string | null; createdAt: string;
};

export interface RepositorioAdministracionTarifas {
  listar(): Promise<ResumenPlanTarifa[]>;
  crearBorrador(plan: PlanTarifaBorrador): Promise<ResumenPlanTarifa>;
  publicar(planId: number): Promise<ResumenPlanTarifa | null>;
}

export interface RepositorioOcupacionOperativa {
  listar(): Promise<RegistroOcupacionOperativa[]>;
  listarObjetivos(): Promise<ObjetivosOcupacionOperativa>;
  crearBloqueo(entrada: NuevoBloqueoInventario, actorEmail: string): Promise<RegistroOcupacionOperativa>;
  cancelarBloqueo(id: number, actorEmail: string): Promise<RegistroOcupacionOperativa | null>;
  crearEstadiaNoComercial(
    entrada: NuevaEstadiaNoComercial,
    actorEmail: string
  ): Promise<RegistroOcupacionOperativa>;
  cancelarEstadiaNoComercial(id: number, actorEmail: string): Promise<RegistroOcupacionOperativa | null>;
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
  cotizacionId: number;
};

export interface RepositorioReservasManyChat {
  crearPendiente(reserva: ReservaPendienteManyChat): Promise<{ id: number | undefined }>;
  guardarPreferenciaPago(reservaId: number, preferenciaId: string): Promise<void>;
}

export type SolicitudPreferenciaPago = {
  reservaId: number;
  reservaCodigo?: string;
  tipoAlojamiento: 'domo' | 'refugio';
  montoSena: number;
};

export interface ProveedorCheckoutReserva {
  buscarPreferenciaPorReferencia?(referencia: string | number): Promise<{
    preferenciaId: string;
    checkoutUrl: string | null;
  } | null>;
  crearPreferencia(solicitud: SolicitudPreferenciaPago): Promise<{
    preferenciaId: string;
    checkoutUrl: string | null;
  }>;
}

export type CheckoutReservaPublica = {
  reservaId: number;
  reservaCodigo: string;
  tipoAlojamiento: 'domo' | 'refugio';
  montoSenaCentavos: number;
  moneda: string;
  estadoFlujo: string;
  expiresAt: string | null;
  preferenciaId: string | null;
  checkoutUrl: string | null;
};

export interface RepositorioCheckoutReservaPublica {
  obtener(reservaId: number): Promise<CheckoutReservaPublica | null>;
  reclamarProvisionamiento(reservaId: number): Promise<boolean>;
  guardarPreferencia(
    reservaId: number,
    preferenciaId: string,
    checkoutUrl: string,
    correlationId: string
  ): Promise<void>;
  registrarFallo(reservaId: number, codigo: string): Promise<void>;
}

export type EstadoReservaPublica = {
  codigo: string;
  estado: string;
  expiresAt: string | null;
  pagoEstado: string | null;
};

export interface RepositorioConsultaEstadoReservaPublica {
  obtenerPorCodigo(codigo: string): Promise<EstadoReservaPublica | null>;
}

export type PagoExternoReserva = {
  id: string;
  estado: string;
  referenciaExterna: unknown;
  montoCentavos: number | null;
  moneda: string | null;
};

export type PagoEsperadoReserva = {
  reservaId: number;
  estadoFlujo: string;
  montoCentavos: number;
  moneda: string;
  preferenciaId: string | null;
};

export type ObservacionPagoReserva = {
  proveedor: string;
  eventoExternoId: string;
  correlationId: string;
  pago: PagoExternoReserva;
  reservaId: number | null;
  resultado: 'recibido' | 'aplicado' | 'sin_cambios' | 'inconsistente';
  motivoCodigo: string | null;
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
  obtenerEsperado(reservaId: number): Promise<PagoEsperadoReserva | null>;
  obtenerEsperadoPorCodigo?(codigo: string): Promise<PagoEsperadoReserva | null>;
  obtenerEstadoPago(proveedor: string, externalPaymentId: string): Promise<EstadoPagoReserva | null>;
  registrarObservacion(observacion: ObservacionPagoReserva): Promise<boolean>;
  registrarPago(observacion: ObservacionPagoReserva, estado: EstadoPagoReserva): Promise<void>;
  confirmar(
    reservaId: number,
    pagoId: string
  ): Promise<ReservaConfirmadaParaNotificar | null>;
  cancelarPendiente(reservaId: number, pagoId: string): Promise<void>;
}

export type PagoTimelineReserva = {
  id: number;
  proveedor: string;
  tipo: string;
  estado: string;
  montoCentavos: number;
  moneda: string;
  externalPaymentId: string | null;
  correlationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventoTimelineReserva = {
  id: number;
  tipo: string;
  version: number;
  actorTipo: string;
  actorRef: string | null;
  correlationId: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
};

export type HistorialReserva = {
  reservaId: number;
  estado: string;
  estadoFlujo: string;
  resumenFinanciero: {
    moneda: string;
    intentos: number;
    aprobadoCentavos: number;
    devueltoCentavos: number;
    netoCentavos: number;
  };
  pagos: PagoTimelineReserva[];
  eventos: EventoTimelineReserva[];
};

export interface RepositorioHistorialReserva {
  obtener(reservaId: number): Promise<HistorialReserva | null>;
}

export interface NotificadorReservaConfirmada {
  notificar(reserva: ReservaConfirmadaParaNotificar): Promise<void>;
}

export type ContextoCuentaCobroReserva = {
  reservaId: number;
  reservaUid: string;
  estadoFlujo: string;
  moneda: string;
  montoEsperadoCentavos: number;
};

export interface RepositorioCuentasCobroReserva {
  obtenerContexto(reservaId: number): Promise<ContextoCuentaCobroReserva | null>;
  preparar(entrada: {
    reservaId: number;
    customerId: string;
    habilitada: boolean;
    simulada?: boolean;
    operacionUid: string;
  }): Promise<CuentaCobroReserva>;
  reclamarProvisionamiento(cuentaId: number, operacionUid: string): Promise<CuentaCobroReserva | null>;
  registrarIntento(entrada: {
    cuentaId: number;
    operacionUid: string;
    tipo: 'lookup' | 'create' | 'alias';
  }): Promise<void>;
  completarIntento(
    operacionUid: string,
    resultado: 'succeeded' | 'not_found' | 'failed' | 'unknown_outcome',
    errorCodigo?: string
  ): Promise<void>;
  marcarLista(cuentaId: number, operacionUid: string, destino: DestinoCobroProveedor): Promise<CuentaCobroReserva>;
  marcarFalla(entrada: {
    cuentaId: number;
    operacionUid: string;
    resultado: 'failed' | 'unknown_outcome';
    errorCodigo: string;
    nextRetryAt: string;
  }): Promise<CuentaCobroReserva>;
}

export interface ProveedorCuentasCobro {
  buscarPorCustomerId(customerId: string): Promise<DestinoCobroProveedor | null>;
  crear(entrada: { customerId: string; idempotencyKey: string }): Promise<DestinoCobroProveedor>;
  asignarAlias(entrada: {
    cuenta: DestinoCobroProveedor;
    alias: string;
    idempotencyKey: string;
  }): Promise<DestinoCobroProveedor>;
}

export interface ProveedorCollectionsCucuru {
  listar(entrada: {
    desde: string;
    hasta: string;
    cursor: string | null;
    limite: number;
  }): Promise<{ items: CollectionCucuruNormalizada[]; nextCursor: string | null }>;
}

export interface ConsumidorCollectionCucuru {
  procesar(collection: CollectionCucuruNormalizada): Promise<void>;
}

export type CheckpointBackfillCucuru = {
  cursor: string | null;
  windowStartAt: string | null;
  windowEndAt: string | null;
};

export interface RepositorioBackfillCucuru {
  adquirirLock(entrada: {
    alcance: string;
    lockUid: string;
    lockExpiresAt: string;
  }): Promise<CheckpointBackfillCucuru | null>;
  guardarCheckpoint(entrada: {
    alcance: string;
    lockUid: string;
    cursor: string | null;
    windowStartAt: string;
    windowEndAt: string;
  }): Promise<boolean>;
  liberarLock(alcance: string, lockUid: string): Promise<void>;
}

export type ResultadoConciliacionCucuru = {
  estado: 'aplicado' | 'prueba_cero' | 'revision_manual' | 'duplicado';
  motivoCodigo: string | null;
  reserva: ReservaConfirmadaParaNotificar | null;
};

export interface RepositorioConciliacionCucuru {
  procesar(
    collection: CollectionCucuruNormalizada,
    correlationId: string
  ): Promise<ResultadoConciliacionCucuru>;
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
