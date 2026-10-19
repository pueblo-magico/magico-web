export type AplicacionApiCatalogo = {
  codigo: 'n8n' | 'manychat' | 'outbox' | 'cucuru' | 'mercado_pago' | 'accounting' | 'stock';
  nombre: string;
  tipo: 'automatizacion' | 'proveedor' | 'servicio_interno';
  variableConfiguracion: string;
  endpoints: Array<{ method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; path: string }>;
};

export const APLICACIONES_API_CATALOGO: readonly AplicacionApiCatalogo[] = [
  {
    codigo: 'n8n', nombre: 'n8n', tipo: 'automatizacion', variableConfiguracion: 'N8N_INBOUND_SECRET',
    endpoints: [
      { method: 'POST', path: '/api/v1/integrations/consultas' },
      { method: 'GET', path: '/api/v1/integrations/reservas/disponibilidad' },
      { method: 'POST', path: '/api/v1/integrations/reservas/cotizaciones' },
      { method: 'POST', path: '/api/v1/integrations/reservas' },
      { method: 'POST', path: '/api/v1/integrations/reservas/expirar-retenciones' },
      { method: 'POST', path: '/api/v1/integrations/reservas/programar-recordatorios-llegada' },
      { method: 'POST', path: '/api/v1/integrations/cucuru/backfill' },
      { method: 'POST', path: '/api/v1/integrations/arrepentimientos/notificaciones' },
      { method: 'POST', path: '/api/v1/integrations/comunicaciones/notificaciones' },
    ],
  },
  {
    codigo: 'manychat', nombre: 'ManyChat', tipo: 'automatizacion', variableConfiguracion: 'MANYCHAT_INBOUND_SECRET',
    endpoints: [{ method: 'POST', path: '/api/manychat' }],
  },
  {
    codigo: 'outbox', nombre: 'Dispatcher de eventos', tipo: 'servicio_interno', variableConfiguracion: 'OUTBOX_DISPATCH_SECRET',
    endpoints: [{ method: 'POST', path: '/api/v1/integrations/outbox/dispatch' }],
  },
  {
    codigo: 'cucuru', nombre: 'Cucuru', tipo: 'proveedor', variableConfiguracion: 'CUCURU_WEBHOOK_SECRET',
    endpoints: [{ method: 'POST', path: '/api/v1/integrations/cucuru/collection_received' }],
  },
  {
    codigo: 'mercado_pago', nombre: 'Mercado Pago', tipo: 'proveedor', variableConfiguracion: 'MP_WEBHOOK_SECRET',
    endpoints: [{ method: 'POST', path: '/api/webhook-mp' }],
  },
  {
    codigo: 'accounting', nombre: 'Contabilidad', tipo: 'servicio_interno', variableConfiguracion: 'ACCOUNTING_API_SECRET',
    endpoints: [],
  },
  {
    codigo: 'stock', nombre: 'Stock', tipo: 'servicio_interno', variableConfiguracion: 'STOCK_API_SECRET',
    endpoints: [],
  },
] as const;

export function aplicacionConfigurada(aplicacion: AplicacionApiCatalogo, env: Record<string, unknown>): boolean {
  const secreto = env[aplicacion.variableConfiguracion];
  return typeof secreto === 'string' && secreto.length >= 24;
}
