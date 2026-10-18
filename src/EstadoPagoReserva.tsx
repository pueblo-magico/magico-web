import React, { useEffect, useState } from 'react';
import {
  AlertCircle, BedDouble, CalendarDays, CheckCircle2, Clock3, Download,
  Loader2, ReceiptText, UtensilsCrossed, Users,
} from 'lucide-react';
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
    details: 'Detalles de tu reserva', checkIn: 'Llegada', checkOut: 'Salida', nights: 'noches', guests: 'personas',
    accommodation: 'Alojamiento', modality: 'Modalidad', meals: 'Alimentación', preparation: 'Preparación de camas',
    breakfast: 'Desayuno incluido', fullBoard: 'Pensión completa · desayuno, almuerzo y cena',
    private: 'Privada', shared: 'Compartida', camping: 'Camping',
    total: 'Total de la estadía', depositPaid: 'Seña acreditada', balance: 'Saldo pendiente',
    createdAt: 'Reserva creada', confirmedAt: 'Confirmada', paymentMethod: 'Forma de pago',
    mercadoPago: 'Mercado Pago', transfer: 'Transferencia',
    download: 'Descargar confirmación PDF', downloading: 'Preparando PDF…', downloadError: 'No pudimos generar el PDF. Intentá nuevamente.',
    impact: 'El 10% de tu inversión va directo a reforestar tabaquillos y restaurar nuestras sierras.',
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
    details: 'Your booking details', checkIn: 'Arrival', checkOut: 'Departure', nights: 'nights', guests: 'guests',
    accommodation: 'Accommodation', modality: 'Room type', meals: 'Meals', preparation: 'Bed setup',
    breakfast: 'Breakfast included', fullBoard: 'Full board · breakfast, lunch and dinner',
    private: 'Private', shared: 'Shared', camping: 'Camping',
    total: 'Stay total', depositPaid: 'Deposit received', balance: 'Balance due',
    createdAt: 'Booking created', confirmedAt: 'Confirmed', paymentMethod: 'Payment method',
    mercadoPago: 'Mercado Pago', transfer: 'Bank transfer',
    download: 'Download confirmation PDF', downloading: 'Preparing PDF…', downloadError: 'We could not generate the PDF. Please try again.',
    impact: '10% of your investment goes directly to reforesting tabaquillo trees and restoring our mountains.',
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
  const [pdfState, setPdfState] = useState<'idle' | 'loading' | 'error'>('idle');

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
  const formatMoney = (centavos: number, moneda: string) => new Intl.NumberFormat(language === 'es' ? 'es-AR' : 'en-US', {
    style: 'currency', currency: moneda || 'ARS', maximumFractionDigits: 2,
  }).format(centavos / 100);
  const money = status ? formatMoney(status.pago.monto_centavos, status.pago.moneda) : '';
  const seconds = status?.reserva.expires_at ? remainingSeconds(status.reserva.expires_at, now) : 0;
  const formatDate = (value: string) => new Intl.DateTimeFormat(language === 'es' ? 'es-AR' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`));
  const formatDateTime = (value: string | null) => value ? new Intl.DateTimeFormat(language === 'es' ? 'es-AR' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value)) : '—';
  const modality = status?.estadia.modalidad === 'privada' ? c.private
    : status?.estadia.modalidad === 'compartida' ? c.shared
      : status?.estadia.modalidad === 'camping' ? c.camping : status?.estadia.modalidad;
  const mealPlan = status?.estadia.regimen_alimentacion === 'pension_completa' ? c.fullBoard : c.breakfast;
  const paymentMethod = status?.pago.metodo === 'transferencia_mp' ? c.transfer : c.mercadoPago;

  const downloadConfirmation = async () => {
    if (!status || !confirmed || pdfState === 'loading') return;
    setPdfState('loading');
    try {
      const [{ pdf }, { ConfirmacionReservaPdf }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./components/pdf/ConfirmacionReservaPdf'),
      ]);
      const blob = await pdf(<ConfirmacionReservaPdf status={status} locale={language} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `confirmacion-${status.reserva.codigo}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setPdfState('idle');
    } catch {
      setPdfState('error');
    }
  };

  return (
    <main className="payment-return">
      <section className={`payment-return__card payment-return__card--${visual}`}>
        <header className="payment-return__hero">
          <Icon className={loading ? 'payment-return__spinner' : ''} size={52} aria-hidden="true" />
          <p className="payment-return__eyebrow">Pueblo Mágico</p>
          <h1>{failed ? c.notFound : title}</h1>
          {!failed && <p>{copy}</p>}
          {(status?.reserva.codigo || code) && (
            <p className="payment-return__code">{c.code}: <strong>{status?.reserva.codigo || code}</strong></p>
          )}
        </header>
        {status && !failed && (
          <section className="payment-return__details" aria-labelledby="reservation-details-title">
            <h2 id="reservation-details-title">{c.details}</h2>
            <div className="payment-return__details-grid">
              <Detail icon={<CalendarDays />} label={c.checkIn} value={`${formatDate(status.estadia.check_in)} · 13:00`} />
              <Detail icon={<CalendarDays />} label={c.checkOut} value={`${formatDate(status.estadia.check_out)} · 11:00`} />
              <Detail icon={<ReceiptText />} label={c.nights} value={String(status.estadia.noches)} />
              <Detail icon={<Users />} label={c.guests} value={String(status.estadia.personas)} />
              <Detail icon={<BedDouble />} label={c.accommodation} value={status.estadia.alojamiento.nombre} />
              <Detail icon={<BedDouble />} label={c.modality} value={modality || '—'} />
              <Detail icon={<UtensilsCrossed />} label={c.meals} value={mealPlan} />
              {status.estadia.preparacion && <Detail icon={<BedDouble />} label={c.preparation} value={status.estadia.preparacion.nombre} />}
            </div>
            <div className="payment-return__price-summary">
              <span>{c.total}<strong>{formatMoney(status.precio.total_centavos, status.precio.moneda)}</strong></span>
              <span>{confirmed ? c.depositPaid : c.deposit}<strong>{formatMoney(status.precio.sena_centavos, status.precio.moneda)}</strong></span>
              <span>{c.balance}<strong>{formatMoney(status.precio.saldo_centavos, status.precio.moneda)}</strong></span>
            </div>
            <dl className="payment-return__metadata">
              <div><dt>{c.createdAt}</dt><dd>{formatDateTime(status.reserva.created_at)}</dd></div>
              {confirmed && <div><dt>{c.confirmedAt}</dt><dd>{formatDateTime(status.reserva.confirmed_at)}</dd></div>}
              <div><dt>{c.paymentMethod}</dt><dd>{paymentMethod}</dd></div>
            </dl>
            <p className="payment-return__impact">{c.impact}</p>
            {confirmed && (
              <div className="payment-return__download">
                <button type="button" onClick={downloadConfirmation} disabled={pdfState === 'loading'}>
                  {pdfState === 'loading' ? <Loader2 className="payment-return__spinner" /> : <Download />}
                  {pdfState === 'loading' ? c.downloading : c.download}
                </button>
                {pdfState === 'error' && <p role="alert">{c.downloadError}</p>}
              </div>
            )}
          </section>
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

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="payment-return__detail">
      <span className="payment-return__detail-icon" aria-hidden="true">{icon}</span>
      <span><small>{label}</small><strong>{value}</strong></span>
    </div>
  );
}
