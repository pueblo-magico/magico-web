import {
  APLICACIONES_API_CATALOGO,
  aplicacionConfigurada,
} from '../../../../_domain/reservas/apiApplicationCatalog.ts';
import { D1RepositorioAplicacionesApi } from '../../../../_infrastructure/d1/D1RepositorioAplicacionesApi.ts';
import { observarSolicitud } from '../../../../_interfaces/http/observability.ts';
import { jsonReserva as json } from '../../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../../_lib/authGuard.ts';

async function listar(request: Request, env: any): Promise<Response> {
  const auth = await requirePermission(request, env, 'integraciones.clientes.leer');
  if (auth instanceof Response) return auth;
  const registros = await new D1RepositorioAplicacionesApi(env.DB).listar();
  const porCodigo = new Map(registros.aplicaciones.map(item => [item.codigo, item]));
  const usos = new Map(registros.usos.map(item => [
    `${item.aplicacionCodigo}:${item.method}:${item.endpoint}`, item,
  ]));

  const aplicaciones = APLICACIONES_API_CATALOGO.map(aplicacion => {
    const registro = porCodigo.get(aplicacion.codigo);
    const endpoints = aplicacion.endpoints.map(endpoint => {
      const uso = usos.get(`${aplicacion.codigo}:${endpoint.method}:${endpoint.path}`);
      return {
        method: endpoint.method, path: endpoint.path,
        first_used_at: uso?.firstUsedAt || null,
        last_used_at: uso?.lastUsedAt || null,
        request_count: uso?.requestCount || 0,
      };
    });
    return {
      codigo: aplicacion.codigo,
      nombre: registro?.nombre || aplicacion.nombre,
      tipo: registro?.tipo || aplicacion.tipo,
      estado: registro?.estado || 'activa',
      configurada: aplicacionConfigurada(aplicacion, env),
      registrado_at: registro?.registradoAt || null,
      first_used_at: endpoints.map(item => item.first_used_at).filter(Boolean).sort()[0] || null,
      last_used_at: endpoints.map(item => item.last_used_at).filter(Boolean).sort().at(-1) || null,
      request_count: endpoints.reduce((total, item) => total + item.request_count, 0),
      endpoints,
    };
  });

  return json({ data: { aplicaciones }, meta: { version: 'v1', secretos_expuestos: false } });
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
  return observarSolicitud(request, 'admin.integrations.applications.list', () => listar(request, env));
}
