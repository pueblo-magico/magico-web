import React from 'react';
import { LogIn } from 'lucide-react';
import type { WebsiteAccountState } from '../src/account';
import { COMPANION_PORTAL_URL, WEBSITE_LOGIN_URL } from '../src/data/config';

interface AccountControlProps {
  readonly compact?: boolean;
  readonly language: 'en' | 'es';
  readonly mobile?: boolean;
  readonly onNavigate?: () => void;
  readonly state: WebsiteAccountState;
  readonly tone?: 'overlay' | 'solid';
}

export const AccountControl: React.FC<AccountControlProps> = ({
  compact = false,
  language,
  mobile = false,
  onNavigate,
  state,
  tone = 'solid',
}) => {
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
        onClick={onNavigate}
        title={compact ? signInLabel : undefined}
      >
        <LogIn size={compact ? 20 : 18} strokeWidth={1.9} aria-hidden="true" />
        {compact ? <span className="sr-only">{signInLabel}</span> : signInLabel}
      </a>
    );
  }

  const accountInitial = (state.user.displayName.trim()[0] || state.user.email?.trim()[0] || 'M').toLocaleUpperCase();
  const accountLinkLabel = isSpanish ? `Abrir Mi cuenta de ${state.user.displayName}` : `Open ${state.user.displayName}'s account`;
  const authenticatedClasses = mobile
    ? 'mx-auto flex min-h-11 w-full max-w-xs items-center justify-center gap-2 rounded-full border border-brand bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:border-gold hover:bg-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold'
    : `relative inline-flex h-10 min-h-10 items-center gap-2 rounded-full border text-[11px] font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${compact ? 'w-10 min-w-10 justify-center p-0' : 'px-4 py-0'} ${tone === 'solid' ? 'border-brand bg-brand text-white shadow-sm hover:border-gold hover:bg-gold' : 'border-white bg-white text-brand shadow-md hover:border-gold hover:bg-gold hover:text-white'}`;

  return (
    <a
      href={COMPANION_PORTAL_URL}
      aria-label={accountLinkLabel}
      className={authenticatedClasses}
      onClick={onNavigate}
      title={compact ? accountLinkLabel : undefined}
    >
      <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-visible rounded-full bg-white/15 text-xs font-bold" aria-hidden="true">
        {state.user.pictureUrl ? (
          <img
            src={state.user.pictureUrl}
            alt=""
            className="h-full w-full rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : accountInitial}
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
      </span>
      {compact ? <span className="sr-only">{isSpanish ? 'Mi cuenta' : 'My account'}</span> : <span>{isSpanish ? 'Mi cuenta' : 'My account'}</span>}
    </a>
  );
};
