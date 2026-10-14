import { resumirPreciosPublicos } from '../../../_application/reservas/resumirPreciosPublicos.ts';
import { esFechaIso } from '../../../_domain/reservas/dateRange.ts';
import { D1RepositorioInventarioAlojamiento } from '../../../_infrastructure/d1/D1RepositorioInventarioAlojamiento.ts';
import { D1RepositorioTarifas } from '../../../_infrastructure/d1/D1RepositorioTarifas.ts';
import { D1RepositorioTarifasAlimentacion } from '../../../_infrastructure/d1/D1RepositorioTarifasAlimentacion.ts';
import { jsonPublico, optionsPublico } from '../../../_interfaces/http/publicApiV1.ts';
import { consumirLimite, respuestaLimite } from '../../../_interfaces/http/rateLimit.ts';

function fechaLocalArgentina(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Cordoba',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

export const onRequestOptions = ({ request }: any) => optionsPublico(request, 'GET');

export async function onRequestGet({ request, env }: any) {
  const limitada = respuestaLimite(await consumirLimite(request, env, 'publico.v1.precios', 60, 60));
  if (limitada) return limitada;
  const fecha = new URL(request.url).searchParams.get('fecha') || fechaLocalArgentina();
  if (!esFechaIso(fecha)) {
    return jsonPublico(request, 'GET', {
      error: { codigo: 'FECHA_INVALIDA', mensaje: 'La fecha de referencia es inválida.' },
    }, 400);
  }

  const resumen = await resumirPreciosPublicos(
    fecha,
    new D1RepositorioInventarioAlojamiento(env.DB),
    new D1RepositorioTarifas(env.DB),
    new D1RepositorioTarifasAlimentacion(env.DB),
  );
  return jsonPublico(request, 'GET', { data: resumen, meta: { version: 'v1' } });
}
