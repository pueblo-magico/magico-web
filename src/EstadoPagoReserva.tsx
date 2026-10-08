import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { WA_MAGICO } from './data/config';
import {
  getPublicReservationStatus,
  type PublicReservationStatus,
} from '../components/booking/bookingApi';
import './EstadoPagoReserva.css';

type ReturnState = 'success' | 'pending' | 'failure';

const COPY = {
  es: {
    checking: 'Estamos verificando tu pago',
    checkingCopy: 'La confirmación puede tardar unos segundos después de volver de Mercado Pago.',
    confirmed: '¡Pago recibido!',
    confirmedCopy: 'Tu reserva está confirmada. Guardá el código para cualquier consulta.',
    pending: 'Pago pendiente de confirmación',
    pendingCopy: 'Tu lugar sigue retenido mientras esperamos la confirmación del pago.',
    failed: 'El pago no se confirmó',
    failedCopy: 'No confirmamos ningún cobro. Podés volver a la estadía y pedir ayuda para completar la reserva.',
    code: 'Código de reserva', back: 'Volver a estadías', help: 'Necesito ayuda', notFound: 'No pudimos consultar esta reserva.',
  },
  en: {
    checking: 'We are verifying your payment',
    checkingCopy: 'Confirmation may take a few seconds after returning from Mercado Pago.',
    confirmed: 'Payment received!',
    confirmedCopy: 'Your reservation is confirmed. Keep the code for any questions.',
    pending: 'Payment pending confirmation',
    pendingCopy: 'Your place remains held while we wait for payment confirmation.',
    failed: 'Payment was not confirmed',
    failedCopy: 'We have not confirmed any charge. Return to the stay page or ask for help to complete the reservation.',
    code: 'Reservation code', back: 'Back to stays', help: 'I need help', notFound: 'We could not retrieve this reservation.',
  },
} as const;

export default function EstadoPagoReserva({ returnState }: { returnState: ReturnState }) {
  const { language } = useLanguage();
  const c = COPY[language];
  const [params] = useSearchParams();
  const code = params.get('reserva') || '';
  const [status, setStatus] = useState<PublicReservationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!code) { setLoading(false); setFailed(true); return; }
    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;
    const load = async () => {
      attempts += 1;
      try {
        const result = await getPublicReservationStatus(code);
        if (cancelled) return;
        setStatus(result);
        setLoading(false);
        setFailed(false);
        if (result.reserva.estado !== 'confirmada' && attempts < 15) {
          timer = window.setTimeout(load, 2000);
        }
      } catch {
        if (cancelled) return;
        setLoading(false);
        setFailed(true);
      }
    };
    load();
    return () => { cancelled = true; if (timer) window.clearTimeout(timer); };
  }, [code]);

  const confirmed = status?.reserva.estado === 'confirmada';
  const rejected = status?.reserva.estado === 'rechazada' || status?.pago.estado === 'rechazado';
  const visual = confirmed ? 'confirmed' : rejected || returnState === 'failure' ? 'failed' : 'pending';
  const title = loading ? c.checking : visual === 'confirmed' ? c.confirmed : visual === 'failed' ? c.failed : c.pending;
  const copy = loading ? c.checkingCopy : visual === 'confirmed' ? c.confirmedCopy : visual === 'failed' ? c.failedCopy : c.pendingCopy;
  const Icon = loading ? Loader2 : visual === 'confirmed' ? CheckCircle2 : visual === 'failed' ? AlertCircle : Clock3;

  return (
    <main className="payment-return">
      <section className={`payment-return__card payment-return__card--${visual}`}>
        <Icon className={loading ? 'payment-return__spinner' : ''} size={52} aria-hidden="true" />
        <p className="payment-return__eyebrow">Pueblo Mágico</p>
        <h1>{failed ? c.notFound : title}</h1>
        {!failed && <p>{copy}</p>}
        {(status?.reserva.codigo || code) && (
          <p className="payment-return__code">{c.code}: <strong>{status?.reserva.codigo || code}</strong></p>
        )}
        <div className="payment-return__actions">
          <Link to="/estadia">{c.back}</Link>
          <a href={`https://wa.me/${WA_MAGICO}`} target="_blank" rel="noopener noreferrer">{c.help}</a>
        </div>
      </section>
    </main>
  );
}
