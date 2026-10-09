import React, { createContext, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import './FloatingUiContext.css';

export type FloatingUiSurface = 'cookie' | 'pwa' | 'reservation' | 'whatsapp';

type FloatingUiContextValue = {
  stackRoot: HTMLDivElement | null;
};

const FloatingUiContext = createContext<FloatingUiContextValue>({
  stackRoot: null,
});

export const FloatingUiProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [stackRoot, setStackRoot] = useState<HTMLDivElement | null>(null);
  const value = useMemo(() => ({ stackRoot }), [stackRoot]);

  return (
    <FloatingUiContext.Provider value={value}>
      {children}
      <div ref={setStackRoot} className="floating-ui-stack" aria-label="Accesos rápidos" />
    </FloatingUiContext.Provider>
  );
};

type FloatingUiPortalProps = React.PropsWithChildren<{ surface: FloatingUiSurface }>;

export const FloatingUiPortal: React.FC<FloatingUiPortalProps> = ({ surface, children }) => {
  const { stackRoot } = useContext(FloatingUiContext);
  if (!stackRoot) return null;

  return createPortal(
    <div className={`floating-ui-stack__item floating-ui-stack__item--${surface}`}>
      {children}
    </div>,
    stackRoot,
  );
};
