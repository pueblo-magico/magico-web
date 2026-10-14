import { useEffect, useState } from 'react';
import { getPublicPricingSummary, type PublicPricingSummary } from './bookingApi';

let cachedRequest: Promise<PublicPricingSummary | null> | null = null;

function loadPricingSummary() {
  if (!cachedRequest) {
    cachedRequest = getPublicPricingSummary().catch(error => {
      cachedRequest = null;
      throw error;
    });
  }
  return cachedRequest;
}

export function usePublicPricingSummary() {
  const [data, setData] = useState<PublicPricingSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    loadPricingSummary()
      .then(summary => { if (active) setData(summary); })
      .catch(() => { if (active) setData(null); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);

  return { data, loaded };
}
