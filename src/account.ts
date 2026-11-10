import { useCallback, useEffect, useState } from 'react';

export type WebsiteAccountState =
  | { readonly status: 'loading' }
  | { readonly status: 'signed_out' }
  | { readonly message: string; readonly status: 'unavailable' }
  | { readonly status: 'authenticated'; readonly user: { readonly displayName: string; readonly email?: string } };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseAuthenticated(value: unknown): WebsiteAccountState | null {
  if (!isRecord(value) || value.status !== 'authenticated' || !isRecord(value.user)) return null;
  const displayName = value.user.displayName;
  const email = value.user.email;
  if (typeof displayName !== 'string' || !displayName.trim() || (email !== undefined && typeof email !== 'string')) return null;
  const normalizedEmail = typeof email === 'string' && email ? email : undefined;
  return { status: 'authenticated', user: { displayName: displayName.trim(), ...(normalizedEmail ? { email: normalizedEmail } : {}) } };
}

export function useWebsiteAccount(): { readonly refresh: () => Promise<void>; readonly state: WebsiteAccountState } {
  const [state, setState] = useState<WebsiteAccountState>({ status: 'loading' });
  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/session', {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      if (response.status === 401) {
        setState({ status: 'signed_out' });
        return;
      }
      if (!response.ok) throw new Error('session_unavailable');
      const parsed = parseAuthenticated(await response.json());
      if (!parsed) throw new Error('invalid_session_response');
      setState(parsed);
    } catch {
      setState({ status: 'unavailable', message: 'No pudimos consultar tu cuenta.' });
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return { refresh, state };
}

export async function closeWebsiteSession(): Promise<void> {
  const response = await fetch('/api/v1/auth/logout', { credentials: 'same-origin', method: 'POST' });
  if (!response.ok) throw new Error('logout_failed');
}
