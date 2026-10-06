import assert from 'node:assert/strict';
import test from 'node:test';

import { ErrorReserva } from '../../functions/_domain/reservas/errors.ts';
import {
  jsonReserva,
  respuestaErrorReserva,
} from '../../functions/_interfaces/http/reservasHttp.ts';

test('serializa respuestas JSON de reservas de forma consistente', async () => {
  const response = jsonReserva({ ok: true }, 201);

  assert.equal(response.status, 201);
  assert.equal(response.headers.get('Content-Type'), 'application/json');
  assert.deepEqual(await response.json(), { ok: true });
});

test('traduce errores tipados a códigos y estados HTTP estables', async () => {
  const response = respuestaErrorReserva(
    new ErrorReserva('CONFLICTO_RESERVA', 'La reserva entra en conflicto con otra estadía.'),
    { codigo: 'ERROR_INTERNO', mensaje: 'Error interno.' }
  );

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: 'La reserva entra en conflicto con otra estadía.',
    codigo: 'CONFLICTO_RESERVA',
  });
});

test('no expone mensajes internos de errores desconocidos', async () => {
  const response = respuestaErrorReserva(
    new Error('SQLITE_CONSTRAINT: detalle interno sensible'),
    { codigo: 'DATOS_INVALIDOS', mensaje: 'Los datos enviados no son válidos.', status: 400 }
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'Los datos enviados no son válidos.',
    codigo: 'DATOS_INVALIDOS',
  });
});

test('usa el estado por defecto del código fallback', async () => {
  const response = respuestaErrorReserva(null, {
    codigo: 'ERROR_INTERNO',
    mensaje: 'No se pudo completar la operación.',
  });

  assert.equal(response.status, 500);
});
