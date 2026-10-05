import assert from 'node:assert/strict';
import test from 'node:test';

import {
  autenticarSolicitudManyChat,
  obtenerOrigenSolicitudManyChat,
} from '../../functions/_interfaces/http/manychatAuth.ts';

test('ManyChat entrante exige un secreto configurado y exactamente coincidente', () => {
  assert.equal(autenticarSolicitudManyChat('preview-secret', 'preview-secret'), true);
  assert.equal(autenticarSolicitudManyChat('otro-secret', 'preview-secret'), false);
  assert.equal(autenticarSolicitudManyChat(null, 'preview-secret'), false);
  assert.equal(autenticarSolicitudManyChat('', ''), false);
  assert.equal(autenticarSolicitudManyChat('preview-secret', undefined), false);
});

test('el callback de pago conserva el origen del ambiente que inició la reserva', () => {
  assert.equal(
    obtenerOrigenSolicitudManyChat('https://pr-2.pueblo-magico-web.pages.dev/api/manychat'),
    'https://pr-2.pueblo-magico-web.pages.dev'
  );
  assert.equal(
    obtenerOrigenSolicitudManyChat('https://experienciamagico.com/api/manychat'),
    'https://experienciamagico.com'
  );
});
