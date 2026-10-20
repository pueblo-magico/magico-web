import { nochesEntre } from '../../_domain/reservas/dateRange.ts';
import type {
  ConsultaIntegracionCreada,
  ErrorCreacionConsulta,
  ResultadoCreacionConsulta,
  SolicitudCrearConsultaIntegracion,
} from '../../_domain/reservas/inquiryCreation.ts';
import type { RepositorioCreacionConsultaIntegracion } from './ports.ts';

function error(codigo: ErrorCreacionConsulta, mensaje: string): ResultadoCreacionConsulta {
  return { ok: false, error: { codigo, mensaje } };
}

async function hashSolicitud(solicitud: SolicitudCrearConsultaIntegracion): Promise<string> {
  const canonica = JSON.stringify({
    clienteNombre: solicitud.clienteNombre.trim(),
    clienteTelefono: solicitud.clienteTelefono?.trim() || null,
    clienteEmail: solicitud.clienteEmail?.trim().toLowerCase() || null,
    alojamientoInteres: solicitud.alojamientoInteres?.trim() || null,
    fechaDesde: solicitud.fechaDesde,
    fechaHasta: solicitud.fechaHasta,
    cantidadPersonas: solicitud.cantidadPersonas,
    montoEstimadoCentavos: solicitud.montoEstimadoCentavos,
    cotizacionCodigo: solicitud.cotizacionCodigo?.trim() || null,
    contactoRef: solicitud.contactoRef.trim(),
    conversacionRef: solicitud.conversacionRef?.trim() || null,
  });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonica));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function crearConsultaIntegracion(
  solicitud: SolicitudCrearConsultaIntegracion,
  repositorio: RepositorioCreacionConsultaIntegracion,
  crearUuid: () => string = () => crypto.randomUUID()
): Promise<ResultadoCreacionConsulta> {
  if (!solicitud.idempotencyKey || solicitud.idempotencyKey.length < 8 || solicitud.idempotencyKey.length > 128) {
    return error('IDEMPOTENCY_KEY_REQUERIDA', 'Se requiere un Idempotency-Key de 8 a 128 caracteres.');
  }
  const nombre = solicitud.clienteNombre.trim();
  const contactoRef = solicitud.contactoRef.trim();
  const email = solicitud.clienteEmail?.trim().toLowerCase() || null;
  const tieneUnaFecha = Boolean(solicitud.fechaDesde || solicitud.fechaHasta);
  const fechasValidas = !tieneUnaFecha || Boolean(
    solicitud.fechaDesde && solicitud.fechaHasta && nochesEntre(solicitud.fechaDesde, solicitud.fechaHasta) !== null
  );
  if (!nombre || !contactoRef || nombre.length > 120 || contactoRef.length > 200 ||
      (solicitud.clienteTelefono?.trim().length ?? 0) > 40 ||
      (email !== null && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) ||
      (solicitud.alojamientoInteres?.trim().length ?? 0) > 120 ||
      (solicitud.conversacionRef?.trim().length ?? 0) > 200 ||
      (solicitud.cotizacionCodigo?.trim().length ?? 0) > 100 || !fechasValidas ||
      (solicitud.cantidadPersonas !== null && (!Number.isInteger(solicitud.cantidadPersonas) || solicitud.cantidadPersonas < 1)) ||
      (solicitud.montoEstimadoCentavos !== null &&
        (!Number.isSafeInteger(solicitud.montoEstimadoCentavos) || solicitud.montoEstimadoCentavos < 0))) {
    return error('SOLICITUD_INVALIDA', 'Los datos de la consulta son inválidos.');
  }

  const requestHash = await hashSolicitud(solicitud);
  const anterior = await repositorio.buscarIdempotencia(solicitud.idempotencyKey);
  if (anterior) {
    if (anterior.requestHash !== requestHash) {
      return error('IDEMPOTENCY_KEY_REUTILIZADA', 'La clave idempotente ya fue usada con otros datos.');
    }
    if (anterior.respuesta) {
      return { ok: true, valor: { ...anterior.respuesta, idempotente: true } };
    }
  }

  let cotizacionId: number | null = null;
  const cotizacionCodigo = solicitud.cotizacionCodigo?.trim() || null;
  if (cotizacionCodigo) {
    cotizacionId = await repositorio.buscarCotizacionId(cotizacionCodigo);
    if (cotizacionId === null) {
      return error('COTIZACION_NO_ENCONTRADA', 'La cotización indicada no existe.');
    }
  }

  const uid = crearUuid();
  try {
    const creada = await repositorio.crearAtomica({
      solicitud: {
        ...solicitud,
        clienteNombre: nombre,
        clienteTelefono: solicitud.clienteTelefono?.trim() || null,
        clienteEmail: email,
        alojamientoInteres: solicitud.alojamientoInteres?.trim() || null,
        cotizacionCodigo,
        contactoRef,
        conversacionRef: solicitud.conversacionRef?.trim() || null,
      },
      cotizacionId,
      requestHash,
      consultaUid: uid,
      consultaCodigo: `CON-${uid}`,
    });
    return { ok: true, valor: creada };
  } catch {
    const recuperada = await repositorio.buscarIdempotencia(solicitud.idempotencyKey);
    if (recuperada?.requestHash === requestHash && recuperada.respuesta) {
      return { ok: true, valor: { ...recuperada.respuesta, idempotente: true } };
    }
    return error('SOLICITUD_INVALIDA', 'No se pudo registrar la consulta.');
  }
}
