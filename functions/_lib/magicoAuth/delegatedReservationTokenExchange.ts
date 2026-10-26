const GRANT_TYPE_TOKEN_EXCHANGE = 'urn:ietf:params:oauth:grant-type:token-exchange';
const TOKEN_TYPE_ACCESS_TOKEN = 'urn:ietf:params:oauth:token-type:access_token';
const CLIENT_ASSERTION_TYPE = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
const TIMEOUT_PREDETERMINADO_MS = 3_000;
const TIMEOUT_MAXIMO_MS = 5_000;
const VIDA_MAXIMA_TOKEN_SEGUNDOS = 300;
const LONGITUD_MAXIMA_CREDENCIAL = 16_384;

export type CodigoErrorIntercambioTokenDelegado =
  | 'CONFIGURACION_INVALIDA'
  | 'TOKEN_SUJETO_NO_DISPONIBLE'
  | 'ASERCION_CLIENTE_NO_DISPONIBLE'
  | 'PROVEEDOR_NO_DISPONIBLE'
  | 'PROVEEDOR_RECHAZO_INTERCAMBIO'
  | 'RESPUESTA_TOKEN_INVALIDA';

export class ErrorIntercambioTokenDelegado extends Error {
  readonly codigo: CodigoErrorIntercambioTokenDelegado;
  readonly reintentable: boolean;

  constructor(codigo: CodigoErrorIntercambioTokenDelegado, reintentable: boolean) {
    super(codigo);
    this.name = 'ErrorIntercambioTokenDelegado';
    this.codigo = codigo;
    this.reintentable = reintentable;
  }
}

export type ConfiguracionIntercambioTokenDelegado = {
  issuer: string;
  tokenEndpoint: string;
  audience: string;
  clientId: string;
  timeoutMs?: number;
};

export interface ProveedorTokenSujetoMagicoAuth {
  obtenerTokenSujeto(): Promise<string>;
}

export interface ProveedorAsercionClienteConfidencial {
  obtenerAsercionCliente(entrada: {
    issuer: string;
    tokenEndpoint: string;
    audience: string;
    clientId: string;
  }): Promise<string>;
}

export type TokenDelegadoReservas = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

type DependenciasIntercambio = {
  fetcher?: typeof fetch;
};

function urlHttps(valor: string, permitirPath = true): URL | null {
  try {
    const url = new URL(valor);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search) {
      return null;
    }
    if (!permitirPath && url.pathname !== '/') return null;
    return url;
  } catch {
    return null;
  }
}
function textoConfigurado(valor: string, maximo = 512): boolean {
  return typeof valor === 'string' && valor.trim() === valor && valor.length > 0 && valor.length <= maximo;
}

function credencialValida(valor: unknown): valor is string {
  return typeof valor === 'string'
    && valor.trim() === valor
    && valor.length > 0
    && valor.length <= LONGITUD_MAXIMA_CREDENCIAL;
}

function validarConfiguracion(configuracion: ConfiguracionIntercambioTokenDelegado) {
  const issuer = urlHttps(configuracion.issuer, false);
  const tokenEndpoint = urlHttps(configuracion.tokenEndpoint);
  const timeoutMs = configuracion.timeoutMs ?? TIMEOUT_PREDETERMINADO_MS;
  if (
    !issuer
    || !tokenEndpoint
    || issuer.origin !== tokenEndpoint.origin
    || tokenEndpoint.pathname === '/'
    || !textoConfigurado(configuracion.audience)
    || !textoConfigurado(configuracion.clientId)
    || !Number.isInteger(timeoutMs)
    || timeoutMs < 100
    || timeoutMs > TIMEOUT_MAXIMO_MS
  ) {
    throw new ErrorIntercambioTokenDelegado('CONFIGURACION_INVALIDA', false);
  }
  return { timeoutMs };
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function normalizarRespuestaToken(valor: unknown): TokenDelegadoReservas {
  if (!esObjeto(valor)) {
    throw new ErrorIntercambioTokenDelegado('RESPUESTA_TOKEN_INVALIDA', false);
  }
  const expiresIn = valor.expires_in;
  if (
    !credencialValida(valor.access_token)
    || valor.issued_token_type !== TOKEN_TYPE_ACCESS_TOKEN
    || typeof valor.token_type !== 'string'
    || valor.token_type.toLowerCase() !== 'bearer'
    || !Number.isInteger(expiresIn)
    || Number(expiresIn) <= 0
    || Number(expiresIn) > VIDA_MAXIMA_TOKEN_SEGUNDOS
  ) {
    throw new ErrorIntercambioTokenDelegado('RESPUESTA_TOKEN_INVALIDA', false);
  }
  return {
    accessToken: valor.access_token,
    tokenType: 'Bearer',
    expiresIn: Number(expiresIn),
  };
}

async function obtenerCredencial(
  proveedor: () => Promise<string>,
  codigo: 'TOKEN_SUJETO_NO_DISPONIBLE' | 'ASERCION_CLIENTE_NO_DISPONIBLE'
): Promise<string> {
  try {
    const credencial = await proveedor();
    if (!credencialValida(credencial)) throw new Error('credencial inválida');
    return credencial;
  } catch {
    throw new ErrorIntercambioTokenDelegado(codigo, false);
  }
}

/**
 * Adaptador server-only y todavía no conectado a ninguna ruta.
 * Los proveedores inyectados son los únicos responsables de obtener credenciales.
 */
export class ClienteIntercambioTokenDelegadoReservas {
  private readonly configuracion: ConfiguracionIntercambioTokenDelegado;
  private readonly proveedorTokenSujeto: ProveedorTokenSujetoMagicoAuth;
  private readonly proveedorAsercion: ProveedorAsercionClienteConfidencial;
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;

  constructor(
    configuracion: ConfiguracionIntercambioTokenDelegado,
    proveedorTokenSujeto: ProveedorTokenSujetoMagicoAuth,
    proveedorAsercion: ProveedorAsercionClienteConfidencial,
    dependencias: DependenciasIntercambio = {}
  ) {
    this.configuracion = configuracion;
    this.proveedorTokenSujeto = proveedorTokenSujeto;
    this.proveedorAsercion = proveedorAsercion;
    this.timeoutMs = validarConfiguracion(configuracion).timeoutMs;
    this.fetcher = dependencias.fetcher ?? fetch;
  }

  async intercambiar(): Promise<TokenDelegadoReservas> {
    const tokenSujeto = await obtenerCredencial(
      () => this.proveedorTokenSujeto.obtenerTokenSujeto(),
      'TOKEN_SUJETO_NO_DISPONIBLE'
    );
    const asercionCliente = await obtenerCredencial(
      () => this.proveedorAsercion.obtenerAsercionCliente({
        issuer: this.configuracion.issuer,
        tokenEndpoint: this.configuracion.tokenEndpoint,
        audience: this.configuracion.audience,
        clientId: this.configuracion.clientId,
      }),
      'ASERCION_CLIENTE_NO_DISPONIBLE'
    );
    const cuerpo = new URLSearchParams({
      grant_type: GRANT_TYPE_TOKEN_EXCHANGE,
      subject_token: tokenSujeto,
      subject_token_type: TOKEN_TYPE_ACCESS_TOKEN,
      requested_token_type: TOKEN_TYPE_ACCESS_TOKEN,
      audience: this.configuracion.audience,
      client_id: this.configuracion.clientId,
      client_assertion_type: CLIENT_ASSERTION_TYPE,
      client_assertion: asercionCliente,
    });
    const controlador = new AbortController();
    const timeout = setTimeout(() => controlador.abort(), this.timeoutMs);
    let respuesta: Response;
    try {
      respuesta = await this.fetcher(this.configuracion.tokenEndpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: cuerpo.toString(),
        redirect: 'manual',
        signal: controlador.signal,
      });
    } catch {
      throw new ErrorIntercambioTokenDelegado('PROVEEDOR_NO_DISPONIBLE', true);
    } finally {
      clearTimeout(timeout);
    }

    if (respuesta.status >= 300 && respuesta.status < 400) {
      throw new ErrorIntercambioTokenDelegado('PROVEEDOR_NO_DISPONIBLE', true);
    }
    const contentType = respuesta.headers.get('content-type')?.toLowerCase() || '';
    if (!contentType.includes('application/json')) {
      throw new ErrorIntercambioTokenDelegado('RESPUESTA_TOKEN_INVALIDA', false);
    }
    let contenido: unknown;
    try {
      contenido = await respuesta.json();
    } catch {
      throw new ErrorIntercambioTokenDelegado('RESPUESTA_TOKEN_INVALIDA', false);
    }
    if (!respuesta.ok) {
      throw new ErrorIntercambioTokenDelegado(
        'PROVEEDOR_RECHAZO_INTERCAMBIO',
        respuesta.status >= 500 || respuesta.status === 429
      );
    }
    return normalizarRespuestaToken(contenido);
  }
}

// La activación pertenece a un checkpoint posterior; este módulo no se auto-configura.
