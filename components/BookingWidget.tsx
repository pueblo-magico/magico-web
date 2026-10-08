import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, ArrowLeft, ArrowRight, BedDouble, CalendarDays, CheckCircle2, Clock3,
  Copy, CreditCard, Landmark, Leaf, Loader2, Mail, MessageCircle, Minus, Phone, Plus, ShieldCheck,
  UserRound, Users, Utensils, X,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { RESERVATION_START_PATH, WA_MAGICO } from '../src/data/config';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookingApiError,
  applyPaymentSurcharge,
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
  defaultPaymentMethod,
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
    selectStart: 'Elegí la fecha de llegada', selectEnd: 'Ahora elegí la fecha de salida',
    previousMonth: 'Mes anterior', nextMonth: 'Mes siguiente',
    dateHelp: 'La salida debe ser posterior a la llegada.', continue: 'Continuar', back: 'Volver', edit: 'Editar',
    dateNoticeTitle: 'Disponibilidad en tiempo real', dateNotice: 'Verificamos las fechas, el alojamiento y el precio antes de crear la reserva.',
    arrivalTitle: 'Horarios de llegada y salida', arrivalTime: 'Check-in desde las 13:00 hs', departureTime: 'Check-out hasta las 11:00 hs',
    arrivalHelp: 'Podés llegar antes o quedarte después para disfrutar del predio; fuera de esos horarios el alojamiento puede estar en limpieza.',
    selectionPending: 'El precio se calcula al verificar disponibilidad.', selectionTitle: 'Tu reserva',
    stayTitle: 'Elegí cómo querés quedarte', accommodation: 'Alojamiento', domo: 'Domo',
    refugio: 'Refugio de piedra', camping: 'Camping', mode: 'Modalidad', compartida: 'Compartida', privada: 'Privada',
    meals: 'Comidas', desayuno_incluido: 'Con desayuno', pension_completa: 'Pensión completa',
    breakfastHelp: 'El desayuno está incluido.', fullBoardHelp: 'Desayuno, almuerzo y cena incluidos.',
    utilities: 'Servicios y condiciones', utilityAvailable: 'Disponible', utilityUnavailable: 'No disponible',
    bedPreparation: 'Preparación de camas', bedPreparationHelp: 'Elegí cómo querés que preparemos el domo.',
    bedPreparationRequired: 'Elegí una preparación de camas para continuar.',
    impactTitle: 'Tu estadía regenera la montaña',
    impactCopy: 'El 10% de tu inversión va directo a reforestar tabaquillos y restaurar nuestras sierras.',
    quote: 'Consultar disponibilidad', loadingOptions: 'Cargando opciones disponibles…',
    noOptions: 'No pudimos cargar los alojamientos.',
    domeCopy: 'Dormí rodeado de naturaleza.', refugeCopy: 'Calidez simple en el refugio.', campingCopy: 'Acampá en un área habilitada en plena naturaleza.',
    unavailable: 'No hay disponibilidad para esa combinación. Probá con otras fechas u opciones.',
    contactSupport: 'Consultar por WhatsApp', reviewTitle: 'Contanos quién viene',
    name: 'Nombre y apellido', phone: 'WhatsApp', email: 'Email',
    contactIntro: 'Completá tus datos para crear la reserva. No necesitás una cuenta.',
    validationTitle: 'Para crear la reserva, falta completar:', validationErrorTitle: 'Revisá estos datos para continuar:',
    nameRequired: 'Ingresá tu nombre y apellido.', phoneRequired: 'Ingresá un número de WhatsApp.',
    emailRequired: 'Ingresá tu email.', emailInvalid: 'Revisá el formato del email (por ejemplo, nombre@dominio.com).',
    dniInvalid: 'Ingresá un DNI válido de 7 u 8 números.', consentRequired: 'Aceptá los términos y la política de privacidad.',
    paymentMethod: 'Forma de pago', checkoutMethod: 'Mercado Pago', transferMethod: 'Transferencia',
    paymentSurcharge: 'Recargo por Mercado Pago', paymentSurchargeHelp: 'Incluye un 10% adicional sobre el total y la seña.',
    dni: 'DNI del titular de la cuenta', dniHelp: 'Debe coincidir con el DNI informado por la cuenta desde la que hacés la transferencia.',
    total: 'Total de la estadía', fromTotal: 'Total desde', fromNight: 'Desde por noche', perPerson: 'Por persona',
    estimatedPrice: 'Estimado con las tarifas publicadas para tu selección.', startingPriceHelp: 'Elegí tus fechas para calcular el total de la estadía.',
    unavailablePrice: 'No hay una tarifa publicada para esta selección.', deposit: 'Seña', balance: 'Saldo al llegar',
    quoteValid: 'Cotización válida durante', consentPrefix: 'Leí y acepto las condiciones de esta estadía, la política de cambios y cancelación, los',
    terms: 'Términos y Condiciones', privacy: 'Política de Privacidad', reserve: 'Crear reserva',
    conditionsTitle: 'Condiciones de tu reserva', conditionsIntro: 'Revisá la información aplicable a esta selección antes de crear la reserva.',
    mealConditionsTitle: 'Comidas y horarios', extendedUseTitle: 'Uso extendido del predio',
    extendedUseCopy: 'Antes del check-in o después del check-out podés disfrutar del río y del predio, pero no tendrás disponible el espacio de alojamiento mientras se prepara para el siguiente ingreso.',
    changesTitle: 'Saldo, cambios y cancelación', changesCopy: 'El saldo pendiente se abona al llegar. Reprogramaciones de fecha o ajustes de comidas deben solicitarse con al menos 24 horas de anticipación.',
    fullPolicy: 'Ver política completa', includedConditionsTitle: 'Servicios y limitaciones del alojamiento',
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
    selectStart: 'Choose your arrival date', selectEnd: 'Now choose your departure date',
    previousMonth: 'Previous month', nextMonth: 'Next month',
    dateHelp: 'Departure must be after arrival.', continue: 'Continue', back: 'Back', edit: 'Edit',
    dateNoticeTitle: 'Live availability', dateNotice: 'We verify dates, accommodation and price before creating the reservation.',
    arrivalTitle: 'Arrival and departure times', arrivalTime: 'Check-in from 1:00 pm', departureTime: 'Check-out by 11:00 am',
    arrivalHelp: 'You may arrive earlier or stay later to enjoy the property; outside these hours the accommodation may be undergoing cleaning.',
    selectionPending: 'The price is calculated after checking availability.', selectionTitle: 'Your reservation',
    stayTitle: 'Choose how you want to stay', accommodation: 'Accommodation', domo: 'Dome',
    refugio: 'Stone shelter', camping: 'Camping', mode: 'Room type', compartida: 'Shared', privada: 'Private',
    meals: 'Meals', desayuno_incluido: 'Breakfast included', pension_completa: 'Full board',
    breakfastHelp: 'Breakfast is included.', fullBoardHelp: 'Breakfast, lunch and dinner included.',
    utilities: 'Amenities and conditions', utilityAvailable: 'Available', utilityUnavailable: 'Not available',
    bedPreparation: 'Bed setup', bedPreparationHelp: 'Choose how you would like us to prepare the dome.',
    bedPreparationRequired: 'Choose a bed setup to continue.',
    impactTitle: 'Your stay helps regenerate the mountains',
    impactCopy: '10% of your investment goes directly to reforesting tabaquillo trees and restoring our mountains.',
    quote: 'Check availability', loadingOptions: 'Loading available options…',
    noOptions: 'We could not load accommodation options.',
    domeCopy: 'Sleep surrounded by nature.', refugeCopy: 'Simple warmth in the stone shelter.', campingCopy: 'Camp in a designated area surrounded by nature.',
    unavailable: 'There is no availability for that combination. Try other dates or options.',
    contactSupport: 'Ask on WhatsApp', reviewTitle: 'Tell us who is coming',
    name: 'Full name', phone: 'WhatsApp', email: 'Email',
    contactIntro: 'Enter your details to create the reservation. You do not need an account.',
    validationTitle: 'To create the booking, complete:', validationErrorTitle: 'Review these details to continue:',
    nameRequired: 'Enter your full name.', phoneRequired: 'Enter a WhatsApp number.',
    emailRequired: 'Enter your email.', emailInvalid: 'Check the email format (for example, name@domain.com).',
    dniInvalid: 'Enter a valid 7 or 8 digit DNI.', consentRequired: 'Accept the terms and privacy policy.',
    paymentMethod: 'Payment method', checkoutMethod: 'Mercado Pago', transferMethod: 'Bank transfer',
    paymentSurcharge: 'Mercado Pago surcharge', paymentSurchargeHelp: 'Includes an additional 10% on the total and deposit.',
    dni: "Account holder's DNI", dniHelp: 'It must match the DNI reported by the account used for the transfer.',
    total: 'Stay total', fromTotal: 'Total from', fromNight: 'From per night', perPerson: 'Per person',
    estimatedPrice: 'Estimated from the published rates for your selection.', startingPriceHelp: 'Choose your dates to calculate the stay total.',
    unavailablePrice: 'There is no published rate for this selection.', deposit: 'Deposit', balance: 'Balance on arrival', quoteValid: 'Quote valid for',
    consentPrefix: 'I have read and accept these stay conditions, the change and cancellation policy, the', terms: 'Terms and Conditions', privacy: 'Privacy Policy',
    conditionsTitle: 'Your booking conditions', conditionsIntro: 'Review the information that applies to this selection before creating the booking.',
    mealConditionsTitle: 'Meals and service times', extendedUseTitle: 'Extended use of the property',
    extendedUseCopy: 'Before check-in or after check-out you may enjoy the river and the property, but the accommodation space will not be available while it is prepared for the next arrival.',
    changesTitle: 'Balance, changes and cancellation', changesCopy: 'The remaining balance is due on arrival. Date changes or meal adjustments must be requested at least 24 hours in advance.',
    fullPolicy: 'View full policy', includedConditionsTitle: 'Accommodation services and limitations',
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
type ReviewField = 'name' | 'phone' | 'email' | 'dni' | 'consent';
type ReviewValidationError = { field: ReviewField; message: string };

const ACTIVE_RESERVATION_STORAGE_KEY = 'magico.active-reservation.v1';
const ACTIVE_RESERVATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const BOOKING_DRAFT_SESSION_KEY = 'magico.booking-draft.v1';

type BookingDraftSnapshot = {
  checkIn: string;
  checkOut: string;
  people: number;
  type: AccommodationType;
  mode: BookingMode;
  mealPlan: MealPlan;
  bedPreparationCode: string | null;
};

function readBookingDraft(): BookingDraftSnapshot | null {
  try {
    const draft = JSON.parse(window.sessionStorage.getItem(BOOKING_DRAFT_SESSION_KEY) || 'null') as BookingDraftSnapshot | null;
    if (!draft || !Number.isSafeInteger(draft.people) || draft.people < 1) return null;
    return draft;
  } catch {
    return null;
  }
}

function writeBookingDraft(draft: BookingDraftSnapshot) {
  try { window.sessionStorage.setItem(BOOKING_DRAFT_SESSION_KEY, JSON.stringify(draft)); } catch { /* optional browser recovery */ }
}

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
    bedPreparationCode?: string | null;
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

function parseIsoDate(value: string): Date {
  return new Date(`${value}T12:00:00Z`);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function monthStart(value: string): string {
  const date = parseIsoDate(value);
  return toIsoDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12)));
}

function shiftMonth(value: string, amount: number): string {
  const date = parseIsoDate(value);
  return toIsoDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1, 12)));
}

function calendarDays(value: string): Array<{ iso: string; currentMonth: boolean }> {
  const first = parseIsoDate(monthStart(value));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setUTCDate(first.getUTCDate() - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setUTCDate(gridStart.getUTCDate() + index);
    return {
      iso: toIsoDate(day),
      currentMonth: day.getUTCMonth() === first.getUTCMonth(),
    };
  });
}

function apiErrorMessage(error: unknown, fallback: string, language: 'es' | 'en'): string {
  return language === 'es' && error instanceof BookingApiError ? error.message : fallback;
}

function accommodationImage(type: AccommodationType): string {
  if (type === 'domo') return '/uploads/domos_2.jpg';
  if (type === 'camping') return '/uploads/campoentero.webp';
  return '/uploads/habitaciones.webp';
}

export const BookingWidget: React.FC<{
  compact?: boolean;
  page?: boolean;
  onOpenChange?: (open: boolean) => void;
  activeViewport?: 'all' | 'mobile' | 'desktop';
}> = ({ compact = false, page = false, onOpenChange, activeViewport = 'all' }) => {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
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
  const draft = useMemo(readBookingDraft, []);
  const open = page;
  const requestedStep = new URLSearchParams(location.search).get('paso');
  const canResumeStay = Boolean(draft?.checkIn && draft?.checkOut);
  const [step, setStep] = useState<Step>(requestedStep !== 'fechas' && canResumeStay ? 2 : 1);
  const [checkIn, setCheckIn] = useState(draft?.checkIn || '');
  const [checkOut, setCheckOut] = useState(draft?.checkOut || '');
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(draft?.checkIn || today));
  const [people, setPeople] = useState(draft?.people || 2);
  const [accommodations, setAccommodations] = useState<PublicAccommodation[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [type, setType] = useState<AccommodationType>(draft?.type || 'domo');
  const [mode, setMode] = useState<BookingMode>(draft?.mode || 'compartida');
  const [mealPlan, setMealPlan] = useState<MealPlan>(draft?.mealPlan || 'desayuno_incluido');
  const [bedPreparationCode, setBedPreparationCode] = useState<string | null>(draft?.bedPreparationCode || null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteSeconds, setQuoteSeconds] = useState(0);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [guest, setGuest] = useState({ name: '', phone: '', email: '' });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia_mp');
  const [payerDni, setPayerDni] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedReviewFields, setTouchedReviewFields] = useState<Partial<Record<ReviewField, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [reservation, setReservation] = useState<ReservationResponse | null>(null);
  const [reservationSeconds, setReservationSeconds] = useState(0);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [copied, setCopied] = useState('');
  const [viewportEligible, setViewportEligible] = useState(activeViewport === 'all');
  const idempotencyKey = useRef(createBookingAttemptKey());
  const flowBodyRef = useRef<HTMLDivElement>(null);
  const shouldScrollToStepRef = useRef(false);
  const bookingFormRef = useRef<HTMLFormElement>(null);
  const stayDates = useMemo(() => stayNightDates(checkIn, checkOut), [checkIn, checkOut]);
  const stayNights = stayDates.length;
  const visibleCalendarDays = useMemo(() => calendarDays(visibleMonth), [visibleMonth]);
  const monthShortcuts = useMemo(
    () => Array.from({ length: 5 }, (_, index) => shiftMonth(monthStart(today), index)),
    [today],
  );
  const calendarLocale = language === 'es' ? 'es-AR' : 'en-US';
  const rawCalendarMonthLabel = new Intl.DateTimeFormat(calendarLocale, {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(parseIsoDate(visibleMonth));
  const calendarMonthLabel = rawCalendarMonthLabel.charAt(0).toUpperCase() + rawCalendarMonthLabel.slice(1);
  const weekDays = language === 'es'
    ? ['L', 'M', 'X', 'J', 'V', 'S', 'D']
    : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const { data: nightlyPricing, loaded: nightlyPricingLoaded } = usePublicPricingSummaries(stayDates);
  const mealSchedule = nightlyPricing[0]?.horarios_comidas ?? publicPricing?.horarios_comidas;
  const mealPlanHelp = (option: MealPlan) => {
    const base = option === 'pension_completa' ? c.fullBoardHelp : c.breakfastHelp;
    if (!mealSchedule) return base;
    if (option === 'desayuno_incluido') {
      const label = language === 'es' ? 'Desayuno' : 'Breakfast';
      return `${base} · ${label} ${mealSchedule.desayuno.desde}–${mealSchedule.desayuno.hasta}`;
    }
    const lunch = language === 'es' ? 'Almuerzo' : 'Lunch';
    const dinner = language === 'es' ? 'Cena' : 'Dinner';
    return `${base} · ${lunch} ${mealSchedule.almuerzo.desde}–${mealSchedule.almuerzo.hasta} · ${dinner} ${mealSchedule.cena.desde}–${mealSchedule.cena.hasta}`;
  };
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
  const selectedPaymentSurchargeBps = displayedQuote
    ? displayedQuote.recargos_metodo_pago?.[paymentMethod]?.porcentaje_bps ?? 0
    : 0;
  const paymentSurchargeCentavos = displayedQuote
    ? Math.round(displayedQuote.precio.subtotal_centavos * selectedPaymentSurchargeBps / 10_000)
    : 0;
  const emailValue = guest.email.trim();
  const normalizedDni = payerDni.replace(/\D/g, '');
  const reviewValidationErrors: ReviewValidationError[] = [
    ...(!guest.name.trim() ? [{ field: 'name' as const, message: c.nameRequired }] : []),
    ...(!guest.phone.trim() ? [{ field: 'phone' as const, message: c.phoneRequired }] : []),
    ...(!emailValue
      ? [{ field: 'email' as const, message: c.emailRequired }]
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)
        ? [{ field: 'email' as const, message: c.emailInvalid }]
        : []),
    ...(paymentMethod === 'transferencia_mp' && !/^\d{7,8}$/.test(normalizedDni)
      ? [{ field: 'dni' as const, message: c.dniInvalid }]
      : []),
    ...(!consent ? [{ field: 'consent' as const, message: c.consentRequired }] : []),
  ];
  const reviewErrorFor = (field: ReviewField) => reviewValidationErrors.find(item => item.field === field);
  const showReviewError = (field: ReviewField) => submitAttempted || Boolean(touchedReviewFields[field]);
  const touchReviewField = (field: ReviewField) => {
    setTouchedReviewFields(current => current[field] ? current : { ...current, [field]: true });
  };
  const displayedTotalCentavos = displayedQuote
    ? applyPaymentSurcharge(displayedQuote.precio.subtotal_centavos, selectedPaymentSurchargeBps)
    : pricePreview?.totalCentavos
    ?? (stayDates.length === 0 ? fallbackTotalCentavos : null);
  const displayedCurrency = displayedQuote?.precio.moneda
    ?? pricePreview?.currency
    ?? publicPricing?.plan.moneda
    ?? 'ARS';
  const displayedPerPersonCentavos = displayedQuote
    ? Math.round((displayedTotalCentavos ?? displayedQuote.precio.subtotal_centavos) / people)
    : pricePreview?.perPersonCentavos
      ?? (stayDates.length === 0 && fallbackTotalCentavos !== null
        ? Math.round(fallbackTotalCentavos / people)
        : null);
  const displayedDepositCentavos = displayedQuote
    ? applyPaymentSurcharge(displayedQuote.precio.sena_centavos, selectedPaymentSurchargeBps)
    : null;
  const displayedBalanceCentavos = displayedQuote && displayedTotalCentavos !== null && displayedDepositCentavos !== null
    ? displayedTotalCentavos - displayedDepositCentavos
    : null;
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
        {selectedPaymentSurchargeBps > 0 && <div className="booking-price-summary__surcharge"><span>{c.paymentSurcharge} ({selectedPaymentSurchargeBps / 100}%)</span><b>+ {formatMoney(paymentSurchargeCentavos, displayedQuote.precio.moneda, language)}</b></div>}
        <div><span>{c.deposit}</span><b>{formatMoney(displayedDepositCentavos ?? 0, displayedQuote.precio.moneda, language)}</b></div>
        <div><span>{c.balance}</span><b>{formatMoney(displayedBalanceCentavos ?? 0, displayedQuote.precio.moneda, language)}</b></div>
      </>}
      {!displayedQuote && <small>{priceLoading ? c.startingAt : priceHelp}</small>}
    </div>
  );

  useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!page || reservation) return;
    writeBookingDraft({ checkIn, checkOut, people, type, mode, mealPlan, bedPreparationCode });
  }, [page, reservation, checkIn, checkOut, people, type, mode, mealPlan, bedPreparationCode]);

  useEffect(() => {
    if (!page) return;
    const requested = new URLSearchParams(location.search).get('paso');
    const nextStep: Step = requested === 'estadia' ? 2 : requested === 'datos' ? 3 : 1;
    if (nextStep > 1 && (!checkIn || !checkOut)) {
      setStep(1);
      navigate('/reservar?paso=fechas', { replace: true });
      return;
    }
    if (nextStep === 3 && !quote && !reservation) {
      setStep(2);
      navigate('/reservar?paso=estadia', { replace: true });
      return;
    }
    setStep(nextStep);
  }, [page, location.search, checkIn, checkOut, quote, reservation, navigate]);

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
    setVisibleMonth(monthStart(snapshot.context.checkIn));
    setPeople(snapshot.context.people);
    setType(snapshot.context.type);
    setMode(snapshot.context.mode);
    setMealPlan(snapshot.context.mealPlan);
    setPaymentMethod(snapshot.context.paymentMethod);
    setBedPreparationCode(snapshot.context.bedPreparationCode || null);
    setStep(3);
    if (page) navigate('/reservar?paso=datos', { replace: true });
  }, [page, navigate]);

  useEffect(() => {
    if (!reservation) return;
    writeActiveReservation({
      version: 1,
      savedAt: Date.now(),
      reservation,
      quote,
      context: { checkIn, checkOut, people, type, mode, mealPlan, paymentMethod, bedPreparationCode },
    });
  }, [reservation, quote, checkIn, checkOut, people, type, mode, mealPlan, paymentMethod, bedPreparationCode]);

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
  const selectedUtilities = useMemo(() => {
    const servicios = accommodations
      .filter(item => item.tipo === type)
      .flatMap(item => item.servicios || []);
    return [...new Map(servicios.map(item => [item.codigo, item])).values()];
  }, [accommodations, type]);
  const bedPreparationOptions = useMemo(() => {
    const options = accommodations
      .filter(item => item.tipo === type)
      .flatMap(item => item.opciones_preparacion || [])
      .filter(item => item.modalidad === mode && item.cantidad_personas === people);
    return [...new Map(options.map(item => [item.codigo, item])).values()];
  }, [accommodations, type, mode, people]);
  const selectedBedPreparation = bedPreparationOptions.find(item => item.codigo === bedPreparationCode) || null;
  const requiresBedPreparation = bedPreparationOptions.length > 0;

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
    if (bedPreparationCode && !bedPreparationOptions.some(item => item.codigo === bedPreparationCode)) {
      setBedPreparationCode(null);
    }
  }, [bedPreparationCode, bedPreparationOptions]);

  useEffect(() => {
    if (!page || !shouldScrollToStepRef.current) return;
    shouldScrollToStepRef.current = false;
    const frame = window.requestAnimationFrame(() => flowBodyRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' }));
    return () => window.cancelAnimationFrame(frame);
  }, [page, step]);

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

  function goToStep(nextStep: Step, replace = false) {
    shouldScrollToStepRef.current = page && nextStep !== step;
    setStep(nextStep);
    setError(null);
    if (!page) return;
    const slug = nextStep === 1 ? 'fechas' : nextStep === 2 ? 'estadia' : 'datos';
    navigate(`/reservar?paso=${slug}`, { replace });
  }

  function resetQuote() { setQuote(null); setError(null); }

  function retryOptions() {
    setError(null);
    setAccommodations([]);
    setOptionsLoaded(false);
  }

  function selectCalendarDay(date: string) {
    resetQuote();
    if (!checkIn || checkOut || date <= checkIn) {
      setCheckIn(date);
      setCheckOut('');
      return;
    }
    setCheckOut(date);
  }

  function goToStay() {
    setError(null);
    if (!checkIn || !checkOut || checkOut <= checkIn || people < 1) {
      setError({ message: c.dateHelp });
      return;
    }
    goToStep(2);
  }

  async function quoteStay() {
    if (requiresBedPreparation && !bedPreparationCode) {
      setError({ message: c.bedPreparationRequired, code: 'PREFERENCIA_PREPARACION_REQUERIDA' });
      return;
    }
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
      setPaymentMethod(defaultPaymentMethod(result.metodos_pago));
      setSubmitAttempted(false);
      setTouchedReviewFields({});
      goToStep(3);
    } catch (err) {
      setError({ message: apiErrorMessage(err, c.genericError, language), code: err instanceof BookingApiError ? err.code : undefined });
    } finally {
      setLoadingQuote(false);
    }
  }

  async function submitReservation(event: React.FormEvent) {
    event.preventDefault();
    setSubmitAttempted(true);
    if (reviewValidationErrors.length > 0) {
      const firstInvalidField = reviewValidationErrors[0].field;
      window.requestAnimationFrame(() => {
        bookingFormRef.current
          ?.querySelector<HTMLElement>(`[data-booking-field="${firstInvalidField}"]`)
          ?.focus();
      });
      return;
    }
    if (!quote?.opcion) return;
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
        bedPreparationCode,
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
        bedPreparationCode,
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
    goToStep(1, true); setQuote(null); setReservation(null); setError(null); setConsent(false);
    setSubmitAttempted(false); setTouchedReviewFields({});
    setBedPreparationCode(null);
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
    <section className={`booking-dialog booking-dialog--page ${reservation ? 'booking-dialog--result' : 'booking-dialog--selection'}`} aria-labelledby="booking-title" tabIndex={-1}>
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
        {page && !reservation && (
          <div className="booking-flow__hero-media" aria-hidden="true">
            <img src="/uploads/hero-estadia.webp" alt="" />
          </div>
        )}
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

      <div ref={flowBodyRef} className="booking-flow__body" aria-live="polite">
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
                  {selectedBedPreparation && <small>{c.bedPreparation}: {selectedBedPreparation.nombre}</small>}
                  <small>{mealPlan === 'pension_completa' ? c.fullBoardHelp : c.breakfastHelp}</small>
                  {selectedUtilities.length > 0 && <div className="booking-utilities booking-utilities--summary">{selectedUtilities.map(item => <span key={item.codigo} className={item.disponibilidad === 'no_disponible' ? 'booking-utility--unavailable' : ''}>{item.disponibilidad === 'incluido' ? <CheckCircle2 /> : <X />}<span><strong>{item.nombre}</strong><small>{item.detalle || (item.disponibilidad === 'incluido' ? c.utilityAvailable : c.utilityUnavailable)}</small></span></span>)}</div>}
                </div>
                <div className="booking-summary__row booking-summary__total"><span>{c.total}</span><strong>{formatMoney(displayedTotalCentavos ?? quote.precio.subtotal_centavos, quote.precio.moneda, language)}</strong></div>
                {selectedPaymentSurchargeBps > 0 && <div className="booking-summary__row booking-summary__surcharge"><span>{c.paymentSurcharge} ({selectedPaymentSurchargeBps / 100}%)</span><strong>+ {formatMoney(paymentSurchargeCentavos, quote.precio.moneda, language)}</strong></div>}
                <div className="booking-summary__row"><span>{c.perPerson}</span><strong>{formatMoney(displayedPerPersonCentavos ?? Math.round(quote.precio.subtotal_centavos / people), quote.precio.moneda, language)}</strong></div>
                <div className="booking-summary__row"><span>{c.deposit}</span><strong>{formatMoney(displayedDepositCentavos ?? quote.precio.sena_centavos, quote.precio.moneda, language)}</strong></div>
                <div className="booking-summary__row"><span>{c.balance}</span><strong>{formatMoney(displayedBalanceCentavos ?? quote.precio.saldo_centavos, quote.precio.moneda, language)}</strong></div>
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
                  <div className="booking-date-range">
                    <div className="booking-date-range__selection" aria-live="polite">
                      <div data-active={!checkIn || Boolean(checkOut) || undefined}>
                        <CalendarDays aria-hidden="true" />
                        <span><small>{c.checkIn}</small><strong>{formatBookingDate(checkIn, language, true)}</strong></span>
                      </div>
                      <ArrowRight aria-hidden="true" />
                      <div data-active={Boolean(checkIn && !checkOut) || undefined}>
                        <CalendarDays aria-hidden="true" />
                        <span><small>{c.checkOut}</small><strong>{formatBookingDate(checkOut, language, true)}</strong></span>
                      </div>
                    </div>
                    <p className="booking-date-range__instruction" role="status">
                      {checkIn && !checkOut ? c.selectEnd : c.selectStart}
                    </p>
                    <div className="booking-date-range__shortcuts" aria-label={language === 'es' ? 'Meses próximos' : 'Upcoming months'}>
                      {monthShortcuts.map(month => (
                        <button key={month} type="button" aria-pressed={month === visibleMonth}
                          onClick={() => setVisibleMonth(month)}>
                          {new Intl.DateTimeFormat(calendarLocale, { month: 'short', timeZone: 'UTC' })
                            .format(parseIsoDate(month)).replace('.', '')}
                        </button>
                      ))}
                    </div>
                    <div className="booking-calendar">
                      <header>
                        <strong>{calendarMonthLabel}</strong>
                        <span>
                          <button type="button" aria-label={c.previousMonth}
                            disabled={visibleMonth <= monthStart(today)}
                            onClick={() => setVisibleMonth(month => shiftMonth(month, -1))}>
                            <ArrowLeft aria-hidden="true" />
                          </button>
                          <button type="button" aria-label={c.nextMonth}
                            onClick={() => setVisibleMonth(month => shiftMonth(month, 1))}>
                            <ArrowRight aria-hidden="true" />
                          </button>
                        </span>
                      </header>
                      <table aria-label={`${c.datesTitle}: ${calendarMonthLabel}`}>
                        <thead><tr>{weekDays.map((day, index) => <th key={`${day}-${index}`} scope="col">{day}</th>)}</tr></thead>
                        <tbody>
                          {Array.from({ length: 6 }, (_, week) => (
                            <tr key={week}>
                              {visibleCalendarDays.slice(week * 7, week * 7 + 7).map(day => {
                                const isDisabled = day.iso < today || !day.currentMonth;
                                const isStart = day.iso === checkIn;
                                const isEnd = day.iso === checkOut;
                                const isInRange = Boolean(checkIn && checkOut && day.iso > checkIn && day.iso < checkOut);
                                const label = new Intl.DateTimeFormat(calendarLocale, {
                                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
                                }).format(parseIsoDate(day.iso));
                                return (
                                  <td key={day.iso} data-in-range={isInRange || undefined}>
                                    <button type="button" disabled={isDisabled} aria-label={label}
                                      aria-pressed={isStart || isEnd}
                                      data-outside-month={!day.currentMonth || undefined}
                                      data-selection-start={isStart || undefined}
                                      data-selection-end={isEnd || undefined}
                                      onClick={() => selectCalendarDay(day.iso)}>
                                      {parseIsoDate(day.iso).getUTCDate()}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {stayNights > 0 && <div className="booking-night-count"><BedDouble size={20} /> {stayNights} {c.nights}</div>}
                  <div className="booking-guests-row">
                    <span><Users size={28} /><span><strong>{c.people}</strong><small>{language === 'es' ? '¿Quiénes vienen?' : 'Who is coming?'}</small></span></span>
                    <div className="booking-counter" aria-label={c.people}><button type="button" aria-label={`${c.people} -`} onClick={() => { setPeople(value => Math.max(1, value - 1)); resetQuote(); }}><Minus /></button><output aria-live="polite">{people}</output><button type="button" aria-label={`${c.people} +`} onClick={() => { setPeople(value => value + 1); resetQuote(); }}><Plus /></button></div>
                  </div>
                  <div className="booking-arrival-summary" aria-label={c.arrivalTitle}>
                    <Clock3 size={22} aria-hidden="true" />
                    <span><strong>{c.arrivalTitle}</strong><small>{c.arrivalTime} · {c.departureTime}</small><small>{c.arrivalHelp}</small></span>
                  </div>
                  <div className="booking-notice booking-notice--gold"><CalendarDays size={22} /><span><strong>{c.dateNoticeTitle}</strong>{c.dateNotice}</span></div>
                  {error && <div className="booking-notice booking-notice--error"><AlertCircle size={20} /> {error.message}</div>}
                  <div className="booking-actions"><button className="booking-button" type="button" onClick={goToStay}>{c.continue}<ArrowRight size={18} /></button></div>
                </div>
              ) : step === 2 ? (
                <div className="booking-panel">
                  <div className="booking-panel__heading"><button className="booking-back-link" type="button" onClick={() => goToStep(1)}><ArrowLeft size={17} /> {c.back}</button><h3>{c.stayTitle}</h3></div>
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
                      {requiresBedPreparation && <>
                        <p className="booking-section-title">{c.bedPreparation}</p>
                        <p className="booking-choice-help">{c.bedPreparationHelp}</p>
                        <div className="booking-choice-grid">{bedPreparationOptions.map(option => <button key={option.codigo} type="button" className={`booking-choice ${bedPreparationCode === option.codigo ? 'booking-choice--selected' : ''}`} aria-pressed={bedPreparationCode === option.codigo} onClick={() => { setBedPreparationCode(option.codigo); resetQuote(); }}><BedDouble size={23} /><span><strong>{option.nombre}</strong>{option.descripcion && <small>{option.descripcion}</small>}</span><CheckCircle2 className="booking-choice__check" size={21} /></button>)}</div>
                      </>}
                      <p className="booking-section-title">{c.meals}</p>
                      <div className="booking-choice-grid">{(['desayuno_incluido', 'pension_completa'] as const).map(option => <button key={option} type="button" className={`booking-choice ${mealPlan === option ? 'booking-choice--selected' : ''}`} aria-pressed={mealPlan === option} onClick={() => { setMealPlan(option); resetQuote(); }}><Utensils size={23} /><span><strong>{c[option]}</strong><small>{mealPlanHelp(option)}</small></span><CheckCircle2 className="booking-choice__check" size={21} /></button>)}</div>
                      {selectedUtilities.length > 0 && <><p className="booking-section-title">{c.utilities}</p><div className="booking-utilities">{selectedUtilities.map(item => <span key={item.codigo} className={item.disponibilidad === 'no_disponible' ? 'booking-utility--unavailable' : ''}>{item.disponibilidad === 'incluido' ? <CheckCircle2 /> : <X />}<span><strong>{item.nombre}</strong><small>{item.detalle || (item.disponibilidad === 'incluido' ? c.utilityAvailable : c.utilityUnavailable)}</small></span></span>)}</div></>}
                    </>
                  )}
                  {error && <div className="booking-notice booking-notice--error"><AlertCircle size={20} /><span>{error.message}{error.code === 'NO_DISPONIBLE' && <> <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">{c.contactSupport}</a></>}</span></div>}
                  {!loadingOptions && optionsLoaded && availableTypes.length === 0 && <button className="booking-button booking-button--secondary" type="button" onClick={retryOptions}>{c.retry}</button>}
                  <div className="booking-actions"><button className="booking-button booking-button--secondary" type="button" onClick={() => goToStep(1)}><ArrowLeft size={17} /> {c.back}</button><button className="booking-button" type="button" disabled={loadingOptions || loadingQuote || availableModes.length === 0 || (requiresBedPreparation && !bedPreparationCode)} onClick={quoteStay}>{loadingQuote ? <><Loader2 className="booking-loading" size={18} /> {c.quote}</> : <>{c.quote}<ArrowRight size={18} /></>}</button></div>
                </div>
              ) : quote ? (
                <form ref={bookingFormRef} className="booking-panel" onSubmit={submitReservation} noValidate>
                  <div className="booking-panel__heading"><button className="booking-back-link" type="button" onClick={() => goToStep(2)}><ArrowLeft size={17} /> {c.back}</button><h3>{c.reviewTitle}</h3><p>{c.contactIntro}</p></div>
                  <div className="booking-review-cards">
                    <div><CalendarDays /><span><small>{c.datesTitle}</small><strong>{formatBookingDate(checkIn, language)} — {formatBookingDate(checkOut, language)}</strong><em>{stayNights} {c.nights} · {people} {c.people.toLowerCase()}</em></span><button type="button" onClick={() => goToStep(1)}>{c.edit}</button></div>
                    <div><BedDouble /><span><small>{c.stayTitle}</small><strong>{c[type]} · {selectedModeName}</strong>{selectedModeDescription && <em>{selectedModeDescription}</em>}{selectedBedPreparation && <em>{c.bedPreparation}: {selectedBedPreparation.nombre}</em>}<em>{c[mealPlan]} · {mealPlanHelp(mealPlan)}</em></span><button type="button" onClick={() => goToStep(2)}>{c.edit}</button></div>
                  </div>
                  <div className="booking-notice booking-notice--success"><ShieldCheck size={22} /><span><strong>{c.secureNote}</strong>{quoteSeconds > 0 ? `${c.quoteValid}: ${formatRemaining(quoteSeconds)}` : c.expired}</span></div>
                  <div className="booking-grid">
                    <label className={`booking-field booking-field--full ${showReviewError('name') && reviewErrorFor('name') ? 'booking-field--error' : ''}`}>
                      {c.name}
                      <span><UserRound /><input id="booking-guest-name" data-booking-field="name" value={guest.name} onChange={event => setGuest({ ...guest, name: event.target.value })} onBlur={() => touchReviewField('name')} autoComplete="name" aria-invalid={showReviewError('name') && Boolean(reviewErrorFor('name'))} aria-describedby={showReviewError('name') && reviewErrorFor('name') ? 'booking-name-error' : undefined} required /></span>
                      {showReviewError('name') && reviewErrorFor('name') && <small id="booking-name-error" className="booking-field__error"><AlertCircle />{reviewErrorFor('name')?.message}</small>}
                    </label>
                    <label className={`booking-field ${showReviewError('phone') && reviewErrorFor('phone') ? 'booking-field--error' : ''}`}>
                      {c.phone}
                      <span><Phone /><input id="booking-guest-phone" data-booking-field="phone" type="tel" value={guest.phone} onChange={event => setGuest({ ...guest, phone: event.target.value })} onBlur={() => touchReviewField('phone')} autoComplete="tel" aria-invalid={showReviewError('phone') && Boolean(reviewErrorFor('phone'))} aria-describedby={showReviewError('phone') && reviewErrorFor('phone') ? 'booking-phone-error' : undefined} required /></span>
                      {showReviewError('phone') && reviewErrorFor('phone') && <small id="booking-phone-error" className="booking-field__error"><AlertCircle />{reviewErrorFor('phone')?.message}</small>}
                    </label>
                    <label className={`booking-field ${showReviewError('email') && reviewErrorFor('email') ? 'booking-field--error' : ''}`}>
                      {c.email}
                      <span><Mail /><input id="booking-guest-email" data-booking-field="email" type="email" value={guest.email} onChange={event => setGuest({ ...guest, email: event.target.value })} onBlur={() => touchReviewField('email')} autoComplete="email" aria-invalid={showReviewError('email') && Boolean(reviewErrorFor('email'))} aria-describedby={showReviewError('email') && reviewErrorFor('email') ? 'booking-email-error' : undefined} required /></span>
                      {showReviewError('email') && reviewErrorFor('email') && <small id="booking-email-error" className="booking-field__error"><AlertCircle />{reviewErrorFor('email')?.message}</small>}
                    </label>
                  </div>
                  <p className="booking-section-title">{c.paymentMethod}</p>
                  <div className="booking-choice-grid booking-payment-methods">{quote.metodos_pago.map(option => {
                    const surchargeBps = quote.recargos_metodo_pago?.[option]?.porcentaje_bps ?? 0;
                    return <button key={option} type="button" className={`booking-choice ${paymentMethod === option ? 'booking-choice--selected' : ''}`} aria-pressed={paymentMethod === option} onClick={() => setPaymentMethod(option)}>{option === 'mercado_pago_checkout' ? <CreditCard size={23} /> : <Landmark size={23} />}<span><strong>{option === 'mercado_pago_checkout' ? c.checkoutMethod : c.transferMethod}</strong>{surchargeBps > 0 && <small>{c.paymentSurchargeHelp}</small>}</span><CheckCircle2 className="booking-choice__check" size={21} /></button>;
                  })}</div>
                  {paymentMethod === 'transferencia_mp' && <label className={`booking-field booking-field--full booking-dni-field ${showReviewError('dni') && reviewErrorFor('dni') ? 'booking-field--error' : ''}`}>{c.dni}<span><UserRound /><input id="booking-payer-dni" data-booking-field="dni" inputMode="numeric" value={payerDni} onChange={event => setPayerDni(event.target.value)} onBlur={() => touchReviewField('dni')} autoComplete="off" pattern="[0-9. -]{7,12}" aria-invalid={showReviewError('dni') && Boolean(reviewErrorFor('dni'))} aria-describedby={`booking-dni-help${showReviewError('dni') && reviewErrorFor('dni') ? ' booking-dni-error' : ''}`} required /></span><small id="booking-dni-help">{c.dniHelp}</small>{showReviewError('dni') && reviewErrorFor('dni') && <small id="booking-dni-error" className="booking-field__error"><AlertCircle />{reviewErrorFor('dni')?.message}</small>}</label>}
                  <section className="booking-conditions" aria-labelledby="booking-conditions-title">
                    <header><ShieldCheck size={24} aria-hidden="true" /><span><h4 id="booking-conditions-title">{c.conditionsTitle}</h4><p>{c.conditionsIntro}</p></span></header>
                    {renderPriceSummary('booking-conditions__price')}
                    <div className="booking-conditions__grid">
                      <div><Clock3 aria-hidden="true" /><span><strong>{c.arrivalTitle}</strong><small>{c.arrivalTime}<br />{c.departureTime}</small></span></div>
                      <div><Utensils aria-hidden="true" /><span><strong>{c.mealConditionsTitle}</strong><small>{c[mealPlan]} · {mealPlanHelp(mealPlan)}</small></span></div>
                    </div>
                    {selectedUtilities.length > 0 && <div className="booking-conditions__section"><strong>{c.includedConditionsTitle}</strong><div className="booking-utilities booking-utilities--review" aria-label={c.utilities}>{selectedUtilities.map(item => <span key={item.codigo} className={item.disponibilidad === 'no_disponible' ? 'booking-utility--unavailable' : ''}>{item.disponibilidad === 'incluido' ? <CheckCircle2 /> : <X />}<span><strong>{item.nombre}</strong><small>{item.detalle || (item.disponibilidad === 'incluido' ? c.utilityAvailable : c.utilityUnavailable)}</small></span></span>)}</div></div>}
                    <div className="booking-conditions__detail"><Leaf aria-hidden="true" /><span><strong>{c.extendedUseTitle}</strong><small>{c.extendedUseCopy}</small></span></div>
                    <div className="booking-conditions__detail booking-conditions__detail--gold"><CalendarDays aria-hidden="true" /><span><strong>{c.changesTitle}</strong><small>{c.changesCopy} <a href="/terminos-y-condiciones/" target="_blank" rel="noopener noreferrer">{c.fullPolicy}</a>.</small></span></div>
                  </section>
                  <div className="booking-notice"><ShieldCheck size={20} /> {c.privacyNote}</div>
                  <label className={`booking-consent ${showReviewError('consent') && reviewErrorFor('consent') ? 'booking-consent--error' : ''}`}>
                    <input data-booking-field="consent" type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); touchReviewField('consent'); }} aria-invalid={showReviewError('consent') && Boolean(reviewErrorFor('consent'))} aria-describedby={showReviewError('consent') && reviewErrorFor('consent') ? 'booking-consent-error' : undefined} required />
                    <span className="booking-consent__content">
                      <span className="booking-consent__copy">{c.consentPrefix} <a href="/terminos-y-condiciones/" target="_blank" rel="noopener noreferrer">{c.terms}</a> {language === 'es' ? 'y la' : 'and the'} <a href="/politica-de-privacidad/" target="_blank" rel="noopener noreferrer">{c.privacy}</a>.</span>
                      {showReviewError('consent') && reviewErrorFor('consent') && <small id="booking-consent-error" className="booking-field__error"><AlertCircle />{reviewErrorFor('consent')?.message}</small>}
                    </span>
                  </label>
                  {reviewValidationErrors.length > 0 && <div className={`booking-validation-summary ${submitAttempted ? 'booking-validation-summary--error' : ''}`} role={submitAttempted ? 'alert' : 'status'} aria-live="polite"><AlertCircle /><span><strong>{submitAttempted ? c.validationErrorTitle : c.validationTitle}</strong><ul>{reviewValidationErrors.map(item => <li key={item.field}>{item.message}</li>)}</ul></span></div>}
                  {error && <div className="booking-notice booking-notice--error"><AlertCircle size={20} /> {error.message}</div>}
                  <div className="booking-actions"><button className="booking-button booking-button--secondary" type="button" onClick={() => goToStep(2)}><ArrowLeft size={17} /> {c.back}</button><button className="booking-button" type="submit" disabled={submitting || quoteSeconds <= 0}>{submitting ? <><Loader2 className="booking-loading" size={18} /> {c.reserving}</> : <>{c.reserve}<ArrowRight size={18} /></>}</button></div>
                </form>
              ) : (
                <div className="booking-panel"><div className="booking-notice booking-notice--error"><AlertCircle size={20} /> {error?.message || c.expired}</div><div className="booking-actions"><button className="booking-button" type="button" onClick={() => goToStep(2)}>{c.retry}</button></div></div>
              )}
            </div>

            <aside className="booking-sidebar" aria-label={c.selectionTitle}>
              <p className="booking-section-title">{c.selectionTitle}</p>
              {step > 1 && <div className="booking-sidebar__visual" aria-hidden="true"><img src={accommodationImage(type)} alt="" /></div>}
              <h3>{step === 1 ? c.datesTitle : `${c[type]} · ${selectedModeName}`}</h3>
              <ul>
                <li><CalendarDays /> <span>{checkIn && checkOut ? `${formatBookingDate(checkIn, language, true)} — ${formatBookingDate(checkOut, language, true)}` : c.datesTitle}</span></li>
                <li><Users /> <span>{people} {c.people.toLowerCase()}</span></li>
                {step > 1 && <li><Utensils /> <span>{c[mealPlan]} · {mealPlanHelp(mealPlan)}</span></li>}
                {step > 1 && selectedModeDescription && <li><BedDouble /> <span>{selectedModeDescription}</span></li>}
                {step > 1 && selectedBedPreparation && <li><BedDouble /> <span>{c.bedPreparation}: {selectedBedPreparation.nombre}</span></li>}
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
      <div className={`booking-widget ${page ? 'booking-widget--page' : ''}`}>
        {!page && (
          <div className="booking-launcher" data-compact={compact || undefined}>
            <div className="booking-launcher__content">
              <p className="booking-launcher__eyebrow">{c.launcherEyebrow}</p>
              <h3 className="booking-launcher__title">{c.launcherTitle}</h3>
              <strong className="booking-launcher__price">{launcherPrice}</strong>
              <p className="booking-launcher__copy">{c.launcherCopy}</p>
            </div>
            <a className="booking-button" href={RESERVATION_START_PATH}><CalendarDays size={19} aria-hidden="true" /> {c.launcherButton}<ArrowRight size={18} /></a>
          </div>
        )}
      </div>

      {!page && viewportEligible && reservation && (
        <FloatingUiPortal surface="reservation">
          <aside className={`booking-active-reservation ${reservationConfirmed ? 'booking-active-reservation--confirmed' : ''} ${reservationExpired ? 'booking-active-reservation--expired' : ''}`} aria-live="polite">
          <a className="booking-active-reservation__open" href={RESERVATION_START_PATH} aria-label={c.openReservation}>
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
          </a>
          <div className="booking-active-reservation__footer">
            <a className="booking-active-reservation__link" href={reservationStatusUrl}>{c.viewStatus}</a>
            {reservationExpired && <button className="booking-active-reservation__discard" type="button" onClick={startAgain}>{c.discard}</button>}
          </div>
          </aside>
        </FloatingUiPortal>
      )}

      {page && bookingFlow}
    </>
  );
};
