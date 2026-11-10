import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, Flame, Heart, Moon, ShieldCheck, Users, Wind } from 'lucide-react';
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
      title: 'Temazcal en Pueblo Mágico · Ceremonia, calor y comunidad',
      description: 'Conocé cómo vivimos el Temazcal en Pueblo Mágico: una ceremonia guiada de calor, vapor, palabra, canto, silencio y presencia compartida.',
    },
    hero: {
      eyebrow: 'Una práctica de Pueblo Mágico',
      title: 'Temazcal',
      lead: 'Entrar en el calor para escuchar, rezar e integrar en comunidad.',
      back: 'Volver a todas las prácticas',
    },
    meaning: {
      eyebrow: 'La ceremonia',
      title: 'Un espacio para atravesar la experiencia con presencia.',
      text: 'El Temazcal reúne calor, vapor, oscuridad, palabra, canto y silencio dentro de un espacio guiado. No lo entendemos como una actividad aislada, sino como una práctica de escucha e integración que se sostiene entre quienes participan y el territorio que los recibe.',
      elements: [
        { title: 'Calor y vapor', text: 'El cuerpo entra en otro ritmo y la atención vuelve al presente.' },
        { title: 'Palabra y canto', text: 'La voz acompaña, expresa intención y construye comunidad.' },
        { title: 'Silencio y escucha', text: 'También hay lugar para recogerse y percibir lo que aparece.' },
        { title: 'Integración', text: 'La experiencia se atraviesa con acompañamiento y respeto por cada proceso.' },
      ],
    },
    way: {
      eyebrow: 'Cómo lo compartimos',
      title: 'Con contexto, elección y cuidado.',
      items: [
        { title: 'Una invitación específica', text: 'Cada ceremonia se comunica con fecha, cupo, formato, aporte y condiciones de participación.' },
        { title: 'Participación voluntaria', text: 'La práctica no es una obligación ni una prueba. Cada persona decide si es el momento adecuado para participar.' },
        { title: 'Un espacio acompañado', text: 'La guía, el grupo, el ritmo de la ceremonia y el territorio forman parte del marco de cuidado.' },
      ],
      note: 'Antes de participar compartimos la información necesaria para tomar una decisión consciente. Si tenés dudas relacionadas con tu salud o la exposición al calor, consultá con un profesional de salud y con la persona responsable de la convocatoria.',
    },
    invitation: {
      eyebrow: 'Próximas ceremonias',
      title: 'El Temazcal se abre cuando existe un contexto para sostenerlo.',
      text: 'No funciona como una actividad permanente. Publicamos cada invitación cuando están definidos el propósito, el acompañamiento y las condiciones de la experiencia.',
      cta: 'Ver invitaciones abiertas',
      practices: 'Conocer todas las prácticas',
    },
  },
  en: {
    seo: {
      title: 'Temazcal at Pueblo Mágico · Ceremony, heat and community',
      description: 'Discover how Temazcal is held at Pueblo Mágico: a guided ceremony of heat, steam, word, song, silence and shared presence.',
    },
    hero: {
      eyebrow: 'A Pueblo Mágico practice',
      title: 'Temazcal',
      lead: 'Entering the heat to listen, pray and integrate in community.',
      back: 'Back to all practices',
    },
    meaning: {
      eyebrow: 'The ceremony',
      title: 'A space for moving through experience with presence.',
      text: 'Temazcal brings together heat, steam, darkness, word, song and silence within a guided space. We do not understand it as an isolated activity, but as a practice of listening and integration held by those who take part and the land that receives them.',
      elements: [
        { title: 'Heat and steam', text: 'The body enters another rhythm and attention returns to the present.' },
        { title: 'Word and song', text: 'The voice accompanies, expresses intention and builds community.' },
        { title: 'Silence and listening', text: 'There is also space to turn inward and notice what arises.' },
        { title: 'Integration', text: 'The experience is held with guidance and respect for each process.' },
      ],
    },
    way: {
      eyebrow: 'How we share it',
      title: 'With context, choice and care.',
      items: [
        { title: 'A specific invitation', text: 'Every ceremony communicates its date, capacity, format, contribution and participation conditions.' },
        { title: 'Voluntary participation', text: 'The practice is neither an obligation nor a test. Each person decides whether it is the right moment to take part.' },
        { title: 'A guided space', text: 'The guide, group, rhythm of the ceremony and territory are all part of the framework of care.' },
      ],
      note: 'Before taking part, we share the information needed to make a conscious decision. If you have questions related to your health or heat exposure, speak with a health professional and the person responsible for the invitation.',
    },
    invitation: {
      eyebrow: 'Upcoming ceremonies',
      title: 'Temazcal opens when there is a context capable of holding it.',
      text: 'It is not a permanent activity. We publish each invitation once its purpose, guidance and participation conditions are defined.',
      cta: 'See open invitations',
      practices: 'Discover all practices',
    },
  },
} as const;

const ELEMENT_ICONS = [Flame, Users, Moon, Heart];
const WAY_ICONS = [Wind, Heart, ShieldCheck];

const Temazcal: React.FC = () => {
  const { language } = useLanguage();
  const content = CONTENT[language as keyof typeof CONTENT] || CONTENT.es;

  useEffect(() => {
    const previousTitle = document.title;
    const pageUrl = `${SITE_URL}${ROUTES.TEMAZCAL}`;
    const imageUrl = `${SITE_URL}/uploads/temazcal.webp`;
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
  }, [content]);

  return <div className="min-h-screen bg-[#F7F1E7] text-[#24362F]">
    <Header />
    <main>
      <section className="relative flex min-h-[88vh] items-end overflow-hidden px-6 pb-16 pt-32 text-white md:min-h-[92vh] md:px-12 md:pb-24">
        <img src="/uploads/temazcal.webp" alt={language === 'es' ? 'Ceremonia de Temazcal en Pueblo Mágico' : 'Temazcal ceremony at Pueblo Mágico'} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,28,20,0.28),rgba(4,28,20,0.94))]" />
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <a href={ROUTES.PRACTICAS} className="mb-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-[#E7C866]"><ArrowLeft size={16} aria-hidden="true" />{content.hero.back}</a>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#E7C866]">{content.hero.eyebrow}</p>
          <h1 className="mt-5 font-serif text-6xl leading-none md:text-8xl lg:text-9xl">{content.hero.title}</h1>
          <p className="mt-7 max-w-2xl font-serif text-2xl leading-snug text-white/[0.85] md:text-4xl">{content.hero.lead}</p>
        </div>
      </section>

      <section id="ceremonia" className="px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#A94A2B]">{content.meaning.eyebrow}</p>
            <h2 className="mt-5 font-serif text-4xl leading-tight text-[#073D2C] md:text-6xl">{content.meaning.title}</h2>
            <p className="mt-7 text-base leading-8 text-[#24362F]/70">{content.meaning.text}</p>
            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {content.meaning.elements.map((item, index) => {
                const Icon = ELEMENT_ICONS[index];
                return <article key={item.title} className="rounded-2xl border border-[#073D2C]/10 bg-white/70 p-5">
                  <Icon size={20} className="text-[#A94A2B]" strokeWidth={1.6} aria-hidden="true" />
                  <h3 className="mt-4 font-serif text-xl text-[#073D2C]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#24362F]/[0.65]">{item.text}</p>
                </article>;
              })}
            </div>
          </div>
          <img src="/uploads/Ciclo Femenino/Temazcal.jpeg" alt={language === 'es' ? 'Estructura del Temazcal en el territorio' : 'Temazcal structure on the land'} className="aspect-[4/5] w-full rounded-[32px] object-cover shadow-[0_24px_70px_rgba(7,61,44,0.16)]" loading="lazy" />
        </div>
      </section>

      <section id="cuidado" className="bg-[#073D2C] px-6 py-20 text-white md:px-12 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E7C866]">{content.way.eyebrow}</p>
            <h2 className="mt-5 font-serif text-4xl leading-tight md:text-6xl">{content.way.title}</h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {content.way.items.map((item, index) => {
              const Icon = WAY_ICONS[index];
              return <article key={item.title} className="rounded-[28px] border border-white/10 bg-white/[0.06] p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E7C866] text-[#073D2C]"><Icon size={22} strokeWidth={1.6} aria-hidden="true" /></span>
                <h3 className="mt-6 font-serif text-2xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/[0.65]">{item.text}</p>
              </article>;
            })}
          </div>
          <p className="mx-auto mt-9 max-w-4xl rounded-2xl border border-[#E7C866]/25 bg-[#E7C866]/10 p-6 text-sm leading-7 text-white/70">{content.way.note}</p>
        </div>
      </section>

      <section id="invitaciones" className="relative overflow-hidden px-6 py-24 text-white md:px-12 md:py-36">
        <img src="/uploads/sunset-rio-fogon-real.webp" alt={language === 'es' ? 'Comunidad reunida alrededor del fuego' : 'Community gathered around the fire'} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-[#061F17]/[0.85]" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E7C866]">{content.invitation.eyebrow}</p>
          <h2 className="mt-5 font-serif text-4xl leading-tight md:text-6xl">{content.invitation.title}</h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/70">{content.invitation.text}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="/#eventos" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-[#073D2C] transition-colors hover:bg-white">{content.invitation.cta}<ArrowRight size={16} aria-hidden="true" /></a>
            <a href={ROUTES.PRACTICAS} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white hover:text-[#073D2C]">{content.invitation.practices}</a>
          </div>
        </div>
      </section>
    </main>
    <Footer />
    <WhatsAppButton />
    <CookieBanner />
  </div>;
};

export default Temazcal;
