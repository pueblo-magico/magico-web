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

test('el workflow de email es importable, permanece inactivo y no contiene secretos', () => {
  const document = workflow(emailPath);
  const raw = readFileSync(emailPath, 'utf8');
  assert.equal(document.active, false);
  assert.equal(document.settings.saveDataSuccessExecution, 'none');
  assert.equal(document.settings.saveDataErrorExecution, 'none');
  assert.equal(document.settings.saveManualExecutions, false);
  assert.match(raw, /\$env\.INTEGRATION_EVENTS_WEBHOOK_SECRET/);
  assert.match(raw, /\$env\.N8N_INBOUND_SECRET/);
  assert.match(raw, /\$vars\.RESERVAS_API_BASE_URL/);
  assert.match(raw, /\$vars\.RESERVAS_EMAIL_FROM/);
  assert.doesNotMatch(raw, /Bearer\s+[A-Za-z0-9_-]{24,}/);
  assert.doesNotMatch(raw, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
});

test('el workflow autentica, filtra el evento y usa el contrato de notificaciones', () => {
  const document = workflow(emailPath);
  const webhook = nodeByName(document, 'Webhook eventos Reservas');
  assert.equal(webhook.parameters.path, 'reservas-eventos');
  assert.equal(webhook.parameters.responseMode, 'responseNode');
  assert.equal(nodeByName(document, 'Responder 401').parameters.options.responseCode, 401);
  assert.equal(nodeByName(document, 'Responder evento ignorado').parameters.options.responseCode, 202);

  const claim = JSON.stringify(nodeByName(document, 'Reclamar notificación').parameters);
  assert.match(claim, /arrepentimientos\/notificaciones/);
  assert.match(claim, /notificacion_uid/);
  assert.match(claim, /X-Integration-Id/);
  assert.match(claim, /X-Service-Secret/);

  const email = nodeByName(document, 'Enviar email');
  assert.equal(email.type, 'n8n-nodes-base.emailSend');
  assert.equal(email.parameters.emailFormat, 'text');
  assert.equal(email.onError, 'continueErrorOutput');
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
  assert.equal(jobs.nodes.some((node: any) => node.type === 'n8n-nodes-base.emailSend'), false);
});
