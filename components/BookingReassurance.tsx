import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { bookingReassurance } from '../src/data/journey';
import { ROUTES } from '../src/routes';

export const BookingReassurance = ({ compact = false, showCta = true }: { compact?: boolean; showCta?: boolean }) => {
  const { language } = useLanguage();
  const copy = bookingReassurance[language];

  return (
    <aside className={`${compact ? 'p-5' : 'p-6 md:p-8'} rounded-2xl border border-gold/25 bg-[#FFF9EA] text-dark shadow-sm`}>
      <div className="flex items-start gap-4">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-brand" />
        <div>
          <h3 className="font-serif text-xl text-brand">{copy.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-dark/70">{copy.body}</p>
          {showCta && (
            <a href={ROUTES.ESTADIA} data-journey-event="booking_reassurance_to_stay" className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold hover:text-brand">
              {copy.cta}<ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </aside>
  );
};
