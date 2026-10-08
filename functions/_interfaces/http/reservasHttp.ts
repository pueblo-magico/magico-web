import { ErrorReserva, type CodigoErrorReserva } from '../../_domain/reservas/errors.ts';

const STATUS_POR_CODIGO: Record<CodigoErrorReserva, number> = {
  RESERVA_NO_ENCONTRADA: 404,
  DATOS_INVALIDOS: 400,
  CONFLICTO_RESERVA: 409,
  ERROR_INTERNO: 500,
};

export function jsonReserva(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function respuestaErrorReserva(
  error: unknown,
  fallback: { codigo: CodigoErrorReserva; mensaje: string; status?: number }
): Response {
  if (error instanceof ErrorReserva) {
    return jsonReserva(
      { error: error.message, codigo: error.codigo },
      STATUS_POR_CODIGO[error.codigo]
    );
  }

  return jsonReserva(
    { error: fallback.mensaje, codigo: fallback.codigo },
    fallback.status ?? STATUS_POR_CODIGO[fallback.codigo]
  );
}
