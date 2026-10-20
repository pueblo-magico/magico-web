import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  BedDouble,
  ChevronDown,
  Home,
  Leaf,
  Menu,
  Snowflake,
  Sprout,
  TreePine,
  UsersRound,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../src/routes';
import { PageSectionNav } from './PageSectionNav';

const submenuIcons: Record<string, LucideIcon> = {
  leaf: Leaf,
  community: UsersRound,
  sprout: Sprout,
  trees: TreePine,
  stay: BedDouble,
  home: Home,
  snow: Snowflake,
  spark: Zap,
};

type HeaderProps = {
  subNavigation?: React.ReactNode;
};

export const Header: React.FC<HeaderProps> = ({ subNavigation }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const [hasAutoSubNavigation, setHasAutoSubNavigation] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();

  const isHomePage = location.pathname === ROUTES.HOME;
  const useAutoSubNavigation = !isHomePage && !subNavigation && location.pathname !== ROUTES.ADMIN_RESERVAS;
  const hasSubNavigation = Boolean(subNavigation || (useAutoSubNavigation && hasAutoSubNavigation));
  const useSolidHeader = isScrolled || isMobileMenuOpen;
  const showSubNavigation = Boolean(hasSubNavigation && isScrolled && !isMobileMenuOpen);

  const scrollSectionBelowHeader = (element: HTMLElement, behavior: ScrollBehavior = 'smooth') => {
    const mainHeaderBottom = document.querySelector<HTMLElement>('[data-header-main-row]')?.getBoundingClientRect().bottom
      || document.querySelector('header')?.getBoundingClientRect().bottom
      || 0;
    const targetTop = window.scrollY + element.getBoundingClientRect().top - mainHeaderBottom;
    window.scrollTo({ top: Math.max(0, targetTop), behavior });
  };

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Scroll effect for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keep active navigation deterministic across clicks, manual scrolling and hash loads.
  useEffect(() => {
    if (!isHomePage) {
      setActiveSection('');
      return;
    }

    const sectionIds = new Set<string>();
    t.menu.items.forEach((item: any) => {
      if (item.href.startsWith('#')) sectionIds.add(item.href.substring(1));
      item.submenu?.forEach((sub: any) => {
        if (sub.href.startsWith('#')) sectionIds.add(sub.href.substring(1));
      });
    });
    sectionIds.add('contacto');

    const updateActiveSection = () => {
      const headerBottom = document.querySelector('header')?.getBoundingClientRect().bottom || 0;
      const activationLine = Math.max(headerBottom + 24, window.innerHeight * 0.3);
      const sections = Array.from(sectionIds)
        .map(id => document.getElementById(id))
        .filter((element): element is HTMLElement => Boolean(element))
        .map(element => ({ element, top: element.getBoundingClientRect().top }))
        .sort((a, b) => a.top - b.top);

      let nextSection = '';
      sections.forEach(({ element, top }) => {
        if (top <= activationLine) {
          nextSection = element.id;
        }
      });

      setActiveSection(current => current === nextSection ? current : nextSection);

      const nextHash = nextSection ? `#${nextSection}` : '';
      if (window.location.hash !== nextHash) {
        const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
        window.history.replaceState(window.history.state, '', nextUrl);
      }
    };

    updateActiveSection();
    const firstFrame = window.requestAnimationFrame(updateActiveSection);
    const settledLayout = window.setTimeout(updateActiveSection, 500);
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearTimeout(settledLayout);
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [t.menu.items, isHomePage]);

  useEffect(() => {
    if (!isHomePage || !location.hash) return;

    const targetId = location.hash.substring(1);
    const target = document.getElementById(targetId);
    if (!target) return;

    setActiveSection(targetId);
    const firstFrame = window.requestAnimationFrame(() => {
      scrollSectionBelowHeader(target);
    });
    const settledLayout = window.setTimeout(() => {
      scrollSectionBelowHeader(target);
    }, 700);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearTimeout(settledLayout);
    };
  }, [isHomePage, location.hash]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, hasSubmenu: boolean, index: number) => {
    // Mobile: Toggle submenu if it exists
    if (isMobile && hasSubmenu) {
      e.preventDefault();
      setActiveSubmenu(activeSubmenu === index ? null : index);
      return;
    }

    // Navigation logic
    if (href.startsWith('#')) {
      if (isHomePage) {
        e.preventDefault();
        const targetId = href.substring(1);
        const element = document.getElementById(targetId);
        
        if (element) {
          setActiveSection(targetId);
          setIsMobileMenuOpen(false);
          scrollSectionBelowHeader(element);
          window.setTimeout(() => scrollSectionBelowHeader(element), 700);
          window.history.pushState(null, '', href);
        }
      } else {
        // On a sub-landing, we let the link navigate to /#section
        setIsMobileMenuOpen(false);
      }
    } else {
      setIsMobileMenuOpen(false);
    }
  };

  // Helper to check if link is active
  const isLinkActive = (href: string) => {
    if (!href.startsWith('#')) return location.pathname === href;
    return isHomePage && activeSection === href.substring(1);
  };

  const isMenuItemActive = (item: any) => (
    isLinkActive(item.href)
    || item.submenu?.some((sub: any) => isLinkActive(sub.href))
  );

  // Dynamic Classes
  // Keep the header pinned to the viewport without transforms so it remains
  // stable on iOS Safari while changing between transparent and solid states.
  const pillClasses = `
    fixed left-0 right-0 top-0 z-[1000] w-full max-w-none
    transition-[background-color,box-shadow,border-radius,top,width,max-width,padding] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
    flex min-w-0 ${hasSubNavigation ? 'flex-col' : 'items-center justify-between'}
    ${
      useSolidHeader
        ? `bg-white text-dark shadow-[0_8px_30px_rgba(0,0,0,0.08)] border-b border-brand/10 px-5 ${showSubNavigation ? 'pt-2 pb-0 lg:pt-2.5 lg:pb-0' : 'py-2 lg:py-2.5'}`
        : 'bg-transparent text-white border-none px-5 py-2.5'
    }
  `;

  const logoClasses = `
    block w-auto transition-all duration-300
    ${useSolidHeader ? 'h-[40px] md:h-[48px] filter-none' : 'h-[52px] md:h-[65px] brightness-0 invert'}
  `;

  return (
    <header className={pillClasses}>
      <div data-header-main-row className="flex w-full items-center justify-between px-2 lg:px-4">
        {/* Logo - Left */}
        <div className="flex-1 lg:flex-none">
          <a href={ROUTES.HOME} className="relative z-[1200] inline-block" onClick={(e) => { 
            if (isHomePage) {
              e.preventDefault(); 
              window.scrollTo({top: 0, behavior: 'smooth'}); 
            }
          }}>
            <img
              src="/uploads/pueblo_magico_logo_marron.svg"
              alt="Pueblo Mágico"
              width="134"
              height="65"
              className={logoClasses}
            />
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden relative z-[1200] p-2 focus:outline-none"
          aria-label={t.ui.toggleMenu}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-dark" />
          ) : (
            <Menu className={`w-6 h-6 ${useSolidHeader ? 'text-dark' : 'text-white'}`} />
          )}
        </button>

        {/* Navigation */}
        <nav
          className={`
            fixed top-0 left-0 w-full h-screen bg-white pt-[100px] pb-10 px-8
            flex flex-col overflow-y-auto transition-all duration-400 z-[1100]
            lg:static lg:h-auto lg:w-auto lg:bg-transparent lg:p-0 lg:flex-row lg:opacity-100 lg:visible lg:overflow-visible
            ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible lg:opacity-100 lg:visible'}
          `}
        >
          <ul className="flex flex-col lg:flex-row items-center gap-0 lg:gap-[45px] w-full lg:w-auto">
            {t.menu.items.map((item: any, index: number) => (
              <li key={index} className="relative group w-full lg:w-auto text-center lg:text-left">
                <a
                  href={item.href.startsWith('#') && !isHomePage ? ROUTES.HOME + item.href : item.href}
                  onClick={(e) => handleNavClick(e, item.href, !!item.submenu, index)}
                  className={`
                    relative flex items-center justify-center lg:justify-start gap-1.5 py-3.5 lg:py-2.5
                    text-[16px] lg:text-[13px] font-serif lg:font-sans font-normal lg:font-medium
                    border-b border-black/5 lg:border-none w-full lg:w-auto
                    transition-colors duration-300
                    ${useSolidHeader
                      ? (isMenuItemActive(item) ? 'text-brand font-semibold' : 'text-dark hover:text-brand')
                      : (isMenuItemActive(item) ? 'text-gold' : 'text-white hover:text-gold')}
                    ${isMobile && !isMenuItemActive(item) ? 'text-[#444]' : ''}
                  `}
                >
                  {item.label}
                  {item.submenu && (
                    <ChevronDown 
                      className={`w-3 h-3 transition-transform duration-300 lg:group-hover:rotate-180 ${activeSubmenu === index ? 'rotate-180' : ''}`}
                    />
                  )}
                  <span className={`pointer-events-none absolute inset-x-0 -bottom-px hidden h-0.5 origin-center rounded-full bg-gold transition-transform duration-300 lg:block ${isMenuItemActive(item) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} aria-hidden="true" />
                </a>

                {/* Submenu */}
                {item.submenu && (
                  <ul
                    className={`
                      lg:absolute lg:top-full lg:left-1/2 lg:-translate-x-1/2 lg:translate-y-[12px]
                      bg-[#FAFAFA] lg:bg-white lg:min-w-[360px] lg:rounded-[22px] lg:border lg:border-brand/10 lg:shadow-[0_18px_50px_rgba(23,49,39,0.14)]
                      lg:opacity-0 lg:invisible lg:group-hover:opacity-100 lg:group-hover:visible lg:group-hover:translate-y-0
                      transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                      w-full lg:w-auto py-1 lg:p-3
                      ${activeSubmenu === index ? 'block animate-fadeIn' : 'hidden lg:block'}
                    `}
                  >
                    {item.submenuEyebrow && (
                      <li className="hidden px-4 pb-2 pt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-dark/45 lg:block">
                        {item.submenuEyebrow}
                      </li>
                    )}
                    {item.submenu.map((sub: any, subIndex: number) => {
                      const SubmenuIcon = submenuIcons[sub.icon] || Leaf;
                      const isSubmenuItemActive = isLinkActive(sub.href);

                      return (
                        <li key={subIndex}>
                          <a
                            href={sub.href.startsWith('#') && !isHomePage ? ROUTES.HOME + sub.href : sub.href}
                            onClick={(e) => handleNavClick(e, sub.href, false, index)}
                            className={`group/sub relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-2.5 text-left transition-[background-color,color] duration-200 lg:min-h-[62px] ${isSubmenuItemActive ? 'bg-[#F5F0E4] text-brand before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-r-full before:bg-gold' : 'text-[#666] hover:bg-[#F8F5EE] hover:text-brand'}`}
                          >
                            <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F3EB] text-dark/55 transition-colors group-hover/sub:text-brand lg:flex">
                              <SubmenuIcon size={19} strokeWidth={1.6} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={`block text-[14px] leading-tight ${isSubmenuItemActive ? 'font-semibold' : 'font-medium'}`}>{sub.label}</span>
                              {sub.description && <span className="mt-1 hidden text-[11px] font-light leading-tight text-dark/50 lg:block">{sub.description}</span>}
                            </span>
                            <ArrowRight className={`hidden shrink-0 text-gold transition-[opacity,transform] duration-200 lg:block ${isSubmenuItemActive ? 'opacity-100' : 'translate-x-1 opacity-0 group-hover/sub:translate-x-0 group-hover/sub:opacity-100'}`} size={18} aria-hidden="true" />
                          </a>
                        </li>
                      );
                    })}
                    {item.viewAllLink && (
                      <li className="mt-2 border-t border-brand/10 pt-2">
                        <a
                          href={item.viewAllLink.href.startsWith('#') && !isHomePage ? ROUTES.HOME + item.viewAllLink.href : item.viewAllLink.href}
                          onClick={(e) => handleNavClick(e, item.viewAllLink.href, false, index)}
                          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-semibold text-gold transition-colors hover:bg-gold/10 hover:text-brand lg:justify-between"
                        >
                          {item.viewAllLink.label}<ArrowRight size={16} aria-hidden="true" />
                        </a>
                      </li>
                    )}
                  </ul>
                )}
              </li>
            ))}
            
            {/* Desktop Reservar Button */}
            <li className="hidden lg:block pl-4 border-l border-white/20">
               <a 
                 href={t.menu.bookLink} 
                 onClick={(e) => handleNavClick(e, t.menu.bookLink, false, -1)}
                 className={`text-xs font-bold px-5 py-2 rounded-full transition-all shadow-lg ${useSolidHeader ? 'bg-brand text-white hover:bg-gold' : 'bg-white text-brand hover:bg-gold hover:text-white'}`}
               >
                  {t.menu.book}
               </a>
            </li>
            
            {/* Mobile Language Button */}
            <li className="lg:hidden mt-8 w-full flex justify-center pb-10">
              <button
                onClick={toggleLanguage}
                className="border border-brand text-brand hover:bg-brand hover:text-white rounded-[30px] py-2 px-8 text-[12px] font-medium transition-colors uppercase"
              >
                {t.menu.lang}
              </button>
            </li>
          </ul>
        </nav>

        {/* Desktop Language Button */}
        <div className="hidden lg:flex items-center pl-5">
          <button
            onClick={toggleLanguage}
            className={`
              text-[11px] font-medium uppercase border rounded-[20px] py-[5px] px-[18px] transition-all duration-300
              ${
                useSolidHeader
                  ? 'border-black/15 text-dark hover:bg-brand hover:border-brand hover:text-white'
                  : 'border-white/40 text-white hover:bg-white hover:border-white hover:text-brand'
              }
            `}
          >
            {language === 'es' ? 'EN' : 'ES'}
          </button>
        </div>
      </div>
      {(subNavigation || useAutoSubNavigation) && (
        <div
          className={`grid w-full min-w-0 max-w-full overflow-visible transition-[grid-template-rows,opacity,border-color] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${showSubNavigation ? 'grid-rows-[1fr] border-t border-brand/10 opacity-100' : 'pointer-events-none grid-rows-[0fr] border-t border-transparent opacity-0'}`}
          aria-hidden={!showSubNavigation}
        >
          <div className="min-h-0 min-w-0 max-w-full overflow-visible">
            {subNavigation || (
              <PageSectionNav
                autoDiscover
                locale={language}
                minimumSections={5}
                onAvailabilityChange={setHasAutoSubNavigation}
              />
            )}
          </div>
        </div>
      )}
    </header>

  );
};
