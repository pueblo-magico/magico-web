import React, { type ReactNode } from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { WhatsAppButton } from '../../components/WhatsAppButton';
import { CookieBanner } from '../../components/CookieBanner';
import { SeoHead } from './SeoHead';

type JourneyPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  image: string;
  seoTitle: string;
  seoDescription: string;
  path: string;
  children: ReactNode;
};

export const JourneyPage = ({ eyebrow, title, intro, image, seoTitle, seoDescription, path, children }: JourneyPageProps) => (
  <div className="min-h-screen bg-[#F8F5EE] text-dark">
    <SeoHead title={seoTitle} description={seoDescription} path={path} image={image} />
    <Header />
    <main>
      <section className="relative flex min-h-[68vh] items-end overflow-hidden bg-brand pt-28 text-white">
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#173127]/95 via-[#173127]/55 to-[#173127]/25" />
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-14 pt-28 lg:px-12 lg:pb-20">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-gold">{eyebrow}</p>
          <h1 className="max-w-4xl font-serif text-4xl leading-tight md:text-6xl lg:text-7xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-base font-light leading-relaxed text-white/85 md:text-xl">{intro}</p>
        </div>
      </section>
      {children}
    </main>
    <Footer />
    <WhatsAppButton />
    <CookieBanner />
  </div>
);
