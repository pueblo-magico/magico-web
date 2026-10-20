export function obtenerOrigenSolicitudManyChat(requestUrl: string): string {
  return new URL(requestUrl).origin;
}
