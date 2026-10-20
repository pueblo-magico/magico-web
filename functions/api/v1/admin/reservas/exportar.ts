import { exportarReservasAdmin } from '../../../../_application/reservas/exportarReservasAdmin.ts';
import { leerBooleanoExportacion } from '../../../../_domain/reservas/adminReservationExport.ts';
import { fechaOperativaCordoba } from '../../../../_domain/reservas/operationalDate.ts';
import { D1RepositorioExportacionReservasAdmin } from '../../../../_infrastructure/d1/D1RepositorioExportacionReservasAdmin.ts';
import { observarSolicitud } from '../../../../_interfaces/http/observability.ts';
import { respuestaErrorReserva } from '../../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../../_lib/authGuard.ts';

async function exportar(request: Request, env: any, correlationId: string): Promise<Response> {
  const auth = await requirePermission(request, env, 'datos_personales.exportar');
  if (auth instanceof Response) return auth;
  const params = new URL(request.url).searchParams;
  try {
    const resultado = await exportarReservasAdmin({
      fechaDesde: params.get('fecha_desde'),
      fechaHasta: params.get('fecha_hasta'),
      estado: params.get('estado'),
      origen: params.get('origen'),
      espacioCodigo: params.get('espacio'),
      titular: params.get('titular'),
      incluirPii: leerBooleanoExportacion(params.get('incluir_pii')),
    }, auth.email, correlationId, new D1RepositorioExportacionReservasAdmin(env.DB));
    return new Response(resultado.csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reservas_${fechaOperativaCordoba()}.csv"`,
        'Cache-Control': 'no-store, private',
        'X-Content-Type-Options': 'nosniff',
        'X-Export-Count': String(resultado.cantidad),
        'X-Export-Truncated': String(resultado.truncada),
        'X-Export-Includes-PII': String(resultado.incluyePii),
      },
    });
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo exportar el reporte.', status: 500,
    });
  }
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
  return observarSolicitud(
    request,
    'admin.reservations.export',
    contexto => exportar(request, env, contexto.requestId)
  );
}
