const MS_POR_DIA = 86_400_000;

export function nochesEntre(entrada: string, salida: string): number | null {
  if (!esFechaIso(entrada) || !esFechaIso(salida)) return null;
  const entradaMs = Date.parse(`${entrada}T00:00:00Z`);
  const salidaMs = Date.parse(`${salida}T00:00:00Z`);

  const noches = (salidaMs - entradaMs) / MS_POR_DIA;
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
