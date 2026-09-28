import React from 'react';
import { HorizontalCardRail } from '../../components/HorizontalCardRail';

const VueloDelCondorTestimonios: React.FC = () => {
  return (
    <section className="py-20 md:py-28 px-6 bg-[#F4F3EF]">
      <div className="max-w-5xl mx-auto">

        {/* Video Testimonials (YouTube Shorts) */}
        <div className="">
          <div className="text-center mb-10" data-reveal>
            <p className="text-[10px] tracking-[0.35em] uppercase text-brand-gold mb-4">Experiencias en video</p>
            <h2 className="text-3xl md:text-4xl serif-title brand-green">Voces del Camino</h2>
            <p className="text-gray-400 text-sm md:text-base font-light mt-3 max-w-xl mx-auto">
              Escuchá los relatos de quienes ya recorrieron el Valle Sagrado con nosotros.
            </p>
          </div>
          
          <HorizontalCardRail previousLabel="Testimonio anterior" nextLabel="Testimonio siguiente" desktopGridClassName="md:grid-cols-3 lg:grid-cols-5" mobileItemClassName="w-[72vw]" gapClassName="gap-4">
            {[
              "xyNHRu_6_FA",
              "XkX8N6mrwdE",
              "-UKDsZbUoTE",
              "TIRMapTAo0k",
              "1mKkxzO8vWM"
            ].map((id, idx) => (
              <div 
                key={id} 
                className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-lg bg-black border border-white/5"
                data-reveal
                data-delay={String(idx + 1)}
              >
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${id}`}
                  title={`Testimonio El Vuelo del Cóndor ${idx + 1}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            ))}
          </HorizontalCardRail>
        </div>

      </div>
    </section>
  );
};

export default VueloDelCondorTestimonios;
