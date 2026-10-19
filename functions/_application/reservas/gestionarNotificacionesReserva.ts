import type { TipoIntencionComunicacion } from '../../_domain/reservas/communicationIntents.ts';

export type NotificacionReservaReclamada = {
  intencionUid: string;
  reservaId: number;
  tipo: TipoIntencionComunicacion;
  audiencia: 'huesped' | 'equipo';
  idioma: 'es' | 'en';
  attempts: number;
  email: string | null;
  codigo: string;
  clienteNombre: string;
  estadoFlujo: string;
  fechaCheckin: string;
  fechaCheckout: string;
  cantidadPersonas: number;
  montoSenaCentavos: number;
  montoTotalCentavos: number;
  moneda: string;
  alojamiento: string;
  modalidad: string;
  expiresAt: string | null;
  checkoutUrl: string | null;
  asuntoTemplate: string;
  cuerpoTemplate: string;
};

export interface RepositorioNotificacionesReserva {
  reclamarPorUid(entrada: {
    intencionUid: string;
    claimUid: string;
    ahora: string;
    claimExpiresAt: string;
  }): Promise<NotificacionReservaReclamada | null>;
  finalizarEntrega(entrada: {
    intencionUid: string;
    claimUid: string;
    deliveryUid: string;
    canal: 'email';
    resultado: 'entregada' | 'retry' | 'sin_canal' | 'dead_letter';
    errorCode: string | null;
    completedAt: string;
    nextAttemptAt: string | null;
  }): Promise<boolean>;
}

export const MAX_INTENTOS_EMAIL_RESERVA = 3;

function codigoErrorSeguro(valor: unknown): string | null {
  const codigo = String(valor || '').trim().toUpperCase();
  return /^[A-Z][A-Z0-9_]{2,63}$/.test(codigo) ? codigo : null;
}

function formatearMonto(centavos: number, moneda: string, idioma: 'es' | 'en'): string {
  try {
    return new Intl.NumberFormat(idioma === 'es' ? 'es-AR' : 'en-US', {
      style: 'currency',
      currency: moneda,
      maximumFractionDigits: 0,
    }).format(centavos / 100);
  } catch {
    return `${moneda} ${Math.round(centavos / 100)}`;
  }
}

function rutaEstado(tipo: TipoIntencionComunicacion, estadoFlujo: string, codigo: string): string {
  const path = tipo === 'pago_aprobado' || estadoFlujo === 'confirmada'
    ? '/reserva-confirmada'
    : tipo === 'reserva_vencida' || tipo === 'reserva_cancelada'
      ? '/reserva-fallida'
      : '/reserva-pendiente';
  return `${path}?reserva=${encodeURIComponent(codigo)}`;
}

function renderizar(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{([a-z_]+)\}\}/g, (_match, clave: string) => variables[clave] ?? '');
}

function normalizarEmailsEquipo(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const unicos = new Map<string, string>();
  for (const candidato of valor.split(/[,;\n]/).map(item => item.trim()).filter(Boolean)) {
    if (candidato.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidato)) continue;
    const clave = candidato.toLowerCase();
    if (!unicos.has(clave)) unicos.set(clave, candidato);
    if (unicos.size >= 20) break;
  }
  return unicos.size > 0 ? [...unicos.values()].join(', ') : null;
}

export async function reclamarNotificacionReserva(
  entrada: {
    intencionUid: string;
    publicSiteUrl: string;
    teamNotificationEmails?: string;
    adminSiteUrl?: string;
  },
  repositorio: RepositorioNotificacionesReserva,
  ahora: () => Date = () => new Date(),
  crearUuid: () => string = () => crypto.randomUUID()
) {
  const intencionUid = entrada.intencionUid.trim();
  if (!intencionUid || intencionUid.length > 200) {
    throw Object.assign(new Error('Intención inválida.'), { codigo: 'DATOS_INVALIDOS', status: 400 });
  }
  let baseUrl: URL;
  try {
    baseUrl = new URL(entrada.publicSiteUrl);
  } catch {
    throw Object.assign(new Error('La URL pública no es válida.'), { codigo: 'DATOS_INVALIDOS', status: 400 });
  }
  if (!['http:', 'https:'].includes(baseUrl.protocol)) {
    throw Object.assign(new Error('La URL pública no es válida.'), { codigo: 'DATOS_INVALIDOS', status: 400 });
  }

  const fecha = ahora();
  const claimUid = crearUuid();
  const reclamada = await repositorio.reclamarPorUid({
    intencionUid,
    claimUid,
    ahora: fecha.toISOString(),
    claimExpiresAt: new Date(fecha.getTime() + 5 * 60_000).toISOString(),
  });
  if (!reclamada) return null;

  const deliveryUid = `entrega:${reclamada.intencionUid}:${reclamada.attempts}`;
  const destinatario = reclamada.audiencia === 'equipo'
    ? normalizarEmailsEquipo(entrada.teamNotificationEmails)
    : reclamada.email;
  if (!destinatario) {
    await repositorio.finalizarEntrega({
      intencionUid: reclamada.intencionUid,
      claimUid,
      deliveryUid,
      canal: 'email',
      resultado: 'sin_canal',
      errorCode: reclamada.audiencia === 'equipo'
        ? 'TEAM_EMAIL_DESTINATION_MISSING'
        : 'EMAIL_DESTINATION_MISSING',
      completedAt: fecha.toISOString(),
      nextAttemptAt: null,
    });
    return {
      intencionUid: reclamada.intencionUid,
      estado: 'sin_canal' as const,
      canal: 'email' as const,
    };
  }

  const statusUrl = new URL(
    rutaEstado(reclamada.tipo, reclamada.estadoFlujo, reclamada.codigo),
    baseUrl
  ).toString();
  let adminBaseUrl = baseUrl;
  if (entrada.adminSiteUrl) {
    try {
      const candidata = new URL(entrada.adminSiteUrl);
      if (['http:', 'https:'].includes(candidata.protocol)) adminBaseUrl = candidata;
    } catch {
      // La URL publica conserva un enlace seguro aunque la opcion admin sea invalida.
    }
  }
  const adminUrl = new URL('/admin/reservas', adminBaseUrl);
  adminUrl.searchParams.set('buscar', reclamada.codigo);
  const variables = {
    reserva_codigo: reclamada.codigo,
    cliente_nombre: reclamada.clienteNombre,
    fecha_checkin: reclamada.fechaCheckin,
    fecha_checkout: reclamada.fechaCheckout,
    cantidad_personas: String(reclamada.cantidadPersonas),
    monto_sena: formatearMonto(reclamada.montoSenaCentavos, reclamada.moneda, reclamada.idioma),
    monto_total: formatearMonto(reclamada.montoTotalCentavos, reclamada.moneda, reclamada.idioma),
    moneda: reclamada.moneda,
    alojamiento: reclamada.alojamiento,
    modalidad: reclamada.modalidad,
    estado_reserva: reclamada.estadoFlujo,
    expires_at: reclamada.expiresAt || '',
    status_url: statusUrl,
    payment_url: reclamada.checkoutUrl || statusUrl,
    admin_url: adminUrl.toString(),
  };
  return {
    intencionUid: reclamada.intencionUid,
    claimUid,
    deliveryUid,
    intento: reclamada.attempts,
    maxIntentos: MAX_INTENTOS_EMAIL_RESERVA,
    estado: 'lista' as const,
    canal: 'email' as const,
    destinatario,
    asunto: renderizar(reclamada.asuntoTemplate, variables),
    cuerpo: renderizar(reclamada.cuerpoTemplate, variables),
    idioma: reclamada.idioma,
    audiencia: reclamada.audiencia,
  };
}

export async function registrarResultadoNotificacionReserva(
  entrada: {
    intencionUid: string;
    claimUid: string;
    deliveryUid: string;
    resultado: 'entregada' | 'retry' | 'dead_letter';
    errorCode?: string | null;
  },
  repositorio: RepositorioNotificacionesReserva,
  ahora: () => Date = () => new Date()
): Promise<boolean> {
  if (!entrada.intencionUid.trim() || !entrada.claimUid.trim() || !entrada.deliveryUid.trim()) {
    throw Object.assign(new Error('Resultado inválido.'), { codigo: 'DATOS_INVALIDOS', status: 400 });
  }
  const fecha = ahora();
  const errorCode = entrada.resultado === 'entregada'
    ? null
    : codigoErrorSeguro(entrada.errorCode) || 'EMAIL_DELIVERY_ERROR';
  return repositorio.finalizarEntrega({
    intencionUid: entrada.intencionUid,
    claimUid: entrada.claimUid,
    deliveryUid: entrada.deliveryUid,
    canal: 'email',
    resultado: entrada.resultado,
    errorCode,
    completedAt: fecha.toISOString(),
    nextAttemptAt: entrada.resultado === 'retry'
      ? new Date(fecha.getTime() + 5 * 60_000).toISOString()
      : null,
  });
}
