import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CircleDot,
  Droplets,
  Flame,
  HeartHandshake,
  Leaf,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Wind,
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useLanguage } from '../contexts/LanguageContext';
import { img } from './lib/img';
import { WA_MAGICO } from './data/config';
import { ROUTES } from './routes';

const COLORS = {
  forest: '#083f31',
  forestDeep: '#052b23',
  clay: '#a65232',
  gold: '#d8ad45',
  cream: '#f5efe3',
  paper: '#fffdf8',
  ink: '#24342d',
};

const DEFAULT_MESSAGE = encodeURIComponent(
  'Hola Pueblo Mágico, quiero conocer las próximas fechas de Temazcal y saber cómo participar.',
);
const WHATSAPP_URL = `https://wa.me/${WA_MAGICO}?text=${DEFAULT_MESSAGE}`;

const todayInCordoba = () => {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Argentina/Cordoba',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const EXPERIENCE_STEPS = [
  {
    number: '01',
    title: 'Llegar y prepararnos',
    text: 'Antes de entrar nos encontramos, conversamos sobre la intención de la ceremonia y compartimos las pautas de cuidado. Es el momento para hacer preguntas y comunicar cualquier condición de salud.',
    Icon: CircleDot,
  },
  {
    number: '02',
    title: 'Entrar al círculo',
    text: 'Ingresamos a un espacio bajo y circular, en contacto con la tierra. Nos sentamos alrededor del centro, con una disposición de respeto, escucha y presencia compartida.',
    Icon: HeartHandshake,
  },
  {
    number: '03',
    title: 'Calor, piedras y vapor',
    text: 'Las piedras calentadas en el fuego sostienen el calor. Al recibir agua generan vapor. La intensidad se construye de manera progresiva y la persona facilitadora acompaña al grupo.',
    Icon: Flame,
  },
  {
    number: '04',
    title: 'Escuchar lo que aparece',
    text: 'En la oscuridad pueden aparecer silencio, respiración, palabra, canto o emoción. No hay una experiencia que deba suceder: cada cuerpo y cada ceremonia tienen su propio ritmo.',
    Icon: Wind,
  },
  {
    number: '05',
    title: 'Salir e integrar',
    text: 'Al finalizar salimos despacio, nos hidratamos y descansamos. Dejamos tiempo para que el cuerpo baje la intensidad y para integrar lo vivido antes de volver a la actividad cotidiana.',
    Icon: Droplets,
  },
];

const FAQS = [
  {
    question: '¿Necesito experiencia previa?',
    answer: 'No. Antes de comenzar explicamos la dinámica y las pautas de cuidado. Lo importante es llegar con disposición a escuchar, respetar el espacio y comunicar lo que necesitás.',
  },
  {
    question: '¿Es lo mismo que un sauna?',
    answer: 'No. Aunque ambos trabajan con calor y vapor, el Temazcal es una práctica ceremonial mesoamericana con una dimensión comunitaria, simbólica y espiritual. No lo presentamos como un servicio de sauna ni como un tratamiento médico.',
  },
  {
    question: '¿Cuánto dura?',
    answer: 'La duración y la intensidad pueden variar según la ceremonia, el grupo y la forma de conducción. Al confirmar tu lugar te compartimos el horario completo de llegada, preparación, ceremonia y descanso.',
  },
  {
    question: '¿Qué tengo que llevar?',
    answer: 'Ropa liviana o traje de baño, una muda seca, toalla, abrigo para después y agua. Al reservar te enviamos la lista definitiva y las recomendaciones específicas de esa fecha.',
  },
  {
    question: '¿Qué pasa si el calor me resulta demasiado intenso?',
    answer: 'Antes de entrar acordamos cómo pedir acompañamiento. Si sentís mareo, dolor, falta de aire o un malestar que te preocupa, avisá inmediatamente y seguí la indicación de la persona facilitadora. No se trata de resistir ni de demostrar nada.',
  },
  {
    question: '¿Hay situaciones de salud que requieren consulta previa?',
    answer: 'Sí. El calor intenso y la deshidratación pueden implicar riesgos. Si estás embarazada, tomás medicación o tenés antecedentes cardíacos, respiratorios, neurológicos, de presión arterial u otra condición relevante, consultá a un profesional de salud y escribinos antes de reservar.',
  },
];

const WhatsAppLink: React.FC<{ children: React.ReactNode; href?: string; secondary?: boolean }> = ({ children, href = WHATSAPP_URL, secondary = false }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`inline-flex items-center justify-center gap-3 rounded-full px-7 py-4 text-xs font-bold uppercase tracking-[0.15em] transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${secondary ? 'border border-white/30 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-white' : 'bg-[#d8ad45] text-[#052b23] shadow-[0_14px_36px_rgba(5,43,35,0.18)] hover:bg-[#e4bd5b] focus-visible:ring-[#d8ad45]'}`}
  >
    {children}
    <ArrowRight className="h-4 w-4" aria-hidden="true" />
  </a>
);

const Temazcal: React.FC = () => {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const today = useMemo(todayInCordoba, []);

  const upcomingDates = useMemo(
    () => ((t.events?.cards || []) as any[])
      .filter((event) => event.isTemazcal && (event.endDate || event.startDate || '') >= today)
      .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || '')),
    [t, today],
  );
  const relatedEvents = useMemo(
    () => ((t.events?.cards || []) as any[])
      .filter((event) => event.relatedToTemazcal && (event.endDate || event.startDate || '') >= today)
      .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || '')),
    [t, today],
  );

  useEffect(() => {
    const previousTitle = document.title;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = meta?.content;
    const description = 'Conocé qué es el Temazcal, cómo vivimos la ceremonia en Pueblo Mágico y las próximas fechas en Los Gigantes, Córdoba.';

    document.title = 'Temazcal en Córdoba — Ceremonia en la Montaña | Pueblo Mágico';
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;

    const schema = document.createElement('script');
    schema.id = 'ld-temazcal';
    schema.type = 'application/ld+json';
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Temazcal en Pueblo Mágico',
      url: `https://experienciamagico.com${ROUTES.TEMAZCAL}`,
      description,
      image: 'https://experienciamagico.com/uploads/temazcal.webp',
      about: {
        '@type': 'Thing',
        name: 'Temazcal',
        description: 'Práctica ceremonial mesoamericana de calor y vapor.',
      },
      provider: {
        '@type': 'Organization',
        name: 'Pueblo Mágico',
        url: 'https://experienciamagico.com',
      },
    });
    document.head.appendChild(schema);

    return () => {
      document.title = previousTitle;
      if (meta && previousDescription !== undefined) meta.content = previousDescription;
      schema.remove();
    };
  }, []);

  return (
    <div className="overflow-x-hidden" style={{ background: COLORS.cream, color: COLORS.ink }}>
      <Header />

      <main>
        <section className="relative isolate flex min-h-[760px] items-end overflow-hidden px-5 pb-20 pt-36 text-white md:min-h-[820px] md:items-center md:px-10 md:py-32">
          <img
            src={img('/uploads/temazcal.webp', 2200)}
            alt="Temazcal preparado junto al fuego en Pueblo Mágico"
            width="1920"
            height="1080"
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[56%_center]"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#031d17]/95 via-[#052b23]/78 to-[#052b23]/35" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-[#052b23] to-transparent" />

          <div className="mx-auto w-full max-w-7xl">
            <div className="max-w-3xl">
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/85 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-[#d8ad45]" aria-hidden="true" />
                Ceremonia · montaña · comunidad
              </p>
              <h1 className="font-serif text-[clamp(4.2rem,10vw,8.4rem)] leading-[0.82] tracking-[-0.04em] text-white">Temazcal</h1>
              <p className="mt-7 max-w-2xl font-serif text-2xl leading-tight text-[#f6e6bd] md:text-4xl">Entrar al calor. Escuchar el cuerpo. Volver a lo esencial.</p>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/78 md:text-lg">Una ceremonia de vapor, oscuridad y presencia compartida en el corazón de Los Gigantes. Una invitación a detenernos, entrar en escucha y atravesar la experiencia acompañados.</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a href="#experiencia" className="inline-flex items-center justify-center rounded-full bg-[#d8ad45] px-7 py-4 text-xs font-bold uppercase tracking-[0.15em] text-[#052b23] transition hover:-translate-y-0.5 hover:bg-[#e4bd5b]">Conocer la experiencia</a>
                <a href="#fechas" className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-7 py-4 text-xs font-bold uppercase tracking-[0.15em] text-white transition hover:bg-white/10">Ver próximas fechas</a>
              </div>
            </div>
          </div>
        </section>

        <section id="que-es" className="px-5 py-20 md:px-10 md:py-28" style={{ background: COLORS.paper }}>
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#d7d0c4]">
              <img src={img('/uploads/Ciclo Femenino/temazcal parte superior.jpeg', 1100)} alt="Estructura circular del temazcal abierta hacia el cielo" className="aspect-[4/5] w-full object-cover" loading="lazy" />
              <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/20 bg-[#052b23]/82 p-5 text-sm leading-6 text-white/82 backdrop-blur-md">
                <p className="font-semibold text-[#f2cf75]">Una tradición viva</p>
                <p className="mt-1">Su forma y conducción cambian según la comunidad, la persona facilitadora y la tradición que la sostiene.</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em]" style={{ color: COLORS.clay }}>Entender antes de entrar</p>
              <h2 className="mt-5 font-serif text-4xl leading-tight md:text-6xl" style={{ color: COLORS.forestDeep }}>¿Qué es un Temazcal?</h2>
              <div className="mt-7 space-y-5 text-base leading-8 text-[#48574f] md:text-lg">
                <p><strong className="text-[#24342d]">Temazcal</strong> viene del náhuatl <em>temazcalli</em>, “casa de vapor”. Es una práctica ancestral de Mesoamérica en la que piedras calentadas en el fuego reciben agua y producen vapor dentro de un espacio bajo y circular.</p>
                <p>Pero no es simplemente un baño caliente. Es una práctica ceremonial y comunitaria que diferentes pueblos han usado con sentidos de cuidado, purificación, transición y renovación.</p>
                <p>No existe un único protocolo universal. Cada tradición conserva su manera de preparar el espacio, conducir el calor, acompañar la palabra y dar sentido a la ceremonia.</p>
              </div>

              <div className="mt-9 rounded-3xl border border-[#a65232]/20 bg-[#a65232]/[0.06] p-6 md:p-7">
                <p className="font-serif text-2xl text-[#7a3d2b]">Lo nombramos con respeto</p>
                <p className="mt-3 text-sm leading-7 text-[#5f514a]">El Temazcal no nació en Pueblo Mágico. Reconocemos su raíz mesoamericana y su transmisión viva. No lo presentamos como una invención propia, una moda de bienestar ni una promesa de curación.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="experiencia" className="px-5 py-20 text-white md:px-10 md:py-28" style={{ background: COLORS.forestDeep }}>
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#d8ad45]">La experiencia</p>
              <h2 className="mt-5 font-serif text-4xl leading-tight md:text-6xl">¿Cómo puede vivirse?</h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/65 md:text-lg">No hay una sensación correcta ni un resultado que alcanzar. Este recorrido explica lo que habitualmente puede suceder; cada ceremonia y cada persona son diferentes.</p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {EXPERIENCE_STEPS.map(({ number, title, text, Icon }) => (
                <article key={number} className="group rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-6 transition hover:-translate-y-1 hover:border-[#d8ad45]/35 hover:bg-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-[0.25em] text-[#d8ad45]">{number}</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d8ad45]/10 text-[#e5c66f]"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  </div>
                  <h3 className="mt-7 font-serif text-2xl leading-tight text-[#fff7e8]">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/60">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="significado" className="relative overflow-hidden px-5 py-20 md:px-10 md:py-28" style={{ background: COLORS.cream }}>
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#d8ad45]/10 blur-3xl" aria-hidden="true" />
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.26em]" style={{ color: COLORS.clay }}>Lo que significa para nosotros</p>
              <h2 className="mt-5 font-serif text-4xl leading-tight md:text-6xl" style={{ color: COLORS.forestDeep }}>Una práctica de relación, no de consumo.</h2>
              <p className="mt-7 text-lg leading-8 text-[#54635b]">En Pueblo Mágico vivimos el Temazcal como una pausa consciente: un espacio para entrar con humildad, encontrarnos en círculo y recordar que el bienestar también nace de cómo nos relacionamos con la tierra y con los demás.</p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                { Icon: Leaf, title: 'Relación con la tierra', text: 'El fuego, las piedras, el agua y el aire no son decoración: sostienen materialmente la experiencia y nos recuerdan nuestra dependencia del territorio.' },
                { Icon: HeartHandshake, title: 'Comunidad y cuidado', text: 'Entramos con otras personas. La escucha, el consentimiento y el cuidado mutuo importan tanto como la intensidad del calor.' },
                { Icon: Sparkles, title: 'Presencia e integración', text: 'No buscamos forzar una revelación. Damos lugar a lo que aparezca y reservamos tiempo para descansar, conversar e integrar.' },
              ].map(({ Icon, title, text }) => (
                <article key={title} className="rounded-[1.75rem] border border-[#083f31]/10 bg-white/70 p-7 shadow-[0_16px_50px_rgba(8,63,49,0.07)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#083f31] text-[#f0cf78]"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <h3 className="mt-6 font-serif text-2xl" style={{ color: COLORS.forestDeep }}>{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#58665f]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="cuidado" className="px-5 py-20 md:px-10 md:py-28" style={{ background: COLORS.paper }}>
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em]" style={{ color: COLORS.clay }}>Cómo lo practicamos</p>
              <h2 className="mt-5 font-serif text-4xl leading-tight md:text-6xl" style={{ color: COLORS.forestDeep }}>Con preparación, acompañamiento y escucha.</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  ['Cupo limitado', 'La inscripción previa nos permite preparar el espacio y acompañar al grupo con atención.'],
                  ['Participación voluntaria', 'Sumarte es una elección. No hay que soportar el calor ni demostrar resistencia.'],
                  ['Explicación antes de entrar', 'Compartimos la dinámica, las formas de pedir ayuda y las pautas de cuidado.'],
                  ['Cierre con tiempo', 'La experiencia incluye hidratación, descanso y un momento de integración.'],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-2xl border border-[#083f31]/10 bg-[#f5efe3]/70 p-5">
                    <p className="flex items-center gap-2 font-semibold text-[#083f31]"><ShieldCheck className="h-4 w-4 text-[#a65232]" aria-hidden="true" />{title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#5d6963]">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-[#d7d0c4] shadow-[0_24px_70px_rgba(5,43,35,0.14)]">
              <img src={img('/uploads/Ciclo Femenino/Temazcal.jpeg', 1200)} alt="Temazcal cubierto y preparado para la ceremonia" className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <div className="bg-[#083f31] p-7 text-white">
                <p className="flex items-center gap-2 font-serif text-2xl text-[#f4d98f]"><ShieldCheck className="h-5 w-5" aria-hidden="true" />Cuidar también es informar</p>
                <p className="mt-4 text-sm leading-7 text-white/68">Llegá bien hidratado/a y sin haber consumido alcohol u otras sustancias. Si tomás medicación o tenés una condición de salud relevante, consultá previamente a un profesional y a nuestro equipo. Esta página no reemplaza asesoramiento médico.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="fechas" className="px-5 py-20 md:px-10 md:py-28" style={{ background: COLORS.forest }}>
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center text-white">
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#e5c66f]">Agenda abierta</p>
              <h2 className="mt-5 font-serif text-4xl leading-tight md:text-6xl">Próximos Temazcales</h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/65">Publicamos aquí solamente las fechas confirmadas. Cada encuentro tiene cupo limitado e inscripción previa.</p>
            </div>

            <div className="mx-auto mt-12 max-w-4xl">
              {upcomingDates.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  {upcomingDates.map((event) => (
                    <article key={`${event.title}-${event.startDate}`} className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#fffdf8] text-[#24342d] shadow-2xl">
                      <img src={img(event.image, 900)} alt={event.title} className="aspect-[16/9] w-full object-cover" loading="lazy" />
                      <div className="p-7">
                        <div className="flex flex-wrap gap-2">{(event.labels || []).map((label: string) => <span key={label} className="rounded-full bg-[#083f31]/[0.07] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#315b43]">{label}</span>)}</div>
                        <p className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#a65232]"><CalendarDays className="h-4 w-4" aria-hidden="true" />{event.date}</p>
                        <h3 className="mt-3 font-serif text-3xl text-[#083f31]">{event.title}</h3>
                        <p className="mt-4 text-sm leading-7 text-[#5a6861]">{event.desc}</p>
                        <a href={event.contactLink || WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#083f31] underline decoration-[#d8ad45] decoration-2 underline-offset-4">Consultar y reservar <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-white/12 bg-white/[0.06] p-8 text-center text-white md:p-12">
                  <CalendarDays className="mx-auto h-9 w-9 text-[#e5c66f]" aria-hidden="true" />
                  <h3 className="mt-5 font-serif text-3xl">Estamos preparando la próxima fecha.</h3>
                  <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/65">Escribinos para recibir el aviso apenas abramos una nueva ceremonia.</p>
                  <div className="mt-7"><WhatsAppLink secondary>Quiero recibir la próxima fecha</WhatsAppLink></div>
                </div>
              )}
            </div>
          </div>
        </section>

        {relatedEvents.length > 0 && (
          <section id="encuentros" className="px-5 py-20 md:px-10 md:py-28" style={{ background: COLORS.cream }}>
            <div className="mx-auto max-w-6xl">
              <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.26em]" style={{ color: COLORS.clay }}>También puede formar parte de</p>
                  <h2 className="mt-5 font-serif text-4xl leading-tight md:text-5xl" style={{ color: COLORS.forestDeep }}>Encuentros más amplios en la montaña.</h2>
                  <p className="mt-6 text-base leading-8 text-[#59675f]">Algunos retiros incluyen el Temazcal dentro de un proceso de varios días. La ceremonia se integra allí a una propuesta y un acompañamiento más amplios.</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {relatedEvents.map((event) => (
                    <a key={`${event.title}-${event.startDate}`} href={event.link} className="group overflow-hidden rounded-[1.75rem] border border-[#083f31]/10 bg-white shadow-[0_18px_55px_rgba(8,63,49,0.08)] transition hover:-translate-y-1">
                      <img src={img(event.image, 800)} alt={event.title} className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
                      <div className="p-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a65232]">{event.date}</p>
                        <h3 className="mt-3 font-serif text-2xl text-[#083f31]">{event.title}</h3>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#637068]">{event.desc}</p>
                        <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#083f31]">Conocer el encuentro <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section id="preguntas" className="px-5 py-20 md:px-10 md:py-28" style={{ background: COLORS.paper }}>
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.26em]" style={{ color: COLORS.clay }}>Antes de reservar</p>
              <h2 className="mt-5 font-serif text-4xl md:text-6xl" style={{ color: COLORS.forestDeep }}>Preguntas frecuentes</h2>
            </div>
            <div className="mt-12 divide-y divide-[#083f31]/10 border-y border-[#083f31]/10">
              {FAQS.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <div key={faq.question}>
                    <button type="button" onClick={() => setOpenFaq(open ? null : index)} className="flex w-full items-center justify-between gap-5 py-6 text-left" aria-expanded={open}>
                      <span className="flex items-center gap-3 font-serif text-xl text-[#083f31] md:text-2xl"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#083f31]/[0.06] text-[#a65232]"><MessageCircle className="h-4 w-4" aria-hidden="true" /></span>{faq.question}</span>
                      <span className={`shrink-0 text-2xl text-[#a65232] transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
                    </button>
                    <div className={`grid transition-[grid-template-rows] duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden"><p className="max-w-3xl pb-6 pl-11 text-sm leading-7 text-[#5c6962] md:text-base">{faq.answer}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden px-5 py-24 text-center text-white md:px-10 md:py-32">
          <img src={img('/uploads/temazcal.webp', 1800)} alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 -z-10 bg-[#052b23]/88" />
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#e5c66f]">Si sentís el llamado</p>
            <h2 className="mt-5 font-serif text-4xl leading-tight md:text-6xl">Conversemos antes de entrar.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/68">Contanos si es tu primera vez, qué fecha te interesa y cualquier duda de salud o preparación. Queremos que llegues con información clara y puedas elegir con tranquilidad.</p>
            <div className="mt-9"><WhatsAppLink>Consultar por WhatsApp</WhatsAppLink></div>
            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-white/55"><MapPin className="h-4 w-4 text-[#d8ad45]" aria-hidden="true" />Pueblo Mágico · Los Gigantes, Córdoba</p>
          </div>
        </section>
      </main>

      <Footer />

      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="Consultar por WhatsApp sobre Temazcal" className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
        <MessageCircle className="h-6 w-6" aria-hidden="true" />
      </a>
    </div>
  );
};

export default Temazcal;
