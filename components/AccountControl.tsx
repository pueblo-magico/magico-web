import React, { useState } from 'react';
import { ArrowRightLeft, ChevronDown, ExternalLink, LogOut, UserRound } from 'lucide-react';
import { Button, DropdownMenu, type DropdownMenuItem } from '@pueblo-magico/react-ui';
import { closeWebsiteSession, type WebsiteAccountState } from '../src/account';
import { COMPANION_PORTAL_URL, STAFF_PORTAL_URL } from '../src/data/config';

export type StaffAccessState = 'allowed' | 'denied' | 'loading' | 'not_configured' | 'unavailable';

interface AccountControlProps {
  readonly language: 'en' | 'es';
  readonly mobile?: boolean;
  readonly onSignedOut?: () => void;
  readonly staffAccess?: StaffAccessState;
  readonly state: WebsiteAccountState;
  readonly tone?: 'overlay' | 'solid';
}

export const AccountControl: React.FC<AccountControlProps> = ({
  language,
  mobile = false,
  onSignedOut,
  staffAccess = 'not_configured',
  state,
  tone = 'solid',
}) => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const isSpanish = language === 'es';
  const sharedClasses = mobile
    ? 'mx-auto flex min-h-11 w-full max-w-xs items-center justify-center gap-2 rounded-full border border-brand px-6 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold'
    : `inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${tone === 'solid' ? 'border-black/15 text-dark hover:border-brand hover:bg-brand hover:text-white' : 'border-white/40 text-white hover:border-white hover:bg-white hover:text-brand'}`;

  if (state.status === 'loading') {
    return <span aria-label={isSpanish ? 'Consultando tu cuenta' : 'Checking your account'} className={`${sharedClasses} min-w-24 animate-pulse opacity-60`} />;
  }
  if (state.status === 'signed_out' || state.status === 'unavailable') {
    return (
      <a href="/api/v1/auth/login" className={sharedClasses} onClick={onSignedOut}>
        <UserRound size={18} aria-hidden="true" />
        {isSpanish ? 'Ingresar' : 'Sign in'}
      </a>
    );
  }

  const items: DropdownMenuItem[] = [
    { description: state.user.email, id: 'identity', isDisabled: true, label: state.user.displayName, textValue: state.user.displayName },
    { icon: <UserRound size={17} aria-hidden="true" />, id: 'companion', label: isSpanish ? 'Mi cuenta' : 'My account', textValue: isSpanish ? 'Mi cuenta' : 'My account' },
  ];
  if (staffAccess === 'loading') {
    items.push({ id: 'staff-loading', isDisabled: true, label: isSpanish ? 'Verificando acceso del equipo…' : 'Checking staff access…', textValue: isSpanish ? 'Verificando acceso del equipo' : 'Checking staff access' });
  }
  if (staffAccess === 'allowed') {
    items.push({ icon: <ExternalLink size={17} aria-hidden="true" />, id: 'staff', label: isSpanish ? 'Portal del equipo' : 'Staff portal', textValue: isSpanish ? 'Portal del equipo' : 'Staff portal' });
  }
  if (staffAccess === 'unavailable') {
    items.push({ description: isSpanish ? 'Intentá de nuevo más tarde.' : 'Try again later.', id: 'staff-unavailable', isDisabled: true, label: isSpanish ? 'No pudimos verificar tu acceso al Portal del equipo.' : 'We could not verify your staff access.', textValue: isSpanish ? 'Acceso del equipo no disponible' : 'Staff access unavailable' });
  }
  items.push(
    { icon: <ArrowRightLeft size={17} aria-hidden="true" />, id: 'switch', label: isSpanish ? 'Cambiar de cuenta' : 'Switch account', textValue: isSpanish ? 'Cambiar de cuenta' : 'Switch account' },
    { icon: <LogOut size={17} aria-hidden="true" />, id: 'logout', isDisabled: isSigningOut, label: isSigningOut ? (isSpanish ? 'Cerrando sesión…' : 'Signing out…') : (isSpanish ? 'Cerrar sesión de Mi cuenta' : 'Sign out of My account'), textValue: isSpanish ? 'Cerrar sesión de Mi cuenta' : 'Sign out of My account', variant: 'danger' },
  );

  const onAction = async (id: string) => {
    setActionError(null);
    if (id === 'companion') window.location.assign(COMPANION_PORTAL_URL);
    if (id === 'staff') window.location.assign(STAFF_PORTAL_URL);
    if (id === 'switch') window.location.assign('/api/v1/auth/switch');
    if (id === 'logout') {
      setIsSigningOut(true);
      try {
        await closeWebsiteSession();
        window.location.assign('/');
      } catch {
        setActionError(isSpanish ? 'No pudimos cerrar la sesión. Intentá de nuevo.' : 'We could not sign you out. Try again.');
        setIsSigningOut(false);
      }
    }
  };

  return (
    <div className={mobile ? 'w-full' : ''}>
      <DropdownMenu
        items={items}
        onAction={(id) => { void onAction(id); }}
        trigger={(
          <Button type="button" variant="ghost" className={sharedClasses} aria-label={isSpanish ? 'Abrir menú de cuenta' : 'Open account menu'}>
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-current/10" aria-hidden="true">
              <UserRound size={16} strokeWidth={1.8} />
            </span>
            <span>{isSpanish ? 'Mi cuenta' : 'My account'}</span>
            <ChevronDown className="shrink-0" size={15} strokeWidth={2} aria-hidden="true" />
          </Button>
        )}
      />
      {actionError ? <p role="alert" className="mt-2 max-w-xs text-xs text-red-700">{actionError}</p> : null}
    </div>
  );
};
