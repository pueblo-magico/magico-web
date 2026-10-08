import type {
  RepositorioConfiguracionBaseReservas,
  RepositorioCreacionReservaPublica,
  RepositorioDisponibilidad,
} from './ports.ts';
import type {
  ErrorCreacionReserva,
  ResultadoCreacionReservaPublica,
  SolicitudCrearReservaPublica,
} from '../../_domain/reservas/reservationCreation.ts';

function error(codigo: ErrorCreacionReserva, mensaje: string): ResultadoCreacionReservaPublica {
  return { ok: false as const, error: { codigo, mensaje } };
}

async function hashSolicitud(solicitud: SolicitudCrearReservaPublica): Promise<string> {
  const metodoPago = solicitud.metodoPago || 'mercado_pago_checkout';
  const canonica = JSON.stringify({
    cotizacionCodigo: solicitud.cotizacionCodigo,
    espacioCodigo: solicitud.espacioCodigo,
    clienteNombre: solicitud.clienteNombre.trim(),
    clienteTelefono: solicitud.clienteTelefono?.trim() || null,
    clienteEmail: solicitud.clienteEmail?.trim().toLowerCase() || null,
    metodoPago,
    pagadorDocumentoHash: solicitud.pagadorDocumentoHash || null,
    pagadorDocumentoUltimos4: solicitud.pagadorDocumentoUltimos4 || null,
    idioma: solicitud.idioma || 'es',
    canalOrigen: solicitud.canalOrigen?.trim() || 'Web',
    referenciaIntegracion: solicitud.referenciaIntegracion ? {
      integracion: solicitud.referenciaIntegracion.integracion,
      contactoRef: solicitud.referenciaIntegracion.contactoRef.trim(),
      conversacionRef: solicitud.referenciaIntegracion.conversacionRef?.trim() || null,
      consultaCodigo: solicitud.referenciaIntegracion.consultaCodigo?.trim() || null,
    } : null,
  });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonica));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function crearReservaPublica(
  solicitud: SolicitudCrearReservaPublica,
  repositorio: RepositorioCreacionReservaPublica,
  disponibilidad: RepositorioDisponibilidad,
  configuracion: Pick<RepositorioConfiguracionBaseReservas, 'obtenerPaymentHoldMinutes'>,
  ahora: () => Date = () => new Date(),
  crearUuid: () => string = () => crypto.randomUUID()
): Promise<ResultadoCreacionReservaPublica> {
  const metodoPago = solicitud.metodoPago || 'mercado_pago_checkout';
  const pagadorDocumentoHash = solicitud.pagadorDocumentoHash || null;
  const pagadorDocumentoUltimos4 = solicitud.pagadorDocumentoUltimos4 || null;
  if (!solicitud.idempotencyKey || solicitud.idempotencyKey.length < 8 || solicitud.idempotencyKey.length > 128) {
    return error('IDEMPOTENCY_KEY_REQUERIDA', 'Se requiere un Idempotency-Key de 8 a 128 caracteres.');
  }
  if (!solicitud.cotizacionCodigo || !solicitud.espacioCodigo || !solicitud.clienteNombre.trim()) {
    return error('SOLICITUD_INVALIDA', 'Cotización, espacio y nombre son obligatorios.');
  }
  const checkoutValido = metodoPago === 'mercado_pago_checkout' &&
    pagadorDocumentoHash === null && pagadorDocumentoUltimos4 === null;
  const transferenciaValida = metodoPago === 'transferencia_mp' &&
    /^[a-f0-9]{64}$/.test(pagadorDocumentoHash) &&
    /^\d{4}$/.test(pagadorDocumentoUltimos4);
  if (!checkoutValido && !transferenciaValida) {
    return error('SOLICITUD_INVALIDA', 'El medio de pago o la identificación del pagador es inválido.');
  }
  if (solicitud.idioma !== undefined && solicitud.idioma !== 'es' && solicitud.idioma !== 'en') {
    return error('SOLICITUD_INVALIDA', 'El idioma de comunicación es inválido.');
  }
  const referencia = solicitud.referenciaIntegracion;
  if ((referencia && (!referencia.contactoRef.trim() || referencia.contactoRef.trim().length > 200 ||
      (referencia.conversacionRef?.trim().length ?? 0) > 200 ||
      (referencia.consultaCodigo?.trim().length ?? 0) > 100)) ||
      (solicitud.canalOrigen?.trim().length ?? 0) > 80) {
    return error('SOLICITUD_INVALIDA', 'Las referencias de origen tienen un formato o longitud inválidos.');
  }
  if (solicitud.cotizacionCodigo.length > 100 || solicitud.espacioCodigo.length > 100 ||
      solicitud.clienteNombre.trim().length > 120 ||
      (solicitud.clienteTelefono?.trim().length ?? 0) > 40 ||
      (solicitud.clienteEmail?.trim().length ?? 0) > 254 ||
      (solicitud.clienteEmail !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(solicitud.clienteEmail.trim()))) {
    return error('SOLICITUD_INVALIDA', 'Los datos del titular tienen un formato o longitud inválidos.');
  }

  const alcanceIdempotencia = referencia ? `crear_reserva_${referencia.integracion}` : 'crear_reserva_publica';
  const requestHash = await hashSolicitud(solicitud);
  const anterior = await repositorio.buscarIdempotencia(solicitud.idempotencyKey, alcanceIdempotencia);
  if (anterior) {
    if (anterior.requestHash !== requestHash) {
      return error('IDEMPOTENCY_KEY_REUTILIZADA', 'La clave idempotente ya fue usada con otros datos.');
    }
    if (anterior.respuesta) return { ok: true, valor: { ...anterior.respuesta, idempotente: true } };
  }

  const cotizacion = await repositorio.obtenerCotizacion(solicitud.cotizacionCodigo);
  if (!cotizacion) return error('COTIZACION_NO_ENCONTRADA', 'La cotización no existe.');
  if (Date.parse(cotizacion.expiresAt) <= ahora().getTime()) {
    return error('COTIZACION_VENCIDA', 'La cotización venció; solicitá una nueva.');
  }

  let consultaId: number | null = null;
  const consultaCodigo = referencia?.consultaCodigo?.trim() || null;
  if (referencia && consultaCodigo) {
    consultaId = await repositorio.buscarConsultaIntegracion({
      codigo: consultaCodigo,
      integracion: referencia.integracion,
      contactoRef: referencia.contactoRef.trim(),
      conversacionRef: referencia.conversacionRef?.trim() || null,
    });
    if (consultaId === null) {
      return error(
        'CONSULTA_NO_ENCONTRADA',
        'La consulta no existe o no corresponde al contacto y conversación indicados.'
      );
    }
  }

  const estado = await disponibilidad.consultar({
    tipo: cotizacion.tipo,
    personas: cotizacion.personas,
    fechaEntrada: cotizacion.fechaCheckin,
    fechaSalida: cotizacion.fechaCheckout,
    modalidad: cotizacion.modalidad,
    contexto: cotizacion.contexto,
    regimenAlimentacion: cotizacion.regimenAlimentacion,
  });
  if (estado.estado !== 'disponible' || estado.espacio_codigo !== solicitud.espacioCodigo) {
    return error('INVENTARIO_NO_DISPONIBLE', 'El espacio cotizado ya no está disponible.');
  }

  const uuid = crearUuid();
  const holdMinutes = await configuracion.obtenerPaymentHoldMinutes();
  const holdExpiresAt = new Date(ahora().getTime() + holdMinutes * 60_000).toISOString();
  try {
    const creada = await repositorio.crearAtomica({
      solicitud: {
        ...solicitud,
        clienteNombre: solicitud.clienteNombre.trim(),
        clienteTelefono: solicitud.clienteTelefono?.trim() || null,
        clienteEmail: solicitud.clienteEmail?.trim().toLowerCase() || null,
        metodoPago,
        pagadorDocumentoHash,
        pagadorDocumentoUltimos4,
        idioma: solicitud.idioma || 'es',
        canalOrigen: solicitud.canalOrigen?.trim() || 'Web',
        referenciaIntegracion: referencia ? {
          integracion: referencia.integracion,
          contactoRef: referencia.contactoRef.trim(),
          conversacionRef: referencia.conversacionRef?.trim() || null,
          consultaCodigo,
        } : undefined,
      },
      consultaId,
      cotizacion,
      requestHash,
      reservaUid: uuid,
      reservaCodigo: `RES-${uuid}`,
      holdExpiresAt,
    });
    return { ok: true, valor: creada };
  } catch {
    const recuperada = await repositorio.buscarIdempotencia(solicitud.idempotencyKey, alcanceIdempotencia);
    if (recuperada?.requestHash === requestHash && recuperada.respuesta) {
      return { ok: true, valor: { ...recuperada.respuesta, idempotente: true } };
    }
    return error('INVENTARIO_NO_DISPONIBLE', 'El inventario cambió mientras se creaba la reserva.');
  }
}
