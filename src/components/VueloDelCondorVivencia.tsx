import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Moon, Leaf, UsersThree, Sun, Target, 
  SpeakerHigh, Mountains, ForkKnife, EyeSlash 
} from '@phosphor-icons/react';

const VIVENCIA_ICONS = [
  Moon, Leaf, UsersThree, Sun, Target, 
  SpeakerHigh, Mountains, ForkKnife, EyeSlash
];

type VueloDelCondorVivenciaProps = {
  reveal?: boolean;
};

const VueloDelCondorVivencia: React.FC<VueloDelCondorVivenciaProps> = ({ reveal = true }) => {
  const { t } = useLanguage();

  return (
    <section className="py-20 md:py-32 px-6 bg-white relative">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl serif-title brand-green text-center mb-16 md:mb-24" data-reveal={reveal ? '' : undefined}>
          {t.vuelo_condor.vivencia.title}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-y-12 md:gap-y-20 gap-x-8 md:gap-x-12">
          {t.vuelo_condor.vivencia.items.map((item: any, i: number) => {
            const Icon = VIVENCIA_ICONS[i] || Target;
            return (
              <div 
                key={i} 
                className="flex flex-col items-center text-center group"
                data-reveal={reveal ? '' : undefined}
                data-delay={reveal ? String(i * 100) : undefined}
              >
                <div className="mb-6 relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-slate-50 flex items-center justify-center text-brand-green border border-slate-100 group-hover:bg-brand-green/5 group-hover:border-brand-green/10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                    <Icon weight="thin" className="w-8 h-8 md:w-10 md:h-10 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {/* Subtle dot accent */}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-brand-gold rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <h4 className="text-sm md:text-base font-medium text-gray-800 tracking-wide uppercase px-2 leading-relaxed">
                  {item.label}
                </h4>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default VueloDelCondorVivencia;
