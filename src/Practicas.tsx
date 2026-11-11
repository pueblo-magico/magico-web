import React, { useEffect } from 'react';
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Eye,
  Flame,
  Hammer,
  Leaf,
  MessageCircle,
  Music2,
  ShieldCheck,
  Sparkles,
  Users,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { CookieBanner } from '../components/CookieBanner';
import { useLanguage } from '../contexts/LanguageContext';
import { ROUTES } from './routes';
import { SITE_URL } from './data/config';

const CONTENT = {
  es: {
    seo: {
      title: 'Prácticas de Pueblo Mágico · Palabra, música, fuego y artesanía',
      description: 'Conocé las prácticas con las que Pueblo Mágico integra y expresa su visión: palabra, música, fuego, artesanía, temazcal, rapé y tabaco ceremonial.',
    },
    hero: {
      eyebrow: 'Pilares en acción · Pueblo Mágico',
      title: 'Lo que somos\nse vuelve práctica.',
      description: 'Nuestra visión no vive solamente en palabras. La integramos en el cuerpo, la comunidad, la escucha, el fuego y la relación con el territorio.',
      primary: 'Conocer las prácticas',
      secondary: 'Ver invitaciones abiertas',
    },
    vision: {
      eyebrow: 'Una visión que se practica',
      title: 'Quiénes somos, qué hacemos, para qué y cómo.',
      intro: 'Los pilares orientan nuestra visión. Las prácticas nos ayudan a incorporarla, sostenerla y expresarla en la vida compartida.',
      items: [
        { title: 'Quiénes somos', text: 'Un territorio y una comunidad de montaña que eligen habitar con consciencia, vínculo y cuidado.' },
        { title: 'Qué hacemos', text: 'Creamos espacios para encontrarnos, escuchar, rezar, expresarnos y volver a lo esencial.' },
        { title: 'Para qué', text: 'Para mantener viva una forma de estar en el mundo que cuide a las personas, los vínculos y el territorio.' },
        { title: 'Cómo', text: 'A través de prácticas concretas que integran cuerpo, palabra, música, fuego, naturaleza e intención.' },
      ],
    },
    temazcal: {
      eyebrow: 'Práctica central',
      title: 'Temazcal',
      lead: 'Una ceremonia para entrar en el calor, el silencio y la escucha.',
      text: 'El temazcal reúne vapor, oscuridad, palabra, canto y presencia dentro de un espacio guiado. En Pueblo Mágico es una práctica central para rezar, integrar procesos y recordar que la transformación también se atraviesa en comunidad.',
      note: 'Se comparte únicamente dentro de invitaciones específicas, con cupo, contexto y acompañamiento informados en cada convocatoria.',
      cta: 'Conocer la ceremonia de Temazcal',
    },
    practices: {
      eyebrow: 'Prácticas vivas',
      title: 'Formas de integrar y expresar nuestra esencia.',
      intro: 'No todas suceden en cada encuentro ni forman una programación fija. Cada una aparece cuando el contexto, la intención y el cuidado la vuelven pertinente.',
      items: [
        { id: 'rape', title: 'Uso ceremonial de rapé', purpose: 'Para rezar y conectar.', text: 'Una práctica de recogimiento e intención que se comparte en espacios específicos, con contexto y acompañamiento.' },
        { id: 'musica', title: 'Música como medicina', purpose: 'Para escuchar y expresarnos.', text: 'La voz, el ritmo y el sonido abren una práctica de presencia, escucha colectiva y expresión genuina.' },
        { id: 'palabra', title: 'Círculos de palabra', purpose: 'Para hablar sin máscaras.', text: 'Nos sentamos en ronda para decir con honestidad, escuchar sin apuro y dejar que la palabra circule.' },
        { id: 'fuego', title: 'Fuego ceremonial', purpose: 'Para levantar rezos y abrigar el territorio.', text: 'El fuego reúne, ilumina y sostiene la intención compartida. A su alrededor cantamos, escuchamos y agradecemos.' },
        { id: 'tabaco', title: 'Uso ceremonial de tabaco', purpose: 'Para rezar y transformar.', text: 'El tabaco se aborda como elemento ceremonial dentro de un marco de intención, respeto y cuidado.' },
        { id: 'artesania', title: 'Artesanía', purpose: 'Para crear con las manos y habitar el proceso.', text: 'Trabajar la materia nos conecta con el tiempo, el oficio y los saberes compartidos. Crear también es una forma de escuchar y transformar.' },
      ],
      careTitle: 'Una aclaración necesaria',
      careText: 'El rapé y el tabaco se presentan como prácticas ceremoniales para personas adultas. No son tratamientos médicos ni una invitación al consumo libre. Cuando hablamos de música como medicina, lo hacemos en un sentido ceremonial y comunitario, no clínico. La participación es siempre voluntaria y cada convocatoria debe comunicar su contexto y condiciones.',
    },
    care: {
      eyebrow: 'Cómo las sostenemos',
      title: 'La práctica importa tanto como la forma de compartirla.',
      items: [
        { title: 'Con contexto', text: 'Cada invitación explica qué práctica se comparte, con qué intención y dentro de qué experiencia.' },
        { title: 'Con libertad', text: 'Participar es una elección. Nadie necesita realizar una práctica para pertenecer al encuentro.' },
        { title: 'Con cuidado', text: 'El marco, el acompañamiento, el grupo y el territorio son parte de la práctica, no detalles accesorios.' },
      ],
    },
    invitations: {
      eyebrow: 'Participar',
      title: 'Las prácticas se comparten mediante invitaciones abiertas.',
      text: 'En esta etapa no funcionan como una agenda permanente. Publicamos convocatorias cuando una práctica encuentra su momento, su contexto y las personas que pueden sostenerla.',
      cta: 'Ver invitaciones abiertas',
      note: 'Cada convocatoria informa fecha, formato, cupo, aporte y condiciones de participación.',
    },
  },
  en: {
    seo: {
      title: 'Pueblo Mágico Practices · Word, music, fire and craft',
      description: 'Discover the practices through which Pueblo Mágico expresses its vision: word, music, fire, craft, temazcal, ceremonial rapé and tobacco.',
    },
    hero: {
      eyebrow: 'Pillars in action · Pueblo Mágico',
      title: 'Who we are\nbecomes practice.',
      description: 'Our vision does not live in words alone. We integrate it through the body, community, listening, fire and our relationship with the land.',
      primary: 'Discover the practices',
      secondary: 'See open invitations',
    },
    vision: {
      eyebrow: 'A vision put into practice',
      title: 'Who we are, what we do, why and how.',
      intro: 'Our pillars guide the vision. Our practices help us embody, sustain and express it in shared life.',
      items: [
        { title: 'Who we are', text: 'A mountain territory and community choosing to live with awareness, connection and care.' },
        { title: 'What we do', text: 'We create spaces to meet, listen, pray, express ourselves and return to what is essential.' },
        { title: 'Why', text: 'To keep alive a way of being that cares for people, relationships and the land.' },
        { title: 'How', text: 'Through concrete practices that integrate body, word, music, fire, nature and intention.' },
      ],
    },
    temazcal: {
      eyebrow: 'Central practice',
      title: 'Temazcal',
      lead: 'A ceremony for entering warmth, silence and listening.',
      text: 'Temazcal brings together steam, darkness, word, song and presence within a guided space. At Pueblo Mágico it is a central practice for prayer, integration and remembering that transformation is also lived in community.',
      note: 'It is shared only through specific invitations, with capacity, context and guidance explained in each announcement.',
      cta: 'Discover the Temazcal ceremony',
    },
    practices: {
      eyebrow: 'Living practices',
      title: 'Ways of embodying and expressing our essence.',
      intro: 'Not every practice is part of every gathering, nor are they a fixed schedule. Each one appears when context, intention and care make it appropriate.',
      items: [
        { id: 'rape', title: 'Ceremonial use of rapé', purpose: 'To pray and connect.', text: 'A practice of recollection and intention, shared in specific spaces with context and guidance.' },
        { id: 'musica', title: 'Music as medicine', purpose: 'To listen and express ourselves.', text: 'Voice, rhythm and sound open a practice of presence, collective listening and genuine expression.' },
        { id: 'palabra', title: 'Word circles', purpose: 'To speak without masks.', text: 'We sit in a circle to speak honestly, listen without rushing and let the word move among us.' },
        { id: 'fuego', title: 'Ceremonial fire', purpose: 'To carry prayers and warm the land.', text: 'Fire gathers, illuminates and holds shared intention. Around it we sing, listen and give thanks.' },
        { id: 'tabaco', title: 'Ceremonial use of tobacco', purpose: 'To pray and transform.', text: 'Tobacco is approached as a ceremonial element within a framework of intention, respect and care.' },
        { id: 'artesania', title: 'Craft', purpose: 'To create with our hands and inhabit the process.', text: 'Working with matter connects us with time, craft and shared knowledge. Creating is also a way of listening and transforming.' },
      ],
      careTitle: 'A necessary clarification',
      careText: 'Rapé and tobacco are presented as ceremonial practices for adults. They are not medical treatments or an invitation to unrestricted use. When we speak of music as medicine, we mean it in a ceremonial and communal, not clinical, sense. Participation is always voluntary, and every invitation must communicate its context and conditions.',
    },
    care: {
      eyebrow: 'How we hold them',
      title: 'The practice matters as much as the way it is shared.',
      items: [
        { title: 'With context', text: 'Every invitation explains which practice is being shared, its intention and the experience around it.' },
        { title: 'With freedom', text: 'Participation is a choice. No one needs to take part in a practice to belong to the gathering.' },
        { title: 'With care', text: 'The frame, guidance, group and territory are part of the practice, not secondary details.' },
      ],
    },
    invitations: {
      eyebrow: 'Take part',
      title: 'Practices are shared through open invitations.',
      text: 'At this stage they do not operate as a permanent schedule. We publish invitations when a practice finds its moment, context and the people who can hold it.',
      cta: 'See open invitations',
      note: 'Each invitation explains the date, format, capacity, contribution and participation conditions.',
    },
  },
} as const;

const PRACTICE_ICONS: Record<string, LucideIcon> = {
  rape: Wind,
  musica: Music2,
  palabra: MessageCircle,
  fuego: Flame,
  tabaco: Leaf,
  artesania: Hammer,
};

const VISION_ICONS = [Eye, Users, Sparkles, Flame];
const CARE_ICONS = [Eye, Users, ShieldCheck];

const Practicas: React.FC = () => {
  const { language } = useLanguage();
  const content = CONTENT[language as keyof typeof CONTENT] || CONTENT.es;

  useEffect(() => {
    const previousTitle = document.title;
    const pageUrl = `${SITE_URL}${ROUTES.PRACTICAS}`;
    const imageUrl = `${SITE_URL}/uploads/sunset-rio-amigos.webp`;
    document.title = content.seo.title;

    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, value: string) => {
      let element = document.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = value;
    };

    setMeta('meta[name="description"]', 'name', 'description', content.seo.description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', content.seo.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', content.seo.description);
    setMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl);
    setMeta('meta[property="og:url"]', 'property', 'og:url', pageUrl);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', content.seo.title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', content.seo.description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = pageUrl;

    return () => { document.title = previousTitle; };
  }, [content, language]);

  return (
    <div className="min-h-screen bg-[#F7F1E7] text-[#24362F]">
      <Header />
      <main>
        <section className="relative flex min-h-[88vh] items-end overflow-hidden px-6 pb-16 pt-32 text-white md:min-h-[92vh] md:px-12 md:pb-24">
          <img src="/uploads/sunset-rio-amigos.webp" alt={language === 'es' ? 'Comunidad reunida en círculo en Pueblo Mágico' : 'Community gathered in a circle at Pueblo Mágico'} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,28,20,0.38)_0%,rgba(4,28,20,0.48)_36%,rgba(4,28,20,0.94)_100%)]" />
          <div className="relative z-10 mx-auto w-full max-w-7xl">
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.32em] text-[#E7C866]">{content.hero.eyebrow}</p>
            <h1 className="max-w-4xl whitespace-pre-line font-serif text-5xl leading-[0.95] md:text-7xl lg:text-8xl">{content.hero.title}</h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/[0.78] md:text-xl">{content.hero.description}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#vision" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-[#073D2C] transition-colors hover:bg-white">
                {content.hero.primary}<ArrowDown size={16} aria-hidden="true" />
              </a>
              <a href="#invitaciones" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[#073D2C]">
                {content.hero.secondary}<ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section id="vision" className="bg-[#F7F1E7] px-6 py-20 md:px-12 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#A94A2B]">{content.vision.eyebrow}</p>
              <h2 className="mt-5 font-serif text-4xl leading-tight text-[#073D2C] md:text-6xl">{content.vision.title}</h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#24362F]/[0.68]">{content.vision.intro}</p>
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {content.vision.items.map((item, index) => {
                const Icon = VISION_ICONS[index];
                return <article key={item.title} className="rounded-[28px] border border-[#073D2C]/10 bg-white/75 p-7 shadow-[0_18px_45px_rgba(24,54,43,0.06)]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#073D2C] text-[#E7C866]"><Icon size={20} strokeWidth={1.6} aria-hidden="true" /></span>
                  <h3 className="mt-6 font-serif text-2xl text-[#073D2C]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#24362F]/[0.65]">{item.text}</p>
                </article>;
              })}
            </div>
          </div>
        </section>

        <section id="practicas" className="bg-white px-6 py-20 md:px-12 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#A94A2B]">{content.practices.eyebrow}</p>
              <h2 className="mt-5 font-serif text-4xl leading-tight text-[#073D2C] md:text-6xl">{content.practices.title}</h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#24362F]/[0.68]">{content.practices.intro}</p>
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {[
                { src: '/uploads/sunset-rio-amigos.webp', es: 'Comunidad y palabra', en: 'Community and word' },
                { src: '/uploads/sunset-rio-guitarreada.webp', es: 'Música y fuego', en: 'Music and fire' },
                { src: '/uploads/fausto-tallando.jpg', es: 'Artesanía y oficio', en: 'Craft and skill' },
              ].map((image, index) => <figure key={image.src} className={`group relative overflow-hidden rounded-[28px] ${index === 1 ? 'md:translate-y-7' : ''}`}>
                <img src={image.src} alt={language === 'es' ? image.es : image.en} className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061F17]/80 via-transparent to-transparent" />
                <figcaption className="absolute bottom-0 left-0 p-6 font-serif text-2xl text-white">{language === 'es' ? image.es : image.en}</figcaption>
              </figure>)}
            </div>
            <div className="mt-14 grid gap-5 md:mt-20 md:grid-cols-2 lg:grid-cols-3">
              {content.practices.items.map((practice, index) => {
                const Icon = PRACTICE_ICONS[practice.id];
                return <article key={practice.id} className={`group rounded-[28px] border p-7 transition-transform duration-300 hover:-translate-y-1 ${index === 3 ? 'border-[#A94A2B]/20 bg-[#FFF8EF]' : 'border-[#073D2C]/10 bg-[#F8F5EF]'}`}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#A94A2B] shadow-sm"><Icon size={22} strokeWidth={1.6} aria-hidden="true" /></span>
                  <h3 className="mt-6 font-serif text-2xl text-[#073D2C]">{practice.title}</h3>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#A94A2B]">{practice.purpose}</p>
                  <p className="mt-4 text-sm leading-7 text-[#24362F]/[0.65]">{practice.text}</p>
                </article>;
              })}
            </div>
            <aside className="mt-8 flex flex-col gap-5 rounded-[28px] border border-[#A94A2B]/[0.18] bg-[#FFF4E8] p-7 md:flex-row md:items-start md:p-9">
              <ShieldCheck className="shrink-0 text-[#A94A2B]" size={28} strokeWidth={1.6} aria-hidden="true" />
              <div><h3 className="font-serif text-2xl text-[#073D2C]">{content.practices.careTitle}</h3><p className="mt-3 max-w-4xl text-sm leading-7 text-[#24362F]/[0.70]">{content.practices.careText}</p></div>
            </aside>
          </div>
        </section>

        <section id="temazcal" className="overflow-hidden bg-[#073D2C] px-6 py-20 text-white md:px-12 md:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E7C866]">{content.temazcal.eyebrow}</p>
              <h2 className="mt-5 font-serif text-5xl text-white md:text-7xl">{content.temazcal.title}</h2>
              <p className="mt-5 font-serif text-2xl leading-snug text-[#E7C866] md:text-3xl">{content.temazcal.lead}</p>
              <p className="mt-7 text-base leading-8 text-white/[0.72]">{content.temazcal.text}</p>
              <div className="mt-8 flex gap-3 rounded-2xl border border-white/[0.12] bg-white/[0.06] p-5 text-sm leading-6 text-white/[0.66]">
                <CalendarDays className="mt-0.5 shrink-0 text-[#E7C866]" size={20} aria-hidden="true" />
                <p>{content.temazcal.note}</p>
              </div>
              <a href={ROUTES.TEMAZCAL} className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-[#073D2C] transition-colors hover:bg-white">
                {content.temazcal.cta}<ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-[36px] border border-[#E7C866]/25" aria-hidden="true" />
              <img src="/uploads/Ciclo Femenino/Temazcal.jpeg" alt={language === 'es' ? 'Estructura ceremonial de temazcal' : 'Ceremonial temazcal structure'} className="relative aspect-[4/3] w-full rounded-[30px] object-cover shadow-2xl" loading="lazy" />
            </div>
          </div>
        </section>

        <section id="cuidado" className="bg-[#EDE5D8] px-6 py-20 md:px-12 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#A94A2B]">{content.care.eyebrow}</p>
                <h2 className="mt-5 font-serif text-4xl leading-tight text-[#073D2C] md:text-6xl">{content.care.title}</h2>
              </div>
              <div className="grid gap-4">
                {content.care.items.map((item, index) => {
                  const Icon = CARE_ICONS[index];
                  return <article key={item.title} className="flex gap-5 rounded-2xl border border-[#073D2C]/10 bg-white/[0.65] p-6">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#073D2C] text-[#E7C866]"><Icon size={18} strokeWidth={1.6} aria-hidden="true" /></span>
                    <div><h3 className="font-serif text-xl text-[#073D2C]">{item.title}</h3><p className="mt-2 text-sm leading-7 text-[#24362F]/[0.65]">{item.text}</p></div>
                  </article>;
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="invitaciones" className="relative overflow-hidden px-6 py-24 text-white md:px-12 md:py-36">
          <img src="/uploads/sunset-rio-fogon-real.webp" alt={language === 'es' ? 'Comunidad reunida alrededor del fuego' : 'Community gathered around the fire'} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-[#061F17]/84" />
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E7C866]">{content.invitations.eyebrow}</p>
            <h2 className="mt-5 font-serif text-4xl leading-tight text-white md:text-6xl">{content.invitations.title}</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/[0.72]">{content.invitations.text}</p>
            <a href="/#eventos" className="mt-9 inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-[#073D2C] transition-colors hover:bg-white">
              {content.invitations.cta}<ArrowRight size={16} aria-hidden="true" />
            </a>
            <p className="mx-auto mt-5 max-w-xl text-xs leading-6 text-white/[0.48]">{content.invitations.note}</p>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
      <CookieBanner />
    </div>
  );
};

export default Practicas;
