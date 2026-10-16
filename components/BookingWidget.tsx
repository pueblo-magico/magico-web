import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle, ArrowLeft, ArrowRight, BedDouble, CalendarDays, CheckCircle2, ChevronRight, Clock3,
  Copy, CreditCard, Landmark, Leaf, Loader2, Mail, MessageCircle, Minus, Phone, Plus, ShieldCheck,
  UserRound, Users, Utensils, X,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { RESERVATION_START_PATH, WA_MAGICO } from '../src/data/config';
import {
  BookingApiError,
  type AccommodationType,
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
import { estimateBookingPrice, stayNightDates } from './booking/pricingPreview';
import { usePublicPricingSummaries, usePublicPricingSummary } from './booking/usePublicPricingSummary';

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
    dateHelp: 'La salida debe ser posterior a la llegada.', continue: 'Continuar', back: 'Volver', edit: 'Editar',
    dateNoticeTitle: 'Disponibilidad en tiempo real', dateNotice: 'Verificamos las fechas, el alojamiento y el precio antes de crear la reserva.',
    selectionPending: 'El precio se calcula al verificar disponibilidad.', selectionTitle: 'Tu reserva',
    stayTitle: 'Elegí cómo querés quedarte', accommodation: 'Alojamiento', domo: 'Domo',
    refugio: 'Refugio de piedra', camping: 'Camping', mode: 'Modalidad', compartida: 'Compartida', privada: 'Privada',
    meals: 'Comidas', desayuno_incluido: 'Con desayuno', pension_completa: 'Pensión completa',
    breakfastHelp: 'El desayuno está incluido.', fullBoardHelp: 'Desayuno, almuerzo y cena incluidos.',
    impactTitle: 'Tu estadía regenera la montaña',
    impactCopy: 'El 10% de tu inversión va directo a reforestar tabaquillos y restaurar nuestras sierras.',
    quote: 'Consultar disponibilidad', loadingOptions: 'Cargando opciones disponibles…',
    noOptions: 'No pudimos cargar los alojamientos.',
    domeCopy: 'Dormí rodeado de naturaleza.', refugeCopy: 'Calidez simple en el refugio.', campingCopy: 'Acampá en un área habilitada en plena naturaleza.',
    unavailable: 'No hay disponibilidad para esa combinación. Probá con otras fechas u opciones.',
    contactSupport: 'Consultar por WhatsApp', reviewTitle: 'Contanos quién viene',
    name: 'Nombre y apellido', phone: 'WhatsApp', email: 'Email',
    contactIntro: 'Completá tus datos para crear la reserva. No necesitás una cuenta.',
    paymentMethod: 'Forma de pago', checkoutMethod: 'Mercado Pago', transferMethod: 'Transferencia',
    dni: 'DNI del titular de la cuenta', dniHelp: 'Debe coincidir con el DNI informado por la cuenta desde la que hacés la transferencia.',
    total: 'Total de la estadía', fromTotal: 'Total desde', fromNight: 'Desde por noche', perPerson: 'Por persona',
    estimatedPrice: 'Estimado con las tarifas publicadas para tu selección.', startingPriceHelp: 'Elegí tus fechas para calcular el total de la estadía.',
    unavailablePrice: 'No hay una tarifa publicada para esta selección.', deposit: 'Seña', balance: 'Saldo al llegar',
    quoteValid: 'Cotización válida durante', consentPrefix: 'Leí y acepto los',
    terms: 'Términos y Condiciones', privacy: 'Política de Privacidad', reserve: 'Crear reserva',
    reserving: 'Creando reserva…', privacyNote: 'Usamos tus datos únicamente para gestionar esta reserva.',
    secureNote: 'La disponibilidad y el precio se verificaron automáticamente.',
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
    dateHelp: 'Departure must be after arrival.', continue: 'Continue', back: 'Back', edit: 'Edit',
    dateNoticeTitle: 'Live availability', dateNotice: 'We verify dates, accommodation and price before creating the reservation.',
    selectionPending: 'The price is calculated after checking availability.', selectionTitle: 'Your reservation',
    stayTitle: 'Choose how you want to stay', accommodation: 'Accommodation', domo: 'Dome',
    refugio: 'Stone shelter', camping: 'Camping', mode: 'Room type', compartida: 'Shared', privada: 'Private',
    meals: 'Meals', desayuno_incluido: 'Breakfast included', pension_completa: 'Full board',
    breakfastHelp: 'Breakfast is included.', fullBoardHelp: 'Breakfast, lunch and dinner included.',
    impactTitle: 'Your stay helps regenerate the mountains',
    impactCopy: '10% of your investment goes directly to reforesting tabaquillo trees and restoring our mountains.',
    quote: 'Check availability', loadingOptions: 'Loading available options…',
    noOptions: 'We could not load accommodation options.',
    domeCopy: 'Sleep surrounded by nature.', refugeCopy: 'Simple warmth in the stone shelter.', campingCopy: 'Camp in a designated area surrounded by nature.',
    unavailable: 'There is no availability for that combination. Try other dates or options.',
    contactSupport: 'Ask on WhatsApp', reviewTitle: 'Tell us who is coming',
    name: 'Full name', phone: 'WhatsApp', email: 'Email',
    contactIntro: 'Enter your details to create the reservation. You do not need an account.',
    paymentMethod: 'Payment method', checkoutMethod: 'Mercado Pago', transferMethod: 'Bank transfer',
    dni: "Account holder's DNI", dniHelp: 'It must match the DNI reported by the account used for the transfer.',
    total: 'Stay total', fromTotal: 'Total from', fromNight: 'From per night', perPerson: 'Per person',
    estimatedPrice: 'Estimated from the published rates for your selection.', startingPriceHelp: 'Choose your dates to calculate the stay total.',
    unavailablePrice: 'There is no published rate for this selection.', deposit: 'Deposit', balance: 'Balance on arrival', quoteValid: 'Quote valid for',
    consentPrefix: 'I have read and accept the', terms: 'Terms and Conditions', privacy: 'Privacy Policy',
    reserve: 'Create reservation', reserving: 'Creating reservation…',
    privacyNote: 'We only use your details to manage this reservation.', secureNote: 'Availability and pricing were verified automatically.', pendingTitle: 'Your place is being held',
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
    type: AccommodationType;
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
        !['domo', 'refugio', 'camping'].includes(context.type) ||
        !['compartida', 'privada', 'camping'].includes(context.mode) ||
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

function formatBookingDate(value: string, language: 'es' | 'en', includeYear = false) {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === 'es' ? 'es-AR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' as const } : {}),
  }).format(date).replace('.', '');
}

function apiErrorMessage(error: unknown, fallback: string, language: 'es' | 'en'): string {
  return language === 'es' && error instanceof BookingApiError ? error.message : fallback;
}

function accommodationImage(type: AccommodationType): string {
  if (type === 'domo') return '/uploads/domos_2.jpg';
  if (type === 'camping') return '/uploads/campoentero.webp';
  return '/uploads/habitaciones.webp';
}

function shouldOpenFromReservationLink(): boolean {
  if (typeof window === 'undefined') return false;
  const reservationUrl = new URL(RESERVATION_START_PATH, window.location.origin);
  return window.location.pathname === reservationUrl.pathname
    && new URLSearchParams(window.location.search).get('reservar') === '1';
}

export const BookingWidget: React.FC<{
  compact?: boolean;
  onOpenChange?: (open: boolean) => void;
  activeViewport?: 'all' | 'mobile' | 'desktop';
}> = ({ compact = false, onOpenChange, activeViewport = 'all' }) => {
  const { language } = useLanguage();
  const c = COPY[language];
  const { data: publicPricing, loaded: publicPricingLoaded } = usePublicPricingSummary();
  const publicRules = publicPricing?.opciones.flatMap(option => option.tarifas) || [];
  const publicPersonRules = publicRules.filter(rule => rule.base_calculo === 'persona_noche');
  const publicStartingRule = (publicPersonRules.length > 0 ? publicPersonRules : publicRules)
    .reduce<(typeof publicRules)[number] | null>(
      (lowest, rule) => !lowest || rule.importe_centavos < lowest.importe_centavos ? rule : lowest,
      null,
    );
  const launcherPrice = publicStartingRule
    ? `${language === 'es' ? 'Desde' : 'From'} ${formatMoney(publicStartingRule.importe_centavos, publicPricing?.plan.moneda || 'ARS', language)} ${publicStartingRule.base_calculo === 'persona_noche' ? (language === 'es' ? 'por persona/noche' : 'per person/night') : (language === 'es' ? 'por unidad/noche' : 'per unit/night')}`
    : publicPricingLoaded ? c.startingAt : (language === 'es' ? 'Cargando tarifa vigente…' : 'Loading current rate…');
  const today = localTodayIso();
  const [open, setOpen] = useState(shouldOpenFromReservationLink);
  const [step, setStep] = useState<Step>(1);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [people, setPeople] = useState(2);
  const [accommodations, setAccommodations] = useState<PublicAccommodation[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [type, setType] = useState<AccommodationType>('domo');
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
  const stayDates = useMemo(() => stayNightDates(checkIn, checkOut), [checkIn, checkOut]);
  const stayNights = stayDates.length;
  const { data: nightlyPricing, loaded: nightlyPricingLoaded } = usePublicPricingSummaries(stayDates);
  const pricePreview = useMemo(() => {
    if (stayDates.length === 0 || nightlyPricing.length !== stayDates.length) return null;
    return estimateBookingPrice(nightlyPricing, step === 1
      ? { people }
      : { people, type, mode, mealPlan });
  }, [stayDates, nightlyPricing, step, people, type, mode, mealPlan]);
  const fallbackTotalCentavos = publicStartingRule
    ? publicStartingRule.importe_centavos * (publicStartingRule.base_calculo === 'persona_noche' ? people : 1)
    : null;
  const displayedQuote = step === 3 ? quote : null;
  const displayedTotalCentavos = displayedQuote?.precio.subtotal_centavos
    ?? pricePreview?.totalCentavos
    ?? (stayDates.length === 0 ? fallbackTotalCentavos : null);
  const displayedCurrency = displayedQuote?.precio.moneda
    ?? pricePreview?.currency
    ?? publicPricing?.plan.moneda
    ?? 'ARS';
  const displayedPerPersonCentavos = displayedQuote
    ? Math.round(displayedQuote.precio.subtotal_centavos / people)
    : pricePreview?.perPersonCentavos
      ?? (stayDates.length === 0 && fallbackTotalCentavos !== null
        ? Math.round(fallbackTotalCentavos / people)
        : null);
  const priceIsExact = Boolean(displayedQuote);
  const priceIsStayEstimate = Boolean(pricePreview);
  const priceLoading = stayDates.length > 0 ? !nightlyPricingLoaded : !publicPricingLoaded;
  const priceLabel = priceIsExact || (step > 1 && priceIsStayEstimate)
    ? c.total
    : stayDates.length > 0 ? c.fromTotal : c.fromNight;
  const priceHelp = priceIsStayEstimate
    ? c.estimatedPrice
    : stayDates.length === 0
      ? c.startingPriceHelp
      : c.unavailablePrice;

  const renderPriceSummary = (className = '') => (
    <div className={`booking-price-summary ${className}`.trim()} aria-live="polite">
      <span>{priceLabel}</span>
      <strong>{displayedTotalCentavos === null
        ? (priceLoading ? '…' : '—')
        : formatMoney(displayedTotalCentavos, displayedCurrency, language)}</strong>
      <div><span>{c.perPerson}</span><b>{displayedPerPersonCentavos === null
        ? '—'
        : formatMoney(displayedPerPersonCentavos, displayedCurrency, language)}</b></div>
      {displayedQuote && <>
        <div><span>{c.deposit}</span><b>{formatMoney(displayedQuote.precio.sena_centavos, displayedQuote.precio.moneda, language)}</b></div>
        <div><span>{c.balance}</span><b>{formatMoney(displayedQuote.precio.saldo_centavos, displayedQuote.precio.moneda, language)}</b></div>
      </>}
      {!displayedQuote && <small>{priceLoading ? c.startingAt : priceHelp}</small>}
    </div>
  );

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
    return (['domo', 'refugio', 'camping'] as const).filter(item => unique.has(item));
  }, [accommodations]);

  const availableModes = useMemo(() => {
    const unique = new Set(accommodations
      .filter(item => item.tipo === type)
      .flatMap(item => item.modalidades.map(option => option.codigo)));
    return (['compartida', 'privada', 'camping'] as const).filter(item => unique.has(item));
  }, [accommodations, type]);
  const commercialModeNames = useMemo(() => new Map(accommodations
    .filter(item => item.tipo === type)
    .flatMap(item => item.modalidades.map(option => [option.codigo, option.nombre] as const))
    .filter((entry): entry is readonly [BookingMode, string] => Boolean(entry[1]))
  ), [accommodations, type]);
  const commercialModeDescriptions = useMemo(() => new Map(accommodations
    .filter(item => item.tipo === type)
    .flatMap(item => item.modalidades.map(option => [option.codigo, option.descripcion] as const))
    .filter((entry): entry is readonly [BookingMode, string] => Boolean(entry[1]))
  ), [accommodations, type]);
  const selectedModeName = commercialModeNames.get(mode) || c[mode];
  const selectedModeDescription = commercialModeDescriptions.get(mode) || '';

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
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, step, reservation?.reserva.codigo]);

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
    if (!quote?.opcion || !guest.name.trim() || !guest.phone.trim() || !guest.email.trim() || !consent ||
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
    <section ref={dialogRef} className={`booking-dialog ${reservation ? 'booking-dialog--result' : ''}`} role="dialog" aria-modal="true" aria-labelledby="booking-title" tabIndex={-1}>
      <header className={`booking-flow__header ${reservationConfirmed ? 'booking-flow__header--confirmed' : ''}`}>
        <div className="booking-flow__header-copy">
          <p className="booking-flow__eyebrow">{reservation ? c.reservationCode : c.launcherEyebrow}</p>
          <h2 id="booking-title">{headerTitle}</h2>
          {!reservation && <strong className="booking-flow__price-lead">
            {priceLabel}: {displayedTotalCentavos === null ? '…' : formatMoney(displayedTotalCentavos, displayedCurrency, language)}
            {displayedPerPersonCentavos !== null && <> · {formatMoney(displayedPerPersonCentavos, displayedCurrency, language)} {c.perPerson.toLowerCase()}</>}
          </strong>}
          <p className="booking-flow__intro">{headerCopy}</p>
        </div>
        <button className="booking-icon-button booking-flow__close" type="button" onClick={() => setOpen(false)} aria-label={c.close}><X aria-hidden="true" /></button>
      </header>

      {!reservation && (
        <nav className="booking-steps" aria-label={c.title}>
          {c.steps.map((label, index) => {
            const number = (index + 1) as Step;
            const state = number === step ? 'booking-step--active' : number < step ? 'booking-step--done' : '';
            return (
              <span key={label} className={`booking-step ${state}`} data-step={number} aria-current={number === step ? 'step' : undefined}>
                <span className="booking-step__number">{number < step ? <CheckCircle2 aria-hidden="true" /> : number}</span>
                <span>{label}</span>
              </span>
            );
          })}
        </nav>
      )}

      <div className="booking-flow__body" aria-live="polite">
        {reservation ? (
          <div className="booking-panel booking-result">
            <div className="booking-result__hero">
              <div className="booking-result__icon">{reservationConfirmed ? <CheckCircle2 size={42} aria-hidden="true" /> : reservationExpired ? <AlertCircle size={42} aria-hidden="true" /> : <Clock3 size={38} aria-hidden="true" />}</div>
              <div>
                <span className="booking-result__status">{reservationConfirmed ? c.activeConfirmed : reservationExpired ? c.activeExpired : c.manualConfirmation}</span>
                <h3>{reservationTitle}</h3>
                <p>{reservationCopy}</p>
              </div>
            </div>
            <p className="booking-result__code">{c.reservationCode}: <strong>{reservation.reserva.codigo}</strong></p>
            {reservationConfirmed ? (
              <div className="booking-notice booking-notice--success"><CheckCircle2 size={20} aria-hidden="true" /> {c.confirmedNotice}</div>
            ) : reservationExpired ? (
              <div className="booking-notice booking-notice--error"><AlertCircle size={20} aria-hidden="true" /> {c.expired}</div>
            ) : reservationPending && (
              <div className="booking-countdown"><Clock3 size={18} aria-hidden="true" /> {c.retention}: <strong>{formatRemaining(reservationSeconds)}</strong></div>
            )}

            {quote && (
              <div className="booking-summary booking-summary--result">
                <div className="booking-summary__headline">
                  <span>{formatBookingDate(checkIn, language)} — {formatBookingDate(checkOut, language)} · {stayNights} {c.nights} · {people} {c.people.toLowerCase()}</span>
                  <strong>{c[type]} · {selectedModeName} · {c[mealPlan]}</strong>
                  {selectedModeDescription && <small>{selectedModeDescription}</small>}
                  <small>{mealPlan === 'pension_completa' ? c.fullBoardHelp : c.breakfastHelp}</small>
                </div>
                <div className="booking-summary__row booking-summary__total"><span>{c.total}</span><strong>{formatMoney(quote.precio.subtotal_centavos, quote.precio.moneda, language)}</strong></div>
                <div className="booking-summary__row"><span>{c.perPerson}</span><strong>{formatMoney(Math.round(quote.precio.subtotal_centavos / people), quote.precio.moneda, language)}</strong></div>
                <div className="booking-summary__row"><span>{c.deposit}</span><strong>{formatMoney(quote.precio.sena_centavos, quote.precio.moneda, language)}</strong></div>
                <div className="booking-summary__row"><span>{c.balance}</span><strong>{formatMoney(quote.precio.saldo_centavos, quote.precio.moneda, language)}</strong></div>
              </div>
            )}

            {reservationPending && (reservation.pago?.estado === 'ready' && reservation.pago.checkout_url ? (
              <a className="booking-button booking-button--payment" href={reservation.pago.checkout_url} rel="noopener noreferrer"><ShieldCheck size={20} aria-hidden="true" /> {c.payDeposit}</a>
            ) : reservation.pago?.estado === 'pending' ? (
              <div className="booking-notice"><Loader2 className="booking-loading" size={20} /><span>{c.paymentPending}</span><button className="booking-link-button" type="button" disabled={submitting} onClick={retryPayment}>{c.retryPayment}</button></div>
            ) : reservation.pago?.estado === 'failed' ? (
              <button className="booking-button booking-button--secondary" type="button" disabled={submitting} onClick={retryPayment}>{c.retryPayment}</button>
            ) : null)}

            {reservationPending && reservation.transferencia?.estado === 'ready' && reservation.transferencia.destino ? (
              <div className="booking-payment">
                <div className="booking-payment__heading"><strong>{c.transferToMp}</strong><span>{c.manualConfirmation}</span></div>
                <p className="booking-payment__instructions">{c.transferInstructions}</p>
                {reservation.transferencia.destino.titular && <div className="booking-payment__value"><span className="booking-payment__text"><span>{c.accountHolder}</span><strong>{reservation.transferencia.destino.titular}</strong></span></div>}
                {reservation.transferencia.destino.alias && <div className="booking-payment__value"><span className="booking-payment__text"><span>{c.alias}</span><strong>{reservation.transferencia.destino.alias}</strong></span><button className="booking-copy-button" type="button" onClick={() => copyValue('alias', reservation.transferencia?.destino?.alias)} aria-label={`${c.copy} ${c.alias}`}>{copied === 'alias' ? c.copied : <Copy size={18} />}</button></div>}
                {reservation.transferencia.destino.cvu && <div className="booking-payment__value"><span className="booking-payment__text"><span>{c.cvu}</span><strong className="booking-payment__identifier">{reservation.transferencia.destino.cvu}</strong></span><button className="booking-copy-button" type="button" onClick={() => copyValue('cvu', reservation.transferencia?.destino?.cvu)} aria-label={`${c.copy} ${c.cvu}`}>{copied === 'cvu' ? c.copied : <Copy size={18} />}</button></div>}
              </div>
            ) : reservationPending && reservation.pago?.estado !== 'ready' && reservation.pago?.estado !== 'pending' && (
              reservation.cuenta_cobro.estado === 'ready' && reservation.cuenta_cobro.destino ? (
                <div className="booking-payment">
                  <div className="booking-payment__heading"><strong>{c.paymentTitle}</strong>{reservation.cuenta_cobro.simulado && <span>{c.mockWarning}</span>}</div>
                  {reservation.cuenta_cobro.destino.alias && <div className="booking-payment__value"><span className="booking-payment__text"><span>{c.alias}</span><strong>{reservation.cuenta_cobro.destino.alias}</strong></span><button className="booking-copy-button" type="button" onClick={() => copyValue('alias', reservation.cuenta_cobro.destino?.alias)} aria-label={`${c.copy} ${c.alias}`}>{copied === 'alias' ? c.copied : <Copy size={18} />}</button></div>}
                  {reservation.cuenta_cobro.destino.cvu && <div className="booking-payment__value"><span className="booking-payment__text"><span>{c.cvu}</span><strong className="booking-payment__identifier">{reservation.cuenta_cobro.destino.cvu}</strong></span><button className="booking-copy-button" type="button" onClick={() => copyValue('cvu', reservation.cuenta_cobro.destino?.cvu)} aria-label={`${c.copy} ${c.cvu}`}>{copied === 'cvu' ? c.copied : <Copy size={18} />}</button></div>}
                </div>
              ) : <div className="booking-notice booking-notice--success"><ShieldCheck size={22} /> {c.manualPayment}</div>
            )}

            <div className="booking-actions booking-actions--result">
              <a className="booking-button booking-button--secondary" href={reservationStatusUrl}>{c.viewStatus}</a>
              <a className="booking-button" href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={19} /> {c.whatsapp}</a>
              <button className="booking-link-button" type="button" onClick={startAgain}>{c.newBooking}</button>
            </div>
          </div>
        ) : (
          <div className="booking-content-grid">
            <div className="booking-main">
              <div className="booking-price-mobile">{renderPriceSummary()}</div>
              <div className="booking-impact"><Leaf size={21} aria-hidden="true" /><span><strong>{c.impactTitle}</strong>{c.impactCopy}</span></div>
              {step === 1 ? (
                <div className="booking-panel">
                  <div className="booking-panel__heading"><div><p className="booking-section-title"><CalendarDays size={18} /> {c.datesTitle}</p><h3>{language === 'es' ? 'Elegí tus fechas' : 'Choose your dates'}</h3></div></div>
                  <div className="booking-date-grid">
                    <label className="booking-date-card"><CalendarDays size={30} /><span><small>{c.checkIn}</small><input aria-label={c.checkIn} type="date" min={today} value={checkIn} onChange={event => { setCheckIn(event.target.value); if (checkOut && event.target.value >= checkOut) setCheckOut(''); resetQuote(); }} required /></span><ChevronRight aria-hidden="true" /></label>
                    <label className="booking-date-card"><CalendarDays size={30} /><span><small>{c.checkOut}</small><input aria-label={c.checkOut} type="date" min={checkIn || today} value={checkOut} onChange={event => { setCheckOut(event.target.value); resetQuote(); }} required /></span><ChevronRight aria-hidden="true" /></label>
                  </div>
                  {stayNights > 0 && <div className="booking-night-count"><BedDouble size={20} /> {stayNights} {c.nights}</div>}
                  <div className="booking-guests-row">
                    <span><Users size={28} /><span><strong>{c.people}</strong><small>{language === 'es' ? '¿Quiénes vienen?' : 'Who is coming?'}</small></span></span>
                    <div className="booking-counter" aria-label={c.people}><button type="button" aria-label={`${c.people} -`} onClick={() => { setPeople(value => Math.max(1, value - 1)); resetQuote(); }}><Minus /></button><output aria-live="polite">{people}</output><button type="button" aria-label={`${c.people} +`} onClick={() => { setPeople(value => value + 1); resetQuote(); }}><Plus /></button></div>
                  </div>
                  <div className="booking-notice booking-notice--gold"><CalendarDays size={22} /><span><strong>{c.dateNoticeTitle}</strong>{c.dateNotice}</span></div>
                  {error && <div className="booking-notice booking-notice--error"><AlertCircle size={20} /> {error.message}</div>}
                  <div className="booking-actions"><button className="booking-button" type="button" onClick={goToStay}>{c.continue}<ArrowRight size={18} /></button></div>
                </div>
              ) : step === 2 ? (
                <div className="booking-panel">
                  <div className="booking-panel__heading"><button className="booking-back-link" type="button" onClick={() => { setStep(1); setError(null); }}><ArrowLeft size={17} /> {c.back}</button><h3>{c.stayTitle}</h3></div>
                  {loadingOptions ? <div className="booking-notice"><Loader2 className="booking-loading" size={20} /> {c.loadingOptions}</div> : (
                    <>
                      <p className="booking-section-title">{c.accommodation}</p>
                      <div className="booking-stay-grid">{availableTypes.map(option => (
                        <button key={option} type="button" className={`booking-stay-card ${type === option ? 'booking-choice--selected' : ''}`} aria-pressed={type === option} onClick={() => { setType(option); resetQuote(); }}>
                          <img src={accommodationImage(option)} alt="" />
                          <span><strong>{c[option]}</strong><small>{option === 'domo' ? c.domeCopy : option === 'camping' ? c.campingCopy : c.refugeCopy}</small></span>
                          <CheckCircle2 className="booking-stay-card__check" size={27} aria-hidden="true" />
                        </button>
                      ))}</div>
                      <p className="booking-section-title">{c.mode}</p>
                      <div className="booking-choice-grid">{availableModes.map(option => <button key={option} type="button" className={`booking-choice ${mode === option ? 'booking-choice--selected' : ''}`} aria-pressed={mode === option} onClick={() => { setMode(option); resetQuote(); }}><Users size={23} /><span><strong>{commercialModeNames.get(option) || c[option]}</strong>{commercialModeDescriptions.get(option) && <small>{commercialModeDescriptions.get(option)}</small>}</span><CheckCircle2 className="booking-choice__check" size={21} /></button>)}</div>
                      <p className="booking-section-title">{c.meals}</p>
                      <div className="booking-choice-grid">{(['desayuno_incluido', 'pension_completa'] as const).map(option => <button key={option} type="button" className={`booking-choice ${mealPlan === option ? 'booking-choice--selected' : ''}`} aria-pressed={mealPlan === option} onClick={() => { setMealPlan(option); resetQuote(); }}><Utensils size={23} /><span><strong>{c[option]}</strong><small>{option === 'desayuno_incluido' ? c.breakfastHelp : c.fullBoardHelp}</small></span><CheckCircle2 className="booking-choice__check" size={21} /></button>)}</div>
                    </>
                  )}
                  {error && <div className="booking-notice booking-notice--error"><AlertCircle size={20} /><span>{error.message}{error.code === 'NO_DISPONIBLE' && <> <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">{c.contactSupport}</a></>}</span></div>}
                  {!loadingOptions && optionsLoaded && availableTypes.length === 0 && <button className="booking-button booking-button--secondary" type="button" onClick={retryOptions}>{c.retry}</button>}
                  <div className="booking-actions"><button className="booking-button booking-button--secondary" type="button" onClick={() => { setStep(1); setError(null); }}><ArrowLeft size={17} /> {c.back}</button><button className="booking-button" type="button" disabled={loadingOptions || loadingQuote || availableModes.length === 0} onClick={quoteStay}>{loadingQuote ? <><Loader2 className="booking-loading" size={18} /> {c.quote}</> : <>{c.quote}<ArrowRight size={18} /></>}</button></div>
                </div>
              ) : quote ? (
                <form className="booking-panel" onSubmit={submitReservation}>
                  <div className="booking-panel__heading"><button className="booking-back-link" type="button" onClick={() => { setStep(2); setError(null); }}><ArrowLeft size={17} /> {c.back}</button><h3>{c.reviewTitle}</h3><p>{c.contactIntro}</p></div>
                  <div className="booking-review-cards">
                    <div><CalendarDays /><span><small>{c.datesTitle}</small><strong>{formatBookingDate(checkIn, language)} — {formatBookingDate(checkOut, language)}</strong><em>{stayNights} {c.nights} · {people} {c.people.toLowerCase()}</em></span><button type="button" onClick={() => setStep(1)}>{c.edit}</button></div>
                    <div><BedDouble /><span><small>{c.stayTitle}</small><strong>{c[type]} · {selectedModeName}</strong>{selectedModeDescription && <em>{selectedModeDescription}</em>}<em>{c[mealPlan]} · {mealPlan === 'pension_completa' ? c.fullBoardHelp : c.breakfastHelp}</em></span><button type="button" onClick={() => setStep(2)}>{c.edit}</button></div>
                  </div>
                  <div className="booking-notice booking-notice--success"><ShieldCheck size={22} /><span><strong>{c.secureNote}</strong>{quoteSeconds > 0 ? `${c.quoteValid}: ${formatRemaining(quoteSeconds)}` : c.expired}</span></div>
                  <div className="booking-grid">
                    <label className="booking-field booking-field--full">{c.name}<span><UserRound /><input value={guest.name} onChange={event => setGuest({ ...guest, name: event.target.value })} autoComplete="name" required /></span></label>
                    <label className="booking-field">{c.phone}<span><Phone /><input type="tel" value={guest.phone} onChange={event => setGuest({ ...guest, phone: event.target.value })} autoComplete="tel" required /></span></label>
                    <label className="booking-field">{c.email}<span><Mail /><input type="email" value={guest.email} onChange={event => setGuest({ ...guest, email: event.target.value })} autoComplete="email" required /></span></label>
                  </div>
                  <p className="booking-section-title">{c.paymentMethod}</p>
                  <div className="booking-choice-grid booking-payment-methods">{quote.metodos_pago.map(option => <button key={option} type="button" className={`booking-choice ${paymentMethod === option ? 'booking-choice--selected' : ''}`} aria-pressed={paymentMethod === option} onClick={() => setPaymentMethod(option)}>{option === 'mercado_pago_checkout' ? <CreditCard size={23} /> : <Landmark size={23} />}<span>{option === 'mercado_pago_checkout' ? c.checkoutMethod : c.transferMethod}</span><CheckCircle2 className="booking-choice__check" size={21} /></button>)}</div>
                  {paymentMethod === 'transferencia_mp' && <label className="booking-field booking-field--full booking-dni-field">{c.dni}<span><UserRound /><input inputMode="numeric" value={payerDni} onChange={event => setPayerDni(event.target.value)} autoComplete="off" pattern="[0-9. -]{7,12}" required /></span><small>{c.dniHelp}</small></label>}
                  <div className="booking-notice"><ShieldCheck size={20} /> {c.privacyNote}</div>
                  <label className="booking-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required /><span>{c.consentPrefix} <a href="/terminos-y-condiciones" target="_blank">{c.terms}</a> {language === 'es' ? 'y la' : 'and the'} <a href="/politica-de-privacidad" target="_blank">{c.privacy}</a>.</span></label>
                  {error && <div className="booking-notice booking-notice--error"><AlertCircle size={20} /> {error.message}</div>}
                  <div className="booking-actions"><button className="booking-button booking-button--secondary" type="button" onClick={() => { setStep(2); setError(null); }}><ArrowLeft size={17} /> {c.back}</button><button className="booking-button" type="submit" disabled={submitting || quoteSeconds <= 0 || !guest.name.trim() || !guest.phone.trim() || !guest.email.trim() || !consent || (paymentMethod === 'transferencia_mp' && !/^\d{7,8}$/.test(payerDni.replace(/\D/g, '')))}>{submitting ? <><Loader2 className="booking-loading" size={18} /> {c.reserving}</> : <>{c.reserve}<ArrowRight size={18} /></>}</button></div>
                </form>
              ) : (
                <div className="booking-panel"><div className="booking-notice booking-notice--error"><AlertCircle size={20} /> {error?.message || c.expired}</div><div className="booking-actions"><button className="booking-button" type="button" onClick={() => { setStep(2); setError(null); }}>{c.retry}</button></div></div>
              )}
            </div>

            <aside className="booking-sidebar" aria-label={c.selectionTitle}>
              <p className="booking-section-title">{c.selectionTitle}</p>
              {step > 1 && <div className="booking-sidebar__visual" aria-hidden="true"><img src={accommodationImage(type)} alt="" /></div>}
              <h3>{step === 1 ? c.datesTitle : `${c[type]} · ${selectedModeName}`}</h3>
              <ul>
                <li><CalendarDays /> <span>{checkIn && checkOut ? `${formatBookingDate(checkIn, language, true)} — ${formatBookingDate(checkOut, language, true)}` : c.datesTitle}</span></li>
                <li><Users /> <span>{people} {c.people.toLowerCase()}</span></li>
                {step > 1 && <li><Utensils /> <span>{c[mealPlan]} · {mealPlan === 'pension_completa' ? c.fullBoardHelp : c.breakfastHelp}</span></li>}
                {step > 1 && selectedModeDescription && <li><BedDouble /> <span>{selectedModeDescription}</span></li>}
              </ul>
              {renderPriceSummary('booking-sidebar__price')}
              <div className="booking-sidebar__trust"><ShieldCheck /><span>{c.dateNotice}</span></div>
              <div className="booking-sidebar__impact"><Leaf /><span><strong>{c.impactTitle}</strong>{c.impactCopy}</span></div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <>
      <div className={`booking-widget ${open ? 'booking-widget--open' : ''}`}>
        {!open && (
          <div className="booking-launcher" data-compact={compact || undefined}>
            <div className="booking-launcher__content">
              <p className="booking-launcher__eyebrow">{c.launcherEyebrow}</p>
              <h3 className="booking-launcher__title">{c.launcherTitle}</h3>
              <strong className="booking-launcher__price">{launcherPrice}</strong>
              <p className="booking-launcher__copy">{c.launcherCopy}</p>
            </div>
            <button ref={launcherRef} className="booking-button" type="button" onClick={() => setOpen(true)}><CalendarDays size={19} aria-hidden="true" /> {c.launcherButton}<ArrowRight size={18} /></button>
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
