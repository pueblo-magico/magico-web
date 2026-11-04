import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ROUTES } from '../src/routes';

const STORAGE_KEY = 'cookie-consent';

export const CookieBanner: React.FC = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Pequeno delay para no distraer apenas carga la p�gina
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      document.body.dataset.cookieBannerVisible = 'true';
    } else {
      delete document.body.dataset.cookieBannerVisible;
    }

    return () => {
      delete document.body.dataset.cookieBannerVisible;
    };
  }, [visible]);

  // Avisa la decisi�n a Microsoft Clarity (Consent API v2). El stub se define en index.html.
  const sendClarityConsent = (analytics: 'granted' | 'denied') => {
    (window as any).clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: analytics });
  };

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    sendClarityConsent('granted');
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'dismissed');
    sendClarityConsent('denied');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t.cookieBanner.title}
      data-cookie-banner
      className="fixed bottom-2 left-2 right-2 z-[100] animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out md:bottom-6 md:left-auto md:right-6 md:max-w-[380px]"
    >
      <div className="group relative max-h-[calc(100vh-1rem)] overflow-x-hidden overflow-y-auto rounded-2xl border border-white/20 bg-white/90 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-md md:p-6">
        {/* Subtle background glow */}
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-gold/5 rounded-full blur-2xl group-hover:bg-gold/10 transition-colors duration-500" />
        
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-brand transition-colors p-1"
          aria-label={t.ui.closeCookieNotice}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand/5 text-lg md:h-10 md:w-10 md:text-xl">
            ??
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="text-brand font-serif text-lg leading-none mb-2">
              {t.cookieBanner.title}
            </h3>
            <p className="text-gray-500 text-xs font-light leading-relaxed mb-5">
              {t.cookieBanner.description}{' '}
              <a
                href={ROUTES.PRIVACIDAD}
                className="text-brand font-medium underline underline-offset-4 decoration-brand/30 hover:decoration-brand transition-all"
              >
                {t.cookieBanner.policy}
              </a>.
            </p>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
              <button
                onClick={accept}
                className="w-full min-w-0 rounded-full bg-brand px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-widest text-white shadow-md transition-all duration-300 hover:bg-gold hover:text-white hover:shadow-lg active:scale-95 sm:flex-1"
              >
                {t.cookieBanner.accept}
              </button>
              <button
                onClick={dismiss}
                className="w-full min-w-0 whitespace-normal px-2 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 transition-colors hover:text-brand sm:w-auto"
              >
                {t.cookieBanner.essentials}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

