const MS_POR_DIA = 86_400_000;

export function nochesEntre(entrada: string, salida: string): number | null {
  const entradaMs = Date.parse(entrada);
  const salidaMs = Date.parse(salida);

  if (Number.isNaN(entradaMs) || Number.isNaN(salidaMs)) return null;

  const noches = Math.round((salidaMs - entradaMs) / MS_POR_DIA);
  return noches > 0 ? noches : null;
}

export function esFechaIso(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const fechaMs = Date.parse(`${fecha}T00:00:00Z`);
  return !Number.isNaN(fechaMs) && new Date(fechaMs).toISOString().slice(0, 10) === fecha;
}

export function agregarDiasIso(fecha: string, dias: number): string {
  return new Date(Date.parse(`${fecha}T00:00:00Z`) + dias * MS_POR_DIA).toISOString().slice(0, 10);
}
