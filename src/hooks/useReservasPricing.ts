import { useEffect, useState } from 'react';
import {
  fetchReservasPublicPricing,
  type ReservasPublicPricingSummary,
} from '../data/reservasPricing';

type PricingState = {
  data: ReservasPublicPricingSummary | null;
  error: boolean;
  loaded: boolean;
};

export function useReservasPricing(): PricingState {
  const [state, setState] = useState<PricingState>({ data: null, error: false, loaded: false });

  useEffect(() => {
    const controller = new AbortController();
    fetchReservasPublicPricing(undefined, controller.signal)
      .then(data => setState({ data, error: false, loaded: true }))
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({ data: null, error: true, loaded: true });
      });
    return () => controller.abort();
  }, []);

  return state;
}
