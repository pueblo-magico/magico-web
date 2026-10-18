import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const emailPath = new URL('../../docs/integrations/n8n-arrepentimientos-email.workflow.json', import.meta.url);
const jobsPath = new URL('../../docs/integrations/n8n-jobs-operativos.workflow.json', import.meta.url);

function workflow(path: URL): any {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function nodeByName(document: any, name: string): any {
  const node = document.nodes.find((item: any) => item.name === name);
  assert.ok(node, `Falta el nodo ${name}`);
  return node;
}

function renderEmailTemplate(message: string, data: Record<string, unknown>): string {
  const expression = message.replace(/^=\{\{\s*/, '').replace(/\s*\}\}$/, '');
  return new Function('$json', `return (${expression});`)({ data });
}

test('el workflow de email transaccional es importable, permanece inactivo y no contiene secretos', () => {
  const document = workflow(emailPath);
  const raw = readFileSync(emailPath, 'utf8');
  assert.equal(document.active, false);
  assert.equal(document.settings.saveDataSuccessExecution, 'none');
  assert.equal(document.settings.saveDataErrorExecution, 'none');
  assert.equal(document.settings.saveManualExecutions, false);
  assert.match(raw, /\$env\.INTEGRATION_EVENTS_WEBHOOK_SECRET/);
  assert.match(raw, /\$env\.N8N_INBOUND_SECRET/);
  assert.match(raw, /\$vars\.RESERVAS_API_BASE_URL/);
  assert.match(raw, /Gmail account/);
  assert.doesNotMatch(raw, /Bearer\s+[A-Za-z0-9_-]{24,}/);
  assert.doesNotMatch(raw, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
});

test('el workflow autentica y admite arrepentimientos y comunicaciones de reserva', () => {
  const document = workflow(emailPath);
  const webhook = nodeByName(document, 'Webhook eventos Reservas');
  assert.equal(webhook.parameters.path, 'reservas-eventos');
  assert.equal(webhook.parameters.responseMode, 'responseNode');
  assert.equal(nodeByName(document, 'Responder 401').parameters.options.responseCode, 401);
  assert.equal(nodeByName(document, 'Responder evento ignorado').parameters.options.responseCode, 202);

  const claim = JSON.stringify(nodeByName(document, 'Reclamar notificación').parameters);
  assert.match(claim, /arrepentimientos\/notificaciones/);
  assert.match(claim, /comunicaciones\/notificaciones/);
  assert.match(claim, /notificacion_uid/);
  assert.match(claim, /intencion_uid/);
  assert.match(claim, /X-Integration-Id/);
  assert.match(claim, /X-Service-Secret/);

  const filter = JSON.stringify(nodeByName(document, 'Es email transaccional').parameters);
  assert.match(filter, /arrepentimiento\.notificacion_pendiente/);
  assert.match(filter, /comunicacion\.intencion_creada/);
  assert.ok(nodeByName(document, 'Tiene destinatario email'));
  assert.equal(nodeByName(document, 'Responder sin email').parameters.options.responseCode, 200);

  const email = nodeByName(document, 'Enviar email');
  assert.equal(email.type, 'n8n-nodes-base.gmail');
  assert.equal(email.credentials.gmailOAuth2.name, 'Gmail account');
  assert.equal(email.parameters.emailType, 'html');
  assert.match(email.parameters.message, /mensaje_humano/);
  assert.match(email.parameters.message, /RECHAZADA/);
  assert.match(email.parameters.message, /Mensaje del equipo de Pueblo Mágico/);
  assert.match(email.parameters.message, /Ver mi reserva confirmada/);
  assert.match(email.parameters.message, /View my confirmed booking/);
  assert.equal(email.onError, 'continueErrorOutput');
});

test('el email de reserva adapta la acción y la ayuda al estado real', () => {
  const document = workflow(emailPath);
  const message = nodeByName(document, 'Enviar email').parameters.message;

  const confirmed = renderEmailTemplate(message, {
    idioma: 'es',
    cuerpo:
      'Recibimos la seña y confirmamos tu reserva RES-123.\nFechas: 2026-10-23 al 2026-10-24.\nPersonas: 2.\nSeña recibida: $ 30.000.\nVer tu reserva: https://preview.test/reserva-confirmada?reserva=RES-123',
  });
  assert.match(confirmed, /Ver mi reserva confirmada/);
  assert.match(confirmed, /Tu reserva está confirmada/);
  assert.doesNotMatch(confirmed, /completar la seña/i);
  assert.doesNotMatch(confirmed, />Ver tu reserva:<\/span>/);
  assert.match(confirmed, />2<\/strong>/);
  assert.match(confirmed, />\$ 30\.000<\/strong>/);

  const pending = renderEmailTemplate(message, {
    idioma: 'es',
    cuerpo:
      'Recibimos tu solicitud de reserva RES-124.\nVer tu reserva: https://preview.test/reserva-pendiente?reserva=RES-124',
  });
  assert.match(pending, /Ver mi reserva y completar la seña/);
  assert.match(pending, /Si ya realizaste el pago, no necesitás hacer nada/);

  const closed = renderEmailTemplate(message, {
    idioma: 'en',
    cuerpo:
      'Your booking RES-125 is no longer pending.\nView your booking: https://preview.test/reserva-fallida?reserva=RES-125',
  });
  assert.match(closed, /Your stay in the mountains/);
  assert.match(closed, /View booking status/);
  assert.match(closed, /This booking is no longer pending/);
});

test('un fallo reintenta con 503 y sólo termina en dead letter al agotar intentos', () => {
  const document = workflow(emailPath);
  assert.equal(nodeByName(document, 'Responder retry').parameters.options.responseCode, 503);
  assert.equal(nodeByName(document, 'Responder dead letter').parameters.options.responseCode, 200);
  assert.match(nodeByName(document, 'Registrar retry').parameters.body, /resultado: 'retry'/);
  assert.match(nodeByName(document, 'Registrar dead letter').parameters.body, /resultado: 'dead_letter'/);
  assert.match(JSON.stringify(nodeByName(document, 'Agotó intentos').parameters), /max_intentos/);

  const outputs = document.connections['Enviar email'].main;
  assert.equal(outputs[0][0].node, 'Registrar entregada');
  assert.equal(outputs[1][0].node, 'Agotó intentos');
});

test('los jobs operativos siguen separados del workflow de correo', () => {
  const jobs = workflow(jobsPath);
  assert.ok(nodeByName(jobs, 'Vencer retenciones'));
  assert.ok(nodeByName(jobs, 'Despachar outbox'));
  assert.equal(jobs.active, false);
  assert.equal(jobs.nodes.some((node: any) => node.type === 'n8n-nodes-base.gmail'), false);
});
