import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { CopyButton } from '@pueblo-magico/react-ui';
import { useLanguage } from '../contexts/LanguageContext';
import { WA_MAGICO } from './data/config';
import {
  getPublicReservationStatus,
  formatRemaining,
  remainingSeconds,
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
    expired: 'La retención venció',
    expiredCopy: 'El lugar ya no está retenido y esta reserva ya no admite pagos.',
    failed: 'El pago no se confirmó',
    failedCopy: 'No confirmamos ningún cobro. Podés volver a la estadía y pedir ayuda para completar la reserva.',
    code: 'Código de reserva', back: 'Volver a estadías', help: 'Necesito ayuda', notFound: 'No pudimos consultar esta reserva.',
    deposit: 'Seña a pagar', timeLeft: 'Tiempo restante', payOnline: 'Pagar seña con Mercado Pago',
    transferTitle: 'Datos para realizar la transferencia', transferCopy: 'Transferí el importe exacto. La reserva se confirma cuando verifiquemos la acreditación.',
    accountHolder: 'Titular', alias: 'Alias', cvu: 'CVU', copy: 'Copiar', copied: 'Copiado',
    paymentPreparing: 'Estamos preparando el enlace de pago. Esta pantalla se actualiza automáticamente.',
    paymentUnavailable: 'Si todavía no ves los datos de pago, escribinos para completar la seña.',
    mockWarning: 'Cuenta de prueba: no transfieras dinero real.',
  },
  en: {
    checking: 'We are verifying your payment',
    checkingCopy: 'Confirmation may take a few seconds after returning from Mercado Pago.',
    confirmed: 'Payment received!',
    confirmedCopy: 'Your reservation is confirmed. Keep the code for any questions.',
    pending: 'Payment pending confirmation',
    pendingCopy: 'Your place remains held while we wait for payment confirmation.',
    expired: 'The hold has expired',
    expiredCopy: 'Your place is no longer being held and this booking no longer accepts payments.',
    failed: 'Payment was not confirmed',
    failedCopy: 'We have not confirmed any charge. Return to the stay page or ask for help to complete the reservation.',
    code: 'Reservation code', back: 'Back to stays', help: 'I need help', notFound: 'We could not retrieve this reservation.',
    deposit: 'Deposit due', timeLeft: 'Time remaining', payOnline: 'Pay deposit with Mercado Pago',
    transferTitle: 'Transfer details', transferCopy: 'Transfer the exact amount. The booking is confirmed once we verify receipt.',
    accountHolder: 'Account holder', alias: 'Alias', cvu: 'CVU', copy: 'Copy', copied: 'Copied',
    paymentPreparing: 'We are preparing the payment link. This page updates automatically.',
    paymentUnavailable: 'If payment details are not shown yet, contact us to complete the deposit.',
    mockWarning: 'Test account: do not transfer real money.',
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
  const [now, setNow] = useState(Date.now());

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

  useEffect(() => {
    if (status?.reserva.estado !== 'pendiente_pago' || !status.reserva.expires_at) return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [status?.reserva.estado, status?.reserva.expires_at]);

  const confirmed = status?.reserva.estado === 'confirmada';
  const rejected = status?.reserva.estado === 'rechazada' || status?.pago.estado === 'rechazado';
  const expired = status?.reserva.estado === 'pendiente_pago' && Boolean(
    status.reserva.expires_at && remainingSeconds(status.reserva.expires_at, now) === 0,
  );
  const visual = confirmed ? 'confirmed' : rejected || expired || returnState === 'failure' ? 'failed' : 'pending';
  const title = loading ? c.checking : confirmed ? c.confirmed : expired ? c.expired : visual === 'failed' ? c.failed : c.pending;
  const copy = loading ? c.checkingCopy : confirmed ? c.confirmedCopy : expired ? c.expiredCopy : visual === 'failed' ? c.failedCopy : c.pendingCopy;
  const Icon = loading ? Loader2 : visual === 'confirmed' ? CheckCircle2 : visual === 'failed' ? AlertCircle : Clock3;
  const activePending = status?.reserva.estado === 'pendiente_pago' && !expired && !rejected;
  const transferDestination = status?.transferencia.estado === 'ready'
    ? status.transferencia.destino
    : status?.cuenta_cobro.estado === 'ready' ? status.cuenta_cobro.destino : undefined;
  const money = status ? new Intl.NumberFormat(language === 'es' ? 'es-AR' : 'en-US', {
    style: 'currency', currency: status.pago.moneda || 'ARS', maximumFractionDigits: 2,
  }).format(status.pago.monto_centavos / 100) : '';
  const seconds = status?.reserva.expires_at ? remainingSeconds(status.reserva.expires_at, now) : 0;

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
        {activePending && status && (
          <section className="payment-return__payment" aria-label={c.deposit}>
            <div className="payment-return__payment-summary">
              <span>{c.deposit}<strong>{money}</strong></span>
              <span>{c.timeLeft}<strong>{formatRemaining(seconds)}</strong></span>
            </div>
            {status.pago.metodo === 'mercado_pago_checkout' && status.pago.checkout_url ? (
              <a className="payment-return__primary" href={status.pago.checkout_url}>{c.payOnline}</a>
            ) : status.pago.metodo === 'mercado_pago_checkout' ? (
              <p className="payment-return__payment-note">{c.paymentPreparing}</p>
            ) : transferDestination ? (
              <div className="payment-return__transfer">
                <h2>{c.transferTitle}</h2>
                <p>{c.transferCopy}</p>
                {status.cuenta_cobro.simulado && <p className="payment-return__warning">{c.mockWarning}</p>}
                {status.transferencia.destino?.titular && <div className="payment-return__datum"><span>{c.accountHolder}</span><strong>{status.transferencia.destino.titular}</strong></div>}
                {transferDestination.alias && <div className="payment-return__datum"><span>{c.alias}<strong>{transferDestination.alias}</strong></span><CopyButton value={transferDestination.alias} label={`${c.copy} ${c.alias}`} copiedLabel={c.copied} errorLabel={c.paymentUnavailable} size="sm" variant="ghost" showLabel /></div>}
                {transferDestination.cvu && <div className="payment-return__datum"><span>{c.cvu}<strong>{transferDestination.cvu}</strong></span><CopyButton value={transferDestination.cvu} label={`${c.copy} ${c.cvu}`} copiedLabel={c.copied} errorLabel={c.paymentUnavailable} size="sm" variant="ghost" showLabel /></div>}
              </div>
            ) : <p className="payment-return__payment-note">{c.paymentUnavailable}</p>}
          </section>
        )}
        <div className="payment-return__actions">
          <Link to="/estadia">{c.back}</Link>
          <a href={`https://wa.me/${WA_MAGICO}`} target="_blank" rel="noopener noreferrer">{c.help}</a>
        </div>
      </section>
    </main>
  );
}
