import { configuredWebsiteAuth, websiteAuthFailure } from '../../../_lib/websiteAuthResponses.ts';
import { completeWebsiteCallback } from '../../../_lib/websiteOidc.ts';

export async function onRequestGet({ request, env }: any): Promise<Response> {
  const config = configuredWebsiteAuth(env);
  if (config instanceof Response) return config;
  try {
    return await completeWebsiteCallback(request, config);
  } catch {
    return websiteAuthFailure();
  }
}
