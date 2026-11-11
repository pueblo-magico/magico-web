import { configuredWebsiteAuth, websiteAuthFailure } from '../../../_lib/websiteAuthResponses.ts';
import { beginWebsiteLogin } from '../../../_lib/websiteOidc.ts';

export async function onRequestGet({ env }: any): Promise<Response> {
  const config = configuredWebsiteAuth(env);
  if (config instanceof Response) return config;
  try {
    return await beginWebsiteLogin(config, 'select_account');
  } catch {
    return websiteAuthFailure();
  }
}
