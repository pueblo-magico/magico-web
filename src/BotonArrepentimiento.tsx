import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Copy, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ROUTES } from './routes';

const crearClave = () => `withdrawal-${crypto.randomUUID()}`;

const COPY = {
  es: {
    eyebrow: 'Derecho del consumidor',
    title: 'Botón de arrepentimiento',
    intro: 'Usá este formulario para solicitar la revocación de una contratación realizada online. No necesitás crear una cuenta.',
    warning: 'Enviar la solicitud no cancela automáticamente la reserva ni genera una devolución inmediata. Nuestro equipo la revisará y conservarás una constancia con código y fecha.',
    booking: 'Código de reserva (opcional)',
    bookingHint: 'Si lo tenés, comienza con RES-. Podés enviar la solicitud aunque no lo encuentres.',
    email: 'Correo electrónico de contacto',
    detail: '¿Qué contratación querés revocar?',
    detailHint: 'Incluí la información mínima que nos permita identificarla.',
    submit: 'Enviar solicitud',
    sending: 'Enviando…',
    back: 'Volver al inicio',
    success: 'Recibimos tu solicitud',
    receipt: 'Guardá este código como constancia:',
    received: 'Fecha de recepción',
    copy: 'Copiar código',
    copied: 'Código copiado',
    another: 'Enviar otra solicitud',
    privacy: 'Usaremos estos datos únicamente para identificar la contratación, contactarte y tramitar la solicitud.',
    genericError: 'No pudimos registrar la solicitud. Probá nuevamente.',
    statusTitle: 'Consultar una solicitud',
    statusIntro: 'Ingresá el código ARR-… y el mismo correo usado al enviar la solicitud.',
    statusSubmit: 'Consultar estado',
    statusMessage: 'Mensaje del equipo',
  },
  en: {
    eyebrow: 'Consumer right',
    title: 'Withdrawal button',
    intro: 'Use this form to request withdrawal from a contract made online. You do not need to create an account.',
    warning: 'Submitting this request does not automatically cancel the booking or trigger an immediate refund. Our team will review it, and you will receive a receipt code and timestamp.',
    booking: 'Booking code (optional)',
    bookingHint: 'If available, it starts with RES-. You can submit the request even if you cannot find it.',
    email: 'Contact email',
    detail: 'Which contract do you want to withdraw from?',
    detailHint: 'Provide only the minimum information needed to identify it.',
    submit: 'Submit request',
    sending: 'Submitting…',
    back: 'Back to home',
    success: 'We received your request',
    receipt: 'Keep this code as your receipt:',
    received: 'Received at',
    copy: 'Copy code',
    copied: 'Code copied',
    another: 'Submit another request',
    privacy: 'We will use this data only to identify the contract, contact you, and process this request.',
    genericError: 'We could not register the request. Please try again.',
    statusTitle: 'Check a request',
    statusIntro: 'Enter the ARR-… code and the same email used to submit the request.',
    statusSubmit: 'Check status',
    statusMessage: 'Message from our team',
  },
};

type Constancia = { codigo: string; estado: string; recibida_at: string };
type EstadoPublico = Constancia & { actualizada_at: string; mensaje: string | null };

const BotonArrepentimiento: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();
  const copy = COPY[language];
  const idempotencyKey = useRef(crearClave());
  const [reservaCodigo, setReservaCodigo] = useState('');
  const [email, setEmail] = useState('');
  const [detalle, setDetalle] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [constancia, setConstancia] = useState<Constancia | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [codigoConsulta, setCodigoConsulta] = useState('');
  const [emailConsulta, setEmailConsulta] = useState('');
  const [estadoConsulta, setEstadoConsulta] = useState<EstadoPublico | null>(null);
  const [errorConsulta, setErrorConsulta] = useState('');
  const [consultando, setConsultando] = useState(false);

  useEffect(() => {
    document.title = `${copy.title} — Pueblo Mágico`;
  }, [copy.title]);

  const enviar = async (event: React.FormEvent) => {
    event.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const response = await fetch('/api/v1/public/arrepentimientos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey.current,
        },
        body: JSON.stringify({ reserva_codigo: reservaCodigo || null, email, detalle, idioma: language }),
      });
      const body: any = await response.json();
      if (!response.ok) throw new Error(body?.error?.mensaje || copy.genericError);
      setConstancia(body.data.solicitud);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.genericError);
    } finally {
      setEnviando(false);
    }
  };

  const nueva = () => {
    idempotencyKey.current = crearClave();
    setReservaCodigo('');
    setEmail('');
    setDetalle('');
    setConstancia(null);
    setCopiado(false);
    setError('');
  };

  const copiar = async () => {
    if (!constancia) return;
    await navigator.clipboard.writeText(constancia.codigo);
    setCopiado(true);
  };

  const consultar = async (event: React.FormEvent) => {
    event.preventDefault();
    setConsultando(true);
    setErrorConsulta('');
    setEstadoConsulta(null);
    try {
      const query = new URLSearchParams({ codigo: codigoConsulta, email: emailConsulta });
      const response = await fetch(`/api/v1/public/arrepentimientos?${query}`);
      const body: any = await response.json();
      if (!response.ok) throw new Error(body?.error?.mensaje || copy.genericError);
      setEstadoConsulta(body.data.solicitud);
    } catch (cause) {
      setErrorConsulta(cause instanceof Error ? cause.message : copy.genericError);
    } finally {
      setConsultando(false);
    }
  };

  return (
    <div className="min-h-screen bg-bone text-dark">
      <header className="border-b border-brand/10 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <a href={ROUTES.HOME} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-gold">
            <ArrowLeft size={17} aria-hidden="true" /> {copy.back}
          </a>
          <button type="button" onClick={toggleLanguage} className="rounded-full border border-brand/30 px-4 py-1.5 text-xs font-bold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
            {language === 'es' ? 'EN' : 'ES'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
        <div className="mb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-gold">{copy.eyebrow}</p>
          <h1 className="mb-4 font-serif text-4xl text-brand sm:text-5xl">{copy.title}</h1>
          <p className="text-base font-light leading-relaxed text-dark/70">{copy.intro}</p>
        </div>

        {!constancia ? (
          <form onSubmit={enviar} className="space-y-5 rounded-3xl border border-brand/15 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              <ShieldCheck className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
              <p>{copy.warning}</p>
            </div>
            <label className="block text-sm font-semibold text-brand">
              {copy.booking}
              <input value={reservaCodigo} onChange={e => setReservaCodigo(e.target.value)} maxLength={104} placeholder="RES-…" className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-sans font-normal uppercase text-dark focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              <span className="mt-1.5 block text-xs font-normal text-dark/50">{copy.bookingHint}</span>
            </label>
            <label className="block text-sm font-semibold text-brand">
              {copy.email}
              <input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={254} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-sans font-normal text-dark focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
            </label>
            <label className="block text-sm font-semibold text-brand">
              {copy.detail}
              <textarea required minLength={10} maxLength={1000} rows={5} value={detalle} onChange={e => setDetalle(e.target.value)} className="mt-2 w-full resize-y rounded-xl border border-gray-300 px-4 py-3 font-sans font-normal text-dark focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              <span className="mt-1.5 block text-xs font-normal text-dark/50">{copy.detailHint}</span>
            </label>
            <p className="text-xs leading-relaxed text-dark/50">{copy.privacy}</p>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button disabled={enviando} className="w-full rounded-full bg-brand px-6 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-gold disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
              {enviando ? copy.sending : copy.submit}
            </button>
          </form>
        ) : (
          <section aria-live="polite" className="rounded-3xl border border-green-200 bg-white p-6 shadow-sm sm:p-8">
            <CheckCircle2 className="mb-4 text-green-700" size={42} aria-hidden="true" />
            <h2 className="mb-2 text-2xl font-bold text-brand">{copy.success}</h2>
            <p className="mb-4 text-sm text-dark/60">{copy.receipt}</p>
            <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <code className="break-all text-base font-bold text-brand">{constancia.codigo}</code>
              <button type="button" onClick={copiar} className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand/20 px-3 py-2 text-xs font-bold text-brand hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                <Copy size={15} aria-hidden="true" /> {copiado ? copy.copied : copy.copy}
              </button>
            </div>
            <p className="mb-6 text-xs text-dark/50">{copy.received}: {new Date(constancia.recibida_at).toLocaleString(language === 'es' ? 'es-AR' : 'en-US')}</p>
            <p className="mb-6 rounded-2xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">{copy.warning}</p>
            <button type="button" onClick={nueva} className="text-sm font-bold text-brand underline underline-offset-4 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">{copy.another}</button>
          </section>
        )}

        <section className="mt-8 rounded-3xl border border-brand/15 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-brand">{copy.statusTitle}</h2>
          <p className="mt-2 text-sm text-dark/60">{copy.statusIntro}</p>
          <form onSubmit={consultar} className="mt-5 grid gap-4 sm:grid-cols-2">
            <input required value={codigoConsulta} onChange={event => setCodigoConsulta(event.target.value)} placeholder="ARR-…" className="rounded-xl border border-gray-300 px-4 py-3 font-sans uppercase text-dark focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
            <input required type="email" value={emailConsulta} onChange={event => setEmailConsulta(event.target.value)} placeholder={copy.email} className="rounded-xl border border-gray-300 px-4 py-3 font-sans text-dark focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
            <button disabled={consultando} className="rounded-full bg-brand px-5 py-3 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2">{consultando ? copy.sending : copy.statusSubmit}</button>
          </form>
          {errorConsulta && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorConsulta}</p>}
          {estadoConsulta && <div aria-live="polite" className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-dark/70">
            <p><strong className="text-brand">{estadoConsulta.codigo}</strong> · {estadoConsulta.estado.replace('_', ' ')}</p>
            {estadoConsulta.mensaje && <p className="mt-2"><strong>{copy.statusMessage}:</strong> {estadoConsulta.mensaje}</p>}
          </div>}
        </section>
      </main>
    </div>
  );
};

export default BotonArrepentimiento;
