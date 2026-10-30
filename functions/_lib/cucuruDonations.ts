export type CollectionCucuru = {
  collectionId: string;
  collectorId: string;
  customerId: string | null;
  accountNumber: string | null;
  amountCents: number;
  currency: string;
  occurredAt: string;
  payloadHash: string;
};

export type ResultadoAporteCucuru = {
  estado: 'aplicado' | 'duplicado' | 'revision_manual';
  motivo: string | null;
  aporteId: number | null;
};

type Statement = {
  bind(...values: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
};

export type D1Like = {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<Array<{ results?: Record<string, unknown>[] }>>;
};

export class ErrorCucuruContrato extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErrorCucuruContrato';
  }
}

const DEFAULT_SECRET_HEADER = 'X-Cucuru-Webhook-Secret';
const SAFE_HEADER_NAME = /^[A-Za-z0-9-]{1,64}$/;

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ErrorCucuruContrato(`Cucuru devolvió ${field} inválido.`);
  }
  return value.trim();
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function accountNumber(value: unknown): string {
  const normalized = requiredText(value, 'collection_account');
  if (!/^\d{22}$/.test(normalized)) {
    throw new ErrorCucuruContrato('Cucuru devolvió collection_account inválido.');
  }
  return normalized;
}

function amountCents(value: unknown): number {
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new ErrorCucuruContrato('Cucuru devolvió amount inválido.');
  }
  const text = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new ErrorCucuruContrato('Cucuru devolvió amount inválido.');
  }
  const [whole, decimals = ''] = text.split('.');
  const result = Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
  if (!Number.isSafeInteger(result)) {
    throw new ErrorCucuruContrato('Cucuru devolvió amount fuera de rango.');
  }
  return result;
}

function utcDate(value: unknown): string {
  const text = requiredText(value, 'date_time');
  const candidate = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(text)
    ? `${text.replace(' ', 'T')}:00.000Z`
    : /Z$/i.test(text) ? text : `${text}Z`;
  const date = new Date(candidate);
  if (Number.isNaN(date.getTime())) {
    throw new ErrorCucuruContrato('Cucuru devolvió date_time inválido.');
  }
  return date.toISOString();
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function autenticarWebhookCucuru(request: Request, env: Record<string, unknown>): boolean {
  const secret = env.CUCURU_WEBHOOK_SECRET;
  const configuredHeader = typeof env.CUCURU_WEBHOOK_HEADER_NAME === 'string'
    ? env.CUCURU_WEBHOOK_HEADER_NAME.trim()
    : DEFAULT_SECRET_HEADER;
  if (typeof secret !== 'string' || secret.length < 24 || !SAFE_HEADER_NAME.test(configuredHeader)) {
    return false;
  }
  const received = request.headers.get(configuredHeader);
  return typeof received === 'string' && constantTimeEqual(received, secret);
}

export function esPruebaImporteCero(payload: Record<string, unknown>): boolean {
  const amount = payload.amount;
  if (typeof amount === 'number') return Number.isFinite(amount) && amount === 0;
  return typeof amount === 'string' && /^0+(?:\.0+)?$/.test(amount.trim());
}

export async function normalizarCollectionCucuru(
  payload: Record<string, unknown>,
  expectedCollectorId?: string,
): Promise<CollectionCucuru> {
  const collectionId = requiredText(payload.collection_id, 'collection_id');
  const collectorId = requiredText(payload.collector_id ?? expectedCollectorId, 'collector_id');
  const customerId = optionalText(payload.customer_id);
  const account = optionalText(payload.collection_account);
  const normalizedAccount = account == null ? null : accountNumber(account);
  const currency = requiredText(payload.currency_id, 'currency_id').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new ErrorCucuruContrato('Cucuru devolvió currency_id inválido.');
  }
  const occurredAt = utcDate(payload.date_time);
  const cents = amountCents(payload.amount);
  const canonical = JSON.stringify({
    collectionId,
    collectionTraceId: optionalText(payload.collection_trace_id),
    collectorId,
    customerId,
    accountNumber: normalizedAccount,
    currency,
    amountCents: cents,
    occurredAt,
  });
  return {
    collectionId,
    collectorId,
    customerId,
    accountNumber: normalizedAccount,
    amountCents: cents,
    currency,
    occurredAt,
    payloadHash: await sha256Hex(canonical),
  };
}

function configuredDonationAccount(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{22}$/.test(value.trim())) {
    throw new Error('CUCURU_DONATIONS_ACCOUNT no está configurado con un CVU válido.');
  }
  return value.trim();
}

export async function procesarAporteCucuru(
  db: D1Like,
  collection: CollectionCucuru,
  env: Record<string, unknown>,
  requestId: string,
): Promise<ResultadoAporteCucuru> {
  const expectedCollectorId = typeof env.CUCURU_COLLECTOR_ID === 'string'
    ? env.CUCURU_COLLECTOR_ID.trim()
    : '';
  if (!expectedCollectorId || collection.collectorId !== expectedCollectorId) {
    throw new ErrorCucuruContrato('La Collection no pertenece al collector configurado.');
  }

  const expectedAccount = configuredDonationAccount(env.CUCURU_DONATIONS_ACCOUNT);
  const expectedCurrency = typeof env.CUCURU_DONATIONS_CURRENCY === 'string' && env.CUCURU_DONATIONS_CURRENCY.trim()
    ? env.CUCURU_DONATIONS_CURRENCY.trim().toUpperCase()
    : 'ARS';
  if (!/^[A-Z]{3}$/.test(expectedCurrency)) {
    throw new Error('CUCURU_DONATIONS_CURRENCY no es una moneda válida.');
  }
  const reason = collection.accountNumber !== expectedAccount
    ? 'CUENTA_NO_ES_REFORESTACION'
    : collection.currency !== expectedCurrency
      ? 'MONEDA_NO_ESPERADA'
      : null;
  const initialState = reason == null ? 'recibido' : 'revision_manual';

  const insert = await db.prepare(`
    INSERT INTO cucuru_webhook_eventos (
      collection_id, collector_id, customer_id, collection_account,
      amount_cents, currency, occurred_at, payload_hash, resultado,
      motivo_codigo, request_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (collection_id) DO NOTHING
    RETURNING id
  `).bind(
    collection.collectionId,
    collection.collectorId,
    collection.customerId,
    collection.accountNumber,
    collection.amountCents,
    collection.currency,
    collection.occurredAt,
    collection.payloadHash,
    initialState,
    reason,
    requestId,
  ).first<{ id: number }>();

  if (!insert) {
    const existing = await db.prepare(`
      SELECT id, payload_hash, resultado, motivo_codigo
      FROM cucuru_webhook_eventos WHERE collection_id = ?
    `).bind(collection.collectionId).first<{
      id: number;
      payload_hash: string;
      resultado: string;
      motivo_codigo: string | null;
    }>();
    if (!existing) throw new Error('No se pudo recuperar el evento Cucuru existente.');
    if (existing.payload_hash !== collection.payloadHash) {
      await db.prepare(`
        INSERT OR IGNORE INTO cucuru_revisiones_aporte (
          webhook_evento_id, motivo_codigo, evidencia_hash
        ) VALUES (?, 'DUPLICADO_INCONSISTENTE', ?)
      `).bind(existing.id, collection.payloadHash).run();
      return { estado: 'revision_manual', motivo: 'DUPLICADO_INCONSISTENTE', aporteId: null };
    }
    const contribution = await db.prepare(`
      SELECT id FROM reforestacion_aportes WHERE cucuru_collection_id = ?
    `).bind(collection.collectionId).first<{ id: number }>();
    return {
      estado: 'duplicado',
      motivo: existing.motivo_codigo,
      aporteId: contribution?.id ?? null,
    };
  }

  if (reason != null) {
    await db.prepare(`
      INSERT OR IGNORE INTO cucuru_revisiones_aporte (
        webhook_evento_id, motivo_codigo, evidencia_hash
      ) VALUES (?, ?, ?)
    `).bind(insert.id, reason, collection.payloadHash).run();
    return { estado: 'revision_manual', motivo: reason, aporteId: null };
  }

  const results = await db.batch([
    db.prepare(`
      INSERT INTO reforestacion_aportes (
        cucuru_collection_id, amount_cents, currency, occurred_at,
        customer_reference, estado
      ) VALUES (?, ?, ?, ?, ?, 'confirmado')
      ON CONFLICT (cucuru_collection_id) DO NOTHING
      RETURNING id
    `).bind(
      collection.collectionId,
      collection.amountCents,
      collection.currency,
      collection.occurredAt,
      collection.customerId,
    ),
    db.prepare(`
      UPDATE cucuru_webhook_eventos
      SET resultado = 'aplicado', processed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE collection_id = ? AND payload_hash = ? AND resultado = 'recibido'
    `).bind(collection.collectionId, collection.payloadHash),
  ]);
  const aporteId = results[0]?.results?.[0]?.id;
  return {
    estado: 'aplicado',
    motivo: null,
    aporteId: typeof aporteId === 'number' ? aporteId : null,
  };
}
