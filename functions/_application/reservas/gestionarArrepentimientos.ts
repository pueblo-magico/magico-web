import type { RegistroAuditoriaReservas } from './ports.ts';

export type EstadoSolicitudArrepentimiento = 'recibida' | 'en_revision' | 'resuelta' | 'rechazada';

export type SolicitudArrepentimiento = {
  id: number;
  codigo: string;
  reservaId: number | null;
  reservaCodigoDeclarado: string | null;
  emailContacto: string;
  detalle: string;
  estado: EstadoSolicitudArrepentimiento;
  idioma: 'es' | 'en';
  mensajeCliente: string | null;
  version: number;
  notificacionEstado: string | null;
  notificacionUid: string | null;
  notificacionErrorCodigo: string | null;
  requestHash: string;
  createdAt: string;
  acknowledgedAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
};

export interface RepositorioSolicitudesArrepentimiento {
  buscarPorIdempotencia(clave: string): Promise<SolicitudArrepentimiento | null>;
  crear(entrada: {
    codigo: string;
    reservaCodigo: string | null;
    email: string;
    detalle: string;
    idioma: 'es' | 'en';
    idempotencyKey: string;
    requestHash: string;
    correlationId: string;
  }): Promise<SolicitudArrepentimiento>;
  listar(estado?: EstadoSolicitudArrepentimiento | null): Promise<SolicitudArrepentimiento[]>;
  buscarPublica(codigo: string, email: string): Promise<SolicitudArrepentimiento | null>;
  cambiarEstado(entrada: {
    id: number;
    estadoActual: EstadoSolicitudArrepentimiento;
    estado: EstadoSolicitudArrepentimiento;
    actorEmail: string;
    notaInterna: string;
    mensajeCliente: string;
  }): Promise<SolicitudArrepentimiento | null>;
}

type ResultadoCrear =
  | { ok: true; valor: SolicitudArrepentimiento; idempotente: boolean }
  | { ok: false; codigo: string; mensaje: string };

async function sha256(valor: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(valor));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODIGO_RESERVA = /^RES-[A-Za-z0-9-]{8,100}$/;

export async function crearSolicitudArrepentimiento(
  entrada: {
    reservaCodigo: string | null;
    email: string;
    detalle: string;
    idioma?: 'es' | 'en';
    idempotencyKey: string;
    correlationId: string;
  },
  repositorio: RepositorioSolicitudesArrepentimiento
): Promise<ResultadoCrear> {
  const email = entrada.email.trim().toLowerCase();
  const detalle = entrada.detalle.trim();
  const reservaCodigo = entrada.reservaCodigo?.trim().toUpperCase() || null;
  const clave = entrada.idempotencyKey.trim();
  const idioma = entrada.idioma || 'es';

  if (clave.length < 8 || clave.length > 128) {
    return { ok: false, codigo: 'IDEMPOTENCY_KEY_REQUERIDA', mensaje: 'Se requiere un Idempotency-Key de 8 a 128 caracteres.' };
  }
  if (!EMAIL.test(email) || email.length > 254) {
    return { ok: false, codigo: 'EMAIL_INVALIDO', mensaje: 'Ingresá un correo electrónico válido.' };
  }
  if (idioma !== 'es' && idioma !== 'en') {
    return { ok: false, codigo: 'IDIOMA_INVALIDO', mensaje: 'El idioma no es válido.' };
  }
  if (reservaCodigo && !CODIGO_RESERVA.test(reservaCodigo)) {
    return { ok: false, codigo: 'CODIGO_RESERVA_INVALIDO', mensaje: 'El código de reserva no tiene un formato válido.' };
  }
  if (detalle.length < 10 || detalle.length > 1_000) {
    return { ok: false, codigo: 'DETALLE_INVALIDO', mensaje: 'Contanos brevemente qué contratación querés revocar (10 a 1000 caracteres).' };
  }

  const requestHash = await sha256(JSON.stringify({ reservaCodigo, email, detalle, idioma }));
  const anterior = await repositorio.buscarPorIdempotencia(clave);
  if (anterior) {
    if (anterior.requestHash !== requestHash) {
      return { ok: false, codigo: 'IDEMPOTENCY_KEY_REUTILIZADA', mensaje: 'La clave idempotente ya fue usada con otros datos.' };
    }
    return { ok: true, valor: anterior, idempotente: true };
  }

  try {
    const creada = await repositorio.crear({
      codigo: `ARR-${crypto.randomUUID()}`,
      reservaCodigo,
      email,
      detalle,
      idioma,
      idempotencyKey: clave,
      requestHash,
      correlationId: entrada.correlationId,
    });
    return { ok: true, valor: creada, idempotente: false };
  } catch (error) {
    const recuperada = await repositorio.buscarPorIdempotencia(clave);
    if (recuperada && recuperada.requestHash === requestHash) {
      return { ok: true, valor: recuperada, idempotente: true };
    }
    throw error;
  }
}

const TRANSICIONES: Record<EstadoSolicitudArrepentimiento, readonly EstadoSolicitudArrepentimiento[]> = {
  recibida: ['en_revision', 'resuelta', 'rechazada'],
  en_revision: ['resuelta', 'rechazada'],
  resuelta: [],
  rechazada: [],
};

export async function resolverSolicitudArrepentimiento(
  entrada: {
    id: number;
    estadoActual: EstadoSolicitudArrepentimiento;
    estado: EstadoSolicitudArrepentimiento;
    actorEmail: string;
    notaInterna: string;
    mensajeCliente: string;
    correlationId: string;
  },
  repositorio: RepositorioSolicitudesArrepentimiento,
  auditoria: RegistroAuditoriaReservas
): Promise<SolicitudArrepentimiento | null> {
  const notaInterna = entrada.notaInterna.trim();
  const mensajeCliente = entrada.mensajeCliente.trim();
  if (!Number.isInteger(entrada.id) || entrada.id < 1 || notaInterna.length < 5 || notaInterna.length > 500 ||
      mensajeCliente.length < 5 || mensajeCliente.length > 1_000) {
    throw new Error('DATOS_INVALIDOS');
  }
  if (!TRANSICIONES[entrada.estadoActual]?.includes(entrada.estado)) {
    throw new Error('TRANSICION_INVALIDA');
  }
  const actualizada = await repositorio.cambiarEstado({
    id: entrada.id,
    estadoActual: entrada.estadoActual,
    estado: entrada.estado,
    actorEmail: entrada.actorEmail,
    notaInterna,
    mensajeCliente,
  });
  if (!actualizada) return null;
  await auditoria.registrar({
    email: entrada.actorEmail,
    accion: 'resolver_solicitud_arrepentimiento',
    entidadTipo: 'solicitud_arrepentimiento',
    entidadId: entrada.id,
    motivo: notaInterna,
    correlationId: entrada.correlationId,
    metadata: { estado: entrada.estado, mensaje_cliente_informado: true },
  });
  return actualizada;
}
