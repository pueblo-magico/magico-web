import React, { useState, useEffect } from 'react';
import { RESERVATION_START_PATH } from '../data/config';
import { RETREATS_DATA } from '../data/retreats';

const GondorbowsHero: React.FC = () => {
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVideoLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="heroSec" className="relative w-full h-screen overflow-hidden flex flex-col justify-center items-center">

      {/* ── Video background ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#001A0E]">
        {videoLoaded && (
          <iframe
            src="https://www.youtube-nocookie.com/embed/Kd1RCM1LcmI?autoplay=1&mute=1&controls=0&loop=1&playlist=Kd1RCM1LcmI&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&playsinline=1&showinfo=0&fs=0"
            title="Video de fondo — Gondorbows"
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

        {/*
          Transparent interceptor: sits above the iframe and captures all
          pointer events, preventing YouTube's hover/play/replay overlays
          from ever activating.
        */}
        <div className="absolute inset-0 z-[1]" style={{ pointerEvents: 'auto' }} />
      </div>

      {/* ── Overlays ── */}
      <div className="absolute inset-0 bg-black/35 z-[2]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 z-[3]" />

      {/* ── Content ── */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex flex-col items-center justify-center h-full pt-12">

        {/* Badge */}
        <div className="mb-5" data-reveal>
          <span className="px-4 py-1.5 rounded-full bg-gold text-white text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] shadow-xl">
            {RETREATS_DATA.gondorbows.dates} · Los Gigantes, Córdoba
          </span>
        </div>

        {/* Titles */}
        <div className="mb-8" data-reveal data-delay="1">
          <h1 className="text-5xl sm:text-6xl md:text-8xl serif-title text-white leading-tight mb-4 tracking-tight drop-shadow-2xl font-light">
            Despertá tu instinto.
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl text-white font-serif mt-2 tracking-wide drop-shadow-lg opacity-90">
            Arquería Ancestral · Gondor Bows
          </p>
        </div>

        {/* Description */}
        <p
          className="text-base md:text-lg text-white/80 font-light max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-sm"
          data-reveal data-delay="2"
        >
          Construí tu propio arco en 3 días de inmersión total en la montaña.
          Oficio ancestral, todo incluido. Sin experiencia previa necesaria.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center w-full" data-reveal data-delay="3">
          <a
            href={RESERVATION_START_PATH}
            className="btn-gold min-w-[220px] shadow-2xl shadow-gold/20"
          >
            Quiero reservar mi lugar
          </a>
          <a href="#comodidad" className="btn-glass min-w-[220px]">
            Ver la experiencia
          </a>
        </div>
      </div>

      {/* ── Location footer ── */}
      <div className="absolute bottom-14 left-0 right-0 flex justify-center z-10" data-reveal data-delay="4">
        <div className="flex items-center gap-3 text-white text-[10px] tracking-[0.4em] uppercase font-bold">
          <div className="w-10 h-px bg-white/40" />
          <span>Los Gigantes · Córdoba · Argentina</span>
          <div className="w-10 h-px bg-white/40" />
        </div>
      </div>

      {/* ── Bottom fade ── */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent z-[5]" />
    </section>
  );
};

export default GondorbowsHero;
