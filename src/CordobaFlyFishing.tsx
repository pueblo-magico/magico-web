import React, { useEffect } from 'react';
import { LanguageProvider } from '../contexts/LanguageContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CheckCircle, WhatsappLogo } from '@phosphor-icons/react';
import { img } from './lib/img';
import { RESERVATION_START_PATH, WA_MAGICO, SITE_URL } from './data/config';
import { ROUTES } from './routes';

const WA = (msg: string) => `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(msg)}`;
const WA_INFO = WA("Hi! I'm interested in the Córdoba Fly Fishing Adventure. Could you tell me more?");
const WA_STAY = WA("Hi! I'd like to extend my Córdoba trip with 2 nights in the geodesic domes + guided fly fishing. Could you tell me more?");

const SPECIES = [
  {
    name: 'Rainbow Trout',
    image: '/uploads/flyfishing-rainbow-trout.jpg',
  },
  {
    name: 'Brook Trout',
    image: '/uploads/flyfishing-brook-trout.jpg',
  },
];

const EQUIPMENT = [
  { label: 'Rod', value: '3 or 4 weight fly rod' },
  { label: 'Lines', value: '(WF) Weight Forward floating line' },
  { label: 'Leader', value: '9 ft tapered leader, 3X' },
];

const CordobaFlyFishing: React.FC = () => {
  // SEO — title, meta, OG, canonical y JSON-LD para esta página
  useEffect(() => {
    const TITLE = 'Córdoba Fly Fishing Adventure | Pueblo Mágico';
    const DESC = 'Guided fly fishing for wild Rainbow and Brook trout in the crystal-clear mountain streams of Las Sierras de Córdoba. Full-day outings or a 2-night stay in geodesic domes.';
    const URL = SITE_URL + ROUTES.FLY_FISHING;
    const IMG = `${SITE_URL}/uploads/flyfishing-hero.jpg`;
    const prevTitle = document.title;

    document.title = TITLE;

    const setMeta = (sel: string, attr: string, val: string) => {
      let el = document.querySelector(sel) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
      el.setAttribute(attr, val);
    };
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
      el.setAttribute('href', href);
    };

    setMeta('meta[name="description"]', 'content', DESC);
    setMeta('meta[property="og:title"]', 'property', 'og:title');
    setMeta('meta[property="og:title"]', 'content', TITLE);
    setMeta('meta[property="og:description"]', 'property', 'og:description');
    setMeta('meta[property="og:description"]', 'content', DESC);
    setMeta('meta[property="og:image"]', 'property', 'og:image');
    setMeta('meta[property="og:image"]', 'content', IMG);
    setMeta('meta[property="og:url"]', 'property', 'og:url');
    setMeta('meta[property="og:url"]', 'content', URL);
    setMeta('meta[property="og:type"]', 'property', 'og:type');
    setMeta('meta[property="og:type"]', 'content', 'website');
    setLink('canonical', URL);

    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card');
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title');
    setMeta('meta[name="twitter:title"]', 'content', TITLE);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description');
    setMeta('meta[name="twitter:description"]', 'content', DESC);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image');
    setMeta('meta[name="twitter:image"]', 'content', IMG);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'TouristTrip',
      name: 'Córdoba Fly Fishing Adventure',
      description: DESC,
      touristType: 'Fly fishing anglers',
      provider: { '@type': 'Organization', name: 'Pointer Outfitters' },
      image: IMG,
      url: URL,
    };
    const ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    ldScript.id = 'ld-fly-fishing';
    ldScript.textContent = JSON.stringify(schema);
    if (!document.getElementById('ld-fly-fishing')) document.head.appendChild(ldScript);

    return () => {
      document.title = prevTitle;
      document.getElementById('ld-fly-fishing')?.remove();
    };
  }, []);

  // Scroll-reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <LanguageProvider>
      <>
        <Header />
        <div className="bg-white text-gray-800 overflow-x-hidden">

          {/* ====== HERO ====== */}
          <section className="relative h-[92vh] min-h-[600px] w-full flex items-end overflow-hidden">
            <img
              src={img('/uploads/flyfishing-hero.jpg', 1400)}
              alt="Releasing a wild trout in a Córdoba mountain stream"
              className="absolute inset-0 w-full h-full object-cover object-center"
              {...{ fetchpriority: 'high' }}
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1410]/92 via-[#0c1410]/35 to-transparent" />
            <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-16 md:pb-24">
              <p className="text-gold/80 text-[10px] uppercase tracking-[0.3em] font-bold mb-4">
                LAS SIERRAS DE CÓRDOBA · GUIDED FLY FISHING
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white leading-tight mb-5 drop-shadow-xl font-light max-w-3xl">
                Córdoba Fly<br />Fishing Adventure
              </h1>
              <p className="text-white/75 text-base font-light max-w-xl mb-8 leading-relaxed">
                Crystal-clear mountain streams, breathtaking scenery and wild Rainbow and Brook trout — one of Argentina's hidden gems for fly fishing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={WA_INFO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-gold text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-brand transition-[background-color,color] duration-300 shadow-lg"
                >
                  <WhatsappLogo className="w-4 h-4 flex-shrink-0" weight="fill" />
                  Plan my trip
                </a>
                <a
                  href="#adventures"
                  className="inline-flex items-center justify-center gap-2 border border-white/40 text-white/90 px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors duration-300"
                >
                  See the adventures
                </a>
              </div>
            </div>
          </section>

          {/* ====== INTRO ====== */}
          <section className="py-16 md:py-24 px-6 bg-white">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              <div data-reveal>
                <p className="font-medium uppercase tracking-[0.2em] text-[11px] brand-green mb-4">Córdoba Fly Fishing Adventure</p>
                <h2 className="text-3xl md:text-4xl serif-title brand-green mb-6" style={{ lineHeight: '1.15' }}>
                  Join us for an unforgettable fishing experience
                </h2>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed font-light mb-4">
                  The crystal-clear mountain streams, breathtaking scenery and wild Rainbow and Brook trout make Córdoba one of Argentina's hidden gems for fly fishing.
                </p>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed font-light">
                  Every adventure is tailored to your experience level, whether you're chasing technical mountain trout or learning to cast a fly rod for the first time.
                </p>
              </div>
              <div data-reveal data-delay="1">
                <img
                  src={img('/uploads/flyfishing-angler-backpack.jpg', 900)}
                  alt="Angler looking over a mountain stream in the Sierras de Córdoba"
                  loading="lazy"
                  className="w-full object-cover rounded-2xl h-auto aspect-[4/3] shadow-lg"
                />
              </div>
            </div>
          </section>

          {/* ====== THE EXPERIENCE ====== */}
          <section className="relative py-20 md:py-28 px-6 overflow-hidden">
            <img
              src={img('/uploads/flyfishing-casting-vertical.jpg', 1400)}
              alt="Angler casting a fly rod over a misty mountain stream"
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0c1410]/85 via-[#0c1410]/55 to-[#0c1410]/85" />
            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <p data-reveal className="text-gold/80 text-[10px] uppercase tracking-[0.3em] font-bold mb-4">The Experience</p>
              <p data-reveal data-delay="1" className="text-white text-xl md:text-2xl font-serif leading-relaxed mb-6">
                Learn to read the water, understand aquatic insects, improve your casting, choose the right fly and experience fly fishing in private and untouched mountain environments.
              </p>
              <p data-reveal data-delay="2" className="text-white/70 text-base md:text-lg font-light">
                Whether you're a beginner or an experienced angler, every outing is designed around your goals.
              </p>
            </div>
          </section>

          {/* ====== TARGET SPECIES ====== */}
          <section className="py-16 md:py-24 px-6 bg-[#FAF9F5]">
            <div className="max-w-5xl mx-auto">
              <h2 data-reveal className="text-4xl md:text-5xl serif-title brand-green text-center mb-14" style={{ lineHeight: '1.1' }}>
                Target Species
              </h2>
              <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
                {SPECIES.map((s, i) => (
                  <div key={s.name} data-reveal data-delay={String(i + 1)} className="relative rounded-2xl overflow-hidden shadow-lg group">
                    <img
                      src={img(s.image, 700)}
                      alt={s.name}
                      loading="lazy"
                      className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute bottom-4 left-4 bg-[#0c1410] text-white text-sm font-bold px-4 py-2 rounded-md">
                      {s.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ====== THE ADVENTURES ====== */}
          <section id="adventures" className="py-16 md:py-24 px-6 bg-white">
            <div className="max-w-5xl mx-auto">
              <div data-reveal className="mb-12 md:mb-16 text-center">
                <p className="font-medium uppercase tracking-[0.2em] text-[11px] brand-green mb-3">Two ways to fish Córdoba</p>
                <h2 className="text-4xl md:text-5xl serif-title brand-green" style={{ lineHeight: '1.1' }}>
                  The Adventures
                </h2>
              </div>

              {/* Extend Your Stay */}
              <div data-reveal data-delay="1" className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-16 md:mb-24">
                <div className="grid grid-cols-2 gap-3">
                  <img src={img('/uploads/flyfishing-domos-aereo.jpg', 700)} alt="Aerial view of the geodesic domes in the Sierras de Córdoba" loading="lazy" className="col-span-2 w-full aspect-[16/9] object-cover rounded-xl shadow-md" />
                  <img src={img('/uploads/flyfishing-refugio-exterior.jpg', 500)} alt="Stone refuge at sunset" loading="lazy" className="w-full aspect-square object-cover rounded-xl shadow-md" />
                  <img src={img('/uploads/flyfishing-refugio-interior.jpg', 500)} alt="Stone and timber lodge interior" loading="lazy" className="w-full aspect-square object-cover rounded-xl shadow-md" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl serif-title brand-green mb-4">Extend Your Stay</h3>
                  <p className="text-gray-600 text-base md:text-lg leading-relaxed font-light mb-6">
                    Add two nights to your Córdoba trip and experience the beauty of the Sierras from our unique geodesic domes. Enjoy a relaxed mountain escape combined with guided fly fishing in crystal-clear streams surrounded by breathtaking scenery.
                  </p>
                  <a href={WA_STAY} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-brand text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gold transition-colors">
                    <CheckCircle className="w-4 h-4" weight="bold" />
                    Ask about the domes
                  </a>
                </div>
              </div>

              {/* Full-Day Guided Fly Fishing */}
              <div data-reveal data-delay="2" className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                <div className="order-2 md:order-1">
                  <h3 className="text-2xl md:text-3xl serif-title brand-green mb-4">Full-Day Guided Fly Fishing</h3>
                  <p className="text-gray-600 text-base md:text-lg leading-relaxed font-light mb-6">
                    Looking for a day on the water? Join our guides for a full-day fly fishing adventure in the Sierras de Córdoba. Explore beautiful mountain streams, target wild trout, and enjoy a completely different side of Córdoba.
                  </p>
                  <a href={RESERVATION_START_PATH}
                    className="inline-flex items-center justify-center gap-2 bg-brand text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gold transition-colors">
                    <WhatsappLogo className="w-4 h-4" weight="fill" />
                    Book a full day
                  </a>
                </div>
                <div className="order-1 md:order-2">
                  <img
                    src={img('/uploads/flyfishing-casting-landscape.jpg', 900)}
                    alt="Guide casting into a mountain pool in the Sierras de Córdoba"
                    loading="lazy"
                    className="w-full object-cover rounded-2xl h-auto aspect-[4/3] shadow-lg"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ====== THE EQUIPMENT ====== */}
          <section className="py-16 md:py-24 px-6 bg-[#FAF9F5]">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              <div data-reveal>
                <h2 className="text-3xl md:text-4xl serif-title brand-green mb-5" style={{ lineHeight: '1.15' }}>
                  The Equipment
                </h2>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed font-light mb-6">
                  We'll provide the right equipment for your stay.
                </p>
                <ul className="space-y-3">
                  {EQUIPMENT.map(e => (
                    <li key={e.label} className="flex items-start gap-3 text-sm md:text-base text-gray-600">
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" weight="duotone" />
                      <span><strong className="text-brand font-semibold">{e.label}:</strong> {e.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div data-reveal data-delay="1" className="grid grid-cols-2 gap-3">
                <img src={img('/uploads/flyfishing-reel-fly.jpg', 500)} alt="Fly rod, reel and fly" loading="lazy" className="w-full aspect-[3/4] object-cover rounded-xl shadow-md" />
                <img src={img('/uploads/flyfishing-fly-box.jpg', 500)} alt="Fly box with a selection of flies" loading="lazy" className="w-full aspect-[3/4] object-cover rounded-xl shadow-md" />
              </div>
            </div>
          </section>

          {/* ====== CLOSING ====== */}
          <section className="relative py-24 md:py-32 px-6 overflow-hidden">
            <img
              src={img('/uploads/flyfishing-closing.jpg', 1400)}
              alt="Angler casting a fly rod, close up"
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-[#0c1410]/78" />
            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <p data-reveal className="text-gold/80 text-[10px] uppercase tracking-[0.3em] font-bold mb-4">Experience Córdoba From a Different Perspective</p>
              <p data-reveal data-delay="1" className="text-white text-lg md:text-xl font-light leading-relaxed mb-4">
                Whether you choose to extend your stay or spend a full day on the water, fly fishing in the Sierras offers the perfect opportunity to slow down, explore Córdoba's mountain landscapes, and discover its wild trout streams.
              </p>
              <p data-reveal data-delay="2" className="text-white/80 text-lg md:text-xl font-light leading-relaxed mb-9">
                Add a fly fishing adventure to your Córdoba trip and make the most of your time in Argentina.
              </p>
              <a data-reveal data-delay="3" href={WA_INFO} target="_blank" rel="noopener noreferrer" className="btn-gold inline-flex items-center gap-2">
                <WhatsappLogo className="w-4 h-4" weight="fill" />
                Plan my trip
              </a>
            </div>
          </section>

          <Footer />
        </div>

        {/* ====== STICKY CTA MÓVIL ====== */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#005333] uppercase tracking-widest truncate">Córdoba Fly Fishing</p>
            <p className="text-[11px] text-gray-400 truncate">Guided trips · Sierras de Córdoba</p>
          </div>
          <a
            href={WA_INFO}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold flex-shrink-0 whitespace-nowrap"
            style={{ padding: '0.5rem 1.1rem', fontSize: '0.78rem', borderRadius: '40px' }}
          >
            Inquire
          </a>
        </div>
        <div className="h-16 md:hidden" aria-hidden="true"></div>
      </>
    </LanguageProvider>
  );
};

export default CordobaFlyFishing;
