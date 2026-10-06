import {
  observarSolicitud,
  type LoggerObservabilidad,
} from './_interfaces/http/observability.ts';

const OPERACIONES: Record<string, string> = {
  '/api/cotizar': 'public.quote',
  '/api/disponibilidad': 'public.availability',
  '/api/v1/public/alojamientos': 'public.v1.accommodations',
  '/api/v1/public/disponibilidad': 'public.v1.availability',
  '/api/v1/public/cotizaciones': 'public.v1.quotes',
  '/api/v1/public/reservas': 'public.v1.reservations',
  '/api/v1/integrations/reservas/expirar-retenciones': 'integration.reservations.expire_holds',
  '/api/ical': 'public.calendar',
  '/api/manychat': 'integration.manychat.create_reservation',
  '/api/webhook-mp': 'integration.mercadopago.webhook',
  '/api/admin/actividad': 'admin.activity.read',
  '/api/admin/asignar': 'admin.reservation.assign',
  '/api/admin/consultas': 'admin.inquiries.read',
  '/api/admin/crear': 'admin.reservation.create',
  '/api/admin/datos-personales': 'admin.personal_data.manage',
  '/api/admin/editar': 'admin.reservation.edit',
  '/api/admin/excepciones-capacidad': 'admin.capacity_exception.manage',
  '/api/admin/login': 'admin.session.create',
  '/api/admin/logout': 'admin.session.delete',
  '/api/admin/me': 'admin.session.read',
  '/api/admin/metricas': 'admin.metrics.read',
  '/api/admin/ocupacion-operativa': 'admin.operational_occupancy.manage',
  '/api/admin/reservas': 'admin.reservations.read',
  '/api/admin/sync-airbnb': 'admin.calendar.sync',
  '/api/admin/tarifas': 'admin.rate_plans.manage',
  '/api/admin/usuarios': 'admin.users.manage',
};

const INSTRUMENTADAS_EN_HANDLER = new Set([
  'GET /api/disponibilidad',
  'POST /api/manychat',
  'POST /api/webhook-mp',
  'GET /api/admin/me',
]);

export function esRutaApi(request: Request): boolean {
  const pathname = new URL(request.url).pathname;
  return pathname === '/api' || pathname.startsWith('/api/');
}

export function operacionApi(request: Request): string {
  return OPERACIONES[new URL(request.url).pathname] || 'api.unknown';
}

export function handlerYaInstrumentado(request: Request): boolean {
  const pathname = new URL(request.url).pathname;
  return INSTRUMENTADAS_EN_HANDLER.has(`${request.method.toUpperCase()} ${pathname}`);
}

export async function onRequest({ request, next, env }: any): Promise<Response> {
  if (!esRutaApi(request) || handlerYaInstrumentado(request)) return next();

  const logger = env?.OBSERVABILITY_LOGGER as LoggerObservabilidad | undefined;
  return observarSolicitud(
    request,
    operacionApi(request),
    async () => next(),
    logger || console
  );
}
