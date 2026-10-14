import React from 'react';
import { RESERVATION_START_PATH } from '../data/config';

const AchalaVivaHero: React.FC = () => {
  return (
    <section id="heroSec" className="relative w-full h-screen overflow-hidden flex flex-col justify-center items-center group">
      <style>{`
        @keyframes hero-zoom {
          from { transform: scale(1.08); }
          to   { transform: scale(1.18); }
        }
        .hero-img-zoom {
          animation: hero-zoom 16s ease-out forwards;
          will-change: transform;
        }
      `}</style>

      {/* Background Image — Ken Burns entrada */}
      <div className="absolute inset-0 z-[0]">
        <img
          src="/uploads/img_6948.webp"
          alt="Achala Viva — Los Gigantes, Córdoba"
          {...{ fetchpriority: 'high' }}
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover hero-img-zoom"
        />
      </div>

      {/* Gradiente oscuro que se acentúa en hover para mejorar la legibilidad de los textos */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#002B18]/88 via-[#004229]/35 to-black/15 z-[1] transition-all duration-700 group-hover:from-[#001f11]/95 group-hover:via-[#00301e]/60 group-hover:to-black/40"></div>

      {/* Content */}
      <div className="relative z-[2] text-center px-4 max-w-4xl mx-auto flex flex-col items-center justify-center h-full pt-8">

        {/* Pre-título */}
        <p className="text-gold font-medium tracking-[0.28em] text-[11px] sm:text-xs uppercase mb-7">
          Próximas fechas a confirmar &nbsp;·&nbsp; Los Gigantes, Córdoba
        </p>

        {/* Título partido en dos líneas de jerarquía distinta */}
        <h1 className="serif-title text-white font-light leading-[1.0] mb-3">
          <span className="block text-5xl sm:text-6xl md:text-7xl tracking-tight">Achala Viva</span>
          <span className="block text-base sm:text-lg md:text-xl tracking-[0.35em] uppercase text-white/60 mt-3 font-sans font-light">
            Tierra &nbsp;·&nbsp; Cielo &nbsp;·&nbsp; Vida Silvestre
          </span>
        </h1>

        <p className="text-sm sm:text-base text-white/80 font-light max-w-xl mx-auto mt-8 mb-10 leading-relaxed">
          Un fin de semana de inmersión total en la Sierra. Aprendé a leer las estrellas, entendé la montaña y recuperá tu capacidad de asombro con guía biológica experta.
        </p>

        {/* CTAs */}
        <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center items-center w-full mb-8">
          <a href={RESERVATION_START_PATH} className="btn-gold inline-flex items-center justify-center">
            Quiero asegurar mi lugar
          </a>
          <a href="#experiencia" className="btn-glass inline-flex items-center justify-center">
            Ver detalles
          </a>
        </div>

        <span className="text-white/45 text-[10px] tracking-[0.25em] uppercase font-light">
          Solo 15 plazas disponibles
        </span>
      </div>
    </section>
  );
};

export default AchalaVivaHero;
