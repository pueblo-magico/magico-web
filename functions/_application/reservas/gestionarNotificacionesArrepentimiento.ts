import type { RegistroAuditoriaReservas } from './ports.ts';

export type TipoNotificacionArrepentimiento =
  | 'arrepentimiento_recibido'
  | 'arrepentimiento_en_revision'
  | 'arrepentimiento_resuelto'
  | 'arrepentimiento_rechazado';

export type NotificacionArrepentimientoReclamada = {
  notificacionUid: string;
  solicitudId: number;
  tipo: TipoNotificacionArrepentimiento;
  idioma: 'es' | 'en';
  attempts: number;
  email: string;
  codigo: string;
  mensajeCliente: string | null;
  claimedAt: string;
};

export interface RepositorioNotificacionesArrepentimiento {
  reclamar(entrada: {
    notificacionUid: string;
    claimUid: string;
    ahora: string;
    claimExpiresAt: string;
  }): Promise<NotificacionArrepentimientoReclamada | null>;
  finalizar(entrada: {
    notificacionUid: string;
    claimUid: string;
    deliveryUid: string;
    resultado: 'entregada' | 'retry' | 'dead_letter';
    errorCode: string | null;
    completedAt: string;
    nextAttemptAt: string | null;
  }): Promise<boolean>;
  reprocesar(entrada: { notificacionUid: string; ahora: string }): Promise<boolean>;
}

const COPIA = {
  es: {
    arrepentimiento_recibido: ['Recibimos tu solicitud {{codigo}}', 'Recibimos tu solicitud de arrepentimiento. Guardá el código {{codigo}} como constancia.'],
    arrepentimiento_en_revision: ['Tu solicitud {{codigo}} está en revisión', 'Estamos revisando tu solicitud {{codigo}}. {{mensaje}}'],
    arrepentimiento_resuelto: ['Resolvimos tu solicitud {{codigo}}', 'Tu solicitud {{codigo}} fue resuelta. {{mensaje}}'],
    arrepentimiento_rechazado: ['Actualización de tu solicitud {{codigo}}', 'Tu solicitud {{codigo}} fue rechazada. {{mensaje}}'],
  },
  en: {
    arrepentimiento_recibido: ['We received your request {{codigo}}', 'We received your withdrawal request. Keep {{codigo}} as your receipt.'],
    arrepentimiento_en_revision: ['Your request {{codigo}} is under review', 'We are reviewing your request {{codigo}}. {{mensaje}}'],
    arrepentimiento_resuelto: ['We resolved your request {{codigo}}', 'Your request {{codigo}} was resolved. {{mensaje}}'],
    arrepentimiento_rechazado: ['Update about your request {{codigo}}', 'Your request {{codigo}} was rejected. {{mensaje}}'],
  },
} as const;

export const MAX_INTENTOS_EMAIL_ARREPENTIMIENTO = 3;

function renderizar(valor: string, codigo: string, mensaje: string | null): string {
  return valor.replaceAll('{{codigo}}', codigo).replaceAll('{{mensaje}}', mensaje || '').trim();
}

function codigoErrorSeguro(valor: unknown): string | null {
  const codigo = String(valor || '').trim().toUpperCase();
  return /^[A-Z][A-Z0-9_]{2,63}$/.test(codigo) ? codigo : null;
}

export async function reclamarNotificacionArrepentimiento(
  notificacionUid: string,
  repositorio: RepositorioNotificacionesArrepentimiento,
  ahora: () => Date = () => new Date(),
  crearUuid: () => string = () => crypto.randomUUID()
) {
  const uid = notificacionUid.trim();
  if (!uid || uid.length > 200) throw Object.assign(new Error('Notificación inválida.'), { codigo: 'DATOS_INVALIDOS', status: 400 });
  const fecha = ahora();
  const claimUid = crearUuid();
  const reclamada = await repositorio.reclamar({
    notificacionUid: uid,
    claimUid,
    ahora: fecha.toISOString(),
    claimExpiresAt: new Date(fecha.getTime() + 5 * 60_000).toISOString(),
  });
  if (!reclamada) return null;
  const [asunto, cuerpo] = COPIA[reclamada.idioma][reclamada.tipo];
  return {
    notificacionUid: reclamada.notificacionUid,
    claimUid,
    deliveryUid: `entrega:${reclamada.notificacionUid}:${reclamada.attempts}`,
    intento: reclamada.attempts,
    maxIntentos: MAX_INTENTOS_EMAIL_ARREPENTIMIENTO,
    destinatario: reclamada.email,
    asunto: renderizar(asunto, reclamada.codigo, reclamada.mensajeCliente),
    cuerpo: renderizar(cuerpo, reclamada.codigo, reclamada.mensajeCliente),
    idioma: reclamada.idioma,
    plantillaVersion: 1,
  };
}

export async function registrarResultadoNotificacionArrepentimiento(
  entrada: {
    notificacionUid: string;
    claimUid: string;
    deliveryUid: string;
    resultado: 'entregada' | 'retry' | 'dead_letter';
    errorCode?: string | null;
  },
  repositorio: RepositorioNotificacionesArrepentimiento,
  ahora: () => Date = () => new Date()
): Promise<boolean> {
  if (!entrada.notificacionUid.trim() || !entrada.claimUid.trim() || !entrada.deliveryUid.trim()) {
    throw Object.assign(new Error('Resultado inválido.'), { codigo: 'DATOS_INVALIDOS', status: 400 });
  }
  const fecha = ahora();
  const errorCode = entrada.resultado === 'entregada'
    ? null
    : codigoErrorSeguro(entrada.errorCode) || 'EMAIL_DELIVERY_ERROR';
  return repositorio.finalizar({
    ...entrada,
    errorCode,
    completedAt: fecha.toISOString(),
    nextAttemptAt: entrada.resultado === 'retry'
      ? new Date(fecha.getTime() + 5 * 60_000).toISOString()
      : null,
  });
}

export async function reprocesarNotificacionArrepentimiento(
  entrada: { notificacionUid: string; motivo: string; actorEmail: string; correlationId: string },
  repositorio: RepositorioNotificacionesArrepentimiento,
  auditoria: RegistroAuditoriaReservas,
  ahora: () => Date = () => new Date()
): Promise<boolean> {
  const uid = entrada.notificacionUid.trim();
  const motivo = entrada.motivo.trim();
  if (!uid || uid.length > 200 || motivo.length < 8 || motivo.length > 500) {
    throw Object.assign(new Error('Reproceso inválido.'), { codigo: 'DATOS_INVALIDOS', status: 400 });
  }
  const actualizada = await repositorio.reprocesar({ notificacionUid: uid, ahora: ahora().toISOString() });
  if (!actualizada) return false;
  await auditoria.registrar({
    email: entrada.actorEmail,
    accion: 'reprocesar_notificacion_arrepentimiento',
    entidadTipo: 'arrepentimiento_notificacion',
    entidadId: uid,
    motivo,
    correlationId: entrada.correlationId,
  });
  return true;
}
