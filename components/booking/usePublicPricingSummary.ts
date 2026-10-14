import { useEffect, useState } from 'react';
import { getPublicPricingSummary, localTodayIso, type PublicPricingSummary } from './bookingApi';

const cachedRequests = new Map<string, Promise<PublicPricingSummary | null>>();

function loadPricingSummary(fecha: string) {
  let request = cachedRequests.get(fecha);
  if (!request) {
    request = getPublicPricingSummary(fecha).catch(error => {
      cachedRequests.delete(fecha);
      throw error;
    });
    cachedRequests.set(fecha, request);
  }
  return request;
}

export function usePublicPricingSummary(fecha = localTodayIso()) {
  const [data, setData] = useState<PublicPricingSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    loadPricingSummary(fecha)
      .then(summary => { if (active) setData(summary); })
      .catch(() => { if (active) setData(null); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [fecha]);

  return { data, loaded };
}

export function usePublicPricingSummaries(fechas: string[]) {
  const key = fechas.join(',');
  const [state, setState] = useState<{
    key: string;
    data: PublicPricingSummary[];
    loaded: boolean;
  }>({ key: '', data: [], loaded: false });

  useEffect(() => {
    let active = true;
    if (fechas.length === 0) {
      setState({ key, data: [], loaded: true });
      return () => { active = false; };
    }
    setState({ key, data: [], loaded: false });
    Promise.all(fechas.map(loadPricingSummary))
      .then(summaries => {
        if (active) setState({
          key,
          data: summaries.filter((summary): summary is PublicPricingSummary => summary !== null),
          loaded: true,
        });
      })
      .catch(() => { if (active) setState({ key, data: [], loaded: true }); });
    return () => { active = false; };
  }, [key]);

  return state.key === key
    ? { data: state.data, loaded: state.loaded }
    : { data: [] as PublicPricingSummary[], loaded: false };
}
