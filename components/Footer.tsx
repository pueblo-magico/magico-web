import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocation } from 'react-router-dom';
import { InstagramLogo, WhatsappLogo, FacebookLogo, MapPin, Envelope, Phone } from '@phosphor-icons/react';
import { SOCIAL_LINKS } from '../src/data/config';
import { ROUTES } from '../src/routes';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { language, t } = useLanguage();
  const location = useLocation();
  const isHomePage = location.pathname === ROUTES.HOME;

  return (
    <footer className="bg-white text-gray-800 py-16 md:py-24 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <img
              src="/uploads/pueblo_magico_logo_marron.svg"
              alt="Pueblo Mágico"
              width="82"
              height="40"
              className="h-10 opacity-90"
            />
            <p className="text-gray-500 leading-relaxed font-light text-base max-w-xs">
              {t.footer.description}
            </p>
            <div className="flex gap-4">
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label={t.ui.followInstagram} className="w-10 h-10 rounded-full bg-brand-green/5 flex items-center justify-center text-brand-green hover:bg-brand-green hover:text-white transition-all duration-300">
                <InstagramLogo size={20} weight="light" />
              </a>
              <a href={t.contact.values.whatsapp} target="_blank" rel="noopener noreferrer" aria-label={t.ui.contactWhatsapp} className="w-10 h-10 rounded-full bg-brand-green/5 flex items-center justify-center text-brand-green hover:bg-brand-green hover:text-white transition-all duration-300">
                <WhatsappLogo size={20} weight="light" />
              </a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label={t.ui.followFacebook} className="w-10 h-10 rounded-full bg-brand-green/5 flex items-center justify-center text-brand-green hover:bg-brand-green hover:text-white transition-all duration-300">
                <FacebookLogo size={20} weight="light" />
              </a>
            </div>
          </div>

          {/* Explore Column */}
          <div>
            <h3 className="text-brand-green font-serif text-xl mb-8 relative inline-block">
              {t.footer.titles.explore}
              <span className="absolute -bottom-2 left-0 w-8 h-px bg-brand-gold"></span>
            </h3>
            <ul className="space-y-4">
              {t.menu.items.map((item: any, index: number) => (
                <li key={index}>
                  <a href={item.href.startsWith('#') && !isHomePage ? ROUTES.HOME + item.href : item.href} className="text-gray-500 hover:text-brand-gold transition-colors duration-300 flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-brand-gold/40 group-hover:bg-brand-gold transition-colors"></span>
                    {item.label}
                  </a>
                </li>
              ))}
              {t.footer.exploreLinks.map((link: any, index: number) => (
                <li key={`explore-${index}`}>
                  <a href={link.href} className="text-gray-500 hover:text-brand-gold transition-colors duration-300 flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-brand-gold/40 group-hover:bg-brand-gold transition-colors"></span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Experiences Column */}
          <div>
            <h3 className="text-brand-green font-serif text-xl mb-8 relative inline-block">
              {t.footer.titles.experiences}
              <span className="absolute -bottom-2 left-0 w-8 h-px bg-brand-gold"></span>
            </h3>
            <div className="space-y-6">
              {t.footer.experienceGroups.map((group: any, gIndex: number) => (
                <div key={gIndex}>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">
                    {group.title}
                  </p>
                  <ul className="space-y-3">
                    {group.links.map((link: any, index: number) => (
                      <li key={index}>
                        <a href={link.href} className="text-gray-500 hover:text-brand-gold transition-colors duration-300 flex items-center gap-2 group">
                          <span className="w-1 h-1 rounded-full bg-brand-gold/40 group-hover:bg-brand-gold transition-colors"></span>
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Project & Impact Column */}
          <div>
            <h3 className="text-brand-green font-serif text-xl mb-8 relative inline-block">
              {t.footer.titles.project}
              <span className="absolute -bottom-2 left-0 w-8 h-px bg-brand-gold"></span>
            </h3>
            <ul className="space-y-4">
              {t.footer.projectLinks.map((link: any, index: number) => (
                <li key={index}>
                  <a href={link.href.startsWith('#') && !isHomePage ? ROUTES.HOME + link.href : link.href} className="text-gray-500 hover:text-brand-gold transition-colors duration-300 flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-brand-gold/40 group-hover:bg-brand-gold transition-colors"></span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-brand-green font-serif text-xl mb-8 relative inline-block">
              {t.footer.titles.contact}
              <span className="absolute -bottom-2 left-0 w-8 h-px bg-brand-gold"></span>
            </h3>
            <ul className="space-y-5">
              <li className="flex items-start gap-3 text-gray-600">
                <MapPin size={18} weight="light" className="text-brand-gold mt-1 flex-shrink-0" />
                <a href={t.location.mapLink} target="_blank" rel="noopener noreferrer" className="text-sm font-light leading-relaxed hover:text-brand-gold transition-colors" dangerouslySetInnerHTML={{ __html: t.footer.address }} />
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <Phone size={18} weight="light" className="text-brand-gold flex-shrink-0" />
                <a href={`tel:${t.contact.values.phone}`} className="text-sm font-light hover:text-brand-gold transition-colors">
                  {t.contact.values.phone}
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <Envelope size={18} weight="light" className="text-brand-gold flex-shrink-0" />
                <a href={`mailto:${t.contact.values.email}`} className="text-sm font-light hover:text-brand-gold transition-colors">
                  {t.contact.labels.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal identity row */}
        <div className="pt-10 border-t border-gray-100 mb-6 flex flex-col items-center gap-4">
          <p className="text-xs text-gray-400 font-light text-center leading-relaxed max-w-4xl">
            <strong className="text-gray-500 font-medium">HERMANOS MÁGICOS SOCIEDAD POR ACCIONES SIMPLIFICADA</strong>
            {' · '}CUIT 30-71875586-3
            {' · '}Calle Aconquija 635, Villa Allende, Dpto. Colón, Córdoba, Argentina.
            {' · '}Hab. Agencia Córdoba Turismo N° 000258
          </p>
          <a
            href="https://www.afip.gob.ar/fe/qr/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
            title="Ver Data Fiscal AFIP"
          >
            <img 
              src="/uploads/qr-arca.png" 
              alt="Data Fiscal AFIP" 
              className="h-20 w-auto object-contain"
            />
          </a>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs text-gray-500 font-light flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <span>&copy; {currentYear} {t.footer.copyright}</span>
            <span className="hidden md:block w-1 h-1 rounded-full bg-gray-200"></span>
            <div className="flex gap-4">
              <a href={ROUTES.TERMINOS} className="hover:text-brand-gold transition-colors">{t.footer.links.terms}</a>
              <a href={ROUTES.PRIVACIDAD} className="hover:text-brand-gold transition-colors">{t.footer.links.privacy}</a>
            </div>
            <a
              href={ROUTES.ARREPENTIMIENTO}
              className="rounded-full border-2 border-brand-green px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-green transition-colors hover:bg-brand-green hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            >
              {language === 'es' ? 'Botón de arrepentimiento' : 'Withdrawal button'}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 italic">{t.footer.madeBy}</span>
            <span className="text-[10px] uppercase tracking-widest text-brand-green/40 font-bold ml-2">by Catálisis</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
