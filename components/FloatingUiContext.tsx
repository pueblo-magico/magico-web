import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react';

export type FloatingUiSurface = 'cookie' | 'reservation' | 'pwa';

const SURFACE_PRIORITY: FloatingUiSurface[] = ['cookie', 'reservation', 'pwa'];

type FloatingUiContextValue = {
  activeSurface: FloatingUiSurface | null;
  setSurfaceActive: (surface: FloatingUiSurface, sourceId: string, active: boolean) => void;
};

const FloatingUiContext = createContext<FloatingUiContextValue>({
  activeSurface: null,
  setSurfaceActive: () => undefined,
});

export const FloatingUiProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [sources, setSources] = useState<Record<FloatingUiSurface, ReadonlySet<string>>>(() => ({
    cookie: new Set(),
    reservation: new Set(),
    pwa: new Set(),
  }));

  const setSurfaceActive = useCallback((surface: FloatingUiSurface, sourceId: string, active: boolean) => {
    setSources(current => {
      const existing = current[surface];
      if (existing.has(sourceId) === active) return current;
      const next = new Set(existing);
      if (active) next.add(sourceId);
      else next.delete(sourceId);
      return { ...current, [surface]: next };
    });
  }, []);

  const activeSurface = SURFACE_PRIORITY.find(surface => sources[surface].size > 0) || null;
  const value = useMemo(() => ({ activeSurface, setSurfaceActive }), [activeSurface, setSurfaceActive]);

  return <FloatingUiContext.Provider value={value}>{children}</FloatingUiContext.Provider>;
};

export function useFloatingUi() {
  return useContext(FloatingUiContext);
}

export function useFloatingUiSurface(surface: FloatingUiSurface, active: boolean) {
  const sourceId = useId();
  const { activeSurface, setSurfaceActive } = useFloatingUi();

  useEffect(() => {
    setSurfaceActive(surface, sourceId, active);
    return () => setSurfaceActive(surface, sourceId, false);
  }, [active, setSurfaceActive, sourceId, surface]);

  return activeSurface === surface;
}
