import {
  serializarExportacionReservas,
  type ExportacionReservas,
  type FiltrosExportacionReservas,
} from '../../_domain/reservas/adminReservationExport.ts';
import { validarFiltrosReservasAdmin } from '../../_domain/reservas/adminReservationManagement.ts';
import type { RepositorioExportacionReservasAdmin } from './ports.ts';

const LIMITE_EXPORTACION = 5_000;

export async function exportarReservasAdmin(
  entrada: Partial<FiltrosExportacionReservas> & { incluirPii: boolean },
  actorEmail: string,
  correlationId: string,
  repositorio: RepositorioExportacionReservasAdmin
): Promise<ExportacionReservas> {
  const filtrosBase = validarFiltrosReservasAdmin({ ...entrada, pagina: 1, limite: 100 });
  const filtros: FiltrosExportacionReservas = {
    fechaDesde: filtrosBase.fechaDesde,
    fechaHasta: filtrosBase.fechaHasta,
    estado: filtrosBase.estado,
    origen: filtrosBase.origen,
    espacioCodigo: filtrosBase.espacioCodigo,
    titular: filtrosBase.titular,
    incluirPii: entrada.incluirPii,
  };
  const resultado = await repositorio.listarParaExportar(filtros, LIMITE_EXPORTACION);
  const { titular: filtroTitular, ...filtrosSinTitular } = filtros;
  await repositorio.registrarExportacion({
    actorEmail,
    correlationId,
    cantidad: resultado.filas.length,
    truncada: resultado.truncada,
    incluirPii: filtros.incluirPii,
    filtros: {
      ...filtrosSinTitular,
      filtroTitularAplicado: Boolean(filtroTitular),
    },
  });
  return {
    csv: serializarExportacionReservas(resultado.filas, filtros.incluirPii),
    cantidad: resultado.filas.length,
    truncada: resultado.truncada,
    incluyePii: filtros.incluirPii,
  };
}
