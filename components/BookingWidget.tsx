import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle, ArrowLeft, BedDouble, CalendarDays, CheckCircle2, Clock3,
  Copy, CreditCard, Landmark, Loader2, MessageCircle, Minus, Plus, ShieldCheck, Users, Utensils, X,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { WA_MAGICO } from '../src/data/config';
import {
  BookingApiError,
  type BookingMode,
  type MealPlan,
  type PaymentMethod,
  type PublicAccommodation,
  type QuoteRequest,
  type QuoteResponse,
  type ReservationResponse,
  checkPublicAvailability,
  createBookingAttemptKey,
  createPublicQuote,
  createPublicReservation,
  formatRemaining,
  getPublicReservationStatus,
  listPublicAccommodations,
  localTodayIso,
  remainingSeconds,
} from './booking/bookingApi';
import './BookingWidget.css';
import { FloatingUiPortal } from './FloatingUiContext';

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
    paymentMethod: 'Forma de pago', checkoutMethod: 'Mercado Pago', transferMethod: 'Transferencia',
    dni: 'DNI del titular de la cuenta', dniHelp: 'Debe coincidir con el DNI informado por la cuenta desde la que hacés la transferencia.',
    total: 'Total de la estadía', deposit: 'Seña', balance: 'Saldo al llegar',
    quoteValid: 'Cotización válida durante', consentPrefix: 'Leí y acepto los',
    terms: 'Términos y Condiciones', privacy: 'Política de Privacidad', reserve: 'Crear reserva',
    reserving: 'Creando reserva…', privacyNote: 'Usamos tus datos únicamente para gestionar esta reserva.',
    pendingTitle: 'Tu lugar está retenido',
    pendingCopy: 'La reserva se confirma cuando verificamos la recepción de la seña.',
    confirmedTitle: '¡Reserva confirmada!',
    confirmedCopy: 'Tu lugar ya está reservado. Guardá el código para cualquier consulta.',
    confirmedNotice: 'La reserva fue confirmada. No realices otro pago desde esta pantalla.',
    closedTitle: 'La reserva ya no está pendiente',
    closedCopy: 'Esta reserva ya no admite pagos. Iniciá una nueva reserva o comunicate con el equipo.',
    expiredTitle: 'La retención venció',
    expiredCopy: 'El lugar ya no está retenido. Podés descartar esta reserva o iniciar una nueva.',
    reservationCode: 'Código de reserva', retention: 'Tiempo restante para realizar la seña',
    expired: 'La retención venció. Iniciá una nueva reserva para verificar disponibilidad nuevamente.',
    paymentTitle: 'Destino de transferencia', mockWarning: 'Simulado · no usar para cobros reales',
    choosePayment: 'Elegí cómo pagar la seña', transferToMp: 'Transferir a nuestra cuenta de Mercado Pago',
    transferInstructions: 'Transferí el importe exacto de la seña. La reserva quedará pendiente hasta que el equipo verifique el ingreso.',
    accountHolder: 'Titular', manualConfirmation: 'Esperando acreditación',
    payDeposit: 'Pagar seña con Mercado Pago', paymentPending: 'Estamos preparando el pago seguro.',
    retryPayment: 'Reintentar Mercado Pago',
    alias: 'Alias', cvu: 'CVU', copy: 'Copiar', copied: 'Copiado',
    manualPayment: 'El equipo te enviará las instrucciones de pago. Tu reserva ya quedó registrada.',
    whatsapp: 'Abrir conversación', newBooking: 'Nueva reserva', genericError: 'No pudimos completar la solicitud.',
    retry: 'Reintentar', activePending: 'Reserva pendiente', activeConfirmed: 'Reserva confirmada',
    activeExpired: 'Retención vencida', activeClosed: 'Reserva finalizada', openReservation: 'Abrir reserva',
    viewStatus: 'Ver estado', discard: 'Descartar',
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
    paymentMethod: 'Payment method', checkoutMethod: 'Mercado Pago', transferMethod: 'Bank transfer',
    dni: "Account holder's DNI", dniHelp: 'It must match the DNI reported by the account used for the transfer.',
    total: 'Stay total', deposit: 'Deposit', balance: 'Balance on arrival', quoteValid: 'Quote valid for',
    consentPrefix: 'I have read and accept the', terms: 'Terms and Conditions', privacy: 'Privacy Policy',
    reserve: 'Create reservation', reserving: 'Creating reservation…',
    privacyNote: 'We only use your details to manage this reservation.', pendingTitle: 'Your place is being held',
    pendingCopy: 'Your reservation is confirmed once we verify the deposit.', reservationCode: 'Reservation code',
    confirmedTitle: 'Booking confirmed!',
    confirmedCopy: 'Your place is reserved. Keep the booking code for any questions.',
    confirmedNotice: 'The booking has been confirmed. Do not make another payment from this screen.',
    closedTitle: 'This booking is no longer pending',
    closedCopy: 'This booking no longer accepts payments. Start a new booking or contact our team.',
    expiredTitle: 'The hold has expired',
    expiredCopy: 'Your place is no longer being held. You can dismiss this booking or start a new one.',
    retention: 'Time remaining to make the deposit',
    expired: 'The hold has expired. Start a new reservation to check availability again.',
    paymentTitle: 'Transfer destination', mockWarning: 'Simulation · do not use for real payments',
    choosePayment: 'Choose how to pay the deposit', transferToMp: 'Transfer to our Mercado Pago account',
    transferInstructions: 'Transfer the exact deposit amount. The reservation remains pending until our team verifies receipt.',
    accountHolder: 'Account holder', manualConfirmation: 'Awaiting receipt',
    payDeposit: 'Pay deposit with Mercado Pago', paymentPending: 'We are preparing secure payment.',
    retryPayment: 'Retry Mercado Pago',
    alias: 'Alias', cvu: 'CVU', copy: 'Copy', copied: 'Copied',
    manualPayment: 'Our team will send payment instructions. Your reservation has already been registered.',
    whatsapp: 'Open conversation', newBooking: 'New reservation', genericError: 'We could not complete the request.',
    retry: 'Try again', activePending: 'Pending booking', activeConfirmed: 'Booking confirmed',
    activeExpired: 'Hold expired', activeClosed: 'Booking closed', openReservation: 'Open booking',
    viewStatus: 'View status', discard: 'Dismiss',
  },
} as const;

type Step = 1 | 2 | 3;

const ACTIVE_RESERVATION_STORAGE_KEY = 'magico.active-reservation.v1';
const ACTIVE_RESERVATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type ActiveReservationSnapshot = {
  version: 1;
  savedAt: number;
  reservation: ReservationResponse;
  quote: QuoteResponse | null;
  context: {
    checkIn: string;
    checkOut: string;
    people: number;
    type: 'domo' | 'refugio';
    mode: BookingMode;
    mealPlan: MealPlan;
    paymentMethod: PaymentMethod;
  };
};

function readActiveReservation(): ActiveReservationSnapshot | null {
  try {
    const raw = window.localStorage.getItem(ACTIVE_RESERVATION_STORAGE_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as ActiveReservationSnapshot;
    const code = snapshot?.reservation?.reserva?.codigo;
    const context = snapshot?.context;
    if (snapshot.version !== 1 || !/^RES-[0-9a-f-]{36}$/i.test(code || '') ||
        !Number.isFinite(snapshot.savedAt) || Date.now() - snapshot.savedAt > ACTIVE_RESERVATION_MAX_AGE_MS ||
        !context || typeof context.checkIn !== 'string' || typeof context.checkOut !== 'string' ||
        !Number.isSafeInteger(context.people) || context.people < 1 ||
        !['domo', 'refugio'].includes(context.type) ||
        !['compartida', 'privada'].includes(context.mode) ||
        !['desayuno_incluido', 'pension_completa'].includes(context.mealPlan) ||
        !['mercado_pago_checkout', 'transferencia_mp'].includes(context.paymentMethod)) {
      window.localStorage.removeItem(ACTIVE_RESERVATION_STORAGE_KEY);
      return null;
    }
    return snapshot;
  } catch {
    try { window.localStorage.removeItem(ACTIVE_RESERVATION_STORAGE_KEY); } catch { /* optional browser recovery */ }
    return null;
  }
}

function writeActiveReservation(snapshot: ActiveReservationSnapshot) {
  try { window.localStorage.setItem(ACTIVE_RESERVATION_STORAGE_KEY, JSON.stringify(snapshot)); } catch { /* optional browser recovery */ }
}

function clearActiveReservation() {
  try { window.localStorage.removeItem(ACTIVE_RESERVATION_STORAGE_KEY); } catch { /* optional browser recovery */ }
}

function formatMoney(cents: number, currency: string, language: 'es' | 'en') {
  return new Intl.NumberFormat(language === 'es' ? 'es-AR' : 'en-US', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(cents / 100);
}

function apiErrorMessage(error: unknown, fallback: string, language: 'es' | 'en'): string {
  return language === 'es' && error instanceof BookingApiError ? error.message : fallback;
}

export const BookingWidget: React.FC<{
  compact?: boolean;
  onOpenChange?: (open: boolean) => void;
  activeViewport?: 'all' | 'mobile' | 'desktop';
}> = ({ compact = false, onOpenChange, activeViewport = 'all' }) => {
  const { language } = useLanguage();
  const c = COPY[language];
  const today = localTodayIso();
  const [open, setOpen] = useState(false);
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercado_pago_checkout');
  const [payerDni, setPayerDni] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reservation, setReservation] = useState<ReservationResponse | null>(null);
  const [reservationSeconds, setReservationSeconds] = useState(0);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [copied, setCopied] = useState('');
  const [viewportEligible, setViewportEligible] = useState(activeViewport === 'all');
  const idempotencyKey = useRef(createBookingAttemptKey());
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (activeViewport === 'all') {
      setViewportEligible(true);
      return;
    }
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const updateEligibility = () => setViewportEligible(
      activeViewport === 'desktop' ? desktopQuery.matches : !desktopQuery.matches,
    );
    updateEligibility();
    desktopQuery.addEventListener('change', updateEligibility);
    return () => desktopQuery.removeEventListener('change', updateEligibility);
  }, [activeViewport]);

  useEffect(() => {
    const snapshot = readActiveReservation();
    if (!snapshot) return;
    setReservation(snapshot.reservation);
    setQuote(snapshot.quote);
    setCheckIn(snapshot.context.checkIn);
    setCheckOut(snapshot.context.checkOut);
    setPeople(snapshot.context.people);
    setType(snapshot.context.type);
    setMode(snapshot.context.mode);
    setMealPlan(snapshot.context.mealPlan);
    setPaymentMethod(snapshot.context.paymentMethod);
    setStep(3);
  }, []);

  useEffect(() => {
    if (!reservation) return;
    writeActiveReservation({
      version: 1,
      savedAt: Date.now(),
      reservation,
      quote,
      context: { checkIn, checkOut, people, type, mode, mealPlan, paymentMethod },
    });
  }, [reservation, quote, checkIn, checkOut, people, type, mode, mealPlan, paymentMethod]);

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
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>('button, input, a[href], [tabindex]:not([tabindex="-1"])')?.focus();
    }, 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
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
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
      launcherRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!quote?.cotizacion.expiresAt) return;
    const tick = () => setQuoteSeconds(remainingSeconds(quote.cotizacion.expiresAt));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [quote?.cotizacion.expiresAt]);

  useEffect(() => {
    const expiresAt = reservation?.reserva.expires_at;
    if (reservation?.reserva.estado !== 'pendiente_pago' || !expiresAt) {
      setReservationSeconds(0);
      return;
    }
    const tick = () => setReservationSeconds(remainingSeconds(expiresAt));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [reservation?.reserva.estado, reservation?.reserva.expires_at]);

  useEffect(() => {
    const code = reservation?.reserva.codigo;
    const expiresAt = reservation?.reserva.expires_at;
    if (!viewportEligible || !code || reservation.reserva.estado !== 'pendiente_pago' ||
        (expiresAt && remainingSeconds(expiresAt) === 0)) return;

    let cancelled = false;
    let checking = false;
    const refreshStatus = async () => {
      if (checking || document.visibilityState === 'hidden' ||
          (expiresAt && remainingSeconds(expiresAt) === 0)) return;
      checking = true;
      try {
        const status = await getPublicReservationStatus(code);
        if (cancelled || status.reserva.codigo !== code) return;
        setReservation(current => current?.reserva.codigo === code ? {
          ...current,
          reserva: {
            ...current.reserva,
            estado: status.reserva.estado,
            expires_at: status.reserva.expires_at,
          },
        } : current);
      } catch {
        // A temporary status-check failure must not discard a valid reservation.
      } finally {
        checking = false;
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshStatus();
    };

    void refreshStatus();
    const timer = window.setInterval(refreshStatus, 10_000);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [viewportEligible, reservation?.reserva.codigo, reservation?.reserva.estado, reservation?.reserva.expires_at]);

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
      setPaymentMethod(result.metodos_pago[0] || 'mercado_pago_checkout');
      setStep(3);
    } catch (err) {
      setError({ message: apiErrorMessage(err, c.genericError, language), code: err instanceof BookingApiError ? err.code : undefined });
    } finally {
      setLoadingQuote(false);
    }
  }

  async function submitReservation(event: React.FormEvent) {
    event.preventDefault();
    const dniValido = /^\d{7,8}$/.test(payerDni.replace(/\D/g, ''));
    if (!quote?.opcion || !guest.name.trim() || !guest.phone.trim() || !consent ||
        (paymentMethod === 'transferencia_mp' && !dniValido)) return;
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
        paymentMethod,
        payerDni,
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

  async function retryPayment() {
    if (!quote?.opcion) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await createPublicReservation({
        quoteCode: quote.cotizacion.codigo,
        spaceCode: quote.opcion.espacio_codigo,
        guest: { name: guest.name.trim(), phone: guest.phone.trim(), email: guest.email.trim() },
        paymentMethod,
        payerDni,
        idempotencyKey: idempotencyKey.current,
      });
      setReservation(result.data);
    } catch (err) {
      setError({ message: apiErrorMessage(err, c.genericError, language) });
    } finally {
      setSubmitting(false);
    }
  }

  function startAgain() {
    setStep(1); setQuote(null); setReservation(null); setError(null); setConsent(false);
    clearActiveReservation();
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
  const reservationServerPending = reservation?.reserva.estado === 'pendiente_pago';
  const reservationExpired = Boolean(
    reservationServerPending && reservation?.reserva.expires_at && remainingSeconds(reservation.reserva.expires_at) === 0,
  );
  const reservationPending = reservationServerPending && !reservationExpired;
  const reservationConfirmed = reservation?.reserva.estado === 'confirmada';
  const reservationTitle = reservationConfirmed
    ? c.confirmedTitle
    : reservationExpired
      ? c.expiredTitle
      : reservationPending
        ? c.pendingTitle
        : c.closedTitle;
  const reservationCopy = reservationConfirmed
    ? c.confirmedCopy
    : reservationExpired
      ? c.expiredCopy
      : reservationPending
        ? c.pendingCopy
        : c.closedCopy;
  const reservationStatusUrl = reservation
    ? `${reservationPending ? '/reserva-pendiente' : reservationConfirmed ? '/reserva-confirmada' : '/reserva-fallida'}?reserva=${encodeURIComponent(reservation.reserva.codigo)}`
    : '';
  const headerTitle = reservation ? reservationTitle : step === 1 ? c.heroDates : step === 2 ? c.heroStay : c.heroReview;
  const headerCopy = reservation
    ? reservationCopy
    : step === 1
      ? c.heroDatesCopy
      : step === 2
        ? c.heroStayCopy
        : c.heroReviewCopy;

  const bookingFlow = (
    <section ref={dialogRef} className="booking-dialog" role="dialog" aria-modal="true" aria-labelledby="booking-title" tabIndex={-1}>
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
                  <h3>{reservationTitle}</h3>
                  <p>{reservationCopy}</p>
                  <p className="booking-result__code">{c.reservationCode}: <strong>{reservation.reserva.codigo}</strong></p>
                  {reservationConfirmed ? (
                    <div className="booking-notice booking-notice--success"><CheckCircle2 size={20} aria-hidden="true" /> {c.confirmedNotice}</div>
                  ) : reservationExpired ? (
                    <div className="booking-notice booking-notice--error"><AlertCircle size={20} aria-hidden="true" /> {c.expired}</div>
                  ) : reservationPending && (
                    <div className="booking-countdown"><Clock3 size={18} aria-hidden="true" /> {c.retention}: {formatRemaining(reservationSeconds)}</div>
                  )}

                  {quote && (
                    <div className="booking-summary booking-summary--result">
                      <div className="booking-summary__row"><span>{checkIn} → {checkOut} · {people} {c.people.toLowerCase()}</span><strong>{c[type]} · {c[mode]}</strong></div>
                      <div className="booking-summary__row booking-summary__total"><span>{c.total}</span><strong>{formatMoney(quote.precio.subtotal_centavos, quote.precio.moneda, language)}</strong></div>
                      <div className="booking-summary__row"><span>{c.deposit}</span><strong>{formatMoney(quote.precio.sena_centavos, quote.precio.moneda, language)}</strong></div>
                      <div className="booking-summary__row"><span>{c.balance}</span><strong>{formatMoney(quote.precio.saldo_centavos, quote.precio.moneda, language)}</strong></div>
                    </div>
                  )}

                  {reservationPending && (reservation.pago?.estado === 'ready' && reservation.pago.checkout_url ? (
                    <a
                      className="booking-button booking-button--payment"
                      href={reservation.pago.checkout_url}
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <ShieldCheck size={20} aria-hidden="true" /> {c.payDeposit}
                    </a>
                  ) : reservation.pago?.estado === 'pending' ? (
                    <div className="booking-notice">
                      <Loader2 className="booking-loading" size={20} />
                      <span>{c.paymentPending}</span>
                      <button className="booking-link-button" type="button" disabled={submitting} onClick={retryPayment}>{c.retryPayment}</button>
                    </div>
                  ) : reservation.pago?.estado === 'failed' ? (
                    <button className="booking-button booking-button--secondary" type="button" disabled={submitting} onClick={retryPayment}>{c.retryPayment}</button>
                  ) : null)}

                  {reservationPending && reservation.transferencia?.estado === 'ready' && reservation.transferencia.destino ? (
                    <div className="booking-payment">
                      <div className="booking-payment__heading">
                        <strong>{c.transferToMp}</strong>
                        <span>{c.manualConfirmation}</span>
                      </div>
                      <p className="booking-payment__instructions">{c.transferInstructions}</p>
                      {reservation.transferencia.destino.titular && (
                        <div className="booking-payment__value">
                          <span className="booking-payment__text"><span>{c.accountHolder}:</span><strong>{reservation.transferencia.destino.titular}</strong></span>
                        </div>
                      )}
                      {reservation.transferencia.destino.alias && (
                        <div className="booking-payment__value">
                          <span className="booking-payment__text"><span>{c.alias}:</span><strong>{reservation.transferencia.destino.alias}</strong></span>
                          <button className="booking-copy-button" type="button" onClick={() => copyValue('alias', reservation.transferencia?.destino?.alias)} aria-label={`${c.copy} ${c.alias}`}>{copied === 'alias' ? c.copied : <Copy size={18} />}</button>
                        </div>
                      )}
                      {reservation.transferencia.destino.cvu && (
                        <div className="booking-payment__value">
                          <span className="booking-payment__text"><span>{c.cvu}:</span><strong className="booking-payment__identifier">{reservation.transferencia.destino.cvu}</strong></span>
                          <button className="booking-copy-button" type="button" onClick={() => copyValue('cvu', reservation.transferencia?.destino?.cvu)} aria-label={`${c.copy} ${c.cvu}`}>{copied === 'cvu' ? c.copied : <Copy size={18} />}</button>
                        </div>
                      )}
                    </div>
                  ) : reservationPending && reservation.pago?.estado !== 'ready' && reservation.pago?.estado !== 'pending' && (
                    reservation.cuenta_cobro.estado === 'ready' && reservation.cuenta_cobro.destino ? (
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
                  ) : <div className="booking-notice booking-notice--success"><ShieldCheck size={22} /> {c.manualPayment}</div>
                  )}

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
                  <p className="booking-section-title" style={{ marginTop: 20 }}>{c.paymentMethod}</p>
                  <div className="booking-choice-grid">
                    {quote.metodos_pago.map(option => (
                      <button key={option} type="button" className={`booking-choice ${paymentMethod === option ? 'booking-choice--selected' : ''}`} aria-pressed={paymentMethod === option} onClick={() => setPaymentMethod(option)}>
                        {option === 'mercado_pago_checkout' ? <CreditCard size={22} /> : <Landmark size={22} />}
                        {option === 'mercado_pago_checkout' ? c.checkoutMethod : c.transferMethod}
                      </button>
                    ))}
                  </div>
                  {paymentMethod === 'transferencia_mp' && (
                    <label className="booking-field booking-field--full booking-dni-field">
                      {c.dni}
                      <input inputMode="numeric" value={payerDni} onChange={event => setPayerDni(event.target.value)} autoComplete="off" pattern="[0-9. -]{7,12}" required />
                      <small>{c.dniHelp}</small>
                    </label>
                  )}
                  <div className="booking-notice booking-notice--success"><ShieldCheck size={20} /> {c.privacyNote}</div>
                  <label className="booking-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required /><span>{c.consentPrefix} <a href="/terminos-y-condiciones" target="_blank">{c.terms}</a> {language === 'es' ? 'y la' : 'and the'} <a href="/politica-de-privacidad" target="_blank">{c.privacy}</a>.</span></label>
                  {error && <div className="booking-notice booking-notice--error"><AlertCircle size={20} /> {error.message}</div>}
                  <div className="booking-actions">
                    <button className="booking-button booking-button--secondary" type="button" onClick={() => { setStep(2); setError(null); }}><ArrowLeft size={17} /> {c.back}</button>
                    <button className="booking-button" type="submit" disabled={submitting || quoteSeconds <= 0 || !guest.name.trim() || !guest.phone.trim() || !consent || (paymentMethod === 'transferencia_mp' && !/^\d{7,8}$/.test(payerDni.replace(/\D/g, '')))}>{submitting ? <><Loader2 className="booking-loading" size={18} /> {c.reserving}</> : c.reserve}</button>
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
      </div>

      {!open && viewportEligible && reservation && (
        <FloatingUiPortal surface="reservation">
          <aside className={`booking-active-reservation ${reservationConfirmed ? 'booking-active-reservation--confirmed' : ''} ${reservationExpired ? 'booking-active-reservation--expired' : ''}`} aria-live="polite">
          <button className="booking-active-reservation__open" type="button" onClick={() => setOpen(true)} aria-label={c.openReservation}>
            <span className="booking-active-reservation__icon">
              {reservationConfirmed
                ? <CheckCircle2 size={22} aria-hidden="true" />
                : reservationExpired
                  ? <AlertCircle size={22} aria-hidden="true" />
                  : <MessageCircle size={22} aria-hidden="true" />}
            </span>
            <span className="booking-active-reservation__content">
              <strong>{reservationConfirmed ? c.activeConfirmed : reservationExpired ? c.activeExpired : reservationPending ? c.activePending : c.activeClosed}</strong>
              <small>{reservation.reserva.codigo}</small>
              {reservationPending && reservationSeconds > 0 && <span><Clock3 size={14} aria-hidden="true" /> {c.retention}: {formatRemaining(reservationSeconds)}</span>}
            </span>
            <span className="booking-active-reservation__action">{c.openReservation}</span>
          </button>
          <div className="booking-active-reservation__footer">
            <a className="booking-active-reservation__link" href={reservationStatusUrl}>{c.viewStatus}</a>
            {reservationExpired && <button className="booking-active-reservation__discard" type="button" onClick={startAgain}>{c.discard}</button>}
          </div>
          </aside>
        </FloatingUiPortal>
      )}

      {open && createPortal(
        <div className="booking-overlay" role="presentation" onMouseDown={event => event.target === event.currentTarget && setOpen(false)}>
          {bookingFlow}
        </div>,
        document.body,
      )}
    </>
  );
};
