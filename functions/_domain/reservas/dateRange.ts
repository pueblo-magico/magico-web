const MS_POR_DIA = 86_400_000;

export function nochesEntre(entrada: string, salida: string): number | null {
  const entradaMs = Date.parse(entrada);
  const salidaMs = Date.parse(salida);

  if (Number.isNaN(entradaMs) || Number.isNaN(salidaMs)) return null;

  const noches = Math.round((salidaMs - entradaMs) / MS_POR_DIA);
  return noches > 0 ? noches : null;
}
