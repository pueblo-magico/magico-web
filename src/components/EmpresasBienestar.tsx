import React, { useState } from 'react';
import {
  Flower2, Brain, Footprints, PersonStanding, Sparkles, Network, Wind,
  Music, MessagesSquare, Users, Compass, Sprout, Sun, MessageCircle, ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { WA_MAGICO } from '../data/config';

// Íconos por nombre: el campo `icon` de cada práctica en data.json (empresas.bienestar.items)
const PRACTICE_ICONS: Record<string, React.ElementType> = {
  users: Users, compass: Compass, brain: Brain, footprints: Footprints, sprout: Sprout,
  flower: Flower2, person: PersonStanding, wind: Wind, messages: MessagesSquare,
  music: Music, sun: Sun, network: Network, sparkles: Sparkles,
};

// Prácticas visibles antes de "Ver todas"
const INITIAL_VISIBLE = 6;

const EmpresasBienestar: React.FC = () => {
  const { t } = useLanguage();
  const b = t.empresas.bienestar;
  const [expanded, setExpanded] = useState(false);
  const waLink = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(b.wa_query)}`;
  const items = expanded ? b.items : b.items.slice(0, INITIAL_VISIBLE);

  return (
    <section className="py-16 md:py-28 px-6 bg-[#FAF9F5]">
      <div className="max-w-6xl mx-auto">
        <div data-reveal>
          <div className="max-w-3xl mb-12 md:mb-16">
            <p className="font-medium uppercase tracking-[0.2em] text-[11px] text-[#D4AF37] mb-4">{b.tag}</p>
            <h2 className="text-3xl md:text-5xl serif-title brand-green mb-6" style={{ lineHeight: '1.1' }}>{b.title}</h2>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed font-light mb-4">{b.intro}</p>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed font-light">{b.custom}</p>
          </div>
        </div>

        <div data-reveal data-delay="1">
          <p className="font-bold brand-green text-sm uppercase tracking-widest mb-6">{b.list_title}</p>
          <div id="empresas-practicas" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item: any) => {
              const Icon = PRACTICE_ICONS[item.icon] || Sparkles;
              return (
                <div key={item.title} className="bg-white rounded-2xl border border-[#E8E4D9] p-6 flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-[#005333]/[0.06] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#005333]" strokeWidth={1.6} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold brand-green text-base mb-1.5">{item.title}</h3>
                    <p className="text-gray-500 text-sm font-light leading-relaxed">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {b.items.length > INITIAL_VISIBLE && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                aria-expanded={expanded}
                aria-controls="empresas-practicas"
                className="inline-flex items-center gap-2 rounded-full border border-[#005333]/20 px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#005333] transition-colors hover:border-[#005333] hover:bg-[#005333] hover:text-white"
              >
                {expanded ? b.show_less : `${b.show_all} (${b.items.length})`}
                <ChevronDown size={16} className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <div data-reveal data-delay="2">
          <div className="mt-12 md:mt-14 text-center">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold btn-icon-inline !inline-flex !max-w-full !whitespace-normal text-center !leading-snug"
            >
              <MessageCircle size={18} className="shrink-0" aria-hidden="true" />
              {b.cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmpresasBienestar;
