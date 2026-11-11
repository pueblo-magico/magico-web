import { configuredWebsiteAuth, websiteAuthJson } from '../../_lib/websiteAuthResponses.ts';
import { clearWebsiteSession, readWebsiteSession } from '../../_lib/websiteOidc.ts';

export async function onRequestGet({ request, env }: any): Promise<Response> {
  const config = configuredWebsiteAuth(env);
  if (config instanceof Response) return config;
  const session = await readWebsiteSession(request, config);
  if (!session) return websiteAuthJson({ status: 'signed_out' }, 401, { 'Set-Cookie': clearWebsiteSession(config) });
  return websiteAuthJson({
    status: 'authenticated',
    user: {
      displayName: session.displayName,
      ...(session.email ? { email: session.email } : {}),
      ...(session.pictureUrl ? { pictureUrl: session.pictureUrl } : {}),
    },
  });
}
