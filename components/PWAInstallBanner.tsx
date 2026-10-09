import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, X } from 'lucide-react';
import { canInstall, onInstallReady, promptInstall } from '../src/lib/pwa';
import { useFloatingUiSurface } from './FloatingUiContext';

export const PWAInstallBanner: React.FC = () => {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isResetVital = pathname === '/reset-vital';
  const ownsFloatingUi = useFloatingUiSurface('pwa', visible && !isResetVital);

  useEffect(() => {
    if (dismissed) return;
    const unsub = onInstallReady(() => {
      // Mostrar después de 8 segundos para no interrumpir la entrada
      setTimeout(() => setVisible(true), 8000);
    });
    if (canInstall()) setTimeout(() => setVisible(true), 8000);
    return unsub;
  }, [dismissed]);

  // No mostrar en /reset-vital (esa página tiene su propio banner)
  if (isResetVital || !visible || !ownsFloatingUi) return null;

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
  };

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm"
      style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))' }}
    >
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ backgroundColor: '#005333', border: '1px solid rgba(212,175,55,0.3)' }}
      >
        <div
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(212,175,55,0.15)' }}
        >
          <Download size={18} color="#D4AF37" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">Instalá la App</p>
          <p className="text-white/60 text-[11px] leading-tight">Pueblo Mágico · Acceso offline</p>
        </div>
        <button
          onClick={handleInstall}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
          style={{ backgroundColor: '#D4AF37', color: '#005333' }}
        >
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-white/40 hover:text-white transition-colors"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
