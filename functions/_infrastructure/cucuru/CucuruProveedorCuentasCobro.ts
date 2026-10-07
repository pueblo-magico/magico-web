import type {
  ProveedorCollectionsCucuru,
  ProveedorCuentasCobro,
} from '../../_application/reservas/ports.ts';
import {
  ErrorProvisionamientoDesconocido,
  type CollectionCucuruNormalizada,
  type DestinoCobroProveedor,
} from '../../_domain/reservas/collectionAccounts.ts';

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

type ConfiguracionCucuru = {
  apiKey?: string;
  collectorId?: string;
  baseUrl?: string;
};

type CuentaApi = {
  account_number?: unknown;
  customer_id?: unknown;
  alias?: unknown;
};

function diagnosticoFetch(cause: unknown): { codigo: string; nombre: string; mensaje: string } {
  const nombre = cause instanceof Error ? cause.name : typeof cause;
  const mensajeOriginal = cause instanceof Error ? cause.message : String(cause);
  const mensaje = mensajeOriginal.replace(/[\r\n\t]+/g, ' ').slice(0, 300);
  if (cause instanceof DOMException && cause.name === 'AbortError') {
    return { codigo: 'CUCURU_TIMEOUT', nombre, mensaje };
  }
  if (cause instanceof TypeError && /invalid url|failed to parse url/i.test(mensaje)) {
    return { codigo: 'CUCURU_URL_INVALIDA', nombre, mensaje };
  }
  return { codigo: 'CUCURU_NETWORK_ERROR', nombre, mensaje };
}

export class ErrorCucuruConfiguracion extends Error {
  constructor() {
    super('La integración Cucuru no está configurada.');
    this.name = 'ErrorCucuruConfiguracion';
  }
}

export class ErrorCucuruTransitorio extends Error {
  readonly codigo: string;
  constructor(message: string, codigo = 'CUCURU_TRANSITORIO', options?: ErrorOptions) {
    super(message, options);
    this.name = 'ErrorCucuruTransitorio';
    this.codigo = codigo;
  }
}

export class ErrorCucuruContrato extends Error {
  readonly codigo: string;
  constructor(message: string, codigo = 'CUCURU_CONTRATO_INVALIDO') {
    super(message);
    this.name = 'ErrorCucuruContrato';
    this.codigo = codigo;
  }
}

function errorHttp(status: number): ErrorCucuruTransitorio | ErrorCucuruContrato {
  const codigo = `CUCURU_HTTP_${status}`;
  return status === 408 || status === 429 || status >= 500
    ? new ErrorCucuruTransitorio(`Cucuru respondió ${status}.`, codigo)
    : new ErrorCucuruContrato(`Cucuru respondió ${status}.`, codigo);
}

function textoObligatorio(valor: unknown, campo: string): string {
  if (typeof valor !== 'string' || !valor.trim()) {
    throw new ErrorCucuruContrato(`Cucuru devolvió ${campo} inválido.`);
  }
  return valor.trim();
}

function cvu(valor: unknown): string {
  const normalizado = textoObligatorio(valor, 'account_number');
  if (!/^\d{22}$/.test(normalizado)) {
    throw new ErrorCucuruContrato('Cucuru devolvió un CVU inválido.');
  }
  return normalizado;
}

function destinoCuenta(cuenta: CuentaApi, customerIdEsperado?: string): DestinoCobroProveedor {
  const accountNumber = cvu(cuenta.account_number);
  const customerId = textoObligatorio(cuenta.customer_id ?? customerIdEsperado, 'customer_id');
  return {
    externalAccountId: accountNumber,
    customerId,
    cvu: accountNumber,
    alias: typeof cuenta.alias === 'string' && cuenta.alias.trim() ? cuenta.alias.trim() : null,
    moneda: 'ARS',
  };
}

function montoCentavos(valor: unknown): number {
  if (typeof valor !== 'number' && typeof valor !== 'string') {
    throw new ErrorCucuruContrato('Cucuru devolvió un importe inválido.');
  }
  const texto = String(valor).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(texto)) {
    throw new ErrorCucuruContrato('Cucuru devolvió un importe inválido.');
  }
  const [enteros, decimales = ''] = texto.split('.');
  const resultado = Number(enteros) * 100 + Number(decimales.padEnd(2, '0'));
  if (!Number.isSafeInteger(resultado)) {
    throw new ErrorCucuruContrato('Cucuru devolvió un importe fuera de rango.');
  }
  return resultado;
}

function fechaUtc(valor: unknown): string {
  const texto = textoObligatorio(valor, 'date_time');
  const candidata = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(texto)
    ? `${texto.replace(' ', 'T')}:00.000Z`
    : /Z$/i.test(texto) ? texto : `${texto}Z`;
  const fecha = new Date(candidata);
  if (Number.isNaN(fecha.getTime())) {
    throw new ErrorCucuruContrato('Cucuru devolvió date_time inválido.');
  }
  return fecha.toISOString();
}

async function hashHex(valor: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(valor));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function normalizarCollectionCucuru(
  payload: Record<string, unknown>,
  collectorIdFallback?: string
): Promise<CollectionCucuruNormalizada> {
  const collectionId = textoObligatorio(payload.collection_id, 'collection_id');
  const collectorId = textoObligatorio(payload.collector_id ?? collectorIdFallback, 'collector_id');
  const customerId = typeof payload.customer_id === 'string' && payload.customer_id.trim()
    ? payload.customer_id.trim()
    : null;
  const accountNumber = typeof payload.collection_account === 'string' && payload.collection_account.trim()
    ? cvu(payload.collection_account)
    : null;
  const moneda = textoObligatorio(payload.currency_id, 'currency_id').toUpperCase();
  const occurredAt = fechaUtc(payload.date_time);
  const centavos = montoCentavos(payload.amount);
  const canonica = JSON.stringify({
    collectionId,
    collectionTraceId: typeof payload.collection_trace_id === 'string'
      ? payload.collection_trace_id.trim()
      : null,
    collectorId,
    customerId,
    accountNumber,
    moneda,
    centavos,
    occurredAt,
  });
  return {
    collectionId,
    collectorId,
    customerId,
    externalAccountId: accountNumber,
    cvu: accountNumber,
    montoCentavos: centavos,
    moneda,
    occurredAt,
    payloadHash: await hashHex(canonica),
  };
}

export class CucuruClienteHttp implements ProveedorCuentasCobro, ProveedorCollectionsCucuru {
  private readonly apiKey?: string;
  private readonly collectorId?: string;
  private readonly baseUrl: string;
  private readonly fetcher: Fetcher;
  private readonly timeoutMs = 8_000;

  constructor(configuracion: ConfiguracionCucuru, fetcher?: Fetcher) {
    this.apiKey = configuracion.apiKey;
    this.collectorId = configuracion.collectorId;
    this.baseUrl = (configuracion.baseUrl || 'https://api.cucuru.com').replace(/\/+$/, '');
    const fetchConfigurado = fetcher ?? globalThis.fetch.bind(globalThis);
    this.fetcher = (input, init) => fetchConfigurado(input, init);
  }

  private configuracion() {
    if (!this.apiKey?.trim() || !this.collectorId?.trim()) throw new ErrorCucuruConfiguracion();
    return { apiKey: this.apiKey.trim(), collectorId: this.collectorId.trim() };
  }

  private headers(): Record<string, string> {
    const { apiKey, collectorId } = this.configuracion();
    return {
      'X-Cucuru-Api-Key': apiKey,
      'X-Cucuru-Collector-id': collectorId,
      'Content-Type': 'application/json',
    };
  }

  private url(path: string, parametros?: Record<string, string | null>): string {
    const url = new URL(path, `${this.baseUrl}/`);
    for (const [nombre, valor] of Object.entries(parametros || {})) {
      if (valor != null && valor !== '') url.searchParams.set(nombre, valor);
    }
    return url.toString();
  }

  private async fetchConTimeout(input: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetcher(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getJson(path: string, parametros?: Record<string, string | null>): Promise<Record<string, unknown>> {
    let response: Response;
    try {
      response = await this.fetchConTimeout(this.url(path, parametros), { headers: this.headers() });
    } catch (cause) {
      const diagnostico = diagnosticoFetch(cause);
      console.error(JSON.stringify({
        evento: 'cucuru_fetch_error',
        operacion: 'GET',
        path,
        codigo: diagnostico.codigo,
        error_nombre: diagnostico.nombre,
        error_mensaje: diagnostico.mensaje,
      }));
      throw new ErrorCucuruTransitorio('No se pudo consultar Cucuru.', diagnostico.codigo, { cause });
    }
    if (!response.ok) {
      if (response.status === 403) {
        const { apiKey, collectorId } = this.configuracion();
        console.error(JSON.stringify({
          evento: 'cucuru_http_403_diagnostico',
          metodo: 'GET',
          url: this.url(path, parametros),
          body: null,
          header_names: ['Content-Type', 'X-Cucuru-Api-Key', 'X-Cucuru-Collector-id'],
          api_key_sha256_16: (await hashHex(apiKey)).slice(0, 16),
          collector_id_sha256_16: (await hashHex(collectorId)).slice(0, 16),
        }));
      }
      throw errorHttp(response.status);
    }
    try {
      const body = await response.json();
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
      return body as Record<string, unknown>;
    } catch {
      throw new ErrorCucuruContrato('Cucuru devolvió JSON inválido.');
    }
  }

  async buscarPorCustomerId(customerId: string): Promise<DestinoCobroProveedor | null> {
    let nextPage: string | null = null;
    let paginas = 0;
    const encontradas: DestinoCobroProveedor[] = [];
    do {
      if (paginas++ >= 100) throw new ErrorCucuruContrato('La paginación de cuentas excedió el límite seguro.');
      const body = await this.getJson('/app/v1/Collection/accounts', { next_page: nextPage });
      if (!Array.isArray(body.accounts)) throw new ErrorCucuruContrato('Cucuru devolvió accounts inválido.');
      for (const cuenta of body.accounts) {
        if (!cuenta || typeof cuenta !== 'object' || Array.isArray(cuenta)) continue;
        if ((cuenta as CuentaApi).customer_id === customerId) encontradas.push(destinoCuenta(cuenta as CuentaApi));
      }
      const cursor = typeof body.next_page === 'string' ? body.next_page.trim() : '';
      nextPage = cursor && cursor.toUpperCase() !== 'EOF' ? cursor : null;
    } while (nextPage);
    if (encontradas.length > 1) throw new ErrorCucuruContrato('Cucuru devolvió customer_id duplicado.');
    return encontradas[0] || null;
  }

  async crear(entrada: { customerId: string; idempotencyKey: string }): Promise<DestinoCobroProveedor> {
    let response: Response;
    try {
      response = await this.fetchConTimeout(this.url('/app/v1/Collection/accounts/account'), {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify({ customer_id: entrada.customerId, read_only: 'true' }),
      });
    } catch {
      throw new ErrorProvisionamientoDesconocido();
    }
    if (response.status >= 500) throw new ErrorProvisionamientoDesconocido();
    if (!response.ok) throw errorHttp(response.status);
    let body: Record<string, unknown>;
    try {
      body = await response.json() as Record<string, unknown>;
    } catch {
      throw new ErrorProvisionamientoDesconocido();
    }
    return destinoCuenta(body, entrada.customerId);
  }

  async asignarAlias(entrada: {
    cuenta: DestinoCobroProveedor;
    alias: string;
    idempotencyKey: string;
  }): Promise<DestinoCobroProveedor> {
    let response: Response;
    try {
      response = await this.fetchConTimeout(this.url('/app/v1/Collection/accounts/account/alias'), {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ account_number: entrada.cuenta.cvu, alias: entrada.alias }),
      });
    } catch {
      throw new ErrorProvisionamientoDesconocido();
    }
    if (response.status >= 500 || response.status === 408 || response.status === 429) {
      throw new ErrorProvisionamientoDesconocido();
    }
    if (!response.ok) throw errorHttp(response.status);
    return { ...entrada.cuenta, alias: entrada.alias };
  }

  async listar(entrada: {
    desde: string;
    hasta: string;
    cursor: string | null;
    limite: number;
  }): Promise<{ items: CollectionCucuruNormalizada[]; nextCursor: string | null }> {
    const { collectorId } = this.configuracion();
    const formatear = (valor: string) => {
      const fecha = new Date(valor);
      if (Number.isNaN(fecha.getTime())) throw new ErrorCucuruContrato('El rango de backfill es inválido.');
      return fecha.toISOString().slice(0, 19);
    };
    const body = await this.getJson('/app/v1/Collection/collections', {
      date_from: formatear(entrada.desde),
      date_to: formatear(entrada.hasta),
      next_page: entrada.cursor,
    });
    if (!Array.isArray(body.collections)) throw new ErrorCucuruContrato('Cucuru devolvió collections inválido.');
    const conciliables = body.collections.filter(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new ErrorCucuruContrato('Cucuru devolvió una Collection inválida.');
      }
      const status = (item as Record<string, unknown>).status;
      if (status === 'rejected') return false;
      if (status != null && status !== 'received' && status !== 'settlement') {
        throw new ErrorCucuruContrato('Cucuru devolvió un estado de Collection desconocido.');
      }
      return true;
    });
    const items = await Promise.all(conciliables.map(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new ErrorCucuruContrato('Cucuru devolvió una Collection inválida.');
      }
      return normalizarCollectionCucuru(item as Record<string, unknown>, collectorId);
    }));
    const cursor = typeof body.next_page === 'string' ? body.next_page.trim() : '';
    return { items, nextCursor: cursor && cursor.toUpperCase() !== 'EOF' ? cursor : null };
  }
}

/** Adaptador fail-closed conservado para configuraciones incompletas. */
export class CucuruContratoNoDisponible implements ProveedorCuentasCobro {
  async buscarPorCustomerId(): Promise<null> {
    throw new ErrorCucuruConfiguracion();
  }

  async crear(): Promise<never> {
    throw new ErrorCucuruConfiguracion();
  }

  async asignarAlias(): Promise<never> {
    throw new ErrorCucuruConfiguracion();
  }
}
