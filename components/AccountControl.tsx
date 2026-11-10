import React, { useState } from 'react';
import { ArrowRightLeft, ChevronDown, ExternalLink, LogIn, LogOut, UserRound } from 'lucide-react';
import { Button, DropdownMenu, type DropdownMenuItem } from '@pueblo-magico/react-ui';
import { closeWebsiteSession, type WebsiteAccountState } from '../src/account';
import { COMPANION_PORTAL_URL, STAFF_PORTAL_URL, WEBSITE_LOGIN_URL } from '../src/data/config';

export type StaffAccessState = 'allowed' | 'denied' | 'loading' | 'not_configured' | 'unavailable';

interface AccountControlProps {
  readonly compact?: boolean;
  readonly language: 'en' | 'es';
  readonly mobile?: boolean;
  readonly onSignedOut?: () => void;
  readonly staffAccess?: StaffAccessState;
  readonly state: WebsiteAccountState;
  readonly tone?: 'overlay' | 'solid';
}

export const AccountControl: React.FC<AccountControlProps> = ({
  compact = false,
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
  const signedOutClasses = mobile
    ? 'mx-auto flex min-h-11 w-full max-w-xs items-center justify-center gap-2 rounded-full border border-brand px-6 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold'
    : `inline-flex h-10 min-h-10 items-center gap-2 rounded-full border text-[11px] font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${compact ? 'w-10 min-w-10 justify-center p-0' : 'px-4 py-0'} ${tone === 'solid' ? 'border-black/15 text-dark hover:border-brand hover:bg-brand hover:text-white' : 'border-white/40 text-white hover:border-white hover:bg-white hover:text-brand'}`;

  if (state.status === 'loading') {
    return <span aria-label={isSpanish ? 'Consultando tu cuenta' : 'Checking your account'} className={`${signedOutClasses} ${compact && !mobile ? '' : 'min-w-24'} animate-pulse opacity-60`} />;
  }
  if (state.status === 'signed_out' || state.status === 'unavailable') {
    const signInLabel = isSpanish ? 'Ingresar' : 'Sign in';
    return (
      <a
        href={WEBSITE_LOGIN_URL}
        aria-label={signInLabel}
        className={signedOutClasses}
        onClick={onSignedOut}
        title={compact ? signInLabel : undefined}
      >
        <LogIn size={compact ? 20 : 18} strokeWidth={1.9} aria-hidden="true" />
        {compact ? <span className="sr-only">{signInLabel}</span> : signInLabel}
      </a>
    );
  }

  const accountInitial = (state.user.displayName.trim()[0] || state.user.email?.trim()[0] || 'M').toLocaleUpperCase();
  const accountMenuLabel = isSpanish ? `Abrir cuenta de ${state.user.displayName}` : `Open ${state.user.displayName}'s account`;
  const authenticatedClasses = mobile
    ? 'mx-auto flex min-h-11 w-full max-w-xs items-center justify-center gap-2 rounded-full border border-brand bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:border-gold hover:bg-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold'
    : `relative inline-flex h-10 min-h-10 items-center gap-2 rounded-full border text-[11px] font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${compact ? 'w-10 min-w-10 justify-center p-0' : 'px-4 py-0'} ${tone === 'solid' ? 'border-brand bg-brand text-white shadow-sm hover:border-gold hover:bg-gold' : 'border-white bg-white text-brand shadow-md hover:border-gold hover:bg-gold hover:text-white'}`;

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
          <Button
            type="button"
            variant="ghost"
            className={authenticatedClasses}
            aria-label={accountMenuLabel}
          >
            {compact ? (
              <>
                <span className="text-sm font-bold leading-none" aria-hidden="true">{accountInitial}</span>
                <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" aria-hidden="true" />
                <span className="sr-only">{isSpanish ? 'Mi cuenta' : 'My account'}</span>
              </>
            ) : (
              <>
                <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold" aria-hidden="true">
                  {accountInitial}
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white" />
                </span>
                <span>{isSpanish ? 'Mi cuenta' : 'My account'}</span>
                <ChevronDown className="shrink-0" size={15} strokeWidth={2} aria-hidden="true" />
              </>
            )}
          </Button>
        )}
      />
      {actionError ? <p role="alert" className="mt-2 max-w-xs text-xs text-red-700">{actionError}</p> : null}
    </div>
  );
};
