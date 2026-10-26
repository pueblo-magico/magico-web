import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ClienteIntercambioTokenDelegadoReservas,
  ErrorIntercambioTokenDelegado,
} from '../functions/_lib/magicoAuth/delegatedReservationTokenExchange.ts';

const CONFIGURACION = {
  issuer: 'https://auth.example.test',
  tokenEndpoint: 'https://auth.example.test/oauth/v2/token',
  audience: 'magico-reservas-project-dev',
  clientId: 'magico-web-reservas-delegation-dev',
  timeoutMs: 150,
};
const TOKEN_SUJETO = 'human-subject-token-sensitive';
const ASERCION = 'confidential-client-assertion-sensitive';
const TOKEN_DELEGADO = 'delegated-reservation-token-sensitive';

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function respuestaValida() {
  return {
    access_token: TOKEN_DELEGADO,
    issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
    token_type: 'Bearer',
    expires_in: 300,
  };
}

function crearCliente(fetcher, cambios = {}) {
  const tokenSujeto = cambios.tokenSujeto || { async obtenerTokenSujeto() { return TOKEN_SUJETO; } };
  const asercion = cambios.asercion || {
    async obtenerAsercionCliente() { return ASERCION; },
  };
  return new ClienteIntercambioTokenDelegadoReservas(
    cambios.configuracion || CONFIGURACION,
    tokenSujeto,
    asercion,
    { fetcher }
  );
}

async function capturarError(promesa, codigo) {
  try {
    await promesa;
    assert.fail(`se esperaba ${codigo}`);
  } catch (error) {
    assert.ok(error instanceof ErrorIntercambioTokenDelegado);
    assert.equal(error.codigo, codigo);
    return error;
  }
}

function fuentesDeRutas(directorio) {
  return readdirSync(directorio, { withFileTypes: true }).flatMap(entrada => {
    const ruta = new URL(`${entrada.name}${entrada.isDirectory() ? '/' : ''}`, directorio);
    return entrada.isDirectory()
      ? fuentesDeRutas(ruta)
      : entrada.name.endsWith('.ts') ? [readFileSync(ruta, 'utf8')] : [];
  });
}

test('intercambia por RFC 8693 con credenciales inyectadas y redirect manual', async () => {
  let solicitud;
  let contextoAsercion;
  const cliente = crearCliente(
    async (url, opciones) => {
      solicitud = { url, opciones };
      return json(respuestaValida());
    },
    {
      asercion: {
        async obtenerAsercionCliente(contexto) {
          contextoAsercion = contexto;
          return ASERCION;
        },
      },
    }
  );

  assert.deepEqual(await cliente.intercambiar(), {
    accessToken: TOKEN_DELEGADO,
    tokenType: 'Bearer',
    expiresIn: 300,
  });
  assert.equal(solicitud.url, CONFIGURACION.tokenEndpoint);
  assert.equal(solicitud.opciones.method, 'POST');
  assert.equal(solicitud.opciones.redirect, 'manual');
  assert.equal(solicitud.opciones.headers['Content-Type'], 'application/x-www-form-urlencoded');
  const cuerpo = new URLSearchParams(solicitud.opciones.body);
  assert.equal(cuerpo.get('grant_type'), 'urn:ietf:params:oauth:grant-type:token-exchange');
  assert.equal(cuerpo.get('subject_token'), TOKEN_SUJETO);
  assert.equal(cuerpo.get('client_assertion'), ASERCION);
  assert.equal(cuerpo.get('subject_token_type'), 'urn:ietf:params:oauth:token-type:access_token');
  assert.equal(cuerpo.get('requested_token_type'), 'urn:ietf:params:oauth:token-type:access_token');
  assert.equal(cuerpo.get('client_assertion_type'), 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
  assert.equal(cuerpo.get('audience'), CONFIGURACION.audience);
  assert.equal(cuerpo.get('client_id'), CONFIGURACION.clientId);
  assert.deepEqual(contextoAsercion, {
    issuer: CONFIGURACION.issuer,
    tokenEndpoint: CONFIGURACION.tokenEndpoint,
    audience: CONFIGURACION.audience,
    clientId: CONFIGURACION.clientId,
  });
});

test('rechaza respuestas inválidas, no JSON y errores OAuth sin copiar su cuerpo', async () => {
  const casos = [
    {
      nombre: 'json inválido',
      respuesta: new Response('secret-body-not-json', {
        status: 200, headers: { 'content-type': 'application/json' },
      }),
      codigo: 'RESPUESTA_TOKEN_INVALIDA',
    },
    {
      nombre: 'content type no JSON',
      respuesta: new Response('secret-body-html', {
        status: 200, headers: { 'content-type': 'text/html' },
      }),
      codigo: 'RESPUESTA_TOKEN_INVALIDA',
    },
    {
      nombre: 'error OAuth',
      respuesta: json({
        error: 'invalid_grant',
        error_description: 'contains-sensitive-provider-detail',
      }, 400),
      codigo: 'PROVEEDOR_RECHAZO_INTERCAMBIO',
    },
  ];

  for (const caso of casos) {
    const error = await capturarError(
      crearCliente(async () => caso.respuesta).intercambiar(),
      caso.codigo
    );
    const serializado = `${error.name} ${error.message} ${JSON.stringify(error)}`;
    assert.equal(serializado.includes('secret-body'), false, caso.nombre);
    assert.equal(serializado.includes('sensitive-provider-detail'), false, caso.nombre);
  }
});
test('exige access token bearer, tipo emitido y vida corta explícitos', async () => {
  const casos = [
    { token_type: undefined },
    { token_type: 'DPoP' },
    { issued_token_type: undefined },
    { issued_token_type: 'urn:ietf:params:oauth:token-type:refresh_token' },
    { access_token: '' },
    { expires_in: 301 },
  ];
  for (const cambios of casos) {
    await capturarError(
      crearCliente(async () => json({ ...respuestaValida(), ...cambios })).intercambiar(),
      'RESPUESTA_TOKEN_INVALIDA'
    );
  }
});
test('normaliza timeout y fallas de proveedores sin filtrar credenciales', async () => {
  const timeout = crearCliente((_url, opciones) => new Promise((_resolve, reject) => {
    opciones.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
  }), { configuracion: { ...CONFIGURACION, timeoutMs: 100 } });
  const errorTimeout = await capturarError(timeout.intercambiar(), 'PROVEEDOR_NO_DISPONIBLE');
  assert.equal(errorTimeout.reintentable, true);

  const fallas = [
    {
      cambios: {
        tokenSujeto: { async obtenerTokenSujeto() { throw new Error(`leak ${TOKEN_SUJETO}`); } },
      },
      codigo: 'TOKEN_SUJETO_NO_DISPONIBLE',
    },
    {
      cambios: {
        asercion: { async obtenerAsercionCliente() { throw new Error(`leak ${ASERCION}`); } },
      },
      codigo: 'ASERCION_CLIENTE_NO_DISPONIBLE',
    },
  ];
  for (const falla of fallas) {
    const error = await capturarError(
      crearCliente(async () => json(respuestaValida()), falla.cambios).intercambiar(),
      falla.codigo
    );
    const serializado = `${error.name} ${error.message} ${JSON.stringify(error)}`;
    assert.equal(serializado.includes(TOKEN_SUJETO), false);
    assert.equal(serializado.includes(ASERCION), false);
  }
});

test('no sigue redirects del token endpoint', async () => {
  let redirect;
  const error = await capturarError(
    crearCliente(async (_url, opciones) => {
      redirect = opciones.redirect;
      return new Response(null, {
        status: 302,
        headers: { location: 'https://attacker.example/token?secret=provider-detail' },
      });
    }).intercambiar(),
    'PROVEEDOR_NO_DISPONIBLE'
  );
  assert.equal(redirect, 'manual');
  assert.equal(error.reintentable, true);
  assert.equal(`${error.message} ${JSON.stringify(error)}`.includes('provider-detail'), false);
});

test('rechaza configuración implícita, insegura o dirigida a otro origen', () => {
  const casos = [
    { issuer: 'http://auth.example.test' },
    { issuer: 'https://user:pass@auth.example.test' },
    { issuer: 'https://auth.example.test/tenant' },
    { tokenEndpoint: 'https://other.example.test/oauth/v2/token' },
    { tokenEndpoint: 'https://auth.example.test' },
    { audience: '' },
    { clientId: '' },
    { timeoutMs: 10_000 },
  ];
  for (const cambios of casos) {
    assert.throws(
      () => crearCliente(async () => json(respuestaValida()), {
        configuracion: { ...CONFIGURACION, ...cambios },
      }),
      error => error instanceof ErrorIntercambioTokenDelegado
        && error.codigo === 'CONFIGURACION_INVALIDA'
    );
  }
});

test('el cliente permanece fuera de todas las rutas actuales', () => {
  const fuentes = [
    ...fuentesDeRutas(new URL('../functions/api/', import.meta.url)),
    readFileSync(new URL('../functions/auth.ts', import.meta.url), 'utf8'),
    readFileSync(new URL('../functions/callback.ts', import.meta.url), 'utf8'),
  ];
  for (const fuente of fuentes) {
    assert.equal(fuente.includes('delegatedReservationTokenExchange'), false);
    assert.equal(fuente.includes('ClienteIntercambioTokenDelegadoReservas'), false);
  }
});

// Este archivo también actúa como guard de arquitectura contra wiring accidental.
