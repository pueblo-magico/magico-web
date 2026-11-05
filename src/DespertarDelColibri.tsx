import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Flame,
  Footprints,
  Heart,
  Instagram,
  Leaf,
  MapPin,
  MessageCircle,
  Moon,
  Mountain,
  Sparkles,
  Sunrise,
  Users,
  Utensils,
  Waves,
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { HorizontalCardRail } from '../components/HorizontalCardRail';
import { img } from './lib/img';
import { WA_MAGICO } from './data/config';

const COLORS = {
  forest: '#07583f',
  forestDark: '#082f25',
  cream: '#f7f2e8',
  paper: '#fffdf8',
  clay: '#8a351e',
  gold: '#d6a72f',
  ink: '#26352f',
};

const WHATSAPP_MESSAGE = encodeURIComponent(
  'Hola, quiero recibir información actualizada y reservar mi lugar para El Despertar del Colibrí, del 27 al 29 de noviembre de 2026 en Pueblo Mágico.',
);
const WHATSAPP_URL = `https://wa.me/${WA_MAGICO}?text=${WHATSAPP_MESSAGE}`;

const EXPERIENCES = [
  { Icon: MessageCircle, title: 'Círculos de palabra', text: 'Encuentros entre hombres para escuchar, compartir y habitar la palabra con verdad.' },
  { Icon: Sparkles, title: 'Meditaciones y rituales', text: 'Prácticas para detener el ruido, volver al cuerpo y abrir espacio a lo nuevo.' },
  { Icon: Footprints, title: 'Caminatas conscientes', text: 'La montaña como territorio de presencia, movimiento y conexión.' },
  { Icon: Waves, title: 'Inmersión en agua fría', text: 'Una práctica corporal de atención, voluntad y vitalidad.' },
  { Icon: Flame, title: 'Círculos de fuego', text: 'El fuego como centro del encuentro, la escucha y la transformación.' },
  { Icon: Sunrise, title: 'Ceremonia de Temazcal', text: 'Un espacio ceremonial de calor, silencio, depuración e integración.' },
  { Icon: Leaf, title: 'Naturaleza viva', text: 'Tiempo para reconectar con el ritmo natural de Los Gigantes.' },
  { Icon: Moon, title: 'Silencio y escucha', text: 'Momentos de intimidad para dejar caer corazas y reconocer lo esencial.' },
];

const TEAM = [
  {
    name: 'Gustavo Torras',
    image: '/uploads/events/colibri/gustavo-torras.jpg',
    text: 'Buscador, terapeuta sonoro, facilitador de regresiones y maestro de Reiki. Caminante del danzar de la vida y apasionado del monte nativo.',
  },
  {
    name: 'Diego Epelman',
    image: '/uploads/events/colibri/diego-epelman.jpg',
    text: 'Comunicador, coach en bienestar y facilitador de experiencias transformadoras. Emprendedor apasionado y Guardián de Vida.',
  },
  {
    name: 'Juan Cruz Sartori',
    image: '/uploads/events/colibri/juan-cruz-sartori.jpg',
    text: 'Coach ontológico, biodecodificador, constelador familiar y facilitador de PNL, hipnosis, breathwork y regresiones.',
  },
];

const FAQS = [
  ['¿A quién está dirigido?', 'A hombres que quieran mirarse con honestidad, abrirse al vínculo con otros, trabajar su energía masculina y reconectar con la naturaleza viva. No hay edad límite; sí hace falta apertura y presencia.'],
  ['¿Cómo funcionan los aportes?', 'Los tres aportes incluyen la misma experiencia completa. Elegí el valor posible para vos: aporte mínimo, valor real del retiro o aporte fraterno para ayudar a sostener el lugar de otro hermano.'],
  ['¿Dónde se realiza?', 'En Pueblo Mágico, un ecolodge de montaña ubicado en Los Gigantes, Sierras Grandes de Córdoba.'],
  ['¿Cómo reservo mi lugar?', 'Elegí el aporte que mejor se ajuste a tu posibilidad, escribinos por WhatsApp y confirmá tu lugar con una seña. Allí recibirás los medios de pago y los próximos pasos.'],
  ['¿Qué necesito llevar?', 'Al confirmar tu lugar te enviaremos la lista de preparación, horarios, recomendaciones y todo lo necesario para llegar a la experiencia.'],
];

const AUDIENCE_ITEMS = [
  'Buscadores espirituales en proceso de transformación.',
  'Hombres que sienten el llamado a conectar con su propia ancestralidad',
  'Quienes necesiten un espacio de silencio y reconexión profunda.',
  'Caminantes que disfrutan de la naturaleza en su estado más puro.',
];

const TESTIMONIAL_SHORTS = ['xyNHRu_6_FA', 'XkX8N6mrwdE', '-UKDsZbUoTE', 'TIRMapTAo0k', '1mKkxzO8vWM'];

const PRICE_OPTIONS = [
  { key: 'minimo', label: 'Aporte mínimo', amount: 465000, note: 'Para quien necesita que el valor no sea la barrera.', suggested: false },
  { key: 'retiro', label: 'Valor del retiro', amount: 495000, note: 'El valor real de sostener este espacio.', suggested: true },
  { key: 'fraterno', label: 'Aporte fraterno', amount: 525000, note: 'Para quien puede sostener también el lugar de otro hermano.', suggested: false },
] as const;

const formatArs = (amount: number) => `$${Math.round(amount).toLocaleString('es-AR')}`;
const priceWhatsAppUrl = (label: string, amount: number) => `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(`Hola, quiero reservar mi lugar para El Despertar del Colibrí con la opción ${label} de ${formatArs(amount)}. ¿Cómo confirmo la seña?`)}`;
const WhatsAppButton: React.FC<{ label: string; secondary?: boolean }> = ({ label, secondary = false }) => (
  <a
    href={WHATSAPP_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={`inline-flex items-center justify-center gap-3 rounded-full px-7 py-4 text-xs font-bold uppercase tracking-[0.16em] transition-all hover:-translate-y-0.5 ${secondary ? 'border border-white/30 bg-white/5 text-white hover:bg-white/10' : 'bg-[#d6a72f] text-[#082f25] shadow-lg hover:bg-[#e3b63d]'}`}
  >
    {label}
    <ArrowRight className="h-4 w-4" aria-hidden="true" />
  </a>
);

const FloatingWhatsApp: React.FC<{ visibleOnMobile: boolean }> = ({ visibleOnMobile }) => (
  <a
    href={WHATSAPP_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={`fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-all hover:scale-110 md:pointer-events-auto md:translate-y-0 md:opacity-100 ${visibleOnMobile ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
    aria-label="Consultar por WhatsApp sobre El Despertar del Colibrí"
  >
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  </a>
);

const DespertarDelColibri: React.FC = () => {
  const [showFloatingWhatsapp, setShowFloatingWhatsapp] = useState(false);
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'El Despertar del Colibrí — Encuentro de Hombres · Pueblo Mágico';

    const description = 'Encuentro de hombres en la montaña: palabra, cuerpo, ritual, fuego, Temazcal y naturaleza. 27 al 29 de noviembre de 2026 en Los Gigantes, Córdoba.';
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = meta?.content;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;

    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.id = 'ld-despertar-colibri';
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: 'El Despertar del Colibrí — Encuentro de Hombres',
      startDate: '2026-11-27',
      endDate: '2026-11-29',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      image: ['https://experienciamagico.com/uploads/events/el-despertar-del-colibri-oficial.png'],
      description,
      location: {
        '@type': 'Place',
        name: 'Pueblo Mágico',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Los Gigantes',
          addressRegion: 'Córdoba',
          addressCountry: 'AR',
        },
      },
      organizer: [
        { '@type': 'Organization', name: 'Acan de Fuego' },
        { '@type': 'Organization', name: 'Pueblo Mágico', url: 'https://experienciamagico.com' },
      ],
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/LimitedAvailability',
        url: WHATSAPP_URL,
      },
    });
    document.head.appendChild(schema);

    return () => {
      document.title = previousTitle;
      if (previousDescription !== undefined && meta) meta.content = previousDescription;
      schema.remove();
    };
  }, []);

  useEffect(() => {
    const updateFloatingWhatsapp = () => setShowFloatingWhatsapp(window.scrollY > 600);
    updateFloatingWhatsapp();
    window.addEventListener('scroll', updateFloatingWhatsapp, { passive: true });
    return () => window.removeEventListener('scroll', updateFloatingWhatsapp);
  }, []);
  return (
    <div className="overflow-x-hidden" style={{ background: COLORS.cream, color: COLORS.ink }}>
      <Header />

      <main>
        <section className="relative isolate flex min-h-[780px] items-center justify-center overflow-hidden px-5 py-20 text-center text-white md:min-h-[760px] md:px-10 md:py-28">
          <img
            src="/uploads/events/colibri/hero-colibri-wide.webp"
            alt=""
            aria-hidden="true"
            width="1672"
            height="941"
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[68%_center] md:object-center"
          />
          <div className="absolute inset-0 -z-10 bg-[#061f19]/60 md:bg-[#061f19]/54" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(4,28,22,0.08)_0%,rgba(4,28,22,0.68)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#082f25]/85 to-transparent" />

          <div className="relative mx-auto w-full max-w-6xl">
            <div className="mx-auto max-w-5xl">
              <div className="mb-7 flex flex-wrap justify-center gap-2">
                <span className="rounded-full border border-white/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">27–29 noviembre 2026</span>
                <span className="rounded-full border border-[#d6a72f]/40 bg-[#d6a72f]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f2ce69]">Cupos limitados</span>
              </div>

              <h1 className="font-serif text-[clamp(3.6rem,9vw,8rem)] leading-[0.9] text-white">
                El Despertar del Colibrí
              </h1>
              <p className="mt-6 font-serif text-2xl leading-tight text-white md:text-4xl">Encuentro de hombres en la montaña</p>
              <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-white/80 md:text-xl">
                Una invitación a reconectar con la alegría, la sensibilidad y la sabiduría del corazón. Soltar corazas, transformar heridas y recuperar la liviandad y el disfrute de vivir.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-white/80">
                <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#d6a72f]" /> 27, 28 y 29 de noviembre</span>
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#d6a72f]" /> Pueblo Mágico · Los Gigantes</span>
              </div>

              <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                <WhatsAppButton label="Quiero recibir información" />
                <a href="#propuesta" className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white/80 transition hover:bg-white/10">Conocer la propuesta</a>
              </div>
            </div>
          </div>
        </section>

        <section id="propuesta" className="px-5 py-20 md:px-10 md:py-28" style={{ background: COLORS.paper }}>
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="overflow-hidden rounded-[30px]">
              <img src={img('/uploads/events/colibri/encuentro-hombres.jpg', 900)} alt="Encuentro de hombres en círculo" className="aspect-[4/5] w-full object-cover" loading="lazy" />
            </div>
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: COLORS.clay }}>El llamado</p>
              <h2 className="font-serif text-4xl leading-tight md:text-6xl" style={{ color: COLORS.forest }}>Volver al corazón.<br />Encender la fuerza invisible.</h2>
              <div className="mt-7 space-y-5 text-base leading-8 text-[#51615a] md:text-lg">
                <p>El colibrí sabe cuándo es tiempo de despertar. De detener el vuelo para beber del néctar. De encender su ligereza sagrada.</p>
                <p>Nos reunimos entre fuego, montaña y silencio para compartir la experiencia de ser hombres: habitar el cuerpo, la emoción y la palabra; soltar lo que ya no sirve y abrir espacio a lo nuevo.</p>
                <p className="font-serif text-2xl italic" style={{ color: COLORS.clay }}>Un encuentro para compartir, recordar y despertar nuestra esencia a través de la palabra, el cuerpo y el ritual.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 md:px-10 md:py-28" style={{ background: COLORS.cream }}>
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: COLORS.clay }}>Lo que vas a vivir</p>
              <h2 className="font-serif text-4xl md:text-6xl" style={{ color: COLORS.forest }}>Ocho puertas hacia una experiencia compartida</h2>
              <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#5c6a64]">No se trata de cumplir actividades, sino de atravesar un proceso sostenido por la tribu, el rito, el cuerpo y la naturaleza.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {EXPERIENCES.map(({ Icon, title, text }) => (
                <article key={title} className="rounded-[24px] border border-[#07583f]/10 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#07583f]/10"><Icon className="h-5 w-5" style={{ color: COLORS.forest }} /></div>
                  <h3 className="font-serif text-xl" style={{ color: COLORS.forest }}>{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#66736e]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="para-quien" className="scroll-mt-28 px-5 py-20 md:px-10 md:py-28" style={{ background: '#f4f3ef' }}>
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_450px] lg:gap-20">
            <div className="order-2 lg:order-1">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: COLORS.gold }}>¿Para quién es este viaje?</p>
              <h2 className="font-serif text-4xl leading-tight md:text-6xl" style={{ color: COLORS.forest }}>Buscamos caminantes dispuestos a abrir el corazón y recibir la medicina de la montaña.</h2>
              <div className="mt-10">
                {AUDIENCE_ITEMS.map((item, index) => (
                  <div key={item} className="group flex items-start gap-5 border-b border-[#07583f]/10 py-5 last:border-0">
                    <span className="w-8 shrink-0 text-right font-serif text-2xl text-[#d6a72f]/60 transition group-hover:text-[#d6a72f]">{String(index + 1).padStart(2, '0')}</span>
                    <p className="text-base font-light leading-7 text-[#394a43] md:text-lg">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <img src={img('/uploads/events/colibri/circulo-hombres.jpg', 1000)} alt="Círculo de hombres compartiendo" className="aspect-[4/5] w-full rounded-[40px] object-cover shadow-2xl lg:rotate-2" loading="lazy" />
            </div>
          </div>
        </section>

        <section className="px-5 py-20 md:px-10 md:py-28" style={{ background: COLORS.paper }}>
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: COLORS.clay }}>El lugar</p>
                <h2 className="font-serif text-4xl md:text-6xl" style={{ color: COLORS.forest }}>Pueblo Mágico.<br />Montaña que sostiene.</h2>
              </div>
              <p className="max-w-2xl text-base leading-8 text-[#5d6c66]">Un ecolodge en Los Gigantes dedicado a retiros y experiencias de desarrollo personal. Inmerso en la naturaleza, invita a conectar con la esencia y el propósito más profundo.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-[1.3fr_0.7fr]">
              <img src={img('/uploads/events/colibri/pueblo-magico-aereo.jpg', 1200)} alt="Vista aérea de Pueblo Mágico" className="h-full min-h-[320px] w-full rounded-[28px] object-cover" loading="lazy" />
              <img src={img('/uploads/events/colibri/salon-piedra.jpg', 900)} alt="Salón de piedra de Pueblo Mágico" className="h-full min-h-[320px] w-full rounded-[28px] object-cover" loading="lazy" />
            </div>
          </div>
        </section>

        <section className="px-5 py-20 md:px-10 md:py-28" style={{ background: '#efe6d8' }}>
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: COLORS.clay }}>La experiencia incluye</p>
              <h2 className="font-serif text-4xl md:text-6xl" style={{ color: COLORS.forest }}>Todo lo necesario para entrar al proceso</h2>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  [BedDouble, 'Alojamiento', 'Habitaciones compartidas dentro de Pueblo Mágico.'],
                  [Utensils, 'Alimentación completa', 'Comidas durante los tres días del encuentro.'],
                  [Flame, 'Actividades y ceremonias', 'Toda la propuesta vivencial incluida.'],
                  [Users, 'Acompañamiento', 'Equipo Acan de Fuego e invitados especiales.'],
                ].map(([Icon, title, text]) => {
                  const ItemIcon = Icon as React.ElementType;
                  return <li key={title as string} className="rounded-[24px] bg-white p-6 shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#07583f]/10"><ItemIcon className="h-5 w-5" style={{ color: COLORS.forest }} /></span><strong className="mt-5 block font-serif text-xl font-normal" style={{ color: COLORS.forest }}>{title as string}</strong><span className="mt-2 block text-sm leading-6 text-[#66736e]">{text as string}</span></li>;
                })}
            </ul>
          </div>
        </section>

        <section id="inversion" className="scroll-mt-28 px-5 py-20 md:px-10 md:py-28" style={{ background: COLORS.paper }}>
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: COLORS.clay }}>Inversión</p>
              <h2 className="font-serif text-4xl md:text-6xl" style={{ color: COLORS.forest }}>Valores por persona</h2>
              <p className="mx-auto mt-5 max-w-xl leading-7 text-[#5d6c66]">Flexibilidad en formas de pago. El lugar se reserva con una seña; si necesitás otra modalidad, la conversamos antes.</p>
              <p className="mx-auto mt-5 rounded-full bg-[#07583f]/[0.07] px-5 py-3 text-sm font-semibold text-[#07583f]">Los tres aportes incluyen la misma experiencia completa.</p>
            </div>

            <div className="grid items-stretch gap-5 md:grid-cols-3">
              {PRICE_OPTIONS.map(option => (
                <article
                  key={option.key}
                  className={`relative flex h-full flex-col rounded-[26px] border p-7 md:p-8 ${option.suggested ? 'border-[#8a351e] bg-[#8a351e]/[0.04] shadow-[0_14px_40px_rgba(138,53,30,0.12)]' : 'border-[#07583f]/10 bg-white'}`}
                >
                  {option.suggested && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#8a351e] px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white">Valor sugerido</span>
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: COLORS.clay }}>{option.label}</p>
                  <p className="mt-2 font-serif text-4xl" style={{ color: COLORS.forest }}>{formatArs(option.amount)}</p>
                  <p className="mt-3 flex-1 text-sm leading-6 text-[#66736e]">{option.note}</p>
                  <a href={priceWhatsAppUrl(option.label, option.amount)} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#07583f] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-[#082f25]">
                    Reservar mi lugar <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>

            <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs font-bold uppercase tracking-[0.16em]" style={{ color: COLORS.clay }}><Flame className="h-4 w-4" aria-hidden="true" /> Cupos muy limitados</p>
          </div>
        </section>

        <section className="px-5 py-20 md:px-10 md:py-28" style={{ background: COLORS.cream }}>
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: COLORS.clay }}>Quiénes acompañan</p>
              <h2 className="font-serif text-4xl md:text-6xl" style={{ color: COLORS.forest }}>Acan de Fuego</h2>
              <p className="mx-auto mt-5 max-w-3xl leading-7 text-[#5d6c66]">Acan de Fuego es una Comunidad de hombres que nace del anhelo profundo de habitar lo masculino de forma más consciente y auténtica. Somos tres compañeros de camino que sentimos el llamado a compartirnos en espacios sagrados donde los hombres podamos mirarnos, acompañarnos y transformarnos. Con diferentes trayectorias y herramientas, co-creamos experiencias que honran la tribu, el rito, el cuerpo, la emoción y el Ser, con la Filosofía del Buen Vivir como bandera.</p>
              <a
                href="https://www.instagram.com/acan_del_fuego/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#07583f]/20 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#07583f] transition hover:border-[#07583f] hover:bg-[#07583f] hover:text-white"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" /> @acan_del_fuego
              </a>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {TEAM.map(member => (
                <article key={member.name} className="rounded-[26px] border border-[#07583f]/10 bg-[#f7f2e8] p-7 text-center">
                  <img src={member.image} alt={member.name} className="mx-auto h-28 w-28 rounded-full border-4 border-white object-cover shadow-md" loading="lazy" />
                  <h3 className="mt-5 font-serif text-2xl" style={{ color: COLORS.forest }}>{member.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#66736e]">{member.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-5 py-20 text-white md:px-10 md:py-24" style={{ background: COLORS.forestDark }}>
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#d6a72f]/10 blur-3xl" />
          <div className="relative mx-auto max-w-5xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#e6bf55]">Detrás del encuentro</p>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl">Una coproducción de</h2>
            <div className="mt-12 grid items-stretch gap-5 sm:grid-cols-3">
              {[
                { name: 'Kintu Producciones', image: '/uploads/vuelo-condor/PRODUCCIONES.png' },
                { name: 'Acan de Fuego', image: '/uploads/vuelo-condor/Logo Acan.png' },
                { name: 'Pueblo Mágico', image: '/uploads/pueblo_magico_logo_marron.svg' },
              ].map(partner => (
                <article key={partner.name} className="flex min-h-40 items-center justify-center rounded-[24px] border border-white/15 bg-white/5 p-7 backdrop-blur-sm">
                  <img src={partner.image} alt={partner.name} className="max-h-20 w-auto max-w-full object-contain brightness-0 invert" loading="lazy" />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonios" className="scroll-mt-28 px-5 py-20 md:px-10 md:py-28" style={{ background: '#f4f3ef' }}>
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: COLORS.gold }}>Experiencias en video</p>
              <h2 className="font-serif text-4xl md:text-6xl" style={{ color: COLORS.forest }}>Voces del Camino</h2>
              <p className="mx-auto mt-4 max-w-xl leading-7 text-[#66736e]">Escuchá los relatos de quienes ya recorrieron experiencias transformadoras con nosotros.</p>
            </div>
            <HorizontalCardRail previousLabel="Testimonio anterior" nextLabel="Testimonio siguiente" desktopGridClassName="md:grid-cols-3 lg:grid-cols-5" mobileItemClassName="w-[72vw]" gapClassName="gap-4">
              {TESTIMONIAL_SHORTS.map((id, index) => (
                <div key={id} className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-lg">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}`}
                    title={`Testimonio El Despertar del Colibrí ${index + 1}`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              ))}
            </HorizontalCardRail>
          </div>
        </section>

        <section id="preguntas" className="scroll-mt-28 px-5 py-20 md:px-10 md:py-28" style={{ background: COLORS.cream }}>
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: COLORS.clay }}>Preguntas frecuentes</p>
              <h2 className="font-serif text-4xl md:text-5xl" style={{ color: COLORS.forest }}>Antes de dar el paso</h2>
            </div>
            <div className="space-y-3">
              {FAQS.map(([question, answer]) => (
                <details key={question} className="group rounded-[20px] border border-[#07583f]/10 bg-white px-6 py-5 open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold" style={{ color: COLORS.forest }}><span>{question}</span><span className="text-xl transition group-open:rotate-45">+</span></summary>
                  <p className="mt-4 max-w-3xl border-t border-[#07583f]/10 pt-4 text-sm leading-7 text-[#66736e]">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-5 py-24 text-center text-white md:px-10 md:py-32" style={{ background: COLORS.forestDark }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${img('/uploads/events/colibri/circulo-hombres.jpg', 1500)})`, backgroundPosition: 'center', backgroundSize: 'cover' }} />
          <div className="absolute inset-0 bg-[#082f25]/80" />
          <div className="relative mx-auto max-w-3xl">
            <Heart className="mx-auto h-10 w-10 text-[#d6a72f]" />
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-[#e6bf55]">27, 28 y 29 de noviembre · Los Gigantes</p>
            <h2 className="mt-5 font-serif text-4xl leading-tight md:text-6xl">¿Te resuena este llamado?</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/70">Te esperamos, hermano. Escribinos para recibir la información actualizada y conversar sobre tu lugar en el encuentro.</p>
            <div className="mt-9 flex justify-center"><WhatsAppButton label="Hablar por WhatsApp" /></div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingWhatsApp visibleOnMobile={showFloatingWhatsapp} />
    </div>
  );
};

export default DespertarDelColibri;
