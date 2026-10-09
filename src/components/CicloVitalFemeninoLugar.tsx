import React from 'react';
import { WA_CICLO_VITAL_FEMENINO } from '../data/config';
import { ROUTES } from '../routes';

const BENEFICIOS = [
  { label: 'Regeneración activa', desc: '+25.000 árboles nativos plantados transforman el aire que respirás' },
  { label: 'Comunidad real', desc: '25 años de coherencia manifestando el propósito' },
  { label: 'Energía solar', desc: 'Casi el 100% de la energía viene del sol' },
];

const CicloVitalFemeninoLugar: React.FC = () => {
  const consultLink =
    'https://wa.me/' + WA_CICLO_VITAL_FEMENINO + '?text=' +
    encodeURIComponent('¡Hola! Estoy organizando mi viaje para el retiro Ciclo Vital Femenino y quería consultar la ubicación y cómo llegar a Pueblo Mágico en Los Gigantes. ⛰️');

  return (
    <section className="py-20 md:py-32 px-6 bg-brand text-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start">

          {/* Copy + beneficios */}
          <div data-reveal>
            <p className="text-[#AA3E11] text-[10px] tracking-[0.4em] uppercase font-bold mb-5">El lugar</p>
            <h2 className="text-4xl md:text-5xl serif-title text-white leading-[1.05] mb-6">
              Pueblo Mágico
            </h2>
            <p className="text-white/70 text-base md:text-lg leading-relaxed mb-10" style={{ maxWidth: '44ch' }}>
              En el corazón de <span className="text-[#E88A5C] font-semibold">Los Gigantes, Córdoba</span>, a 1800 msnm. La montaña habla en silencio; la comunidad que te acompaña lo dice todo. Acceso para todo tipo de vehículos hasta la puerta.
            </p>

            <div className="space-y-6 mb-10">
              {BENEFICIOS.map(({ label, desc }) => (
                <div key={label} className="flex items-start gap-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E88A5C] flex-shrink-0 mt-2" />
                  <div>
                    <p className="text-white font-semibold text-sm">{label}</p>
                    <p className="text-white/55 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href={ROUTES.ESTADIA}
              className="inline-block border border-white/30 text-white rounded-full px-7 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-brand transition-colors duration-300"
            >
              Conocé el lugar →
            </a>
          </div>

          {/* Video vertical */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-[280px]">
              <div className="absolute -inset-3 rounded-2xl border border-[#E88A5C]/25 rotate-3 transition-transform duration-700 hover:rotate-6 pointer-events-none" />
              <div className="absolute -inset-3 rounded-2xl border border-white/8 -rotate-3 transition-transform duration-700 hover:-rotate-6 pointer-events-none" />
              <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-black">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube-nocookie.com/embed/hxE7Ksy7IsY?autoplay=1&mute=1&loop=1&playlist=hxE7Ksy7IsY"
                  title="Pueblo Mágico — La montaña"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="mt-16 md:mt-20">
          <div
            className="relative cursor-zoom-in"
            onClick={() => window.open('/uploads/mapa_magico.webp', '_blank')}
          >
            <img
              src="/uploads/mapa_magico.webp"
              alt="Mapa — Los Gigantes, Córdoba"
              loading="lazy"
              className="w-full rounded-2xl opacity-90 hover:opacity-100 transition-opacity duration-300"
            />
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/uploads/mapa_magico.webp" download="Mapa_CicloVitalFemenino_Los_Gigantes.webp" className="btn-glass w-full sm:w-auto text-center">
              Descargar Mapa
            </a>
            <a href={consultLink} target="_blank" rel="noopener noreferrer" className="btn-gold w-full sm:w-auto text-center">
              Consultar ubicación
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CicloVitalFemeninoLugar;
