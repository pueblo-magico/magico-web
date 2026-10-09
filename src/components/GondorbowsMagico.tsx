import React from 'react';
import { WA_GONDOR } from '../data/config';

const BENEFICIOS = [
  { label: 'Regeneración activa', desc: '+25.000 árboles nativos plantados transforman el aire que respirás' },
  { label: 'Comunidad real',      desc: '25 años de coherencia manifestando el propósito' },
  { label: 'Energía solar',       desc: 'Casi el 100% de la energía viene del sol' },
];

const GondorbowsMagico: React.FC = () => {
  const consultLink =
    'https://wa.me/' + WA_GONDOR + '?text=' +
    encodeURIComponent('¡Hola Fausto! Estoy organizando mi viaje para el retiro de Gondorbows y quería consultar la ubicación y cómo llegar a Pueblo Mágico en Los Gigantes. ⛰️');

  return (
    <>
      {/* ── Pueblo Mágico: ubicación ── */}
      <section className="py-20 md:py-32 px-6 bg-brand text-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start">

            {/* Left: copy */}
            <div>
              <p className="text-gold text-[10px] tracking-[0.4em] uppercase font-bold mb-5">El lugar</p>
              <h2 className="text-4xl md:text-5xl serif-title text-white leading-[1.05] mb-6">
                Pueblo Mágico
              </h2>
              <p className="text-white/70 text-base md:text-lg leading-relaxed mb-10" style={{ maxWidth: '44ch' }}>
                En el corazón de <span className="text-gold font-semibold">Los Gigantes, Córdoba</span>, a 1 h de Tanti y 1:30 h de Villa Carlos Paz. La montaña habla en silencio; la comunidad que te acompaña lo dice todo.
                Acceso para todo tipo de vehículos hasta la puerta.
              </p>

              <div className="space-y-6 mb-10">
                {BENEFICIOS.map(({ label, desc }) => (
                  <div key={label} className="flex items-start gap-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0 mt-2" />
                    <div>
                      <p className="text-white font-semibold text-sm">{label}</p>
                      <p className="text-white/55 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a href="/reforestacion" className="block text-white/45 text-xs md:text-sm italic leading-relaxed underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold" style={{ maxWidth: '40ch' }}>
                El 10% de tu inversión se destina a reforestar los tabaquillos y restaurar las sierras de Los Gigantes.
              </a>
            </div>

            {/* Right: video */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-[280px]">
                <div className="absolute -inset-3 rounded-2xl border border-gold/20 rotate-3 transition-transform duration-700 hover:rotate-6 pointer-events-none" />
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
              <a href="/uploads/mapa_magico.webp" download="Mapa_Gondorbows_Los_Gigantes.webp" className="btn-glass w-full sm:w-auto text-center">
                Descargar Mapa
              </a>
              <a href={consultLink} className="btn-gold w-full sm:w-auto text-center">
                Consultar ubicación
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── El arte detrás de tu arco ── */}
      <section className="py-20 md:py-28 px-6 bg-[#F8F6F1]">
        <div className="max-w-5xl mx-auto">
          <p className="text-gold text-[10px] tracking-[0.4em] uppercase font-bold text-center mb-5">El proceso</p>
          <h2 className="text-3xl md:text-4xl serif-title text-brand text-center mb-5 leading-tight">
            El arte detrás de tu arco
          </h2>
          <p className="text-gray-500 text-sm md:text-base text-center mb-12 max-w-2xl mx-auto leading-relaxed">
            Cómo trabajamos la madera respetando su veta natural, el alineamiento por calor y el tillerizado fino.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-7">
            {[
              'https://www.youtube-nocookie.com/embed/o3m_A68JC0M',
              'https://www.youtube-nocookie.com/embed/JtkYFlsBEW8',
              'https://www.youtube-nocookie.com/embed/rkgQ2e-gEco',
            ].map((src) => (
              <div key={src} className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                  <iframe
                    src={src}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                    className="absolute top-0 left-0 w-full h-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default GondorbowsMagico;
