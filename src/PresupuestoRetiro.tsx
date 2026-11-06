import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  ChefHat,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { CookieBanner } from '../components/CookieBanner';
import { img } from './lib/img';
import { WA_MAGICO } from './data/config';

const COLORS = {
  green: '#005333',
  darkGreen: '#003D27',
  gold: '#D4AF37',
  cream: '#FDFBF7',
  sand: '#F3EEE5',
  terra: '#AA3E11',
  brown: '#2A1708',
  muted: '#6B4A33',
};

export const PROPOSAL_VALID_FROM = '2026-11-07T00:00:00-03:00';
export const PROPOSAL_VALID_UNTIL = '2026-12-07T00:00:00-03:00';

const validityFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Argentina/Cordoba',
});
const validityEndInclusive = new Date(new Date(PROPOSAL_VALID_UNTIL).getTime() - 1_000);
const VALIDITY_LABEL = `Válida hasta el ${validityFormatter.format(validityEndInclusive)} inclusive`;

type Proposal = {
  slug: string;
  name: string;
  month: string;
  group: string;
};

export const RETREAT_PROPOSALS: Record<string, Proposal> = {
  cande: {
    slug: 'cande',
    name: 'Cande',
    month: 'Febrero 2027',
    group: '15 a 20 personas',
  },
  'barbi-firmapaz': {
    slug: 'barbi-firmapaz',
    name: 'Barbi Firmapaz',
    month: 'Marzo 2027',
    group: '15 a 30 personas',
  },
};

const INCLUDED = [
  'Habitaciones compartidas en el eco-refugio premium y domos geodésicos',
  'Ropa blanca, toallas y biocosmética en todos los baños',
  'Uso completo del predio y los espacios comunes',
  'Coordinación general y equipo anfitrión durante toda la experiencia',
  'Todas las actividades y dinámicas acordadas dentro de la propuesta',
  'Seguro de responsabilidad civil y accidentes personales',
];

const MEALS = ['2 desayunos', '2 almuerzos', '2 cenas', 'Brunch permanente'];

const EXTRA_EXPERIENCES = [
  'Yoga y consciencia corporal',
  'Armonizaciones sonoras',
  'Constelaciones familiares',
  'Trekking guiado',
  'Ceremonia de Temazcal',
  'Otras ceremonias ancestrales',
];

const ValidityNotice: React.FC = () => {
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>('header');
    if (!header) return;

    const updateOffset = () => setHeaderHeight(header.getBoundingClientRect().height);
    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(header);
    window.addEventListener('resize', updateOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateOffset);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 z-[950] px-4" style={{ top: headerHeight }}>
      <div className="mx-auto flex max-w-6xl justify-center md:justify-end">
        <p className="pointer-events-auto inline-flex items-center gap-2 rounded-b-xl border border-t-0 border-white/20 bg-[#003D27]/95 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-lg backdrop-blur-md md:text-xs">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" style={{ color: COLORS.gold }} aria-hidden="true" />
          {VALIDITY_LABEL}
        </p>
      </div>
    </div>
  );
};

function usePrivateProposalMeta(proposal: Proposal) {
  useEffect(() => {
    document.title = `Propuesta para ${proposal.name} · Pueblo Mágico`;
    document.querySelectorAll('link[rel="canonical"], meta[property^="og:"], meta[name^="twitter:"], script[type="application/ld+json"]').forEach((node) => node.remove());

    const setMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    setMeta('robots', 'noindex, nofollow, noarchive, nosnippet');
    setMeta('googlebot', 'noindex, nofollow, noarchive, nosnippet');
    setMeta('referrer', 'no-referrer');
    document.querySelector('meta[name="description"]')?.remove();
  }, [proposal]);
}

const PresupuestoRetiroPage: React.FC<{ proposal: Proposal }> = ({ proposal }) => {
  usePrivateProposalMeta(proposal);

  const whatsappHref = useMemo(() => {
    const message = encodeURIComponent(`Hola Pueblo Mágico, soy ${proposal.name}. Quiero conversar sobre la propuesta de retiro de ${proposal.month}.`);
    return `https://wa.me/${WA_MAGICO}?text=${message}`;
  }, [proposal]);

  const price = new Intl.NumberFormat('es-AR').format(300000);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: COLORS.cream, color: COLORS.brown }}>
      <Header autoSubNavigation={false} />
      <ValidityNotice />
      <main>
        <section className="relative flex min-h-[100svh] items-end overflow-hidden pb-14 pt-36 md:pb-24 md:pt-44">
          <img src={img('/uploads/dji_0074.webp', 1800)} alt="Vista aérea de Pueblo Mágico en Los Gigantes" className="absolute inset-0 h-full w-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/15" />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 md:px-12">
            <div className="max-w-4xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/90 backdrop-blur-sm">
                <MapPin size={14} aria-hidden="true" /> Pueblo Mágico · Los Gigantes
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: COLORS.gold }}>Tu propuesta integral en la montaña</p>
              <h1 className="serif-title mt-4 text-4xl leading-[1.02] text-white sm:text-5xl md:text-6xl lg:text-7xl">
                {proposal.name}, esta experiencia <span className="block" style={{ color: COLORS.gold }}>fue pensada para vos y tu grupo.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:text-xl">
                Queremos que puedas enfocarte en lo esencial: facilitar, compartir y vivir un encuentro all inclusive de 2 noches y 3 días que integra naturaleza, aventura y profundidad. Nosotros nos ocupamos del resto.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-gold btn-icon-inline max-w-full text-[11px] font-semibold sm:text-sm">
                  Conversar sobre la propuesta <ArrowRight size={18} aria-hidden="true" />
                </a>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/75">
                  <span>{proposal.group}</span><span>{proposal.month}</span><span>All inclusive</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: COLORS.terra }}>El espíritu de la experiencia</p>
              <h2 className="serif-title mt-5 text-4xl leading-tight md:text-6xl" style={{ color: COLORS.green }}>Todo resuelto para poder estar presentes.</h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed md:text-lg" style={{ color: COLORS.muted }}>
              <p>Esta propuesta está pensada para personas que buscan ir un paso más allá: integrar lo vivido, fortalecer vínculos y habitar la montaña desde un lugar más consciente.</p>
              <p>Nos ocupamos del alojamiento, la alimentación, los espacios, la coordinación y el cuidado del grupo, para que vos y tu equipo puedan enfocarse en disfrutar, compartir y facilitar una experiencia significativa.</p>
              <div className="rounded-2xl border-l-4 px-6 py-5" style={{ backgroundColor: '#F6F3EA', borderColor: COLORS.gold }}>
                <p className="serif-title text-2xl leading-snug" style={{ color: COLORS.darkGreen }}>Naturaleza, profundidad y comunidad, con cada detalle cuidado.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 md:py-28" style={{ backgroundColor: COLORS.sand }}>
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: COLORS.terra }}>Formato propuesto</p>
              <h2 className="serif-title mt-4 text-4xl leading-tight md:text-6xl" style={{ color: COLORS.green }}>2 noches / 3 días · All inclusive</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <article className="rounded-3xl bg-white p-7 shadow-sm md:p-10">
                <div className="grid gap-5 sm:grid-cols-3">
                  {[
                    { Icon: Users, label: 'Grupo estimado', value: proposal.group },
                    { Icon: CalendarDays, label: 'Fecha prevista', value: proposal.month },
                    { Icon: BedDouble, label: 'Duración', value: '2 noches / 3 días' },
                  ].map(({ Icon, label, value }) => (
                    <div key={label} className="rounded-2xl p-5" style={{ backgroundColor: COLORS.cream }}>
                      <Icon size={21} style={{ color: COLORS.green }} aria-hidden="true" />
                      <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: COLORS.muted }}>{label}</p>
                      <p className="mt-2 font-semibold" style={{ color: COLORS.brown }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-7 rounded-2xl px-6 py-7 text-white" style={{ backgroundColor: COLORS.green }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">Inversión por persona</p>
                  <div className="mt-3 flex flex-wrap items-end gap-3"><strong className="serif-title text-5xl">$ {price}</strong><span className="pb-1 text-sm text-white/65">ARS</span></div>
                  <p className="mt-3 text-sm text-white/70">Alojamiento + pensión completa + experiencia integral</p>
                </div>
              </article>

              <article className="rounded-3xl border bg-white p-7 shadow-sm md:p-10" style={{ borderColor: 'rgba(0,83,51,0.14)' }}>
                <div className="flex items-center gap-3"><ChefHat size={23} style={{ color: COLORS.gold }} aria-hidden="true" /><h3 className="serif-title text-3xl" style={{ color: COLORS.green }}>Alimentación incluida</h3></div>
                <ul className="mt-7 grid grid-cols-2 gap-3">
                  {MEALS.map((meal) => <li key={meal} className="flex items-center gap-2 text-sm" style={{ color: COLORS.muted }}><Check size={17} style={{ color: COLORS.green }} aria-hidden="true" />{meal}</li>)}
                </ul>
                <p className="mt-7 border-t pt-6 text-sm leading-relaxed" style={{ borderColor: 'rgba(0,83,51,0.12)', color: COLORS.muted }}>Cocina casera, abundante y equilibrada, adaptada al retiro. Contemplamos restricciones alimentarias informadas previamente.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
            <div className="grid grid-cols-2 gap-3">
              <img src={img('/uploads/refu.webp', 900)} alt="Eco-refugio de Pueblo Mágico" className="col-span-2 h-72 w-full rounded-3xl object-cover" loading="lazy" />
              <img src={img('/uploads/domos_2.jpg', 700)} alt="Domos geodésicos" className="h-44 w-full rounded-2xl object-cover" loading="lazy" />
              <img src={img('/uploads/469280911_444096748740233_2818770490495002077_n.webp', 700)} alt="Espacio para prácticas grupales" className="h-44 w-full rounded-2xl object-cover" loading="lazy" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: COLORS.terra }}>Alojamiento y espacios</p>
              <h2 className="serif-title mt-5 text-4xl leading-tight md:text-6xl" style={{ color: COLORS.green }}>La montaña también forma parte del retiro.</h2>
              <p className="mt-6 text-base leading-relaxed md:text-lg" style={{ color: COLORS.muted }}>El grupo se aloja en habitaciones compartidas del eco-refugio premium y domos geodésicos compartidos, con confort, calidez y contacto directo con el paisaje.</p>
              <div className="mt-8 grid gap-3">
                {INCLUDED.map((item) => <div key={item} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: COLORS.cream }}><Check size={18} className="mt-0.5 shrink-0" style={{ color: COLORS.green }} aria-hidden="true" /><span className="text-sm leading-relaxed" style={{ color: COLORS.brown }}>{item}</span></div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 text-white md:py-28" style={{ backgroundColor: COLORS.green }}>
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: COLORS.gold }}>Experiencias adicionales</p>
              <h2 className="serif-title mt-4 text-4xl leading-tight md:text-6xl">Sumemos lo que resuene con el propósito del grupo.</h2>
              <p className="mt-5 text-base leading-relaxed text-white/65">Trabajamos con una red de facilitadores y facilitadoras. Estas experiencias se cotizan por separado según formato, grupo y disponibilidad.</p>
            </div>
            <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {EXTRA_EXPERIENCES.map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] px-5 py-4 text-sm"><Sparkles size={16} className="shrink-0" style={{ color: COLORS.gold }} aria-hidden="true" />{item}</div>)}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-5 py-28 text-center text-white md:py-40">
          <img src={img('/uploads/img_6948.webp', 1600)} alt="Paisaje de montaña en Pueblo Mágico" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,61,39,0.86)' }} />
          <div className="relative z-10 mx-auto max-w-3xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10"><HeartHandshake size={25} style={{ color: COLORS.gold }} aria-hidden="true" /></div>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.28em]" style={{ color: COLORS.gold }}>{proposal.name}, esta propuesta fue pensada para tu grupo</p>
            <h2 className="serif-title mt-4 text-4xl leading-tight md:text-6xl">Conversemos y terminemos de co-diseñar la experiencia.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/65">Podemos ajustar actividades, dinámicas y detalles según el propósito del encuentro. La fecha se reserva una vez acordadas las condiciones y acreditada la seña.</p>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-gold btn-icon-inline mt-9 max-w-full text-[11px] font-semibold sm:text-sm">Hablar con Pueblo Mágico <ArrowRight size={18} aria-hidden="true" /></a>
            <div className="mx-auto mt-8 flex max-w-xl items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.07] p-5 text-left">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: COLORS.gold }} aria-hidden="true" />
              <p className="text-xs leading-relaxed text-white/60">Propuesta personalizada y no indexada. {VALIDITY_LABEL}.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
      <CookieBanner />
    </div>
  );
};

const PresupuestoRetiro: React.FC = () => {
  const { proposalId = '' } = useParams();
  const proposal = RETREAT_PROPOSALS[proposalId];
  if (!proposal) return <Navigate to="/organiza-tu-retiro" replace />;
  return <PresupuestoRetiroPage proposal={proposal} />;
};

export default PresupuestoRetiro;
