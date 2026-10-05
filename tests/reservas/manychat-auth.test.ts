import assert from 'node:assert/strict';
import test from 'node:test';

import { obtenerOrigenSolicitudManyChat } from '../../functions/_interfaces/http/manychatAuth.ts';

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
