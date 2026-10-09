import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ROUTES } from '../src/routes';
import { useFloatingUiSurface } from './FloatingUiContext';

const STORAGE_KEY = 'cookie-consent';

export const CookieBanner: React.FC = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const ownsFloatingUi = useFloatingUiSurface('cookie', visible);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Pequeno delay para no distraer apenas carga la página
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Avisa la decisión a Microsoft Clarity (Consent API v2). El stub se define en index.html.
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

  if (!visible || !ownsFloatingUi) return null;

  return (
    <div
      role="dialog"
      aria-label={t.cookieBanner.title}
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-[380px] z-[100] animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out"
    >
      <div className="bg-white/80 backdrop-blur-md border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl p-6 relative overflow-hidden group">
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

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-brand/5 rounded-full flex items-center justify-center text-xl">
            🍃
          </div>
          <div className="flex-1 pt-1">
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
            <div className="flex items-center gap-4">
              <button
                onClick={accept}
                className="flex-1 bg-brand text-white px-6 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-gold hover:text-white transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
              >
                {t.cookieBanner.accept}
              </button>
              <button
                onClick={dismiss}
                className="text-gray-400 hover:text-brand text-[10px] font-bold tracking-widest uppercase transition-colors px-2 py-1"
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
