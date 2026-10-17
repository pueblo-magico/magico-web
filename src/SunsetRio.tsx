import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Waves, Coffee, Sunset, Flame, Mountain, Wind, Snowflake, AlertTriangle, ChevronDown, Users, User, Backpack, Home, Music, HelpCircle, Car, Tent, X, Check, Percent, Utensils, type LucideIcon } from 'lucide-react';
import { img } from './lib/img';
import { validarNombre, validarTelefono, validarEmail, validarEdad } from './lib/validarContacto';
import { useAntiBot } from './lib/useAntiBot';
import { WA_MAGICO } from './data/config';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { HorizontalCardRail } from '../components/HorizontalCardRail';

// Landing de VALIDACIÓN: todavía no toma señas. La fecha quedó definida
// (finde del 30/10 al 1/11): cada clic en un botón se guarda como evento
// fecha_elegida, y el formulario corto (nombre, solo/a o grupo) se guarda en D1
// antes de abrir WhatsApp — ver functions/api/interes.ts y add_interes_eventos.sql.

const EVENTO = 'sunset-y-rio';
const FECHA = '30-1';
type Valor = typeof FECHA | 'grupo';

const wa = (msg: string) => `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(msg)}`;

// Lo manda la persona desde su WhatsApp (gratis) y confirma que el número es suyo.
const waConfirmacion = (nombre: string, codigo: string, modalidad: 'solo' | 'grupo', cantidad: number) =>
  wa(`¡Hola! Soy ${nombre}. Me anoté a Sunset y Río (30 de octubre al 1 de noviembre) con el código ${codigo}${modalidad === 'grupo' ? `, vamos en grupo de ${cantidad}` : ''}. Confirmo mis datos ✅`);

const WA_INFO = wa('¡Hola! Quiero saber más de Sunset y Río.');

// sendBeacon sobrevive a que la página navegue a WhatsApp; si falla, no frena nada.
const trackFechaElegida = (valor: Valor) => {
  try {
    navigator.sendBeacon('/api/interes', JSON.stringify({ tipo: 'click', evento: EVENTO, valor }));
  } catch { /* medición best-effort */ }
};

const C = {
  sunset:  '#D9622B', // naranja de atardecer — color principal del evento
  ember:   '#B5401F', // brasa — hover / contraste sobre crema
  gold:    '#D4AF37',
  green:   '#005333',
  river:   '#2F6F7E', // agua de río — acento del bloque río
  night:   '#1A120C',
  cream:   '#FDFBF7',
  sand:    '#F7F1E8',
  dark:    '#2A1708',
  muted:   '#6B4A33',
  faint:   '#8B6347',
};

// Primera edición: las fotos con personas de la portada y del río son
// ilustrativas (IA sobre paisajes reales del lugar) y lo decimos en la foto.
const NOTA_IA = 'Imagen ilustrativa creada con IA sobre paisajes reales de Pueblo Mágico · es la primera edición';

// photoMobile: en celular la foto ilustrativa del río ya es la portada, así
// que la tarjeta muestra directamente la toma real (sin recuadro ni aviso).
// opcional: actividades guiadas con contraindicaciones (ver AVISO_SALUD).
const SABADO: { Icon: LucideIcon; color: string; hora: string; title: string; text: React.ReactNode; photo: string; alt: string; ilustrativa?: boolean; opcional?: boolean; inset?: { src: string; alt: string }; photoMobile?: { src: string; alt: string } }[] = [
  {
    Icon: Car, color: C.faint, hora: 'Desde las 10', title: 'Llegada',
    text: 'Llegás y te acomodás.',
    photo: '/uploads/sunset-rio-refugio-jardin.webp', alt: 'Visitantes en el jardín del refugio de piedra de Pueblo Mágico',
  },
  {
    Icon: Wind, color: C.green, hora: 'Media mañana', title: 'Breathwork',
    text: 'Una sesión de respiración guiada con música, acostados en el pasto del jardín. Se siente como soltar todo lo que traés de la semana.',
    photo: '/uploads/sunset-rio-breathwork.webp', alt: 'Grupo de amigos acostados en el pasto, con las cabezas juntas, riéndose',
    ilustrativa: true, opcional: true,
  },
  {
    Icon: Waves, color: C.river, hora: 'Mediodía y tarde', title: 'Río',
    text: 'Caminata tranqui de unos 20 minutos, almuerzo en el río y la tarde en el agua, con sombra armada.',
    photo: '/uploads/sunset-rio-amigos-rio.webp', alt: 'Amigos con los pies en el agua sobre las piedras del río',
    ilustrativa: true,
    inset: { src: '/uploads/sunset-rio-pozon.webp', alt: 'El pozón real del río, entre piedras y pastizal' },
    photoMobile: { src: '/uploads/sunset-rio-pozon.webp', alt: 'El pozón real del río, entre piedras y pastizal' },
  },
  {
    Icon: Snowflake, color: C.river, hora: 'A la vuelta del río', title: 'Ice bath',
    text: 'Una experiencia de inmersión en frío, guiada y a tu ritmo. Unos minutos en agua con hielo y después, a la merienda.',
    photo: '/uploads/sunset-rio-ice-bath.webp', alt: 'Chica relajada en una tina con agua y hielo en el jardín del refugio de piedra',
    ilustrativa: true, opcional: true,
  },
  {
    Icon: Coffee, color: C.green, hora: 'Después', title: 'Merienda',
    text: 'Mate o tereré mientras se arma el atardecer. Y para refrescar, agua con cítricos y limonada.',
    photo: '/uploads/sunset-rio-jarras.webp', alt: 'Jarras de agua con naranja y menta sobre la mesa de madera',
  },
  {
    Icon: Sunset, color: C.sunset, hora: 'Cae el sol', title: 'Sunset con música',
    text: 'El sol baja con música, brindis con el trago de la casa (con y sin alcohol) y algo para picar. Si se confirma DJ, lo anunciamos cerca de la fecha.',
    photo: '/uploads/sunset-rio-brindis.webp', alt: 'Grupo de amigos brindando al atardecer en el jardín del refugio de piedra',
    ilustrativa: true,
  },
  {
    Icon: Flame, color: C.ember, hora: 'A la noche', title: 'Fogón',
    text: 'Cena casera y guitarreada.',
    photo: '/uploads/sunset-rio-fogon-real.webp', alt: 'Ronda alrededor del fogón con tambor en Pueblo Mágico',
  },
];

const DOMINGO = [
  'Desayuno.',
  'Otro río, distinto al del sábado. Podés ir caminando o en auto: en auto, son solo 5 minutos a pie desde donde se estaciona.',
  'Almuerzo casero.',
  'Salida libre: recomendamos desde las 18 para volver con luz. Si querés quedarte más, o una noche más, se puede.',
];

// Cada tarjeta lleva solo 3 puntos cortos y del mismo largo para que las tres
// queden parejas; el detalle de comidas va una sola vez en COMIDAS (desplegable).
// Sin precios por ahora: se publican cuando se abran las reservas.
const MODALIDADES: { key: string; label: string; cuando: string; destacado: boolean; incluye: string[] }[] = [
  {
    key: 'sabado', label: 'Sábado', cuando: 'Sábado · sin alojamiento',
    destacado: false,
    incluye: ['Río, atardecer y fogón', 'Almuerzo, merienda, picada y cena', 'Volvés el sábado a la noche'],
  },
  {
    key: '1noche', label: '1 noche', cuando: 'Sábado y domingo',
    destacado: true,
    incluye: ['Todo lo del sábado', 'Dormís acá: no manejás de noche', 'Domingo: desayuno, río y almuerzo'],
  },
  {
    key: 'finde', label: 'Finde completo', cuando: '2 noches · vie a dom o sáb a lun',
    destacado: false,
    incluye: ['Todo lo de 1 noche', 'Sumás el viernes o el domingo', 'Elegís tus dos noches'],
  },
];

const COMIDAS: { opcion: string; texto: string }[] = [
  { opcion: 'Sábado', texto: 'Almuerzo en el río, merienda, picada al atardecer y cena.' },
  { opcion: '1 noche', texto: 'Todo lo del sábado + desayuno y almuerzo casero del domingo.' },
  { opcion: 'Finde completo · desde el viernes', texto: 'Cena del viernes; desayuno, almuerzo y cena del sábado; desayuno y almuerzo del domingo. Salida libre el domingo.' },
  { opcion: 'Finde completo · desde el sábado', texto: 'Almuerzo y cena del sábado; desayuno, almuerzo y cena del domingo; desayuno del lunes. Salís el lunes.' },
];

const BOTONES_FECHA: { label: string; valor: Valor; primary: boolean }[] = [
  { label: 'Quiero ir',      valor: FECHA,   primary: true },
  { label: 'Vamos en grupo', valor: 'grupo', primary: false },
];

// ─── Formulario de interés ──────────────────────────────────────────────────────
type FormInicial = { modalidad: 'solo' | 'grupo' | null };

const Opcion: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({ selected, onClick, children }) => (
  <button
    type="button" role="radio" aria-checked={selected} onClick={onClick}
    className="flex-1 min-w-0 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors"
    style={selected
      ? { backgroundColor: C.sunset, borderColor: C.sunset, color: 'white' }
      : { backgroundColor: 'white', borderColor: 'rgba(42,23,8,0.15)', color: C.dark }}
  >
    {children}
  </button>
);

const GENEROS: { valor: string; label: string }[] = [
  { valor: 'mujer', label: 'Mujer' },
  { valor: 'hombre', label: 'Hombre' },
  { valor: 'no_binario', label: 'No binario' },
  { valor: 'prefiero_no_decir', label: 'Prefiero no decir' },
];

const FUENTES: { valor: string; label: string }[] = [
  { valor: 'instagram', label: 'Instagram' },
  { valor: 'facebook', label: 'Facebook' },
  { valor: 'tiktok', label: 'TikTok' },
  { valor: 'whatsapp', label: 'Por WhatsApp' },
  { valor: 'amigos', label: 'Me lo contó alguien' },
  { valor: 'google', label: 'Google' },
  { valor: 'runclub_cordoba', label: 'RunclubCordoba' },
  { valor: 'ya_vine', label: 'Ya vine a Pueblo Mágico' },
  { valor: 'otro', label: 'Otro' },
];

const InteresModal: React.FC<{ inicial: FormInicial; onClose: () => void }> = ({ inicial, onClose }) => {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');
  const [fuente, setFuente] = useState('');
  const [fuenteOtro, setFuenteOtro] = useState('');
  const [modalidad, setModalidad] = useState<'solo' | 'grupo' | null>(inicial.modalidad);
  const [cantidad, setCantidad] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [mailEnviado, setMailEnviado] = useState(false);
  const { trampa, trampaValor, msLlenado } = useAntiBot();
  const [error, setError] = useState('');
  const nombreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nombreRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(cantidad);
    const ed = Number(edad);
    const invalido = validarNombre(nombre) || validarTelefono(telefono) || validarEmail(email) || validarEdad(ed);
    if (invalido) return setError(invalido);
    if (!genero) return setError('Elegí una opción de género.');
    if (!fuente) return setError('Contanos cómo te enteraste del evento.');
    if (!modalidad) return setError('Contanos si venís solo/a o en grupo.');
    if (modalidad === 'grupo' && (!Number.isInteger(n) || n < 2 || n > 30)) return setError('¿Cuántos son? (entre 2 y 30)');
    setError('');
    setEnviando(true);
    try {
      const res = await fetch('/api/interes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'form', evento: EVENTO, valor: FECHA,
          nombre: nombre.trim(), telefono: telefono.trim(), email: email.trim(), edad: ed,
          genero, fuente, fuenteOtro: fuente === 'otro' ? fuenteOtro.trim() : undefined,
          modalidad, cantidad: modalidad === 'grupo' ? n : undefined,
          pagina: window.location.pathname + window.location.search,
          sitio_web: trampaValor(), ms: msLlenado(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'No se pudo guardar.');
      }
      const data = await res.json();
      setMailEnviado(Boolean(data.mailConfirmacion));
      setMailEnviado(Boolean(data.mailConfirmacion));
      setCodigo(data.codigo || '');
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar. Probá de nuevo o escribinos por WhatsApp.');
    } finally {
      setEnviando(false);
    }
  };

  const labelCls = 'block text-[11px] font-bold uppercase tracking-widest mb-2';
  const inputCls = 'w-full rounded-xl border px-4 py-3 text-base mb-5 outline-none focus:ring-2 bg-white';
  const inputStyle = { borderColor: 'rgba(42,23,8,0.15)', color: C.dark };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="interes-titulo">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(26,18,12,0.7)' }} onClick={onClose} />
      <form onSubmit={submit} noValidate
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 md:p-8 max-h-[92svh] overflow-y-auto"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        {trampa}
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5">
          <X size={18} color={C.faint} />
        </button>
        <p className="text-[10px] tracking-[0.35em] uppercase font-semibold mb-2" style={{ color: C.sunset }}>Sunset y Río · 30/10 al 1/11</p>

        {codigo !== null ? (
          <div role="status">
            <h2 id="interes-titulo" className="text-2xl serif-title mb-3" style={{ color: C.dark }}>¡Listo, {nombre.trim().split(' ')[0]}!</h2>
            <p className="text-sm mb-4" style={{ color: C.muted }}>
              Ya estás en la lista. Te escribimos apenas abramos las reservas, con precios y todos los detalles.
            </p>
            {codigo && (
              <p className="text-center rounded-2xl py-3 mb-4" style={{ backgroundColor: C.sand }}>
                <span className="block text-[10px] font-bold uppercase tracking-widest" style={{ color: C.faint }}>Tu código</span>
                <span className="text-2xl font-bold tabular-nums" style={{ color: C.ember }}>{codigo}</span>
              </p>
            )}
            <p className="text-sm mb-4" style={{ color: C.muted }}>
              {mailEnviado
                ? <>Te mandamos un mail a <strong style={{ color: C.dark }}>{email.trim()}</strong> para confirmarlo (mirá también en spam). Y si querés, confirmá también por WhatsApp:</>
                : <>Si querés, confirmá tus datos por WhatsApp con tu código:</>}
            </p>
            <a href={waConfirmacion(nombre.trim(), codigo, modalidad || 'solo', Number(cantidad))} target="_blank" rel="noopener noreferrer"
              className="block text-center text-sm font-bold py-3.5 rounded-full mb-3 text-white" style={{ backgroundColor: '#25D366' }}>
              Confirmar por WhatsApp
            </a>
            <button type="button" onClick={onClose} className="block w-full text-center text-sm font-semibold py-3.5 rounded-full border" style={{ borderColor: C.dark, color: C.dark }}>
              Volver a la página
            </button>
          </div>
        ) : (
          <>
            <h2 id="interes-titulo" className="text-2xl serif-title mb-1" style={{ color: C.dark }}>Anotate</h2>
            <p className="text-sm mb-6" style={{ color: C.muted }}>Viernes 30 de octubre al domingo 1 de noviembre. Te avisamos cuando abramos las reservas.</p>

            <label htmlFor="interes-nombre" className={labelCls} style={{ color: C.faint }}>Nombre y apellido</label>
            <input id="interes-nombre" ref={nombreRef} type="text" autoComplete="name" maxLength={100}
              value={nombre} onChange={e => setNombre(e.target.value)} className={inputCls} style={inputStyle} />

            <label htmlFor="interes-telefono" className={labelCls} style={{ color: C.faint }}>Teléfono (WhatsApp)</label>
            <input id="interes-telefono" type="tel" autoComplete="tel" inputMode="tel" maxLength={30} placeholder="351 123 4567"
              value={telefono} onChange={e => setTelefono(e.target.value)} className={inputCls} style={inputStyle} />

            <label htmlFor="interes-email" className={labelCls} style={{ color: C.faint }}>Mail</label>
            <input id="interes-email" type="email" autoComplete="email" maxLength={120}
              value={email} onChange={e => setEmail(e.target.value)} className={inputCls} style={inputStyle} />

            <div className="grid grid-cols-[6rem_1fr] gap-3">
              <div>
                <label htmlFor="interes-edad" className={labelCls} style={{ color: C.faint }}>Edad</label>
                <input id="interes-edad" type="number" inputMode="numeric" min={14} max={99}
                  value={edad} onChange={e => setEdad(e.target.value)} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label htmlFor="interes-genero" className={labelCls} style={{ color: C.faint }}>Género</label>
                <select id="interes-genero" value={genero} onChange={e => setGenero(e.target.value)} className={inputCls} style={inputStyle}>
                  <option value="" disabled>Elegí</option>
                  {GENEROS.map(g => <option key={g.valor} value={g.valor}>{g.label}</option>)}
                </select>
              </div>
            </div>

            <label htmlFor="interes-fuente" className={labelCls} style={{ color: C.faint }}>¿Cómo te enteraste del evento?</label>
            <select id="interes-fuente" value={fuente} onChange={e => setFuente(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="" disabled>Elegí</option>
              {FUENTES.map(f => <option key={f.valor} value={f.valor}>{f.label}</option>)}
            </select>
            {fuente === 'otro' && (
              <input aria-label="¿Dónde?" type="text" maxLength={80} placeholder="¿Dónde?"
                value={fuenteOtro} onChange={e => setFuenteOtro(e.target.value)} className={`${inputCls} -mt-2`} style={inputStyle} />
            )}

            <p className={labelCls} style={{ color: C.faint }} id="interes-modalidad">¿Venís solo/a o en grupo?</p>
            <div role="radiogroup" aria-labelledby="interes-modalidad" className="flex gap-2 mb-5">
              <Opcion selected={modalidad === 'solo'} onClick={() => setModalidad('solo')}>Solo/a</Opcion>
              <Opcion selected={modalidad === 'grupo'} onClick={() => setModalidad('grupo')}>En grupo</Opcion>
            </div>

            {modalidad === 'grupo' && (
              <>
                <label htmlFor="interes-cantidad" className={labelCls} style={{ color: C.faint }}>¿Cuántos son?</label>
                <input id="interes-cantidad" type="number" inputMode="numeric" min={2} max={30}
                  value={cantidad} onChange={e => setCantidad(e.target.value)}
                  className="w-32 rounded-xl border px-4 py-3 text-base mb-5 outline-none focus:ring-2" style={inputStyle} />
              </>
            )}

            {error && <p role="alert" className="text-sm font-semibold mb-4" style={{ color: C.ember }}>{error}</p>}

            <button type="submit" disabled={enviando} className="btn-gold text-sm py-4 w-full disabled:opacity-60">
              {enviando ? 'Enviando…' : 'Anotarme'}
            </button>
            <p className="text-xs text-center mt-3" style={{ color: C.faint }}>
              Todavía no tomamos reservas ni pagos. Usamos tus datos solo para contactarte por este evento.
            </p>
          </>
        )}
      </form>
    </div>
  );
};

type Desplegable = { key: string; Icon: LucideIcon; title: string; body: React.ReactNode };

const Accordion: React.FC<{ item: Desplegable; open: boolean; onToggle: () => void }> = ({ item, open, onToggle }) => (
  <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: open ? 'rgba(217,98,43,0.35)' : 'rgba(42,23,8,0.1)' }}>
    <button onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between gap-4 px-5 md:px-6 py-4 md:py-5 text-left transition-colors hover:bg-black/[0.02]">
      <span className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(217,98,43,0.1)' }}>
          <item.Icon size={16} color={C.sunset} />
        </span>
        <span className="font-semibold text-base md:text-lg" style={{ color: C.dark }}>{item.title}</span>
      </span>
      <ChevronDown size={18} color={C.faint} className="flex-shrink-0 transition-transform duration-300" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
    </button>
    <div className="overflow-hidden transition-all duration-500 ease-in-out" style={{ maxHeight: open ? '1200px' : '0px', opacity: open ? 1 : 0 }}>
      <div className="px-5 md:px-6 pb-6 text-sm md:text-base leading-relaxed" style={{ color: C.muted }}>
        {item.body}
      </div>
    </div>
  </div>
);

const SunsetRio: React.FC = () => {
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [comidasOpen, setComidasOpen] = useState(false);
  const [form, setForm] = useState<FormInicial | null>(null);
  const cerrarForm = useCallback(() => setForm(null), []);
  // Vuelta del link "Confirmar mi mail" (functions/api/confirmar.ts).
  const [confirmado, setConfirmado] = useState<'1' | '0' | null>(null);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('confirmado');
    if (v === '1' || v === '0') setConfirmado(v);
  }, []);

  const elegir = (valor: Valor) => {
    trackFechaElegida(valor);
    setForm({ modalidad: valor === 'grupo' ? 'grupo' : null });
  };

  useEffect(() => {
    document.title = 'Sunset y Río · en la montaña · 30 oct al 1 nov · Pueblo Mágico';
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const r = document.getElementById('fecha')?.getBoundingClientRect();
      const fechaVisible = r ? r.top < window.innerHeight && r.bottom > 0 : false;
      const nearBottom = y + window.innerHeight > document.documentElement.scrollHeight - 600;
      setShowStickyBar(y > 500 && !nearBottom && !fechaVisible);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const DESPLEGABLES: Desplegable[] = [
    {
      key: 'llevo', Icon: Backpack, title: '¿Qué llevo?',
      body: (
        <>
          <p className="mb-4">Pensalo como un día de pileta, pero en la montaña.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {['Malla abajo', 'Ropa cómoda', 'Zapatillas o sandalias que agarren', 'Toalla', 'Protector solar', 'Abrigo para la noche'].map(i => (
              <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(217,98,43,0.08)', color: C.ember, border: '1px solid rgba(217,98,43,0.2)' }}>{i}</span>
            ))}
          </div>
          <p className="mb-3">Si tenés sombrilla, sumala para el río. Y si tocás la guitarra, traela para el fogón.</p>
          <p>Si venís en carpa y no tenés equipo, te conectamos con nuestros aliados para alquilarlo.</p>
        </>
      ),
    },
    {
      key: 'donde', Icon: Home, title: '¿Dónde dormís y dónde es?',
      body: (
        <>
          <p className="mb-3">
            Pueblo Mágico, un refugio vivo en Los Gigantes, a 90 km de Córdoba. Llega cualquier auto. Dormís en cama, en habitación compartida o domo, o en carpa en la zona de camping (30% OFF).
          </p>
          <p className="mb-5">
            El 10% de cada entrada va a la reforestación y restauración de las Sierras Grandes de Córdoba: árboles nativos plantados en las mismas hectáreas que vas a recorrer.
          </p>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {[
              { src: '/uploads/hero-estadia.webp', alt: 'Refugio de piedra al atardecer', label: 'Habitación' },
              { src: '/uploads/sunset-rio-domo.webp', alt: 'Huéspedes charlando en el deck del domo', label: 'Domo' },
              { src: '/uploads/exterior.webp', alt: 'Zona de camping entre árboles', label: 'Carpa' },
            ].map(p => (
              <figure key={p.label} className="relative rounded-xl overflow-hidden">
                <img src={img(p.src, 500)} alt={p.alt} className="w-full aspect-[4/3] object-cover" loading="lazy" />
                <figcaption className="absolute bottom-0 inset-x-0 px-2.5 py-1.5 text-[11px] font-semibold text-white" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>{p.label}</figcaption>
              </figure>
            ))}
          </div>
          <figure className="relative mt-3 rounded-xl overflow-hidden">
            <img src={img('/uploads/sunset-rio-mate-domo.webp', 800)} alt="Ronda de mate y charla en el domo" className="w-full aspect-[5/2] object-cover object-[center_35%]" loading="lazy" />
            <figcaption className="absolute bottom-0 inset-x-0 px-3 py-2 text-xs font-semibold text-white" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>Mate y charla en el domo</figcaption>
          </figure>
        </>
      ),
    },
    {
      key: 'musica', Icon: Music, title: 'Música y bebidas',
      body: (
        <>
          <p className="mb-3">El sol baja con buena música y se arma baile. Si se confirma DJ, lo anunciamos cerca de la fecha.</p>
          <p>En el río hay agua fresca y limonada; al atardecer, el trago de la casa con y sin alcohol. A la noche, guitarreada en el fogón.</p>
        </>
      ),
    },
    {
      key: 'faq', Icon: HelpCircle, title: 'Preguntas frecuentes',
      body: (
        <dl className="space-y-4">
          {[
            { q: '¿Hay que caminar mucho?', a: 'No. La caminata más larga es de unos 20 minutos, tranqui. Y el domingo podés ir al río en auto y caminar solo 5 minutos. Si preferís, también te podés quedar en el Mágico.' },
            { q: '¿Puedo llegar el viernes o quedarme hasta el lunes?', a: 'Sí. Con el finde completo elegís tus dos noches: viernes y sábado, o sábado y domingo.' },
            { q: '¿A qué hora llego y a qué hora me voy?', a: 'Llegás el sábado desde las 10. El domingo la salida es libre: recomendamos desde las 18 para volver con luz.' },
            { q: '¿Puedo volver el sábado a la noche?', a: 'Sí, pero son 90 km de ruta de montaña de noche. Si te quedás, dormís acá y el domingo hay otro río.' },
            { q: '¿Tengo que hacer el breathwork y el ice bath?', a: 'No, son opcionales. Si querés, mientras tanto te quedás con un mate o descansando. Si tenés alguna condición de salud (corazón, presión alta, epilepsia, embarazo), avisanos antes.' },
            { q: '¿Hay baño?', a: 'Sí, en el refugio.' },
            { q: '¿Cómo llego?', a: 'En auto. Si no tenés, avisanos y te conectamos con alguien que va.' },
            { q: '¿Podemos dormir juntos en grupo?', a: 'Sí, pueden compartir domo o refugio.' },
          ].map(({ q, a }) => (
            <div key={q}>
              <dt className="font-semibold mb-1" style={{ color: C.dark }}>{q}</dt>
              <dd>{a}</dd>
            </div>
          ))}
        </dl>
      ),
    },
  ];

  return (
    <div style={{ backgroundColor: C.cream, color: C.dark }} className="overflow-x-hidden">
      <Header />

      {confirmado && (
        <div role="status" className="fixed top-24 left-1/2 -translate-x-1/2 z-[999] w-[calc(100%-2rem)] max-w-md rounded-2xl px-5 py-4 shadow-2xl flex items-start gap-3"
          style={{ backgroundColor: confirmado === '1' ? C.green : C.ember, color: 'white' }}>
          <Check size={20} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm flex-1">
            {confirmado === '1'
              ? <><strong>¡Mail confirmado!</strong> Te avisamos apenas abramos las reservas de Sunset y Río.</>
              : <>Ese link de confirmación no es válido. Si tenés dudas, escribinos por WhatsApp.</>}
          </p>
          <button type="button" onClick={() => setConfirmado(null)} aria-label="Cerrar" className="flex-shrink-0"><X size={18} /></button>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="relative h-[100svh] min-h-[640px] md:h-[100vh] w-full flex flex-col justify-end md:justify-center overflow-hidden" style={{ backgroundColor: C.night }}>
        {/* Celular: amigos en el río (vertical). Escritorio: amigos bailando,
            con el lado izquierdo libre para el texto. */}
        <div className="absolute inset-0 md:hidden" style={{ backgroundImage: `url(${img('/uploads/sunset-rio-amigos-rio.webp', 900)})`, backgroundSize: 'cover', backgroundPosition: 'center 18%' }} />
        {/* La foto deja libre el ~40% izquierdo (el refugio): ahí va el texto,
            alineado al borde izquierdo de la pantalla y no centrado. */}
        <div className="absolute inset-0 hidden md:block bg-cover bg-[position:25%_40%]" style={{ backgroundImage: `url(${img('/uploads/sunset-rio-baile.webp', 1800)})` }} />
        <div
          className="absolute inset-0 pointer-events-none md:hidden"
          style={{ background: 'linear-gradient(to top, rgba(26,18,12,0.95) 0%, rgba(26,18,12,0.6) 32%, rgba(90,35,10,0.1) 60%, rgba(90,35,10,0) 100%)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none hidden md:block"
          style={{ background: 'linear-gradient(to right, rgba(26,18,12,0.92) 0%, rgba(26,18,12,0.7) 35%, rgba(90,35,10,0.15) 65%, rgba(90,35,10,0) 100%)' }}
        />

        <div className="relative z-10 w-full px-6 md:px-12 lg:px-16 pt-24 md:pt-36 pb-12 md:pb-0 flex flex-col">
          {/* Portada mínima: cuándo/dónde, nombre, una línea de propuesta y un
              solo botón. El resto (actividades, cupo, con amigos o solo/a)
              está más abajo en la página. */}
          <div className="md:max-w-[38%] flex flex-col">
          <p className="text-[11px] md:text-xs tracking-[0.12em] md:tracking-[0.25em] uppercase font-semibold mb-4 whitespace-nowrap" style={{ color: '#FFC9A3' }}>
            30 oct al 1 nov · Los Gigantes, Córdoba
          </p>
          <h1 className="text-6xl md:text-6xl lg:text-7xl xl:text-8xl serif-title leading-[0.95] text-white md:whitespace-nowrap">
            Sunset <span style={{ color: '#F4A261' }}>y</span> Río
          </h1>
          <p className="text-white/80 text-base md:text-xl leading-relaxed max-w-md mt-4 mb-7 md:mb-9">
            Río de día, atardecer con música y fogón a la noche. A 90 km de Córdoba.
          </p>

          <a href="#fecha" className="btn-gold text-sm py-4 px-8 inline-block self-start">
            Quiero ir · 30 oct al 1 nov
          </a>
          <p className="text-white/55 text-xs mt-3">Cupo: 30 personas · viernes 30 de octubre al domingo 1 de noviembre</p>
          </div>
        </div>
        <p className="absolute z-10 bottom-2 right-3 md:right-5 max-w-[16rem] md:max-w-none text-right text-[9px] md:text-[10px] text-white/55 leading-tight">
          {NOTA_IA}
        </p>
      </section>

      {/* ── PRUEBA SOCIAL ── */}
      <div className="bg-white py-5 px-6 flex justify-center border-b" style={{ borderColor: 'rgba(42,23,8,0.06)' }}>
        <a href="https://maps.app.goo.gl/4c1nrpBbQf5hYrsE9" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border rounded-full px-4 py-1.5 transition-colors hover:bg-black/5"
          style={{ borderColor: 'rgba(217,98,43,0.25)' }}>
          <span className="text-sm" style={{ color: C.gold }}>★★★★★</span>
          <span className="text-xs font-semibold" style={{ color: C.muted }}>5.0 · 64 reseñas en Google</span>
        </a>
      </div>

      {/* ── ASÍ ES EL FINDE ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div data-reveal>
            <div className="text-center mb-12 md:mb-14">
              <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold" style={{ backgroundColor: C.sunset }}>
                Así es el finde
              </p>
              <h2 className="text-3xl md:text-4xl serif-title" style={{ color: C.dark }}>
                Sábado: del río al fuego
              </h2>
            </div>
          </div>

          <div data-reveal data-delay="1">
            <HorizontalCardRail
              previousLabel="Momento anterior"
              nextLabel="Momento siguiente"
              desktopGridClassName="md:grid-cols-3 lg:grid-cols-4"
              mobileItemClassName="w-[78vw] sm:w-[55vw]"
              gapClassName="gap-4"
            >
              {SABADO.map(({ Icon, color, hora, title, text, photo, alt, ilustrativa, opcional, inset, photoMobile }, i) => (
                <article key={title} className="group h-full rounded-2xl overflow-hidden border flex flex-col" style={{ borderColor: `${color}22`, backgroundColor: `${color}06` }}>
                  <div className="relative overflow-hidden">
                    {photoMobile && (
                      <img src={img(photoMobile.src, 700)} alt={photoMobile.alt} className="md:hidden w-full aspect-[4/3] object-cover" loading="lazy" />
                    )}
                    <img src={img(photo, 700)} alt={alt} className={`${photoMobile ? 'hidden md:block ' : ''}w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105`} loading="lazy" />
                    <span className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: color }}>
                      {i + 1}
                    </span>
                    {/* Toma real del lugar junto a la foto ilustrativa */}
                    {inset && (
                      <figure className="absolute top-3 right-3 w-[38%] hidden md:block rounded-lg overflow-hidden border-2 border-white shadow-lg">
                        <img src={img(inset.src, 300)} alt={inset.alt} className="w-full aspect-square object-cover" loading="lazy" />
                        <figcaption className="absolute bottom-0 inset-x-0 text-center text-[9px] font-bold uppercase tracking-wider text-white py-0.5" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>El río real</figcaption>
                      </figure>
                    )}
                    {ilustrativa && (
                      <p className={`absolute bottom-0 inset-x-0 px-2.5 py-1 ${photoMobile ? 'hidden md:block ' : ''}text-[9px] leading-tight text-white/85`} style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}>
                        {NOTA_IA}
                      </p>
                    )}
                  </div>
                  <div className="p-5 flex-1">
                    <p className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-bold mb-1.5" style={{ color }}>
                      <Icon size={13} color={color} /> {hora}
                    </p>
                    <h3 className="text-xl serif-title mb-2 flex items-center gap-2 flex-wrap" style={{ color: C.dark }}>
                      {title}
                      {opcional && (
                        <span className="text-[9px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}14`, color }}>Opcional</span>
                      )}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{text}</p>
                  </div>
                </article>
              ))}
            </HorizontalCardRail>
          </div>

          <div data-reveal data-delay="2">
            <div className="mt-6 rounded-2xl px-5 py-4 md:px-6 border flex gap-3 items-start" style={{ borderColor: 'rgba(47,111,126,0.25)', backgroundColor: 'rgba(47,111,126,0.06)' }}>
              <AlertTriangle size={18} color={C.river} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                <strong style={{ color: C.dark }}>Breathwork e ice bath son opcionales y guiados.</strong> Si tenés problemas cardíacos, presión alta, epilepsia, estás embarazada o tenés alguna condición de salud, avisanos antes de anotarte. La respiración nunca se hace dentro del agua ni justo antes de entrar al hielo: por eso van en momentos separados del día.
              </p>
            </div>
          </div>

          <div data-reveal data-delay="2">
            <div className="mt-6 rounded-2xl p-6 md:p-8 border" style={{ borderColor: 'rgba(0,83,51,0.18)', backgroundColor: 'rgba(0,83,51,0.04)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0,83,51,0.1)' }}>
                  <Mountain size={18} color={C.green} />
                </div>
                <div>
                  <p className="text-[10px] tracking-widest uppercase font-bold" style={{ color: C.green }}>Si te quedás a dormir</p>
                  <h3 className="text-xl serif-title" style={{ color: C.dark }}>Domingo</h3>
                </div>
              </div>
              <div className="grid md:grid-cols-[1fr_22rem] lg:grid-cols-[1fr_26rem] gap-6 md:gap-8 items-start">
                <ul className="space-y-2">
                  {DOMINGO.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm md:text-base leading-relaxed" style={{ color: C.muted }}>
                      <span className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.green }} />{item}
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 gap-3">
                  <img src={img('/uploads/sunset-rio-rio-real.webp', 500)} alt="Descanso en el agua del río, sobre la piedra" className="w-full aspect-[3/4] object-cover rounded-xl" loading="lazy" />
                  <img src={img('/uploads/sunset-rio-ventanal.webp', 500)} alt="Pausa tranquila junto al ventanal del refugio" className="w-full aspect-[3/4] object-cover rounded-xl" loading="lazy" />
                </div>
              </div>
            </div>
            <p className="text-center text-sm md:text-base mt-8 max-w-xl mx-auto" style={{ color: C.muted }}>
              <strong style={{ color: C.dark }}>Nada es obligatorio:</strong> si te querés tirar una siesta o quedarte con un mate, también es plan.
            </p>
          </div>
        </div>
      </section>

      {/* ── CON AMIGOS O SOLO/A ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: C.sand }}>
        <div className="max-w-5xl mx-auto">
          <div data-reveal>
            <div className="text-center mb-12">
              <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold" style={{ backgroundColor: C.sunset }}>
                Con amigos o solo/a
              </p>
              <h2 className="text-3xl md:text-4xl serif-title" style={{ color: C.dark }}>
                Las dos formas funcionan
              </h2>
            </div>
          </div>

          <div data-reveal data-delay="1">
            <div className="grid md:grid-cols-2 gap-5">
              {[
                {
                  Icon: Users, photo: '/uploads/sunset-rio-amigos-mate.webp', alt: 'Cuatro amigos tomando mate y picando algo en una mesa bajo los árboles', ilustrativa: true,
                  q: '¿Con tus amigos hace meses que dicen "tenemos que hacer algo"?',
                  a: 'Acá está el plan, ya armado. Ustedes llegan; la comida, la música, la sombra y el fuego los ponemos nosotros.',
                  badge: 'Desde 4 personas: 30% de descuento',
                },
                {
                  Icon: User, photo: '/uploads/sunset-rio-guitarreada.webp', alt: 'Guitarra junto al fuego', ilustrativa: false,
                  q: '¿Y si no conozco a nadie?',
                  a: 'Mejor. Caminás al río con gente que recién conocés, compartís el mate a la vuelta y a la noche estás cantando en el fogón con un grupo nuevo.',
                  badge: null,
                },
              ].map(({ Icon, photo, alt, ilustrativa, q, a, badge }) => (
                <article key={q} className="rounded-3xl overflow-hidden bg-white shadow-sm flex flex-col">
                  <div className="relative">
                    <img src={img(photo, 800)} alt={alt} className="w-full aspect-[16/9] object-cover" loading="lazy" />
                    {ilustrativa && (
                      <p className="absolute bottom-0 inset-x-0 px-2.5 py-1 text-[9px] leading-tight text-white/85" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}>{NOTA_IA}</p>
                    )}
                  </div>
                  <div className="p-6 md:p-8 flex-1 flex flex-col">
                    <Icon size={20} color={C.sunset} className="mb-3" />
                    <h3 className="text-xl md:text-2xl serif-title leading-snug mb-3" style={{ color: C.dark }}>{q}</h3>
                    <p className="text-sm md:text-base leading-relaxed flex-1" style={{ color: C.muted }}>{a}</p>
                    {badge && (
                      <p className="mt-5 self-start text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(217,98,43,0.1)', color: C.ember }}>
                        {badge}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-3xl p-6 md:p-8 text-center bg-white border" style={{ borderColor: 'rgba(217,98,43,0.2)' }}>
              <h3 className="text-xl md:text-2xl serif-title mb-2" style={{ color: C.sunset }}>¿Quién viene?</h3>
              <p className="text-sm md:text-base leading-relaxed max-w-2xl mx-auto" style={{ color: C.muted }}>
                Grupos de amigos, parejas y gente que viene sola o solo. Somos 30 como máximo: un grupo chico, donde a la noche ya te sabés los nombres.
              </p>
            </div>
            <p className="text-center text-sm mt-8" style={{ color: C.faint }}>
              No hace falta experiencia en montaña ni haber hecho nada parecido antes.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section id="precios" className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div data-reveal>
            <div className="text-center mb-12 md:mb-14">
              <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold" style={{ backgroundColor: C.sunset }}>
                Opciones
              </p>
              <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.dark }}>
                Elegís cuánto te quedás
              </h2>
              <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: C.muted }}>
                Las tres incluyen comidas y actividades. Los precios los publicamos cuando abramos las reservas: anotate y te avisamos primero.
              </p>
            </div>
          </div>

          <div data-reveal data-delay="1">
            <div className="grid md:grid-cols-3 gap-5 md:gap-6 items-stretch">
              {MODALIDADES.map(m => (
                <article key={m.key}
                  className={`relative flex flex-col h-full rounded-3xl p-6 md:p-7 ${m.destacado ? 'order-first md:order-none' : ''}`}
                  style={m.destacado
                    ? { backgroundColor: '#FFF8F3', border: `2px solid ${C.sunset}`, boxShadow: '0 14px 40px rgba(217,98,43,0.16)' }
                    : { backgroundColor: 'white', border: '1px solid rgba(42,23,8,0.12)' }}>
                  {m.destacado && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white whitespace-nowrap" style={{ backgroundColor: C.sunset }}>
                      Nuestra recomendación
                    </span>
                  )}

                  <h3 className="text-[11px] tracking-[0.2em] uppercase font-bold" style={{ color: m.destacado ? C.ember : C.dark }}>{m.label}</h3>
                  <p className="text-sm mt-1" style={{ color: C.faint }}>{m.cuando}</p>

                  <ul className="space-y-2.5 mt-6 pt-6 border-t mb-7" style={{ borderColor: 'rgba(42,23,8,0.08)' }}>
                    {m.incluye.map(i => (
                      <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: C.dark }}>
                        <Check size={16} color={m.destacado ? C.sunset : C.green} className="flex-shrink-0 mt-0.5" />{i}
                      </li>
                    ))}
                  </ul>

                  <a href="#fecha"
                    className="mt-auto block text-center py-3.5 px-4 rounded-full font-bold text-sm transition-opacity hover:opacity-85"
                    style={m.destacado
                      ? { backgroundColor: C.sunset, color: 'white' }
                      : { border: `1.5px solid ${C.dark}`, color: C.dark }}>
                    Quiero ir
                  </a>
                </article>
              ))}
            </div>

            <p className="text-center text-xs md:text-sm mt-6" style={{ color: C.faint }}>
              Precios y formas de pago: los anunciamos al abrir las reservas.
            </p>

            <div className="max-w-3xl mx-auto mt-8 rounded-2xl border" style={{ borderColor: 'rgba(42,23,8,0.1)' }}>
              <button type="button" onClick={() => setComidasOpen(o => !o)} aria-expanded={comidasOpen}
                className="w-full flex items-center justify-between gap-4 px-5 md:px-6 py-4 text-left">
                <span className="flex items-center gap-3 text-sm md:text-base font-semibold" style={{ color: C.dark }}>
                  <Utensils size={16} color={C.sunset} /> ¿Qué comidas incluye cada opción?
                </span>
                <ChevronDown size={18} color={C.faint} className="flex-shrink-0 transition-transform duration-300" style={{ transform: comidasOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              <div className="overflow-hidden transition-all duration-500 ease-in-out" style={{ maxHeight: comidasOpen ? '700px' : '0px', opacity: comidasOpen ? 1 : 0 }}>
                <dl className="px-5 md:px-6 pb-3">
                  {COMIDAS.map(c => (
                    <div key={c.opcion} className="py-3 border-t sm:grid sm:grid-cols-[13rem_1fr] sm:gap-4" style={{ borderColor: 'rgba(42,23,8,0.08)' }}>
                      <dt className="text-xs font-bold uppercase tracking-wide mb-1 sm:mb-0 sm:pt-0.5" style={{ color: C.ember }}>{c.opcion}</dt>
                      <dd className="text-sm leading-relaxed" style={{ color: C.muted }}>{c.texto}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>

          <div data-reveal data-delay="2">
            <div className="grid sm:grid-cols-3 gap-3 md:gap-4 mt-10">
              {[
                { Icon: Users, title: 'Cupo: 30 personas', text: '20 en cama · 10 en carpa.' },
                { Icon: Percent, title: 'Grupos: 30% OFF', text: 'Desde 4 personas. Los domos se priorizan para grupos.' },
                { Icon: Tent, title: 'Camping: 30% OFF', text: 'Traé tu carpa o alquilá el equipo con nuestros aliados, a los mejores precios.' },
              ].map(({ Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3 rounded-2xl p-5" style={{ backgroundColor: C.sand }}>
                  <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-white">
                    <Icon size={16} color={C.sunset} />
                  </span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: C.dark }}>{title}</p>
                    <p className="text-xs leading-relaxed mt-1" style={{ color: C.muted }}>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ELEGÍ TU FINDE ── */}
      <section id="fecha" className="pb-20 md:pb-28 px-6 bg-white scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div data-reveal>
            <div className="rounded-3xl p-6 md:p-10 text-center" style={{ backgroundColor: C.night, backgroundImage: 'radial-gradient(ellipse at top, rgba(217,98,43,0.35), transparent 65%)' }}>
              <p className="text-[10px] tracking-[0.35em] uppercase font-semibold mb-3" style={{ color: C.gold }}>La fecha</p>
              <h2 className="text-2xl md:text-3xl serif-title text-white mb-7">Viernes 30 de octubre al domingo 1 de noviembre</h2>
              <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {BOTONES_FECHA.map(b => (
                  <button key={b.valor} type="button" onClick={() => elegir(b.valor)}
                    className={b.primary
                      ? 'btn-gold text-sm py-4 px-6 block w-full text-center'
                      : 'block w-full text-center text-sm font-semibold py-4 px-6 rounded-full border border-white/30 text-white/90 hover:bg-white/10 transition-colors'}>
                    {b.label}
                  </button>
                ))}
              </div>
              <p className="text-white/50 text-xs md:text-sm mt-6 max-w-md mx-auto italic">
                Todavía no tomamos reservas. Dejanos tus datos y te avisamos cuando abramos las reservas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DESPLEGABLES ── */}
      <section className="py-20 md:py-24 px-6" style={{ backgroundColor: C.sand }}>
        <div className="max-w-3xl mx-auto">
          <div data-reveal>
            <h2 className="text-2xl md:text-3xl serif-title text-center mb-8" style={{ color: C.dark }}>
              Todo lo que necesitás saber
            </h2>
          </div>
          <div data-reveal data-delay="1">
            <div className="space-y-3">
              {DESPLEGABLES.map(item => (
                <Accordion key={item.key} item={item} open={openKey === item.key} onToggle={() => setOpenKey(k => (k === item.key ? null : item.key))} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CIERRE ── */}
      <section className="relative py-20 md:py-28 px-6 overflow-hidden"
        style={{ backgroundImage: `url(${img('/uploads/sunset-rio-fogon-real.webp', 1600)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(26,18,12,0.85)' }} />
        <div className="max-w-2xl mx-auto relative z-10 text-center">
          <div data-reveal>
            <p className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-4" style={{ color: C.gold }}>Sunset y Río · en la montaña</p>
            <p className="text-2xl md:text-3xl serif-title leading-snug mb-8 text-white">
              Río de día, sol que baja con música, fuego a la noche.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#fecha" className="btn-gold text-sm py-5 px-10 inline-block">Quiero ir · 30 oct al 1 nov</a>
              <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
                className="inline-block border border-white/30 text-white/80 font-semibold text-sm py-5 px-10 rounded-full hover:bg-white/10 transition-colors">
                Tengo preguntas
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── BARRA FIJA MOBILE ── */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-[998] px-4 pt-3 transition-transform duration-300 ${showStickyBar && !form ? 'translate-y-0' : 'translate-y-full'}`}
        style={{
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
          backgroundColor: 'rgba(26,18,12,0.97)',
          borderTop: '1px solid rgba(217,98,43,0.35)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <a href="#fecha" className="btn-gold text-sm py-3 w-full text-center block">
          Quiero ir · 30 oct al 1 nov
        </a>
      </div>

      {form && <InteresModal inicial={form} onClose={cerrarForm} />}

      <Footer />
    </div>
  );
};

export default SunsetRio;
