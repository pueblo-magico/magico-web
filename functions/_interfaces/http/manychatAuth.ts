export function autenticarSolicitudManyChat(
  secretoRecibido: string | null,
  secretoConfigurado: unknown
): boolean {
  if (typeof secretoConfigurado !== 'string' || secretoConfigurado.length === 0) return false;
  if (typeof secretoRecibido !== 'string' || secretoRecibido.length !== secretoConfigurado.length) {
    return false;
  }

  let diferencia = 0;
  for (let i = 0; i < secretoConfigurado.length; i++) {
    diferencia |= secretoRecibido.charCodeAt(i) ^ secretoConfigurado.charCodeAt(i);
  }
  return diferencia === 0;
}

export function obtenerOrigenSolicitudManyChat(requestUrl: string): string {
  return new URL(requestUrl).origin;
}
