import { configuredWebsiteAuth } from '../../../_lib/websiteAuthResponses.ts';
import { clearWebsiteSession } from '../../../_lib/websiteOidc.ts';

export async function onRequestPost({ request, env }: any): Promise<Response> {
  const config = configuredWebsiteAuth(env);
  if (config instanceof Response) return config;
  if (request.headers.get('Origin') !== config.appBaseUrl.origin) {
    return Response.json({ error: { code: 'invalid_origin', message: 'La solicitud no es válida.' } }, { status: 403 });
  }
  return new Response(null, {
    headers: { 'Cache-Control': 'no-store', 'Set-Cookie': clearWebsiteSession(config) },
    status: 204,
  });
}
