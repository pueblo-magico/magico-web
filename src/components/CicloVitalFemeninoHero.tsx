import React, { useState, useEffect } from 'react';
import { RESERVATION_START_PATH } from '../data/config';
import { RETREATS_DATA } from '../data/retreats';

const CicloVitalFemeninoHero: React.FC = () => {
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVideoLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="heroSec" className="relative w-full h-screen overflow-hidden flex flex-col justify-center items-center">

      {/* ── Fondo: video del encuentro ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#0B0F17]">
        {videoLoaded && (
          <iframe
            src="https://www.youtube-nocookie.com/embed/g0F3jwDOi4E?autoplay=1&mute=1&controls=0&loop=1&playlist=g0F3jwDOi4E&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&playsinline=1&showinfo=0&fs=0"
            title="Video de fondo — Ciclo Vital Femenino"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            className="pointer-events-none absolute"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) scale(1.8)',
              width: '177.78vh',
              height: '100vh',
              minWidth: '100vw',
            }}
          />
        )}
        <div className="absolute inset-0 z-[1]" style={{ pointerEvents: 'auto' }} />
      </div>

      {/* ── Overlays — cálidos, tono otoño-invierno en vez de negro puro ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2A0F06]/60 via-[#1a0906]/22 to-[#210a05]/65 z-[2]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent z-[3]" />

      {/* ── Content ── */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-full pt-12">

        {/* Badge — dos píldoras para que nunca se corte el texto */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3" data-reveal>
          <span className="px-4 py-1.5 rounded-full bg-gold text-white text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] shadow-xl whitespace-nowrap">
            {RETREATS_DATA.cicloVitalFemenino.dates}
          </span>
          <span className="hidden sm:inline text-white/40 text-xs">·</span>
          <span className="px-4 py-1.5 rounded-full bg-[#AA3E11] text-white text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] shadow-xl whitespace-nowrap">
            Los Gigantes, Córdoba
          </span>
        </div>

        {/* Titles */}
        <div className="mb-6" data-reveal data-delay="1">
          <p className="text-white/60 text-[11px] md:text-xs tracking-[0.4em] uppercase font-semibold mb-4">
            Ciclo Vital Femenino
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-7xl serif-title text-white leading-tight tracking-tight drop-shadow-2xl font-light">
            Capítulo Muerte<span className="text-gold">·</span>Invierno
          </h1>
        </div>

        {/* Description */}
        <p
          className="text-lg md:text-2xl text-white/85 font-serif italic max-w-xl mx-auto mb-10 leading-relaxed drop-shadow-sm"
          data-reveal data-delay="2"
        >
          Para transmutar todo lo que no ES.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center w-full" data-reveal data-delay="3">
          <a
            href={RESERVATION_START_PATH}
            className="btn-gold min-w-[220px] shadow-2xl shadow-gold/20"
          >
            Reservar mi lugar
          </a>
          <a href="#que-viviras" className="btn-glass min-w-[220px]">
            Ver la experiencia
          </a>
        </div>
      </div>

      {/* ── Location footer ── */}
      <div className="absolute bottom-14 left-0 right-0 flex justify-center z-10" data-reveal data-delay="4">
        <div className="flex items-center gap-3 text-white text-[10px] tracking-[0.4em] uppercase font-bold">
          <div className="w-10 h-px bg-white/40" />
          <span>Encuentro de Mujeres en Invierno</span>
          <div className="w-10 h-px bg-white/40" />
        </div>
      </div>

      {/* ── Bottom fade ── */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent z-[5]" />
    </section>
  );
};

export default CicloVitalFemeninoHero;
