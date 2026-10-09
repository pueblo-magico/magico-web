import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ROUTES } from '../src/routes';

export const WithdrawalAccessLink: React.FC<{ embedded?: boolean; inverse?: boolean }> = ({
  embedded = false,
  inverse = false,
}) => {
  const { language } = useLanguage();
  const location = useLocation();
  if (location.pathname.startsWith('/admin') || location.pathname === ROUTES.ARREPENTIMIENTO) return null;
  if (!embedded && (location.pathname === '/' || location.pathname === ROUTES.ESTADIA)) return null;

  const className = embedded
    ? `mt-3 flex w-full items-center justify-center rounded-full border bg-transparent px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] shadow-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
        inverse
          ? 'border-white/60 text-white hover:bg-white/10'
          : 'border-brand/30 text-brand hover:bg-brand/5'
      }`
    : 'fixed bottom-4 left-4 z-[900] max-w-[220px] rounded-full border-2 border-brand bg-white px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-brand shadow-[0_8px_24px_rgba(0,83,51,0.2)] transition-colors hover:bg-brand hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2';

  return (
    <a
      href={ROUTES.ARREPENTIMIENTO}
      className={className}
    >
      {language === 'es' ? 'Botón de arrepentimiento' : 'Withdrawal button'}
    </a>
  );
};
