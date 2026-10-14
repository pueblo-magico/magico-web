import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { RESERVATION_START_PATH } from '../data/config';

const FamilionHero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="heroSec" className="relative w-full h-screen overflow-hidden flex flex-col justify-center items-center group">
      
      {/* Background Video */}
      <div className="absolute inset-0 z-[0] w-full h-full overflow-hidden pointer-events-none bg-black">
        <iframe
          src="https://www.youtube-nocookie.com/embed/SlTNlO0Smog?autoplay=1&mute=1&loop=1&playlist=SlTNlO0Smog&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
          className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          title="Video de fondo — Familion"
          allow="autoplay; encrypted-media"
          frameBorder="0"
        ></iframe>
      </div>

      {/* Gradiente oscuro */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#002B18]/88 via-[#004229]/35 to-black/15 z-[1] transition-all duration-700 group-hover:from-[#001f11]/95 group-hover:via-[#00301e]/60 group-hover:to-black/40"></div>

      {/* Content */}
      <div className="relative z-[2] text-center px-4 max-w-4xl mx-auto flex flex-col items-center justify-center h-full pt-8">

        {/* Pre-título */}
        <p className="text-gold font-medium tracking-[0.22em] text-[10px] sm:text-xs uppercase mb-7 text-center">
          {t.familion.hero.dates}
        </p>

        {/* Título */}
        <h1 className="serif-title text-white font-light leading-[1.0] mb-3">
          <span className="block text-5xl sm:text-6xl md:text-7xl tracking-tight">{t.familion.hero.title}</span>
          <span className="block text-sm sm:text-base md:text-lg tracking-[0.2em] sm:tracking-[0.35em] uppercase text-white/60 mt-3 font-sans font-light">
            {t.familion.hero.subtitle}
          </span>
        </h1>

        <p className="text-sm sm:text-base text-white/80 font-light max-w-xl mx-auto mt-8 mb-10 leading-relaxed">
          {t.familion.hero.description}
        </p>

        {/* CTAs */}
        <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center items-center w-full mb-8">
          <a href={RESERVATION_START_PATH} className="btn-gold inline-flex items-center justify-center">
            {t.familion.hero.cta_join}
          </a>
          <a href="/#eventos" className="btn-glass inline-flex items-center justify-center">
            {t.familion.hero.cta_details}
          </a>
        </div>
      </div>
    </section>
  );
};

export default FamilionHero;
