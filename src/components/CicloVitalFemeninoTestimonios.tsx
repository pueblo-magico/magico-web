import React from 'react';
import { HorizontalCardRail } from '../../components/HorizontalCardRail';

const TESTIMONIOS = [
  {
    text: 'Me sentí parte de la vida de la montaña, como en casa. Un refugio de paz inigualable.',
    name: 'Sofía R.',
    rol: 'Viajera',
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
  },
  {
    text: 'Una experiencia transformadora. La comida consciente y los espacios son de otro mundo.',
    name: 'Marcos D.',
    rol: 'Huésped',
    image: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    text: 'Lo más importante: el amor y la entrega de todo el equipo, y la capacidad de sentirte uno con la naturaleza.',
    name: 'Julieta C.',
    rol: 'Facilitadora',
    image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg',
  },
];

const CicloVitalFemeninoTestimonios: React.FC = () => {
  return (
    <section className="py-20 md:py-28 px-6 bg-[#F8F6F1]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14" data-reveal>
          <p className="text-[#AA3E11] text-[10px] tracking-[0.4em] uppercase font-bold mb-5">Voces de la montaña</p>
          <h2 className="text-3xl md:text-5xl serif-title text-brand leading-tight mb-6">
            Lo que dicen quienes ya vivieron Pueblo Mágico
          </h2>
          <a
            href="https://maps.app.goo.gl/4c1nrpBbQf5hYrsE9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-brand/20 rounded-full px-4 py-1.5 hover:bg-brand/5 transition-colors"
          >
            <span className="text-[#D4AF37] text-sm">★★★★★</span>
            <span className="text-brand/70 text-xs font-semibold">5.0 · 64 reseñas en Google Maps</span>
          </a>
        </div>

        <HorizontalCardRail previousLabel="Testimonio anterior" nextLabel="Testimonio siguiente" desktopGridClassName="md:grid-cols-3" gapClassName="gap-6">
          {TESTIMONIOS.map((t, i) => (
            <div
              key={t.name}
              className="h-full bg-white rounded-2xl p-6 md:p-7"
              style={{ boxShadow: '0 12px 40px rgba(0,83,51,0.06)' }}
              data-reveal
              data-delay={String(i + 1)}
            >
              <p className="text-gray-600 italic text-sm leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <img src={t.image} alt={t.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" loading="lazy" />
                <div>
                  <p className="font-bold text-sm text-brand">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.rol}</p>
                </div>
              </div>
            </div>
          ))}
        </HorizontalCardRail>
      </div>
    </section>
  );
};

export default CicloVitalFemeninoTestimonios;
