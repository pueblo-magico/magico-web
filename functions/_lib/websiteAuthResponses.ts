import { readWebsiteAuthConfig, type WebsiteAuthConfig, type WebsiteAuthEnv } from './websiteAuthConfig.ts';

export function websiteAuthJson(value: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(value, { headers: { 'Cache-Control': 'no-store', ...headers }, status });
}

export function unavailableWebsiteAuth(): Response {
  return websiteAuthJson({ error: { code: 'auth_unavailable', message: 'El ingreso no está disponible en este momento.' } }, 503);
}

export function websiteAuthFailure(): Response {
  return websiteAuthJson({ error: { code: 'auth_failed', message: 'No pudimos completar el ingreso. Volvé a intentarlo.' } }, 401);
}

export function configuredWebsiteAuth(env: WebsiteAuthEnv): WebsiteAuthConfig | Response {
  try {
    return readWebsiteAuthConfig(env);
  } catch {
    return unavailableWebsiteAuth();
  }
}
