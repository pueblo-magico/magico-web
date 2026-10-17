import React, { useState } from 'react';
import { Sprout, ArrowRight, CalendarDays, Gift, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShowMoreButton } from '../../components/ShowMoreButton';
import { ROUTES } from '../routes';
import { WA_MAGICO } from '../data/config';

// Pasos de "Programas a medida" visibles antes de "Ver más"
const VISIBLE_STEPS = 3;

const FORMATO_PHOTOS = [
  '/uploads/Aula Verde/IMG-20251120-WA0107.jpg',
  '/uploads/fogon_nocturno.webp',
  '/uploads/domos.webp',
];

const waLink = (text: string) => `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(text)}`;

const EmpresasProceso: React.FC = () => {
  const { t } = useLanguage();
  const pr = t.empresas.proceso;
  const f = t.empresas.formatos;
  const [showAllSteps, setShowAllSteps] = useState(false);

  // Próximas jornadas abiertas: salen de la agenda (events.cards con isReforestacion), así no hay fechas duplicadas
  const today = new Date().toISOString().slice(0, 10);
  const openDays = (t.events.cards as any[]).filter(c => c.isReforestacion && (c.endDate || c.startDate || '') >= today);

  return (
    <>
      {/* ====== PROCESO ====== */}
      <section className="py-16 md:py-24 px-6 bg-[#FAF9F5]">
        <div className="max-w-5xl mx-auto">
          <h2 data-reveal className="text-3xl md:text-5xl serif-title brand-green mb-5" style={{ lineHeight: '1.1' }}>
            {pr.title}
          </h2>
          <p data-reveal data-delay="1" className="text-gray-500 text-base md:text-lg leading-relaxed max-w-2xl mb-12 font-light">
            {pr.subtitle}
          </p>

          <div data-reveal>
          <div id="empresas-proceso-pasos" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {(showAllSteps ? pr.steps : pr.steps.slice(0, VISIBLE_STEPS)).map((step: any) => (
              <div key={step.num} className="bg-white rounded-2xl border border-[#E8E4D9] p-6">
                <span className="serif-title text-3xl font-light block leading-none mb-3" style={{ color: 'rgba(0,83,51,0.2)' }}>
                  {step.num}
                </span>
                <h4 className="font-bold brand-green text-sm uppercase tracking-widest mb-2">{step.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed font-light">{step.text}</p>
              </div>
            ))}
          </div>
          {pr.steps.length > VISIBLE_STEPS && (
            <div className="mt-6 text-center">
              <ShowMoreButton
                open={showAllSteps}
                onToggle={() => setShowAllSteps(v => !v)}
                moreLabel={t.ui.showMore}
                lessLabel={t.ui.showLess}
                controls="empresas-proceso-pasos"
                hiddenCount={pr.steps.length - VISIBLE_STEPS}
              />
            </div>
          )}
          </div>
        </div>
      </section>

      {/* ====== FORMATOS ====== */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          {f.tag && (
            <p data-reveal className="font-bold text-[#9C7F1E] text-xs uppercase tracking-widest mb-4">{f.tag}</p>
          )}
          <h2 data-reveal className="text-3xl md:text-5xl serif-title brand-green mb-12 md:mb-16 max-w-2xl" style={{ lineHeight: '1.1' }}>
            {f.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {f.items.map((item: any, i: number) => (
              <div key={i} data-reveal data-delay={String(i + 1)} className="relative rounded-2xl overflow-hidden text-white min-h-[260px] flex flex-col justify-end p-7 md:p-8">
                <img src={FORMATO_PHOTOS[i]} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,20,14,0.95) 10%, rgba(0,40,27,0.55) 60%, rgba(0,40,27,0.25) 100%)' }} />
                <div className="relative z-10">
                  <h3 className="text-xl serif-title text-white mb-3">{item.title}</h3>
                  <p className="text-white/75 text-sm leading-relaxed font-light">{item.text}</p>
                  {item.price && (
                    <p className="mt-4 inline-block rounded-full bg-[#D4AF37] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#005333]">{item.price}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p data-reveal data-delay="4" className="text-gray-500 text-sm leading-relaxed font-light italic max-w-xl">
            {f.note}
          </p>

          {/* Otras formas de sumarse: regalos, opción sin viajar y, al final, jornadas abiertas por postulación
              (las privadas son la oferta principal; las abiertas no compiten con ellas) */}
          {f.more_title && (
            <div data-reveal>
              <div className="mt-12">
                <p className="font-bold brand-green text-sm uppercase tracking-widest mb-5">{f.more_title}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MoreCard
                    icon={Gift}
                    badge={f.gifts.badge}
                    title={f.gifts.title}
                    text={f.gifts.text}
                    href={waLink(f.gifts.wa_query)}
                    external
                    cta={f.gifts.cta}
                    ctaIcon={MessageCircle}
                  />
                  <MoreCard
                    icon={Sprout}
                    title={f.remote.title}
                    text={f.remote.text}
                    href={ROUTES.REFORESTACION}
                    cta={f.remote.cta}
                    ctaIcon={ArrowRight}
                  />
                  {openDays.length > 0 && (
                    <MoreCard
                      icon={CalendarDays}
                      badge={f.open_days.badge}
                      title={f.open_days.title}
                      text={f.open_days.text}
                      extra={
                        <div className="flex flex-wrap gap-2 mb-5">
                          {openDays.map(d => (
                            <span key={d.startDate} className="rounded-full bg-[#005333]/[0.06] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#005333]">{d.date}</span>
                          ))}
                        </div>
                      }
                      href={waLink(f.open_days.wa_query)}
                      external
                      cta={f.open_days.cta}
                      ctaIcon={MessageCircle}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

const MoreCard: React.FC<{
  icon: React.ElementType;
  badge?: string;
  title: string;
  text: string;
  extra?: React.ReactNode;
  href: string;
  external?: boolean;
  cta: string;
  ctaIcon: React.ElementType;
}> = ({ icon: Icon, badge, title, text, extra, href, external, cta, ctaIcon: CtaIcon }) => (
  <div className="rounded-2xl border border-[#E8E4D9] bg-[#FAF9F5] p-6 flex flex-col">
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-[#005333]/[0.07] flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-[#005333]" strokeWidth={1.6} aria-hidden="true" />
      </div>
      {badge && (
        <span className="rounded-full border border-[#D4AF37]/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#9C7F1E]">{badge}</span>
      )}
    </div>
    <h3 className="font-bold brand-green text-base mb-2">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed font-light mb-5 flex-grow">{text}</p>
    {extra}
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#005333]/20 px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#005333] transition-colors hover:border-[#005333] hover:bg-[#005333] hover:text-white text-center"
    >
      {cta}
      <CtaIcon size={15} className="shrink-0" aria-hidden="true" />
    </a>
  </div>
);

export default EmpresasProceso;
