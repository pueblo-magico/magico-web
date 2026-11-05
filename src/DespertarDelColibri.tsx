import React, { useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  Flame,
  Footprints,
  Heart,
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
import { Footer } from '../components/Footer';
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
  ['¿Qué incluye la experiencia?', 'Alojamiento en habitaciones compartidas, alimentación completa y todas las actividades y ceremonias del encuentro.'],
  ['¿Dónde se realiza?', 'En Pueblo Mágico, un ecolodge de montaña ubicado en Los Gigantes, Sierras Grandes de Córdoba.'],
  ['¿Cómo reservo mi lugar?', 'Los cupos son limitados y el lugar se confirma con una seña. Escribinos por WhatsApp para recibir el valor actualizado, los medios de pago y los próximos pasos.'],
  ['¿Qué necesito llevar?', 'Al confirmar tu lugar te enviaremos la lista de preparación, horarios, recomendaciones y todo lo necesario para llegar a la experiencia.'],
];

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

const DespertarDelColibri: React.FC = () => {
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

  return (
    <div className="overflow-x-hidden" style={{ background: COLORS.cream, color: COLORS.ink }}>
      <a href="#contenido-colibri" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:text-[#082f25]">
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#071d18]/95 text-white shadow-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-9">
          <a href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/85 transition hover:text-[#f2ce69]" aria-label="Volver al inicio de Pueblo Mágico">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Pueblo Mágico
          </a>
          <span className="hidden font-serif text-lg text-[#f2ce69] md:block">El Despertar del Colibrí</span>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#d6a72f]/60 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f2ce69] transition hover:bg-[#d6a72f] hover:text-[#082f25]">
            Reservar
          </a>
        </div>
        <nav aria-label="Secciones del encuentro" className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-5 gap-y-2 px-5 pb-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/70 md:gap-x-9 md:px-9 md:text-[11px]">
          <a href="#propuesta" className="transition hover:text-[#f2ce69]">El llamado</a>
          <a href="#experiencia" className="transition hover:text-[#f2ce69]">Experiencia</a>
          <a href="#lugar" className="transition hover:text-[#f2ce69]">El lugar</a>
          <a href="#equipo" className="transition hover:text-[#f2ce69]">Equipo</a>
          <a href="#preguntas" className="transition hover:text-[#f2ce69]">Preguntas</a>
        </nav>
      </header>

      <main id="contenido-colibri">
        <section className="relative isolate flex min-h-[780px] items-center overflow-hidden px-5 py-20 text-white md:min-h-[760px] md:px-10 md:py-28">
          <img
            src="/uploads/events/colibri/hero-colibri-wide.webp"
            alt=""
            aria-hidden="true"
            width="1672"
            height="941"
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[70%_center] md:object-center"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(4,28,22,0.97)_0%,rgba(4,28,22,0.89)_35%,rgba(4,28,22,0.44)_62%,rgba(4,28,22,0.12)_100%)] md:bg-[linear-gradient(90deg,rgba(4,28,22,0.95)_0%,rgba(4,28,22,0.82)_38%,rgba(4,28,22,0.28)_64%,rgba(4,28,22,0.08)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#082f25]/85 to-transparent" />

          <div className="relative mx-auto w-full max-w-7xl">
            <div className="max-w-2xl">
              <div className="mb-7 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">27–29 noviembre 2026</span>
                <span className="rounded-full border border-[#d6a72f]/40 bg-[#d6a72f]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f2ce69]">Cupos limitados</span>
              </div>

              <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-[#d6a72f]">Encuentro de hombres en la montaña</p>
              <h1 className="max-w-3xl font-serif text-5xl leading-[0.92] text-white sm:text-6xl md:text-8xl">
                El Despertar<br />del Colibrí
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/75 md:text-xl">
                Una invitación a reconectar con la alegría, la sensibilidad y la sabiduría del corazón. Soltar corazas, transformar heridas y recuperar la liviandad y el disfrute de vivir.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-white/70">
                <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#d6a72f]" /> 27, 28 y 29 de noviembre</span>
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#d6a72f]" /> Pueblo Mágico · Los Gigantes</span>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <WhatsAppButton label="Quiero recibir información" />
                <a href="#propuesta" className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white/80 transition hover:bg-white/10">Conocer la propuesta</a>
              </div>
            </div>
          </div>
        </section>

        <section id="propuesta" className="scroll-mt-28 px-5 py-20 md:px-10 md:py-28" style={{ background: COLORS.paper }}>
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

        <section id="experiencia" className="scroll-mt-28 px-5 py-20 md:px-10 md:py-28" style={{ background: COLORS.cream }}>
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

        <section className="px-5 py-20 text-white md:px-10 md:py-28" style={{ background: COLORS.forest }}>
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-[#e6bf55]">¿Para quién es?</p>
              <h2 className="font-serif text-4xl leading-tight md:text-6xl">Para hombres dispuestos a mirarse de verdad</h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">Para quienes quieran abrirse al vínculo con otros, trabajar su energía masculina y reconectar con la naturaleza viva.</p>
              <div className="mt-8 flex flex-wrap gap-2">
                {['Sin edad límite', 'Con apertura', 'Con presencia', 'Con verdad'].map(label => <span key={label} className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/75">{label}</span>)}
              </div>
            </div>
            <img src={img('/uploads/events/colibri/circulo-hombres.jpg', 1000)} alt="Círculo de hombres compartiendo" className="aspect-[16/10] w-full rounded-[30px] object-cover shadow-2xl" loading="lazy" />
          </div>
        </section>

        <section id="lugar" className="scroll-mt-28 px-5 py-20 md:px-10 md:py-28" style={{ background: COLORS.paper }}>
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
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
            <div className="rounded-[30px] bg-white p-8 md:p-10">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: COLORS.clay }}>La experiencia incluye</p>
              <h2 className="font-serif text-4xl" style={{ color: COLORS.forest }}>Todo lo necesario para entrar al proceso</h2>
              <ul className="mt-8 space-y-5">
                {[
                  [BedDouble, 'Alojamiento', 'Habitaciones compartidas dentro de Pueblo Mágico.'],
                  [Utensils, 'Alimentación completa', 'Comidas durante los tres días del encuentro.'],
                  [Flame, 'Actividades y ceremonias', 'Toda la propuesta vivencial incluida.'],
                  [Users, 'Acompañamiento', 'Equipo Acan de Fuego e invitados especiales.'],
                ].map(([Icon, title, text]) => {
                  const ItemIcon = Icon as React.ElementType;
                  return <li key={title as string} className="flex gap-4"><span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#07583f]/10"><ItemIcon className="h-5 w-5" style={{ color: COLORS.forest }} /></span><div><strong className="block" style={{ color: COLORS.forest }}>{title as string}</strong><span className="text-sm leading-6 text-[#66736e]">{text as string}</span></div></li>;
                })}
              </ul>
            </div>

            <div className="flex flex-col justify-between rounded-[30px] p-8 text-white md:p-10" style={{ background: COLORS.forestDark }}>
              <div>
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-[#e6bf55]">Inversión y reserva</p>
                <h2 className="font-serif text-4xl">Pedí los valores actualizados</h2>
                <p className="mt-5 leading-7 text-white/70">Consultá la inversión vigente, los medios de pago y la disponibilidad para esta edición directamente por WhatsApp.</p>
                <div className="mt-7 space-y-3 text-sm text-white/75">
                  {['Cupos limitados', 'La reserva se confirma con una seña', 'Información y acompañamiento antes de llegar'].map(item => <p key={item} className="flex items-center gap-3"><Check className="h-4 w-4 text-[#d6a72f]" />{item}</p>)}
                </div>
              </div>
              <div className="mt-10"><WhatsAppButton label="Consultar valores y reservar" /></div>
            </div>
          </div>
        </section>

        <section id="equipo" className="scroll-mt-28 px-5 py-20 md:px-10 md:py-28" style={{ background: COLORS.paper }}>
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <img src="/uploads/acan-de-fuego-logo.png" alt="Acan de Fuego" className="mx-auto mb-6 h-24 w-auto object-contain" loading="lazy" />
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: COLORS.clay }}>Quiénes acompañan</p>
              <h2 className="font-serif text-4xl md:text-6xl" style={{ color: COLORS.forest }}>Acan de Fuego</h2>
              <p className="mx-auto mt-5 max-w-3xl leading-7 text-[#5d6c66]">Un círculo de hombres nacido del deseo de habitar lo masculino de forma más consciente y auténtica. Una propuesta que honra la tribu, el rito, el cuerpo, la emoción y el Ser.</p>
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
            <p className="mt-8 text-center text-sm font-bold uppercase tracking-[0.16em]" style={{ color: COLORS.clay }}>Facilita Equipo Acan de Fuego + invitados especiales</p>
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
    </div>
  );
};

export default DespertarDelColibri;
