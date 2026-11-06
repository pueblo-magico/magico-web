import { isRetiredReservationPath, retiredReservationResponse } from '../_lib/reservasCutover.mjs';

export async function onRequest(context: any): Promise<Response> {
  const pathname = new URL(context.request.url).pathname;
  if (!isRetiredReservationPath(pathname)) return context.next();

  return retiredReservationResponse();
}
