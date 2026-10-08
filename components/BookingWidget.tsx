import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle, ArrowLeft, BedDouble, CalendarDays, CheckCircle2, Clock3,
  Copy, Loader2, MessageCircle, Minus, Plus, ShieldCheck, Users, Utensils, X,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { WA_MAGICO } from '../src/data/config';
import {
  BookingApiError,
  type BookingMode,
  type MealPlan,
  type PublicAccommodation,
  type QuoteRequest,
  type QuoteResponse,
  type ReservationResponse,
  checkPublicAvailability,
  createBookingAttemptKey,
  createPublicQuote,
  createPublicReservation,
  formatRemaining,
  listPublicAccommodations,
  localTodayIso,
  remainingSeconds,
} from './booking/bookingApi';
import './BookingWidget.css';

export const G = { green: '#005333', gold: '#D4AF37', muted: '#4A6070' };

const COPY = {
  es: {
    launcherEyebrow: 'Reserva online', launcherTitle: 'Encontrá tu lugar en la montaña',
    launcherCopy: 'Consultá disponibilidad y precio real antes de reservar.', launcherButton: 'Comenzar reserva',
    title: 'Reservá tu estadía', steps: ['Fechas', 'Estadía', 'Resumen'], close: 'Cerrar reserva',
    heroDates: 'Tu experiencia en la montaña', heroDatesCopy: 'Elegí tus fechas y quiénes vienen.',
    heroStay: 'Elegí cómo querés quedarte', heroStayCopy: 'Seleccioná alojamiento, modalidad y comidas.',
    heroReview: 'Revisá tu reserva', heroReviewCopy: 'Comprobá los datos antes de crear la reserva.',
    startingAt: 'Precio y disponibilidad en tiempo real', nights: 'noches',
    datesTitle: 'Fechas y personas', checkIn: 'Llegada', checkOut: 'Salida', people: 'Personas',
    dateHelp: 'La salida debe ser posterior a la llegada.', continue: 'Continuar', back: 'Volver',
    stayTitle: 'Elegí cómo querés quedarte', accommodation: 'Alojamiento', domo: 'Domo',
    refugio: 'Refugio de piedra', mode: 'Modalidad', compartida: 'Compartida', privada: 'Privada',
    meals: 'Comidas', desayuno_incluido: 'Con desayuno', pension_completa: 'Pensión completa',
    breakfastHelp: 'El desayuno está incluido.', fullBoardHelp: 'Desayuno, almuerzo y cena incluidos.',
    quote: 'Consultar disponibilidad', loadingOptions: 'Cargando opciones disponibles…',
    noOptions: 'No pudimos cargar los alojamientos.',
    domeCopy: 'Dormí rodeado de naturaleza.', refugeCopy: 'Calidez simple en el refugio.',
    unavailable: 'No hay disponibilidad para esa combinación. Probá con otras fechas u opciones.',
    contactSupport: 'Consultar por WhatsApp', reviewTitle: 'Revisá y completá tus datos',
    name: 'Nombre y apellido', phone: 'WhatsApp', email: 'Email', optional: 'Opcional',
    total: 'Total de la estadía', deposit: 'Seña', balance: 'Saldo al llegar',
    quoteValid: 'Cotización válida durante', consentPrefix: 'Leí y acepto los',
    terms: 'Términos y Condiciones', privacy: 'Política de Privacidad', reserve: 'Crear reserva',
    reserving: 'Creando reserva…', privacyNote: 'Usamos tus datos únicamente para gestionar esta reserva.',
    pendingTitle: 'Tu lugar está retenido',
    pendingCopy: 'La reserva se confirma cuando verificamos la recepción de la seña.',
    reservationCode: 'Código de reserva', retention: 'Tiempo restante para realizar la seña',
    expired: 'La retención venció. Iniciá una nueva reserva para verificar disponibilidad nuevamente.',
    paymentTitle: 'Destino de transferencia', mockWarning: 'Simulado · no usar para cobros reales',
    alias: 'Alias', cvu: 'CVU', copy: 'Copiar', copied: 'Copiado',
    manualPayment: 'El equipo te enviará las instrucciones de pago. Tu reserva ya quedó registrada.',
    whatsapp: 'Abrir conversación', newBooking: 'Nueva reserva', genericError: 'No pudimos completar la solicitud.',
    retry: 'Reintentar',
  },
  en: {
    launcherEyebrow: 'Book online', launcherTitle: 'Find your place in the mountains',
    launcherCopy: 'Check real availability and pricing before booking.', launcherButton: 'Start booking',
    title: 'Book your stay', steps: ['Dates', 'Stay', 'Summary'], close: 'Close booking',
    heroDates: 'Your mountain experience', heroDatesCopy: 'Choose your dates and who is coming.',
    heroStay: 'Choose how you want to stay', heroStayCopy: 'Select accommodation, room type and meals.',
    heroReview: 'Review your booking', heroReviewCopy: 'Check the details before creating your reservation.',
    startingAt: 'Live pricing and availability', nights: 'nights',
    datesTitle: 'Dates and guests', checkIn: 'Arrival', checkOut: 'Departure', people: 'Guests',
    dateHelp: 'Departure must be after arrival.', continue: 'Continue', back: 'Back',
    stayTitle: 'Choose how you want to stay', accommodation: 'Accommodation', domo: 'Dome',
    refugio: 'Stone shelter', mode: 'Room type', compartida: 'Shared', privada: 'Private',
    meals: 'Meals', desayuno_incluido: 'Breakfast included', pension_completa: 'Full board',
    breakfastHelp: 'Breakfast is included.', fullBoardHelp: 'Breakfast, lunch and dinner included.',
    quote: 'Check availability', loadingOptions: 'Loading available options…',
    noOptions: 'We could not load accommodation options.',
    domeCopy: 'Sleep surrounded by nature.', refugeCopy: 'Simple warmth in the stone shelter.',
    unavailable: 'There is no availability for that combination. Try other dates or options.',
    contactSupport: 'Ask on WhatsApp', reviewTitle: 'Review and complete your details',
    name: 'Full name', phone: 'WhatsApp', email: 'Email', optional: 'Optional',
    total: 'Stay total', deposit: 'Deposit', balance: 'Balance on arrival', quoteValid: 'Quote valid for',
    consentPrefix: 'I have read and accept the', terms: 'Terms and Conditions', privacy: 'Privacy Policy',
    reserve: 'Create reservation', reserving: 'Creating reservation…',
    privacyNote: 'We only use your details to manage this reservation.', pendingTitle: 'Your place is being held',
    pendingCopy: 'Your reservation is confirmed once we verify the deposit.', reservationCode: 'Reservation code',
    retention: 'Time remaining to make the deposit',
    expired: 'The hold has expired. Start a new reservation to check availability again.',
    paymentTitle: 'Transfer destination', mockWarning: 'Simulation · do not use for real payments',
    alias: 'Alias', cvu: 'CVU', copy: 'Copy', copied: 'Copied',
    manualPayment: 'Our team will send payment instructions. Your reservation has already been registered.',
    whatsapp: 'Open conversation', newBooking: 'New reservation', genericError: 'We could not complete the request.',
    retry: 'Try again',
  },
} as const;

type Step = 1 | 2 | 3;

function formatMoney(cents: number, currency: string, language: 'es' | 'en') {
  return new Intl.NumberFormat(language === 'es' ? 'es-AR' : 'en-US', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(cents / 100);
}

function apiErrorMessage(error: unknown, fallback: string, language: 'es' | 'en'): string {
  return language === 'es' && error instanceof BookingApiError ? error.message : fallback;
}

export const BookingWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language } = useLanguage();
  const c = COPY[language];
  const today = localTodayIso();
  const [open, setOpen] = useState(false);
  const [mobileFlow, setMobileFlow] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [people, setPeople] = useState(2);
  const [accommodations, setAccommodations] = useState<PublicAccommodation[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [type, setType] = useState<'domo' | 'refugio'>('domo');
  const [mode, setMode] = useState<BookingMode>('compartida');
  const [mealPlan, setMealPlan] = useState<MealPlan>('desayuno_incluido');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteSeconds, setQuoteSeconds] = useState(0);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [guest, setGuest] = useState({ name: '', phone: '', email: '' });
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reservation, setReservation] = useState<ReservationResponse | null>(null);
  const [reservationSeconds, setReservationSeconds] = useState(0);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [copied, setCopied] = useState('');
  const idempotencyKey = useRef(createBookingAttemptKey());
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const update = () => setMobileFlow(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const availableTypes = useMemo(() => {
    const unique = new Set(accommodations.map(item => item.tipo));
    return (['domo', 'refugio'] as const).filter(item => unique.has(item));
  }, [accommodations]);

  const availableModes = useMemo(() => {
    const unique = new Set(accommodations
      .filter(item => item.tipo === type)
      .flatMap(item => item.modalidades.map(option => option.codigo)));
    return (['compartida', 'privada'] as const).filter(item => unique.has(item));
  }, [accommodations, type]);

  useEffect(() => {
    if (!open || optionsLoaded) return;
    let cancelled = false;
    setLoadingOptions(true);
    setError(null);
    listPublicAccommodations()
      .then(items => {
        if (cancelled) return;
        setAccommodations(items);
        const firstType = items.find(item => item.tipo === 'domo')?.tipo || items[0]?.tipo;
        if (firstType) setType(firstType);
      })
      .catch(err => !cancelled && setError({ message: apiErrorMessage(err, c.noOptions, language) }))
      .finally(() => {
        if (!cancelled) {
          setLoadingOptions(false);
          setOptionsLoaded(true);
        }
      });
    return () => { cancelled = true; };
  }, [open, optionsLoaded, c.noOptions, language]);

  useEffect(() => {
    if (!availableModes.includes(mode) && availableModes.length > 0) setMode(availableModes[0]);
  }, [availableModes, mode]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    if (mobileFlow) document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>('button, input, a[href], [tabindex]:not([tabindex="-1"])')?.focus();
    }, 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (!mobileFlow || event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      if (mobileFlow) document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
      launcherRef.current?.focus();
    };
  }, [open, mobileFlow]);

  useEffect(() => {
    if (!quote?.cotizacion.expiresAt) return;
    const tick = () => setQuoteSeconds(remainingSeconds(quote.cotizacion.expiresAt));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [quote?.cotizacion.expiresAt]);

  useEffect(() => {
    if (!reservation?.reserva.expires_at) return;
    const tick = () => setReservationSeconds(remainingSeconds(reservation.reserva.expires_at));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [reservation?.reserva.expires_at]);

  const quoteRequest: QuoteRequest = {
    check_in: checkIn, check_out: checkOut, personas: people,
    tipo_alojamiento: type, modalidad: mode, contexto: 'general', regimen_alimentacion: mealPlan,
  };

  function resetQuote() { setQuote(null); setError(null); }

  function retryOptions() {
    setError(null);
    setAccommodations([]);
    setOptionsLoaded(false);
  }

  function goToStay() {
    setError(null);
    if (!checkIn || !checkOut || checkOut <= checkIn || people < 1) {
      setError({ message: c.dateHelp });
      return;
    }
    setStep(2);
  }

  async function quoteStay() {
    setLoadingQuote(true);
    setError(null);
    try {
      if (!(await checkPublicAvailability(quoteRequest))) {
        setQuote(null);
        setError({ message: c.unavailable, code: 'NO_DISPONIBLE' });
        return;
      }
      const result = await createPublicQuote(quoteRequest);
      if (result.estado !== 'disponible' || !result.opcion) {
        setError({ message: c.unavailable, code: result.motivo_codigo });
        return;
      }
      setQuote(result);
      setStep(3);
    } catch (err) {
      setError({ message: apiErrorMessage(err, c.genericError, language), code: err instanceof BookingApiError ? err.code : undefined });
    } finally {
      setLoadingQuote(false);
    }
  }

  async function submitReservation(event: React.FormEvent) {
    event.preventDefault();
    if (!quote?.opcion || !guest.name.trim() || !guest.phone.trim() || !consent) return;
    if (quoteSeconds <= 0) {
      setError({ message: c.expired, code: 'COTIZACION_VENCIDA' });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await createPublicReservation({
        quoteCode: quote.cotizacion.codigo,
        spaceCode: quote.opcion.espacio_codigo,
        guest: { name: guest.name.trim(), phone: guest.phone.trim(), email: guest.email.trim() },
        idempotencyKey: idempotencyKey.current,
      });
      setReservation(result.data);
    } catch (err) {
      const code = err instanceof BookingApiError ? err.code : undefined;
      setError({ message: apiErrorMessage(err, c.genericError, language), code });
      if (code === 'COTIZACION_VENCIDA' || code === 'INVENTARIO_NO_DISPONIBLE') setQuote(null);
    } finally {
      setSubmitting(false);
    }
  }

  function startAgain() {
    setStep(1); setQuote(null); setReservation(null); setError(null); setConsent(false);
    idempotencyKey.current = createBookingAttemptKey();
  }

  async function copyValue(label: string, value?: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1800);
  }

  const whatsappText = reservation
    ? `${language === 'es' ? 'Hola, necesito ayuda con mi reserva' : 'Hi, I need help with my reservation'} ${reservation.reserva.codigo}.`
    : language === 'es' ? 'Hola, necesito ayuda para reservar una estadía.' : 'Hi, I need help booking a stay.';
  const whatsappUrl = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(whatsappText)}`;
  const stayNights = checkIn && checkOut
    ? Math.max(0, Math.round((Date.parse(`${checkOut}T12:00:00Z`) - Date.parse(`${checkIn}T12:00:00Z`)) / 86_400_000))
    : 0;
  const headerTitle = reservation ? c.pendingTitle : step === 1 ? c.heroDates : step === 2 ? c.heroStay : c.heroReview;
  const headerCopy = reservation
    ? c.pendingCopy
    : step === 1
      ? c.heroDatesCopy
      : step === 2
        ? c.heroStayCopy
        : c.heroReviewCopy;

  const bookingFlow = (
    <section ref={dialogRef} className="booking-dialog" role="dialog" aria-modal={mobileFlow || undefined} aria-labelledby="booking-title" tabIndex={-1}>
            <header className="booking-flow__header">
              <p className="booking-flow__eyebrow">{c.launcherEyebrow}</p>
              <h2 id="booking-title">{headerTitle}</h2>
              {!reservation && step === 1 && <strong className="booking-flow__price-lead">{c.startingAt}</strong>}
              <p className="booking-flow__intro">{headerCopy}</p>
              <button className="booking-icon-button booking-flow__close" type="button" onClick={() => setOpen(false)} aria-label={c.close}><X aria-hidden="true" /></button>
            </header>

            {!reservation && (
              <nav className="booking-steps" aria-label={c.title}>
                {c.steps.map((label, index) => {
                  const number = (index + 1) as Step;
                  const state = number === step ? 'booking-step--active' : number < step ? 'booking-step--done' : '';
                  return <span key={label} className={`booking-step ${state}`} data-step={number} aria-current={number === step ? 'step' : undefined}>{label}</span>;
                })}
              </nav>
            )}

            <div className="booking-flow__body" aria-live="polite">
              {reservation ? (
                <div className="booking-panel booking-result">
                  <div className="booking-result__icon"><CheckCircle2 size={38} aria-hidden="true" /></div>
                  <h3>{c.pendingTitle}</h3>
                  <p>{c.pendingCopy}</p>
                  <p className="booking-result__code">{c.reservationCode}: <strong>{reservation.reserva.codigo}</strong></p>
                  {reservationSeconds > 0
                    ? <div className="booking-countdown"><Clock3 size={18} aria-hidden="true" /> {c.retention}: {formatRemaining(reservationSeconds)}</div>
                    : <div className="booking-notice booking-notice--error"><AlertCircle size={20} aria-hidden="true" /> {c.expired}</div>}

                  {quote && (
                    <div className="booking-summary booking-summary--result">
                      <div className="booking-summary__row"><span>{checkIn} → {checkOut} · {people} {c.people.toLowerCase()}</span><strong>{c[type]} · {c[mode]}</strong></div>
                      <div className="booking-summary__row booking-summary__total"><span>{c.total}</span><strong>{formatMoney(quote.precio.subtotal_centavos, quote.precio.moneda, language)}</strong></div>
                      <div className="booking-summary__row"><span>{c.deposit}</span><strong>{formatMoney(quote.precio.sena_centavos, quote.precio.moneda, language)}</strong></div>
                      <div className="booking-summary__row"><span>{c.balance}</span><strong>{formatMoney(quote.precio.saldo_centavos, quote.precio.moneda, language)}</strong></div>
                    </div>
                  )}

                  {reservation.cuenta_cobro.estado === 'ready' && reservation.cuenta_cobro.destino ? (
                    <div className="booking-payment">
                      <strong>{c.paymentTitle}</strong>
                      {reservation.cuenta_cobro.simulado && <span className="booking-notice">{c.mockWarning}</span>}
                      {reservation.cuenta_cobro.destino.alias && (
                        <div className="booking-payment__value">
                          <span className="booking-payment__text"><span>{c.alias}:</span><strong>{reservation.cuenta_cobro.destino.alias}</strong></span>
                          <button className="booking-copy-button" type="button" onClick={() => copyValue('alias', reservation.cuenta_cobro.destino?.alias)} aria-label={`${c.copy} ${c.alias}`}>{copied === 'alias' ? c.copied : <Copy size={18} />}</button>
                        </div>
                      )}
                      {reservation.cuenta_cobro.destino.cvu && (
                        <div className="booking-payment__value">
                          <span className="booking-payment__text"><span>{c.cvu}:</span><strong className="booking-payment__identifier">{reservation.cuenta_cobro.destino.cvu}</strong></span>
                          <button className="booking-copy-button" type="button" onClick={() => copyValue('cvu', reservation.cuenta_cobro.destino?.cvu)} aria-label={`${c.copy} ${c.cvu}`}>{copied === 'cvu' ? c.copied : <Copy size={18} />}</button>
                        </div>
                      )}
                    </div>
                  ) : <div className="booking-notice booking-notice--success"><ShieldCheck size={22} /> {c.manualPayment}</div>}

                  <div className="booking-actions">
                    <button className="booking-button booking-button--secondary" type="button" onClick={startAgain}>{c.newBooking}</button>
                    <a className="booking-button" href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}><MessageCircle size={19} /> {c.whatsapp}</a>
                  </div>
                </div>
              ) : step === 1 ? (
                <div className="booking-panel">
                  <p className="booking-section-title"><CalendarDays size={16} /> {c.datesTitle}</p>
                  <div className="booking-date-grid">
                    <label className="booking-date-card"><CalendarDays size={28} /><span><small>{c.checkIn}</small><input aria-label={c.checkIn} type="date" min={today} value={checkIn} onChange={event => { setCheckIn(event.target.value); if (checkOut && event.target.value >= checkOut) setCheckOut(''); resetQuote(); }} required /></span></label>
                    <label className="booking-date-card"><CalendarDays size={28} /><span><small>{c.checkOut}</small><input aria-label={c.checkOut} type="date" min={checkIn || today} value={checkOut} onChange={event => { setCheckOut(event.target.value); resetQuote(); }} required /></span></label>
                  </div>
                  {stayNights > 0 && <div className="booking-night-count"><BedDouble size={20} /> {stayNights} {c.nights}</div>}
                  <div className="booking-guests-row">
                    <span><Users size={27} /> <strong>{c.people}</strong></span>
                    <div className="booking-counter" aria-label={c.people}>
                      <button type="button" aria-label={`${c.people} -`} onClick={() => { setPeople(value => Math.max(1, value - 1)); resetQuote(); }}><Minus /></button>
                      <output aria-live="polite">{people}</output>
                      <button type="button" aria-label={`${c.people} +`} onClick={() => { setPeople(value => value + 1); resetQuote(); }}><Plus /></button>
                    </div>
                  </div>
                  {error && <div className="booking-notice booking-notice--error"><AlertCircle size={20} /> {error.message}</div>}
                  <div className="booking-actions"><button className="booking-button" type="button" onClick={goToStay}>{c.continue}</button></div>
                </div>
              ) : step === 2 ? (
                <div className="booking-panel">
                  <p className="booking-section-title"><BedDouble size={16} /> {c.stayTitle}</p>
                  {loadingOptions ? <div className="booking-notice"><Loader2 className="booking-loading" size={20} /> {c.loadingOptions}</div> : (
                    <>
                      <p className="booking-section-title" style={{ marginTop: 20 }}>{c.accommodation}</p>
                      <div className="booking-stay-grid">{availableTypes.map(option => (
                        <button key={option} type="button" className={`booking-stay-card ${type === option ? 'booking-choice--selected' : ''}`} aria-pressed={type === option} onClick={() => { setType(option); resetQuote(); }}>
                          <img src={option === 'domo' ? '/uploads/domos_2.jpg' : '/uploads/habitaciones.webp'} alt="" />
                          <span><strong>{c[option]}</strong><small>{option === 'domo' ? c.domeCopy : c.refugeCopy}</small></span>
                          <CheckCircle2 className="booking-stay-card__check" size={25} aria-hidden="true" />
                        </button>
                      ))}</div>
                      <p className="booking-section-title">{c.mode}</p>
                      <div className="booking-choice-grid">{availableModes.map(option => <button key={option} type="button" className={`booking-choice ${mode === option ? 'booking-choice--selected' : ''}`} aria-pressed={mode === option} onClick={() => { setMode(option); resetQuote(); }}><Users size={22} /> {c[option]}</button>)}</div>
                      <p className="booking-section-title">{c.meals}</p>
                      <div className="booking-choice-grid">{(['desayuno_incluido', 'pension_completa'] as const).map(option => <button key={option} type="button" className={`booking-choice ${mealPlan === option ? 'booking-choice--selected' : ''}`} aria-pressed={mealPlan === option} onClick={() => { setMealPlan(option); resetQuote(); }}><Utensils size={22} /><span>{c[option]}<br /><small>{option === 'desayuno_incluido' ? c.breakfastHelp : c.fullBoardHelp}</small></span></button>)}</div>
                    </>
                  )}
                  {error && <div className="booking-notice booking-notice--error"><AlertCircle size={20} /><span>{error.message}{error.code === 'NO_DISPONIBLE' && <> <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">{c.contactSupport}</a></>}</span></div>}
                  {!loadingOptions && optionsLoaded && availableTypes.length === 0 && (
                    <button className="booking-button booking-button--secondary" type="button" onClick={retryOptions}>{c.retry}</button>
                  )}
                  <div className="booking-actions">
                    <button className="booking-button booking-button--secondary" type="button" onClick={() => { setStep(1); setError(null); }}><ArrowLeft size={17} /> {c.back}</button>
                    <button className="booking-button" type="button" disabled={loadingOptions || loadingQuote || availableModes.length === 0} onClick={quoteStay}>{loadingQuote ? <><Loader2 className="booking-loading" size={18} /> {c.quote}</> : c.quote}</button>
                  </div>
                </div>
              ) : quote ? (
                <form className="booking-panel" onSubmit={submitReservation}>
                  <p className="booking-section-title"><Users size={16} /> {c.reviewTitle}</p>
                  <div className="booking-summary">
                    <div className="booking-summary__row"><span>{checkIn} → {checkOut} · {people} {c.people.toLowerCase()}</span><strong>{c[type]} · {c[mode]}</strong></div>
                    <div className="booking-summary__row"><span>{c[mealPlan]}</span><strong>{formatMoney(quote.precio.alimentacion_centavos, quote.precio.moneda, language)}</strong></div>
                    <div className="booking-summary__row booking-summary__total"><span>{c.total}</span><strong>{formatMoney(quote.precio.subtotal_centavos, quote.precio.moneda, language)}</strong></div>
                    <div className="booking-summary__row"><span>{c.deposit}</span><strong>{formatMoney(quote.precio.sena_centavos, quote.precio.moneda, language)}</strong></div>
                    <div className="booking-summary__row"><span>{c.balance}</span><strong>{formatMoney(quote.precio.saldo_centavos, quote.precio.moneda, language)}</strong></div>
                  </div>
                  <div className="booking-notice"><Clock3 size={20} /> {quoteSeconds > 0 ? `${c.quoteValid}: ${formatRemaining(quoteSeconds)}` : c.expired}</div>
                  <div className="booking-grid">
                    <label className="booking-field booking-field--full">{c.name}<input value={guest.name} onChange={event => setGuest({ ...guest, name: event.target.value })} autoComplete="name" required /></label>
                    <label className="booking-field">{c.phone}<input type="tel" value={guest.phone} onChange={event => setGuest({ ...guest, phone: event.target.value })} autoComplete="tel" required /></label>
                    <label className="booking-field">{c.email} <small>{c.optional}</small><input type="email" value={guest.email} onChange={event => setGuest({ ...guest, email: event.target.value })} autoComplete="email" /></label>
                  </div>
                  <div className="booking-notice booking-notice--success"><ShieldCheck size={20} /> {c.privacyNote}</div>
                  <label className="booking-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required /><span>{c.consentPrefix} <a href="/terminos-y-condiciones" target="_blank">{c.terms}</a> {language === 'es' ? 'y la' : 'and the'} <a href="/politica-de-privacidad" target="_blank">{c.privacy}</a>.</span></label>
                  {error && <div className="booking-notice booking-notice--error"><AlertCircle size={20} /> {error.message}</div>}
                  <div className="booking-actions">
                    <button className="booking-button booking-button--secondary" type="button" onClick={() => { setStep(2); setError(null); }}><ArrowLeft size={17} /> {c.back}</button>
                    <button className="booking-button" type="submit" disabled={submitting || quoteSeconds <= 0 || !guest.name.trim() || !guest.phone.trim() || !consent}>{submitting ? <><Loader2 className="booking-loading" size={18} /> {c.reserving}</> : c.reserve}</button>
                  </div>
                </form>
              ) : (
                <div className="booking-panel">
                  <div className="booking-notice booking-notice--error"><AlertCircle size={20} /> {error?.message || c.expired}</div>
                  <div className="booking-actions"><button className="booking-button" type="button" onClick={() => { setStep(2); setError(null); }}>{c.retry}</button></div>
                </div>
              )}
            </div>
    </section>
  );

  return (
    <>
      <div className={`booking-widget ${open ? 'booking-widget--open' : ''}`}>
        {!open && (
          <div className="booking-launcher" style={compact ? { padding: 14 } : undefined}>
            <p className="booking-launcher__eyebrow">{c.launcherEyebrow}</p>
            <h3 className="booking-launcher__title">{c.launcherTitle}</h3>
            <p className="booking-launcher__copy">{c.launcherCopy}</p>
            <button ref={launcherRef} className="booking-button" type="button" onClick={() => setOpen(true)}>
              <CalendarDays size={18} aria-hidden="true" /> {c.launcherButton}
            </button>
          </div>
        )}
        {open && !mobileFlow && <div className="booking-inline">{bookingFlow}</div>}
      </div>

      {open && mobileFlow && createPortal(
        <div className="booking-overlay" role="presentation" onMouseDown={event => event.target === event.currentTarget && setOpen(false)}>
          {bookingFlow}
        </div>,
        document.body,
      )}
    </>
  );
};
