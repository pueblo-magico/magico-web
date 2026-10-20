import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CheckIcon, AirplaneTiltIcon, WhatsappLogoIcon, ChatsIcon, CurrencyDollarIcon, SealCheckIcon } from '@phosphor-icons/react';
import { RESERVATION_START_PATH } from '../data/config';
import { RETREATS_DATA } from '../data/retreats';

const STEPS = [
  { icon: WhatsappLogoIcon,     num: '01', label: 'Escribinos por WhatsApp' },
  { icon: ChatsIcon,            num: '02', label: 'Conversamos tu proceso'  },
  { icon: CurrencyDollarIcon,   num: '03', label: 'Enviás la seña'   },
  { icon: SealCheckIcon,        num: '04', label: 'Tu lugar está asegurado' },
];

const VueloDelCondorInversion: React.FC = () => {
  const { t } = useLanguage();
  const inv = t.vuelo_condor.inversion;

  return (
    <section
      id="reservar"
      className="py-16 md:py-24 px-4 md:px-6 bg-[#005333] text-white rounded-2xl md:rounded-3xl relative mx-2 md:mx-0 overflow-hidden"
    >
      {/* Subtle inner border */}
      <div className="absolute inset-0 border border-white/10 rounded-2xl md:rounded-3xl pointer-events-none" />

      {/* Ambient glow — bottom left, barely visible */}
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#D4AF37]/6 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div className="mb-12 md:mb-16" data-reveal>
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37]/60 mb-5">La inversión</p>
          <h2 className="text-3xl md:text-5xl serif-title text-white leading-tight mb-6">
            {inv.title}
          </h2>
          <span className="inline-flex items-center gap-2 bg-[#D4AF37]/12 border border-[#D4AF37]/30 text-[#D4AF37] text-[11px] font-bold uppercase tracking-[0.25em] px-5 py-2 rounded-full">
            {RETREATS_DATA.vueloDelCondor.dates} · {RETREATS_DATA.vueloDelCondor.location}
          </span>
        </div>

        {/* ── MAIN GRID: value list | price card ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-12 mb-12">

          {/* LEFT — inclusions */}
          <div>
            <h3 className="text-[10px] tracking-[0.35em] uppercase text-white/40 mb-6" data-reveal>
              {inv.incluye_title}
            </h3>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-10" data-reveal data-delay="1">
              {inv.incluye.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckIcon weight="bold" className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-[3px]" />
                  <span className="text-white/80 text-sm md:text-base leading-snug">{item}</span>
                </li>
              ))}
            </ul>

            {/* Not included */}
            <div className="border-t border-white/8 pt-8" data-reveal data-delay="2">
              <h3 className="text-[10px] tracking-[0.35em] uppercase text-white/30 mb-4">
                {inv.no_incluye_title}
              </h3>
              <p className="text-white/50 text-sm mb-4">{inv.no_incluye}</p>
              <div className="flex items-start gap-3 bg-white/4 rounded-xl p-4">
                <AirplaneTiltIcon weight="light" className="w-4 h-4 text-[#D4AF37]/70 flex-shrink-0 mt-0.5" />
                <p
                  className="text-white/55 text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: inv.vuelos_help }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT — sticky price card */}
          <div className="lg:sticky lg:top-28 self-start" data-reveal data-delay="1">
            <div className="bg-white rounded-2xl overflow-hidden">

              {/* Slots ribbon */}
              <div className="bg-[#D4AF37] text-[#002a19] text-center py-2.5 px-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{inv.slots}</span>
              </div>

              <div className="p-8 text-center">
                {/* Price */}
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#005333]/40 mb-3">{inv.total_title}</p>
                <div className="flex items-start justify-center gap-1.5 mb-3">
                  <span className="text-lg font-light text-[#005333]/50 mt-3">{inv.currency}</span>
                  <span className="text-6xl md:text-7xl font-serif text-[#005333] leading-none tracking-tight">
                    {inv.price}
                  </span>
                </div>

                <div className="w-8 h-px bg-[#005333]/15 mx-auto mb-4" />

                <p
                  className="text-[#005333]/60 text-xs leading-relaxed mb-8"
                  dangerouslySetInnerHTML={{ __html: inv.note }}
                />

                <a
                  href={RESERVATION_START_PATH}
                  className="btn-gold w-full flex items-center justify-center gap-2 py-4 text-sm"
                >
                  <SealCheckIcon weight="fill" className="w-4 h-4" />
                  {inv.btn}
                </a>

                <p className="text-[#005333]/40 text-[11px] mt-4 font-light italic">{inv.msg}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── PROCESO DE RESERVA ──────────────────────────────────────── */}
        <div className="border-t border-white/8 pt-10 md:pt-14" data-reveal>
          <p className="text-[10px] tracking-[0.4em] uppercase text-white/30 mb-8 text-center md:text-left">
            Cómo reservar
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 relative">
            {/* Connecting line — desktop only */}
            <div className="hidden md:block absolute top-5 left-[12.5%] right-[12.5%] h-px bg-white/8 z-0" />

            {STEPS.map(({ icon: Icon, num, label }) => (
              <div key={num} className="flex flex-col items-center text-center relative z-10 gap-3">
                <div className="w-10 h-10 rounded-full border border-white/15 bg-[#005333] flex items-center justify-center mb-1">
                  <Icon weight="light" className="w-4 h-4 text-[#D4AF37]/70" />
                </div>
                <span className="text-[10px] tracking-[0.3em] text-[#D4AF37]/50 font-mono">{num}</span>
                <p className="text-white/70 text-xs leading-snug max-w-[100px]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── FORMA DE PAGO ───────────────────────────────────────────── */}
        <div className="border-t border-white/8 pt-10 md:pt-14 mt-10 md:mt-14" data-reveal>
          <p className="text-[10px] tracking-[0.4em] uppercase text-white/30 mb-8">
            Forma de pago
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
            {[
              'Confirmá tu asistencia con una seña para asegurar tu lugar.',
              'El saldo restante se puede abonar en diferentes modalidades a convenir, con flexibilidad.',
              'Consultá por opciones de financiación y otras formas de intercambio.',
              'Si sentís el llamado, estamos abiertos a conversar con vos para que puedas ser parte.',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="text-[#D4AF37]/40 font-mono text-[10px] tracking-widest mt-0.5 flex-shrink-0">
                  {'0' + (i + 1)}
                </span>
                <p className="text-white/65 text-sm md:text-base leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default VueloDelCondorInversion;
