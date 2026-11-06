const RETIRED_RESERVATION_PATHS = new Set([
  '/api/disponibilidad',
  '/api/cotizar',
  '/api/manychat',
  '/api/webhook-mp',
  '/api/ical',
  '/api/admin/asignar',
  '/api/admin/consultas',
  '/api/admin/crear',
  '/api/admin/editar',
  '/api/admin/metricas',
  '/api/admin/reservas',
  '/api/admin/sync-airbnb',
]);

export function isRetiredReservationPath(pathname) {
  return RETIRED_RESERVATION_PATHS.has(pathname) || pathname.startsWith('/api/ical/');
}

export function retiredReservationResponse() {
  return new Response(JSON.stringify({
    error: {
      code: 'reservas_cutover',
      message: 'Esta operación ahora se realiza en Pueblo Mágico Reservas.',
    },
    reservas_url: 'https://reservas.experienciamagico.com',
  }), {
    status: 410,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
