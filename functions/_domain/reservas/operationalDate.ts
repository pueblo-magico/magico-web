import { agregarDiasIso } from './dateRange.ts';

export const ZONA_OPERATIVA_RESERVAS = 'America/Argentina/Cordoba';

const FORMATO_FECHA = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_OPERATIVA_RESERVAS,
  year: 'numeric', month: '2-digit', day: '2-digit',
});

export function fechaOperativaCordoba(instante = new Date()): string {
  const partes = FORMATO_FECHA.formatToParts(instante);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find(parte => parte.type === tipo)?.value || '';
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}

export function ventanaOperativaCordoba(instante = new Date(), dias = 7): {
  desde: string;
  hastaExclusivo: string;
} {
  const desde = fechaOperativaCordoba(instante);
  return { desde, hastaExclusivo: agregarDiasIso(desde, dias) };
}
