import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { marked } from 'marked';
import { HorizontalCardRail } from './HorizontalCardRail';

export const SectionTestimonios: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="testimonios" className="py-24 bg-bone">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div data-reveal className="text-center mb-16">
          <h2
            className="text-3xl md:text-5xl text-brand font-serif mb-6"
            dangerouslySetInnerHTML={{ __html: marked.parse(t.testimonials.title as string) as string }}
          />
          <a
            href="https://maps.app.goo.gl/4c1nrpBbQf5hYrsE9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white border border-brand/10 rounded-full px-5 py-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-yellow-400 text-base leading-none tracking-tight">★★★★★</span>
            <span className="text-brand font-bold text-sm">5.0</span>
            <span className="text-dark/50 text-xs font-light">{(t.testimonials as any).googleReviews}</span>
          </a>
        </div>
        <HorizontalCardRail previousLabel={t.ui.prev} nextLabel={t.ui.next} desktopGridClassName="md:grid-cols-3">
          {t.testimonials.items.map((item: any) => (
            <div key={item.id} className="h-full text-center bg-white md:bg-transparent p-6 md:p-0 rounded-xl md:rounded-none shadow-sm md:shadow-none">
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                loading="lazy"
              />
              <p className="text-dark/80 italic mb-4">"{item.text}"</p>
              <p className="font-bold text-brand">{item.name}</p>
              <p className="text-sm text-dark/60">{item.role}</p>
            </div>
          ))}
        </HorizontalCardRail>
      </div>
    </section>
  );
};
