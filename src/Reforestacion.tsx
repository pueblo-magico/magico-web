import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gift,
  Share2,
  Coins,
  Copy,
  Globe2,
  Heart,
  HandHeart,
  Leaf,
  MessageCircle,
  MapPinned,
  Play,
  QrCode,
  ShieldCheck,
  Sprout,
  Target,
  Ticket,
  TreePine,
  Users,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Header } from '../components/Header';
import { HorizontalCardRail } from '../components/HorizontalCardRail';
import { Footer } from '../components/Footer';
import ReforestacionTransparencia from './components/ReforestacionTransparencia';
import { AliadosAmbientales } from '../components/AliadosAmbientales';
import { PracticasRegenerativas } from '../components/PracticasRegenerativas';
import { useLanguage } from '../contexts/LanguageContext';
import { REFORESTATION_CONTRIBUTION, SITE_URL, WA_MAGICO, WA_VOLUNTEERS } from './data/config';
import { ROUTES } from './routes';

const HERO_IMAGE = '/uploads/reforestacion/jornada-comunidad.jpeg';
const IMPACT_BACKGROUND_IMAGE = '/uploads/reforestacion/territorio-restauracion.jpeg';
const FUNDING_BACKGROUND_IMAGE = '/uploads/reforestacion/jornada-plantacion.jpeg';

type PhaseMedia = {
  src: string;
  alt: string;
  caption: string;
  type?: 'image' | 'video';
};

type ExpandedGallery = {
  items: PhaseMedia[];
  index: number;
};

type CopyField = 'alias' | 'cbu' | 'iban' | 'bic' | 'usdc' | 'btc' | 'eth';
type ContributionMethod = 'argentina' | 'sepa' | 'crypto';
type CryptoAsset = 'USDC' | 'BTC' | 'ETH';
type CryptoQrDetails = { asset: CryptoAsset; address: string; network: string };

const CryptoAssetIcon = ({ asset, size = 44 }: { asset: CryptoAsset; size?: number }) => {
  if (asset === 'ETH') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
        <circle cx="24" cy="24" r="24" fill="#627EEA" />
        <path d="M24 7.5 23.6 8.9v20.8l.4.4 9.7-5.7L24 7.5Z" fill="#fff" fillOpacity=".62" />
        <path d="m24 7.5-9.7 16.9 9.7 5.7V7.5Z" fill="#fff" />
        <path d="m24 32-0.2.3v7.4l.2.8 9.7-13.7L24 32Z" fill="#fff" fillOpacity=".62" />
        <path d="M24 40.5V32l-9.7-5.2L24 40.5Z" fill="#fff" />
      </svg>
    );
  }

  if (asset === 'BTC') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
        <circle cx="24" cy="24" r="24" fill="#F7931A" />
        <text x="24" y="32" textAnchor="middle" fill="#fff" fontSize="25" fontWeight="700" fontFamily="Arial, sans-serif">₿</text>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <circle cx="24" cy="24" r="24" fill="#2775CA" />
      <circle cx="24" cy="24" r="15" fill="none" stroke="#fff" strokeWidth="2.5" />
      <path d="M27.8 19.5c-.5-1.4-1.7-2.1-3.6-2.1-2.2 0-3.5.9-3.5 2.3 0 3.7 7.4 1.7 7.4 6.4 0 2.2-1.7 3.8-4.2 4.1M24 14.5v3m0 12.8v3.2" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M13.5 17a13 13 0 0 0 0 14M34.5 17a13 13 0 0 1 0 14" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
};

const CryptoNetworkIcon = ({ asset }: { asset: CryptoAsset }) => (
  <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full">
    <CryptoAssetIcon asset={asset === 'USDC' ? 'ETH' : asset} size={20} />
  </span>
);

const Reforestacion: React.FC = () => {
  const { t, language } = useLanguage();
  const content = t.reforestation;
  const reforestationEvents = [...(t.events?.cards || [])]
    .filter((event: any) => event.isReforestacion === true)
    .sort((first: any, second: any) => (first.startDate || '').localeCompare(second.startDate || ''));
  const [copiedField, setCopiedField] = useState<CopyField | null>(null);
  const [selectedContributionMethod, setSelectedContributionMethod] = useState<ContributionMethod>('argentina');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showSticky, setShowSticky] = useState(false);
  const [cryptoQr, setCryptoQr] = useState<CryptoQrDetails | null>(null);
  const [expandedGallery, setExpandedGallery] = useState<ExpandedGallery | null>(null);
  const galleryTouchStartX = useRef<number | null>(null);
  const hasAlias = Boolean(REFORESTATION_CONTRIBUTION.alias);
  const hasSepa = Boolean(
    REFORESTATION_CONTRIBUTION.sepa.accountHolder
    && REFORESTATION_CONTRIBUTION.sepa.iban
    && REFORESTATION_CONTRIBUTION.sepa.bic,
  );
  const hasCrypto = Boolean(
    REFORESTATION_CONTRIBUTION.crypto.usdc.address
    || REFORESTATION_CONTRIBUTION.crypto.btc.address
    || REFORESTATION_CONTRIBUTION.crypto.eth.address,
  );
  const phaseOneGoal = 1_500_000;
  const raisedAmount = Number.isFinite(REFORESTATION_CONTRIBUTION.raisedAmount)
    ? Math.max(0, REFORESTATION_CONTRIBUTION.raisedAmount)
    : 0;
  const progressPercentage = Math.min(100, (raisedAmount / phaseOneGoal) * 100);
  const displayedPercentage = Math.round((raisedAmount / phaseOneGoal) * 100);
  const displayedRaisedAmount = language === 'en'
    ? Math.max(0, REFORESTATION_CONTRIBUTION.raisedAmountUsd)
    : raisedAmount;
  const displayedPhaseOneGoal = language === 'en' ? 1_000 : phaseOneGoal;
  const currencyFormatter = new Intl.NumberFormat(language === 'es' ? 'es-AR' : 'en-US', {
    style: 'currency',
    currency: language === 'es' ? 'ARS' : 'USD',
    maximumFractionDigits: 0,
  });
  const contributionMethodLabels: Record<ContributionMethod, string> = {
    argentina: content.contribution.argentinaMethod,
    sepa: content.contribution.sepaMethod,
    crypto: `${content.contribution.cryptoMethod} (USDC / BTC / ETH)`,
  };
  const requestContributionDataWhatsappUrl = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(content.contribution.whatsappMessage)}`;
  const contributionConfirmationWhatsappUrl = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(
    content.contribution.confirmationWhatsappMessage.replace('{method}', contributionMethodLabels[selectedContributionMethod]),
  )}`;
  const corporateWhatsappUrl = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(content.corporate.whatsappMessage)}`;
  // El voucher solidario usa la misma cuenta y suma a la misma meta que el aporte libre.
  // "VOUCHER" es la palabra clave para la respuesta automática de WhatsApp.
  const voucherWhatsappUrl = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(content.voucher.whatsappMessage)}`;
  const giftWhatsappUrl = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(content.gift.whatsappMessage)}`;
  const shareWhatsappUrl = `https://wa.me/?text=${encodeURIComponent(content.share.message.replace('{url}', SITE_URL + ROUTES.REFORESTACION))}`;
  const { treePrice, donorsCount } = REFORESTATION_CONTRIBUTION;
  const displayedTreePrice = language === 'en' ? 1 : treePrice;
  const formatTrees = (amount: number) => String(Math.floor(amount / displayedTreePrice));
  // Días hasta la fecha límite de la seña (inclusive). null = vencida: no se muestra.
  const daysLeft = (() => {
    const deadline = new Date(`${REFORESTATION_CONTRIBUTION.depositDeadline}T23:59:59-03:00`);
    const diff = deadline.getTime() - Date.now();
    return diff < 0 ? null : Math.floor(diff / 86_400_000);
  })();
  const confirmationWhatsappUrl = selectedAmount
    ? `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(
      content.contribution.confirmationWhatsappMessage
        .replace('{method}', contributionMethodLabels[selectedContributionMethod])
        .replace(/(Monto y moneda|Amount and currency): \[[^\]]+\]/, `$1: ${currencyFormatter.format(selectedAmount)} (${content.contribution.treesLabel.replace('{trees}', formatTrees(selectedAmount))})`),
    )}`
    : contributionConfirmationWhatsappUrl;
  const getVolunteerWhatsappUrl = (event: { title: string; date: string }) => {
    const message = content.volunteering.applyMessage
      .replace('{event}', event.title)
      .replace('{date}', event.date);
    return `https://wa.me/${WA_VOLUNTEERS}?text=${encodeURIComponent(message)}`;
  };

  useEffect(() => {
    const title = content.seo.title;
    const description = content.seo.description;
    const url = SITE_URL + ROUTES.REFORESTACION;
    const image = SITE_URL + HERO_IMAGE;
    const previousTitle = document.title;

    document.title = title;

    const setMeta = (selector: string, key: 'name' | 'property', keyValue: string, value: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(key, keyValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:image"]', 'property', 'og:image', image);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', language === 'es' ? 'es_AR' : 'en_US');
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.id = 'ld-reforestacion';
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'DonateAction',
      name: content.hero.title,
      description,
      recipient: {
        '@type': 'Organization',
        name: 'Pueblo Mágico',
        url: SITE_URL,
      },
      target: url,
    });
    document.getElementById(schema.id)?.remove();
    document.head.appendChild(schema);

    return () => {
      document.title = previousTitle;
      document.getElementById(schema.id)?.remove();
    };
  }, [content, language]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -32px 0px' },
    );
    document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  // Botón fijo "Aportar" en celular: visible después de la portada, oculto
  // mientras la sección de aportes está en pantalla (ahí ya están los botones).
  useEffect(() => {
    const contributeSection = document.getElementById('aportar');
    let contributeVisible = false;
    const update = () => setShowSticky(window.scrollY > window.innerHeight * 0.8 && !contributeVisible);
    const observer = new IntersectionObserver(([entry]) => {
      contributeVisible = entry.isIntersecting;
      update();
    });
    if (contributeSection) observer.observe(contributeSection);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update);
    };
  }, []);

  useEffect(() => {
    if (!cryptoQr) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCryptoQr(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [cryptoQr]);

  const moveExpandedGallery = (direction: -1 | 1) => {
    setExpandedGallery(current => {
      if (!current || current.items.length < 2) return current;
      return {
        ...current,
        index: (current.index + direction + current.items.length) % current.items.length,
      };
    });
  };

  useEffect(() => {
    if (!expandedGallery) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpandedGallery(null);
      if (event.key === 'ArrowLeft') moveExpandedGallery(-1);
      if (event.key === 'ArrowRight') moveExpandedGallery(1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [expandedGallery]);

  const expandedMedia = expandedGallery?.items[expandedGallery.index] ?? null;

  const copyValue = async (field: CopyField, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(current => current === field ? null : current), 2200);
  };

  const trimWalletAddress = (address: string) => address.length > 20
    ? `${address.slice(0, 8)}…${address.slice(-6)}`
    : address;

  const renderCopyField = (
    label: string,
    value: string,
    field: CopyField,
    copyLabel: string,
  ) => (
    <div className="rounded-xl bg-bone/70 p-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">{label}</p>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <code className="min-w-0 break-all text-sm font-semibold text-brand sm:text-base">{value}</code>
        <button
          type="button"
          onClick={() => copyValue(field, value)}
          aria-label={copyLabel}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand/15 bg-white text-brand transition-colors hover:border-gold hover:bg-gold hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {copiedField === field ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );

  const renderTransferOptions = (method?: ContributionMethod) => (
    <div className="space-y-4 md:space-y-5">
      {hasAlias && (!method || method === 'argentina') && (
        <section className="rounded-2xl border border-brand/15 bg-white p-5 md:p-6" aria-label={content.contribution.localTransferTitle}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Building2 size={19} aria-hidden="true" />
            </div>
            <h3 className="font-serif text-2xl text-brand">{content.contribution.localTransferTitle}</h3>
          </div>
          <div className="space-y-3">
            {renderCopyField(content.contribution.aliasLabel, REFORESTATION_CONTRIBUTION.alias, 'alias', content.contribution.copy)}
            {REFORESTATION_CONTRIBUTION.accountHolder && (
              <dl className="rounded-xl bg-bone/70 p-4 text-sm text-gray-500">
                <div><dt className="inline font-semibold text-gray-700">{content.contribution.holderLabel}:</dt> <dd className="inline">{REFORESTATION_CONTRIBUTION.accountHolder}</dd></div>
              </dl>
            )}
          </div>
          {REFORESTATION_CONTRIBUTION.cbu && (
            <div className="mt-3">{renderCopyField(content.contribution.cbuLabel, REFORESTATION_CONTRIBUTION.cbu, 'cbu', content.contribution.copyCbu)}</div>
          )}
        </section>
      )}

      {hasSepa && (!method || method === 'sepa') && (
        <section className="rounded-2xl border border-brand/15 bg-white p-5 md:p-6" aria-label={content.contribution.internationalTransferTitle}>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Globe2 size={19} aria-hidden="true" />
            </div>
            <h3 className="min-w-0 flex-1 font-serif text-2xl text-brand">{content.contribution.internationalTransferTitle}</h3>
            {REFORESTATION_CONTRIBUTION.sepa.isSample && <span className="rounded-full bg-[#fff1c2] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#76570d]">{content.contribution.sepaSampleBadge}</span>}
          </div>
          {REFORESTATION_CONTRIBUTION.sepa.isSample && <p className="mb-5 rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm font-medium leading-relaxed text-amber-900">{content.contribution.sepaWarning}</p>}
          <div className="space-y-3">
            {renderCopyField(content.contribution.ibanLabel, REFORESTATION_CONTRIBUTION.sepa.iban, 'iban', content.contribution.copyIban)}
            <div className="grid gap-3 sm:grid-cols-2">
              {renderCopyField(content.contribution.bicLabel, REFORESTATION_CONTRIBUTION.sepa.bic, 'bic', content.contribution.copyBic)}
              <dl className="rounded-xl bg-bone/70 p-4 text-sm text-gray-500">
                {REFORESTATION_CONTRIBUTION.sepa.bankName && <div><dt className="inline font-semibold text-gray-700">{content.contribution.bankLabel}:</dt> <dd className="inline">{REFORESTATION_CONTRIBUTION.sepa.bankName}</dd></div>}
                <div className={REFORESTATION_CONTRIBUTION.sepa.bankName ? 'mt-2' : ''}><dt className="inline font-semibold text-gray-700">{content.contribution.currencyLabel}:</dt> <dd className="inline">{REFORESTATION_CONTRIBUTION.sepa.currency}</dd></div>
              </dl>
            </div>
            <dl className="rounded-xl bg-bone/70 p-4 text-sm text-gray-500">
              <div><dt className="inline font-semibold text-gray-700">{content.contribution.holderLabel}:</dt> <dd className="inline">{REFORESTATION_CONTRIBUTION.sepa.accountHolder}</dd></div>
            </dl>
          </div>
        </section>
      )}

      {hasCrypto && (!method || method === 'crypto') && (
        <section className="rounded-2xl border border-brand/15 bg-white p-5 md:p-6" aria-label={content.contribution.cryptoTransferTitle}>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Coins size={19} aria-hidden="true" />
            </div>
            <h3 className="min-w-0 flex-1 font-serif text-2xl text-brand">{content.contribution.cryptoTransferTitle}</h3>
          </div>
          {REFORESTATION_CONTRIBUTION.crypto.isSample && <p className="mb-5 rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm font-medium leading-relaxed text-amber-900">{content.contribution.cryptoWarning}</p>}
          <p className="mb-5 rounded-xl border border-brand/10 bg-brand/[0.04] px-4 py-3 text-sm leading-relaxed text-gray-600">{content.contribution.cryptoNetworkNote}</p>
          <div className="scrollbar-hide flex snap-x gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
            {([
              ['USDC', 'usdc', REFORESTATION_CONTRIBUTION.crypto.usdc],
              ['BTC', 'btc', REFORESTATION_CONTRIBUTION.crypto.btc],
              ['ETH', 'eth', REFORESTATION_CONTRIBUTION.crypto.eth],
            ] as const).map(([asset, field, wallet]) => (
              <article key={asset} className="flex min-w-[17rem] flex-1 snap-start flex-col rounded-xl border border-brand/10 bg-bone/70 p-4 md:min-w-0">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CryptoAssetIcon asset={asset} />
                    <div>
                      <h4 className="font-serif text-2xl leading-none text-brand">{asset}</h4>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{content.contribution.cryptoMethod}</p>
                    </div>
                  </div>
                  {wallet.isSample && <span className="rounded-full bg-[#fff1c2] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#76570d]">{content.contribution.cryptoSampleBadge}</span>}
                </div>
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-brand/10 bg-white/80 px-3 py-2 text-gray-600">
                  <CryptoNetworkIcon asset={asset} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400">{content.contribution.networkLabel}</p>
                    <p className="truncate text-xs font-semibold text-brand">{wallet.network}</p>
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">{content.contribution.walletLabel}</p>
                  <code className="block truncate text-sm font-semibold text-brand" title={wallet.address}>{trimWalletAddress(wallet.address)}</code>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCryptoQr({ asset, address: wallet.address, network: wallet.network })}
                      className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-full border border-brand/15 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-brand transition-colors hover:border-gold hover:bg-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    >
                      <QrCode size={16} aria-hidden="true" />
                      {content.contribution.scanQr}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyValue(field, wallet.address)}
                      aria-label={content.contribution.copyWallet.replace('{asset}', asset)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand/15 bg-white text-brand transition-colors hover:border-gold hover:bg-gold hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    >
                      {copiedField === field ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  const impactIcons = [TreePine, Sprout, Users];
  const useIcons = [Sprout, ShieldCheck, Heart, Leaf];
  const phaseIcons = [Target, Sprout, Heart, TreePine];

  return (
    <div className="bg-bone text-dark overflow-x-hidden">
      <Header />

      <main>
        <section className="relative min-h-[720px] md:min-h-[94vh] flex items-end overflow-hidden pt-32">
          <img
            src={HERO_IMAGE}
            alt={content.hero.imageAlt}
            className="absolute inset-0 h-full w-full object-cover object-center"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071d14]/95 via-[#071d14]/65 to-[#071d14]/25" />
          <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-16 md:pb-24">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.28em] text-gold drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">
              {content.hero.eyebrow}
            </p>
            <h1 className="max-w-4xl text-white font-serif text-5xl sm:text-6xl md:text-7xl leading-[0.98] font-light mb-6">
              {content.hero.title}
            </h1>
            <p className="max-w-2xl text-white/80 text-lg md:text-xl font-light leading-relaxed mb-7">
              {content.hero.description}
            </p>
            <div className="mb-8 max-w-xl rounded-2xl border border-white/15 bg-[#071d14]/45 p-4 backdrop-blur-sm md:p-5">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-white">
                <p>
                  <span className="font-serif text-2xl md:text-3xl">{currencyFormatter.format(displayedRaisedAmount)}</span>{' '}
                  <span className="text-sm text-white/70">{content.hero.raisedLabel}</span>
                </p>
                <p className="text-sm font-semibold text-gold">{displayedPercentage}% {content.hero.ofGoal} {currencyFormatter.format(displayedPhaseOneGoal)}</p>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label={content.funding.progressLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, displayedPercentage)}>
                <div className="h-full rounded-full bg-gold" style={{ width: `${Math.max(3, progressPercentage)}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/85">
                {daysLeft !== null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                    <CalendarDays size={14} className="text-gold" aria-hidden="true" />
                    {daysLeft === 0 ? content.hero.lastDay : content.hero.daysLeft.replace('{days}', String(daysLeft))}
                  </span>
                )}
                <a href="#voucher" className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-brand transition-opacity hover:opacity-90">
                  <Ticket size={14} aria-hidden="true" />
                  {content.hero.voucherBadge}
                </a>
                {donorsCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                    <Users size={14} className="text-gold" aria-hidden="true" />
                    {content.hero.donors.replace('{count}', String(donorsCount))}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#aportar" className="btn-gold btn-icon-inline">
                {content.hero.primaryCta}
                <ArrowDown size={17} aria-hidden="true" />
              </a>
              <a href="#impacto" className="btn-glass inline-flex items-center justify-center">
                {content.hero.secondaryCta}
              </a>
            </div>
          </div>
        </section>

        <section id="impacto" className="relative overflow-hidden bg-white px-6 py-20 md:py-28">
          <img
            src={IMPACT_BACKGROUND_IMAGE}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.38]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/82 via-white/76 to-white/90" aria-hidden="true" />
          <div className="relative max-w-6xl mx-auto">
            <div data-reveal>
              <div className="max-w-3xl mx-auto text-center mb-14">
                <p className="text-brand text-[11px] uppercase tracking-[0.25em] font-bold mb-4">{content.impact.eyebrow}</p>
                <h2 className="font-serif text-4xl md:text-5xl text-brand leading-tight mb-6">{content.impact.title}</h2>
                <p className="text-gray-600 text-lg font-light leading-relaxed">{content.impact.description}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {content.impact.stats.map((stat: { value: string; label: string; description: string; href: string; action: string }, index: number) => {
                const Icon = impactIcons[index];
                return (
                  <div data-reveal data-delay={String(index + 1)} key={stat.label}>
                    <a href={stat.href} className="group block h-full rounded-2xl border border-brand/10 bg-bone p-7 text-center transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                      <Icon size={30} strokeWidth={1.5} className="mx-auto text-gold mb-5" aria-hidden="true" />
                      <p className="font-serif text-4xl text-brand mb-2">{stat.value}</p>
                      <h3 className="font-semibold text-dark mb-3">{stat.label}</h3>
                      <p className="text-sm text-gray-500 font-light leading-relaxed">{stat.description}</p>
                      <span className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-brand/20 bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand shadow-sm transition-all group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                        {stat.action}
                        <ArrowRight size={15} aria-hidden="true" />
                      </span>
                    </a>
                  </div>
                );
              })}
            </div>
            <div data-reveal>
              <div className="mt-16">
                <PracticasRegenerativas variant="light" />
              </div>
            </div>
            <div data-reveal>
              <div className="mt-16">
                <AliadosAmbientales />
              </div>
            </div>
          </div>
        </section>

        <section id="metas" className="relative overflow-hidden bg-bone px-6 py-20 md:py-28">
          <img
            src={FUNDING_BACKGROUND_IMAGE}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.28]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-bone/82" aria-hidden="true" />
          <div className="relative max-w-6xl mx-auto">
            <div data-reveal className="max-w-3xl mx-auto text-center mb-12">
              <p className="text-brand text-[11px] uppercase tracking-[0.25em] font-bold mb-4">{content.funding.eyebrow}</p>
              <h2 className="font-serif text-4xl md:text-5xl text-brand leading-tight mb-6">{content.funding.title}</h2>
              <p className="text-gray-600 text-lg font-light leading-relaxed">{content.funding.description}</p>
            </div>

            <ol className="relative grid gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-4 before:hidden lg:before:block lg:before:absolute lg:before:left-[12.5%] lg:before:right-[12.5%] lg:before:top-8 lg:before:h-px lg:before:bg-brand/15">
              {content.funding.phases.map((phase: { number: string; status: string; title: string; goal: string; description: string }, index: number) => {
                const Icon = phaseIcons[index] ?? Sprout;
                return (
                  <li key={phase.number} data-reveal data-delay={String(index + 1)} className="relative flex">
                    <article className={`flex w-full flex-col rounded-2xl border p-6 transition-transform duration-300 hover:-translate-y-1 md:p-7 ${index === 0 ? 'bg-white border-gold/50 shadow-[0_16px_45px_rgba(0,83,51,0.11)]' : 'bg-white/70 border-brand/10 shadow-[0_8px_28px_rgba(0,83,51,0.04)]'}`}>
                      <div className="mb-6 flex items-start justify-between gap-3">
                        <div className={`relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[6px] border-bone ${index === 0 ? 'bg-brand text-gold' : 'bg-[#e7efeb] text-brand'}`}>
                          <Icon size={23} strokeWidth={1.5} aria-hidden="true" />
                          <span className={`absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white px-1 text-[10px] font-bold ${index === 0 ? 'bg-gold text-brand' : 'bg-white text-brand shadow-sm'}`}>
                            {index + 1}
                          </span>
                        </div>
                        <span className={`mt-1 rounded-full px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] font-bold text-center ${index === 0 ? 'bg-gold/20 text-[#76570d]' : 'bg-gray-100 text-gray-500'}`}>{phase.status}</span>
                      </div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{phase.number}</p>
                      <h3 className="mb-4 font-serif text-[1.7rem] leading-tight text-brand">{phase.title}</h3>
                      <div className={`mb-4 flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm font-semibold ${index === 0 ? 'bg-gold/10 text-[#76570d]' : 'bg-brand/[0.055] text-brand'}`}>
                        <Target size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{phase.goal}</span>
                      </div>
                      <p className="mt-auto text-sm font-light leading-relaxed text-gray-600">{phase.description}</p>
                    </article>
                  </li>
                );
              })}
            </ol>
            <div data-reveal className="mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-brand/10 bg-white/65 p-5 sm:flex-row sm:flex-wrap md:p-6">
              <a href="#aportar" className="btn-gold btn-icon-inline">
                <Heart size={18} aria-hidden="true" />
                {content.funding.cta}
              </a>
              <a href={`${ROUTES.VOLUNTARIADO}#convocatorias`} className="inline-flex items-center justify-center gap-2 rounded-full border border-brand/20 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-brand transition-colors hover:border-brand hover:bg-brand hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                <HandHeart size={18} aria-hidden="true" />
                {content.funding.volunteerCta}
              </a>
              <a href={language === 'es' ? '#mapas' : '#maps'} className="inline-flex items-center justify-center gap-2 rounded-full border border-brand/20 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-brand transition-colors hover:border-brand hover:bg-brand hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                <MapPinned size={18} aria-hidden="true" />
                {content.funding.mapsCta}
              </a>
            </div>
          </div>
        </section>

        <section id="avances" className="py-14 md:py-20 px-6 bg-[#eef3ed] scroll-mt-24">
          <div className="max-w-6xl mx-auto">
            <div data-reveal className="max-w-3xl mx-auto text-center">
              <p className="text-brand text-[11px] uppercase tracking-[0.25em] font-bold mb-4">{content.updates.eyebrow}</p>
              <h2 className="font-serif text-3xl md:text-4xl text-brand leading-tight mb-4">{content.updates.title}</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-6">{content.updates.description}</p>
              <button
                type="button"
                onClick={() => setLogOpen(open => !open)}
                aria-expanded={logOpen}
                aria-controls="bitacora-fases"
                className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-brand transition-colors hover:border-brand hover:bg-brand hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <Camera size={17} aria-hidden="true" />
                {logOpen ? content.updates.toggleClose : content.updates.toggleOpen}
                <ChevronDown size={17} className={`transition-transform ${logOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            </div>

            {/* Siempre en el DOM (oculto con `hidden`) para que el IntersectionObserver
                de data-reveal ya los observe y aparezcan al abrir la bitácora. */}
            <div id="bitacora-fases" hidden={!logOpen} className="mt-12 space-y-8">
              {content.updates.phases.map((phase: {
                number: string;
                title: string;
                status: string;
                description: string;
                plannedDate?: string;
                note?: string;
                steps: Array<{ title: string; status: string; state: 'active' | 'completed' | 'upcoming' }>;
                photos: PhaseMedia[];
              }, phaseIndex: number) => {
                const Icon = phaseIcons[phaseIndex] ?? Sprout;
                return (
                  <article key={phase.number} data-reveal className="rounded-3xl border border-brand/10 bg-white p-6 md:p-9 shadow-[0_16px_50px_rgba(0,83,51,0.07)]">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-7">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex shrink-0 items-center justify-center ${phaseIndex === 0 ? 'bg-brand text-gold' : 'bg-brand/10 text-brand'}`}>
                          <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-1">{phase.number}</p>
                          <h3 className="font-serif text-3xl text-brand">{phase.title}</h3>
                        </div>
                      </div>
                      <span className={`self-start rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] font-bold ${phaseIndex === 0 ? 'bg-gold/20 text-[#76570d]' : 'bg-gray-100 text-gray-500'}`}>{phase.status}</span>
                    </div>
                    <p className="max-w-3xl text-gray-600 font-light leading-relaxed mb-7">{phase.description}</p>
                    {phase.plannedDate && (
                      <p className="mb-7 inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">
                        <CalendarDays size={17} aria-hidden="true" />
                        {phase.plannedDate}
                      </p>
                    )}

                    {phase.steps.length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-3 mb-8">
                        {phase.steps.map((step, stepIndex) => (
                          <div key={step.title} className={`flex items-center gap-3 rounded-xl border px-4 py-4 ${step.state === 'active' ? 'border-gold/45 bg-gold/10' : step.state === 'completed' ? 'border-brand/25 bg-brand/5' : 'border-brand/10 bg-bone'}`}>
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step.state === 'active' ? 'bg-gold text-brand' : step.state === 'completed' ? 'bg-brand text-white' : 'bg-brand/10 text-brand'}`}>
                              {step.state === 'completed' ? <Check size={16} aria-hidden="true" /> : stepIndex + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-dark">{step.title}</p>
                              <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] font-bold ${step.state === 'active' ? 'bg-gold/25 text-[#76570d]' : step.state === 'completed' ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-500'}`}>{step.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {phase.photos.length > 0 ? (
                      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4" aria-label={content.updates.carouselLabel}>
                        {phase.photos.map((photo, mediaIndex) => (
                          <figure key={photo.src} className="flex w-[68vw] max-w-72 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-brand/10 bg-white shadow-lg sm:w-72">
                            <button
                              type="button"
                              onClick={() => setExpandedGallery({ items: phase.photos, index: mediaIndex })}
                              className="group relative block aspect-square w-full overflow-hidden bg-bone focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-gold"
                              aria-label={`${content.updates.goTo}: ${photo.alt}`}
                            >
                              {photo.type === 'video' ? (
                                <>
                                  <video muted playsInline preload="metadata" className="pointer-events-none h-full w-full object-cover" aria-hidden="true">
                                    <source src={photo.src} />
                                  </video>
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/15 transition-colors group-hover:bg-black/25" aria-hidden="true">
                                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-brand shadow-xl">
                                      <Play size={24} className="ml-1" fill="currentColor" />
                                    </span>
                                  </span>
                                </>
                              ) : (
                                <img src={photo.src} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" decoding="async" />
                              )}
                            </button>
                            <figcaption className="min-h-20 flex-1 p-4 text-sm leading-relaxed text-gray-600">{photo.caption}</figcaption>
                          </figure>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 rounded-xl border border-dashed border-brand/20 bg-bone/70 px-5 py-6 text-center sm:text-left">
                        <Camera size={23} strokeWidth={1.5} className="text-gold" aria-hidden="true" />
                        <p className="text-sm text-gray-500 font-light">{content.updates.noPhotos}</p>
                      </div>
                    )}

                    {phase.note && (
                      <p className="mt-5 rounded-xl border border-gold/25 bg-gold/10 px-5 py-4 text-sm text-gray-600 leading-relaxed">
                        {phase.note}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="aportar" className="bg-bone px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div data-reveal className="mx-auto mb-10 max-w-4xl text-center">
              <div className="mb-4 flex items-center justify-center gap-4">
                <span className="h-px w-12 bg-brand/35" aria-hidden="true" />
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand">{content.contribution.eyebrow}</p>
                <span className="h-px w-12 bg-brand/35" aria-hidden="true" />
              </div>
              <h2 className="mb-4 font-serif text-4xl leading-tight text-brand md:text-6xl">{content.contribution.title}</h2>
              <p className="text-lg font-light leading-relaxed text-gray-600 md:text-xl">{content.contribution.description}</p>
            </div>

            <div data-reveal data-delay="1" className="mb-6 rounded-2xl border border-brand/10 bg-white/90 p-6 shadow-[0_14px_45px_rgba(0,83,51,0.07)] md:p-7">
              <div className="grid items-center gap-6 lg:grid-cols-[0.85fr_1.35fr_auto]">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Sprout size={27} strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand/60">{content.contribution.activeGoalLabel}</p>
                    <h3 className="font-serif text-3xl text-brand">{content.funding.phases[0].title}</h3>
                  </div>
                </div>
                <div>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-brand">
                    <p><span className="font-serif text-3xl md:text-4xl">{currencyFormatter.format(displayedRaisedAmount)}</span> <span className="text-sm text-gray-500">{content.funding.currentLabel.toLowerCase()}</span></p>
                    <p className="text-sm font-semibold">{displayedPercentage}% · {currencyFormatter.format(displayedPhaseOneGoal)}</p>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-brand/10" role="progressbar" aria-label={content.funding.progressLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, displayedPercentage)}>
                    <div className="flex h-full min-w-[2.5rem] items-center justify-center rounded-full bg-gradient-to-r from-[#d6a91e] to-gold text-[10px] font-bold text-white transition-[width] duration-700" style={{ width: `${Math.max(4, progressPercentage)}%` }}>
                      {displayedPercentage}%
                    </div>
                  </div>
                </div>
                <a href="#metas" className="inline-flex items-center justify-center gap-2 border-b border-gold pb-1 text-sm font-semibold text-brand transition-colors hover:text-gold">
                  {content.contribution.progressCta}
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
            </div>

            <div data-reveal data-delay="2">
              <div id="voucher" className="mb-10 scroll-mt-28 overflow-hidden rounded-2xl border-2 border-gold/70 bg-white shadow-[0_20px_65px_rgba(212,175,55,0.16)]">
                <div className="grid min-w-0 lg:grid-cols-[1fr_1fr]">
                  <div className="min-w-0 bg-brand p-7 text-white md:p-10">
                    <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
                      <Ticket size={16} aria-hidden="true" />
                      {content.voucher.eyebrow}
                    </p>
                    <h3 className="mb-4 font-serif text-3xl leading-tight md:text-4xl">{content.voucher.title}</h3>
                    <p className="mb-7 font-light leading-relaxed text-white/70">{content.voucher.description}</p>
                    <div className="mb-7 grid grid-cols-2 gap-3">
                      {content.voucher.priceOptions.map((option: { label: string; price: string }) => (
                        <div key={option.price} className="rounded-xl border border-gold/40 bg-white/[0.06] p-4 text-center">
                          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/60">{option.label}</p>
                          <p className="mt-1 font-serif text-2xl text-gold md:text-3xl">{option.price}</p>
                          <p className="mt-1 text-xs font-semibold text-white/75">
                            {content.voucher.treesEquivalent.replace('{trees}', formatTrees(Number(option.price.replace(/\D/g, ''))))}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3 text-white/80">
                      {content.voucher.benefits.map((benefit: string) => (
                        <p key={benefit} className="flex gap-3 leading-relaxed">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold"><Check size={15} aria-hidden="true" /></span>
                          <span className="pt-0.5">{benefit}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-0 p-7 md:p-10">
                    <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-brand/60">{content.voucher.stepsTitle}</p>
                    <ol className="mb-5 space-y-3">
                      {content.voucher.steps.map((step: string, index: number) => (
                        <li key={step} className="flex gap-3 leading-relaxed text-gray-600">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{index + 1}</span>
                          <span className="pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                    {hasAlias && (
                      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-brand/15 bg-bone p-4 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">{content.contribution.aliasLabel}</p>
                          <code className="break-all text-xl font-semibold text-brand">{REFORESTATION_CONTRIBUTION.alias}</code>
                          {REFORESTATION_CONTRIBUTION.accountHolder && (
                            <p className="text-xs text-gray-500">{content.contribution.holderLabel}: {REFORESTATION_CONTRIBUTION.accountHolder}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => copyValue('alias', REFORESTATION_CONTRIBUTION.alias)}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-gold hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                        >
                          {copiedField === 'alias' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                          {copiedField === 'alias' ? content.contribution.copied : content.contribution.copy}
                        </button>
                      </div>
                    )}
                    <a href={voucherWhatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-gold btn-icon-inline w-full">
                      <MessageCircle size={18} aria-hidden="true" />
                      {content.voucher.cta}
                    </a>
                  </div>
                </div>
              </div>
              <p className="mb-5 text-center font-serif text-2xl text-brand">{content.voucher.orLabel}</p>
            </div>

            <div data-reveal data-delay="2" className="overflow-hidden rounded-2xl border border-brand/10 bg-white shadow-[0_20px_65px_rgba(0,83,51,0.08)]">
              <div className="grid min-w-0 lg:grid-cols-[0.72fr_1.55fr]">
                <aside className="min-w-0 border-b border-white/10 bg-brand p-7 text-white md:p-10 lg:border-b-0 lg:border-r">
                  <h3 className="mb-5 font-serif text-4xl text-white">{content.contribution.cardTitle}</h3>
                  <div className="mb-6 h-0.5 w-16 bg-gold" aria-hidden="true" />
                  <p className="mb-6 text-lg font-light leading-relaxed text-white/70">{content.contribution.cardDescription} {content.contribution.treePrice}</p>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">{content.contribution.amountsTitle}</p>
                  <div className="mb-8 grid grid-cols-2 gap-2" role="radiogroup" aria-label={content.contribution.amountsTitle}>
                    {content.contribution.amounts.map((amount: number) => {
                      const selected = selectedAmount === amount;
                      return (
                        <button
                          key={amount}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setSelectedAmount(selected ? null : amount)}
                          className={`rounded-xl border px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${selected ? 'border-gold bg-gold text-brand' : 'border-white/20 bg-white/[0.06] text-white hover:border-gold/60'}`}
                        >
                          <span className="block font-serif text-lg leading-tight">{currencyFormatter.format(amount)}</span>
                          <span className={`block text-[11px] font-semibold ${selected ? 'text-brand/80' : 'text-white/60'}`}>{content.contribution.treesLabel.replace('{trees}', formatTrees(amount))}</span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selectedAmount === null}
                      onClick={() => setSelectedAmount(null)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${selectedAmount === null ? 'border-gold bg-gold text-brand' : 'border-white/20 bg-white/[0.06] text-white hover:border-gold/60'}`}
                    >
                      {content.contribution.otherAmount}
                    </button>
                  </div>
                  <div className="space-y-5 text-white/75">
                    {content.contribution.notes.map((note: string) => (
                      <p key={note} className="flex gap-3 leading-relaxed">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold"><Check size={16} aria-hidden="true" /></span>
                        <span className="pt-1">{note}</span>
                      </p>
                    ))}
                  </div>
                </aside>

                <div className="min-w-0 p-6 md:p-8 lg:p-10">
                  {hasAlias || hasSepa || hasCrypto ? (
                    <>
                      <div className="mb-5 flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white ring-4 ring-brand/10">1</span>
                        <h3 className="font-serif text-3xl text-brand">{content.contribution.chooseMethodTitle}</h3>
                      </div>
                      <div className="scrollbar-hide mb-5 flex w-full min-w-0 snap-x gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0" role="tablist" aria-label={content.contribution.chooseMethodTitle}>
                        {([
                          { id: 'argentina', label: content.contribution.argentinaMethod, status: content.contribution.availableLabel, Icon: Building2, disabled: !hasAlias },
                          { id: 'sepa', label: content.contribution.sepaMethod, status: REFORESTATION_CONTRIBUTION.sepa.isSample ? content.contribution.comingSoonLabel : content.contribution.availableLabel, Icon: Globe2, disabled: REFORESTATION_CONTRIBUTION.sepa.isSample || !hasSepa },
                          { id: 'crypto', label: content.contribution.cryptoMethod, status: content.contribution.partialLabel, Icon: Coins, disabled: !hasCrypto },
                        ] as const).map(({ id, label, status, Icon, disabled }) => {
                          const selected = selectedContributionMethod === id;
                          return (
                            <button
                              key={id}
                              type="button"
                              role="tab"
                              aria-selected={selected}
                              disabled={disabled}
                              onClick={() => setSelectedContributionMethod(id)}
                              className={`min-w-[9.5rem] flex-1 snap-start rounded-xl border p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:min-w-0 ${selected ? 'border-brand bg-brand/[0.04] shadow-sm' : 'border-brand/10 bg-bone/40 hover:border-brand/30'} disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <Icon size={21} className={selected ? 'text-brand' : 'text-gray-400'} aria-hidden="true" />
                                <span className={`h-5 w-5 rounded-full border-2 ${selected ? 'border-brand bg-brand shadow-[inset_0_0_0_4px_white]' : 'border-gray-300'}`} aria-hidden="true" />
                              </div>
                              <p className="font-serif text-lg text-brand">{label}</p>
                              <span className="mt-2 inline-flex rounded-full bg-brand/[0.07] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-brand/65">{status}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div role="tabpanel">{renderTransferOptions(selectedContributionMethod)}</div>
                      <div className="mt-5 flex gap-4 rounded-xl border border-gold/60 bg-gold/[0.08] p-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-bold text-brand">2</span>
                        <div>
                          <p className="font-serif text-xl text-brand">{content.contribution.afterTransferTitle}</p>
                          <p className="mt-1 text-sm leading-relaxed text-gray-600">{content.contribution.afterTransferDescription}</p>
                        </div>
                      </div>
                      <a href={confirmationWhatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-gold btn-icon-inline mt-5 w-full">
                        <MessageCircle size={18} aria-hidden="true" />
                        {content.contribution.confirmCta}
                      </a>
                    </>
                  ) : (
                    <div className="py-4 text-center">
                      <MessageCircle size={36} strokeWidth={1.5} className="mx-auto mb-5 text-gold" aria-hidden="true" />
                      <h3 className="mb-4 font-serif text-3xl text-brand">{content.contribution.fallbackTitle}</h3>
                      <p className="mb-7 font-light leading-relaxed text-gray-500">{content.contribution.fallbackDescription}</p>
                      <a href={requestContributionDataWhatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-gold btn-icon-inline">
                        <MessageCircle size={18} aria-hidden="true" />
                        {content.contribution.fallbackCta}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div data-reveal data-delay="2">
              <div className="mt-8 flex flex-col gap-6 rounded-2xl border border-gold/50 bg-white p-6 shadow-[0_14px_45px_rgba(0,83,51,0.07)] md:flex-row md:items-center md:p-8">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[#76570d]">
                  <Gift size={28} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand/60">{content.gift.eyebrow}</p>
                  <h3 className="mb-2 font-serif text-3xl text-brand">{content.gift.title}</h3>
                  <p className="font-light leading-relaxed text-gray-600">{content.gift.description}</p>
                  <p className="mt-2 flex gap-2 text-sm leading-relaxed text-gray-500">
                    <MapPinned size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                    {content.gift.certificate}
                  </p>
                </div>
                <a href={giftWhatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-gold btn-icon-inline shrink-0">
                  <MessageCircle size={18} aria-hidden="true" />
                  {content.gift.cta}
                </a>
              </div>
            </div>
            <p className="mx-auto mt-6 max-w-3xl text-center text-xs font-light leading-relaxed text-gray-400">{content.contribution.legalNote}</p>
          </div>
        </section>

        <section className="bg-brand py-20 md:py-28 px-6 text-white">
          <div className="max-w-6xl mx-auto">
            <div data-reveal>
              <div className="max-w-3xl mb-14">
                <p className="text-gold text-[11px] uppercase tracking-[0.25em] font-bold mb-4">{content.use.eyebrow}</p>
                <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-6">{content.use.title}</h2>
                <p className="text-white/70 text-lg font-light leading-relaxed">{content.use.description}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {content.use.items.map((item: { title: string; description: string }, index: number) => {
                const Icon = useIcons[index];
                return (
                  <div data-reveal data-delay={String(index + 1)} key={item.title}>
                    <article className="h-full rounded-2xl border border-white/15 bg-white/5 p-6">
                      <Icon size={28} strokeWidth={1.5} className="text-gold mb-5" aria-hidden="true" />
                      <h3 className="font-serif text-2xl mb-3">{item.title}</h3>
                      <p className="text-white/65 text-sm font-light leading-relaxed">{item.description}</p>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id={language === 'es' ? 'voluntariado' : 'volunteering'} className="bg-bone px-6 py-20 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div data-reveal className="overflow-hidden rounded-3xl border border-gold/25 bg-gold/10 p-7 shadow-[0_18px_60px_rgba(0,83,51,0.08)] md:p-10 lg:p-12">
              <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
                <div>
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-gold">
                    <HandHeart size={28} strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-brand">{content.volunteering.eyebrow}</p>
                  <h2 className="mb-6 font-serif text-4xl leading-tight text-brand md:text-5xl">{content.volunteering.title}</h2>
                  <p className="text-lg font-light leading-relaxed text-gray-600">{content.volunteering.description}</p>
                </div>
                <ul className="space-y-4">
                  {content.volunteering.items.map((item: string) => (
                    <li key={item} className="flex gap-3 text-gray-700">
                      <Check size={20} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-14">
              <div data-reveal className="mx-auto mb-10 max-w-3xl text-center">
                <CalendarDays size={34} strokeWidth={1.5} className="mx-auto mb-5 text-gold" aria-hidden="true" />
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-brand">{content.volunteering.scheduleEyebrow}</p>
                <h3 className="mb-5 font-serif text-4xl leading-tight text-brand md:text-5xl">{content.volunteering.scheduleTitle}</h3>
                <p className="text-lg font-light leading-relaxed text-gray-600">{content.volunteering.scheduleDescription}</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{content.volunteering.eventDetails}</p>
              </div>

              <HorizontalCardRail previousLabel={t.ui.prev} nextLabel={t.ui.next} desktopGridClassName="md:grid-cols-2" gapClassName="gap-6">
                {reforestationEvents.map((event: any, index: number) => (
                  <article key={`${event.date}-${event.title}`} data-reveal data-delay={String(index + 1)} className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand/10 bg-white shadow-[0_12px_35px_rgba(0,83,51,0.08)]">
                    <div className="relative aspect-[16/9] overflow-hidden bg-brand/5">
                      <img src={event.image} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]" loading="lazy" decoding="async" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071d14]/75 via-transparent to-transparent" />
                      <span className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand">{content.volunteering.eventBadge}</span>
                      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white">
                        <CalendarDays size={16} className="text-gold" aria-hidden="true" />
                        {event.date}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-6 md:p-7">
                      <h4 className="mb-3 font-serif text-3xl leading-tight text-brand">{event.title}</h4>
                      <p className="mb-5 flex-1 font-light leading-relaxed text-gray-600">{event.desc}</p>
                      <div className="mb-5 rounded-xl bg-brand/5 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand/60">{content.volunteering.eventGoalLabel}</p>
                        <p className="mt-1 font-serif text-xl text-brand">{content.volunteering.eventGoal}</p>
                      </div>
                      <a href={getVolunteerWhatsappUrl(event)} target="_blank" rel="noopener noreferrer" className="btn-gold btn-icon-inline self-start">
                        <MessageCircle size={18} aria-hidden="true" />
                        {content.volunteering.cta}
                      </a>
                    </div>
                  </article>
                ))}
              </HorizontalCardRail>
            </div>
          </div>
        </section>

        <section id={language === 'es' ? 'mapas' : 'maps'} className="bg-white px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div data-reveal className="mx-auto mb-12 max-w-3xl text-center">
              <MapPinned size={34} strokeWidth={1.5} className="mx-auto mb-5 text-gold" aria-hidden="true" />
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-brand">{content.maps.eyebrow}</p>
              <h2 className="mb-6 font-serif text-4xl leading-tight text-brand md:text-5xl">{content.maps.title}</h2>
              <p className="text-lg font-light leading-relaxed text-gray-600">{content.maps.description}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {content.maps.areas.map((area: { status: string; title: string; description: string; image: string; imageAlt: string }, index: number) => (
                <article key={area.title} data-reveal data-delay={String(index + 1)} className="overflow-hidden rounded-2xl border border-brand/10 bg-bone shadow-[0_12px_35px_rgba(0,83,51,0.07)]">
                  <button type="button" onClick={() => setExpandedGallery({ items: [{ src: area.image, alt: area.imageAlt, caption: area.title }], index: 0 })} className="group block aspect-[16/10] w-full overflow-hidden bg-brand/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-gold" aria-label={`${content.updates.goTo}: ${area.imageAlt}`}>
                    <img src={area.image} alt={area.imageAlt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" loading="lazy" decoding="async" />
                  </button>
                  <div className="p-7 md:p-8">
                    <span className="mb-5 inline-flex rounded-full bg-brand/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand">{area.status}</span>
                    <h3 className="mb-3 font-serif text-3xl text-brand">{area.title}</h3>
                    <p className="font-light leading-relaxed text-gray-600">{area.description}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-6 rounded-xl border border-gold/25 bg-gold/10 px-5 py-4 text-center text-sm leading-relaxed text-gray-600">{content.maps.note}</p>
          </div>
        </section>

        <ReforestacionTransparencia raised={currencyFormatter.format(displayedRaisedAmount)} />

        <section className="bg-brand px-6 py-12 text-white md:py-14">
          <div data-reveal>
            <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-brand">
                  <Building2 size={24} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.25em] text-gold">{content.corporate.eyebrow}</p>
                  <h2 className="mb-2 font-serif text-3xl leading-tight">{content.corporate.title}</h2>
                  <p className="max-w-2xl font-light leading-relaxed text-white/75">{content.corporate.description}</p>
                </div>
              </div>
              <div className="flex min-w-0 shrink-0 flex-col gap-3 sm:flex-row">
                <a href={ROUTES.EMPRESAS} className="btn-gold btn-icon-inline !w-full !max-w-full !whitespace-normal text-center !leading-snug sm:!w-auto">
                  {content.corporate.cta}
                  <ArrowRight size={18} className="shrink-0" aria-hidden="true" />
                </a>
                <a href={corporateWhatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-glass btn-icon-inline !w-full !max-w-full !whitespace-normal text-center !leading-snug sm:!w-auto">
                  <MessageCircle size={18} className="shrink-0" aria-hidden="true" />
                  {content.corporate.contactCta}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="preguntas" className="bg-bone px-6 py-20 md:py-24">
          <div className="mx-auto max-w-3xl">
            <div data-reveal className="mb-10 text-center">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-brand">{content.faq.eyebrow}</p>
              <h2 className="font-serif text-4xl leading-tight text-brand md:text-5xl">{content.faq.title}</h2>
            </div>
            <div className="space-y-3">
              {content.faq.items.map((item: { q: string; a: string }, index: number) => {
                const open = openFaq === index;
                return (
                  <div key={item.q} className="overflow-hidden rounded-2xl border border-brand/10 bg-white">
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? null : index)}
                        aria-expanded={open}
                        aria-controls={`faq-${index}`}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-brand transition-colors hover:bg-brand/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold md:px-6"
                      >
                        {item.q}
                        <ChevronDown size={20} className={`shrink-0 text-gold transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </button>
                    </h3>
                    <div id={`faq-${index}`} hidden={!open} className="px-5 pb-5 font-light leading-relaxed text-gray-600 md:px-6">
                      {item.a}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative py-24 md:py-32 px-6 overflow-hidden">
          <img
            src="/uploads/reforestacion/plantacion-detalle.jpeg"
            alt={content.closing.imageAlt}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-[#071d14]/78" />
          <div data-reveal>
            <div className="relative z-10 max-w-3xl mx-auto text-center text-white">
              <Leaf size={34} strokeWidth={1.5} className="text-gold mx-auto mb-6" aria-hidden="true" />
              <h2 className="font-serif text-4xl md:text-6xl leading-tight mb-6">{content.closing.title}</h2>
              <p className="text-white/75 text-lg font-light leading-relaxed mb-8">{content.closing.description}</p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href="#aportar" className="btn-gold inline-flex items-center justify-center">{content.closing.cta}</a>
                <a href={shareWhatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-glass btn-icon-inline">
                  <Share2 size={18} aria-hidden="true" />
                  {content.share.cta}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {copiedField && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-[8000] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-full border border-white/15 bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-[0_16px_45px_rgba(0,45,28,0.35)]"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold text-brand">
            <Check size={16} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span>{content.contribution.copyConfirmation}</span>
        </div>
      )}

      {cryptoQr && (
        <div
          className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#071d14]/85 px-4 py-8 backdrop-blur-sm"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setCryptoQr(null);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="crypto-qr-title" className="relative w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl md:p-9">
            <button
              type="button"
              onClick={() => setCryptoQr(null)}
              aria-label={content.contribution.closeQr}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-bone hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <X size={21} aria-hidden="true" />
            </button>
            <div className="mx-auto mb-4 flex w-fit items-center gap-3">
              <CryptoAssetIcon asset={cryptoQr.asset} />
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">{content.contribution.networkLabel}</p>
                <p className="font-semibold text-brand">{cryptoQr.network}</p>
              </div>
            </div>
            <h2 id="crypto-qr-title" className="mb-2 font-serif text-3xl text-brand">{content.contribution.qrTitle.replace('{asset}', cryptoQr.asset)}</h2>
            <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-gray-500">{content.contribution.qrDescription}</p>
            <div className="mx-auto mb-5 w-fit rounded-2xl border border-brand/10 bg-white p-4 shadow-[0_10px_35px_rgba(0,83,51,0.10)]">
              <QRCodeSVG value={cryptoQr.address} size={240} level="M" bgColor="#ffffff" fgColor="#005333" marginSize={1} />
            </div>
            <code className="block break-all rounded-xl bg-bone px-4 py-3 text-xs font-semibold leading-relaxed text-brand">{cryptoQr.address}</code>
            <button
              type="button"
              onClick={() => copyValue(cryptoQr.asset.toLowerCase() as 'usdc' | 'btc' | 'eth', cryptoQr.address)}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-gold hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <Copy size={16} aria-hidden="true" />
              {content.contribution.copyWallet.replace('{asset}', cryptoQr.asset)}
            </button>
          </section>
        </div>
      )}

      {expandedGallery && expandedMedia && (
        <div
          className="fixed inset-0 z-[6000] flex items-center justify-center bg-[#071d14]/90 p-4 backdrop-blur-sm md:p-8"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setExpandedGallery(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={expandedMedia.alt}
            className="relative flex max-h-full w-full max-w-6xl touch-pan-y flex-col items-center"
            onTouchStart={event => {
              galleryTouchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={event => {
              const startX = galleryTouchStartX.current;
              const endX = event.changedTouches[0]?.clientX;
              galleryTouchStartX.current = null;
              if (startX === null || endX === undefined) return;
              const distance = endX - startX;
              if (Math.abs(distance) < 50) return;
              moveExpandedGallery(distance > 0 ? -1 : 1);
            }}
          >
            <button
              type="button"
              onClick={() => setExpandedGallery(null)}
              aria-label={content.contribution.closeModal}
              className="absolute right-2 top-2 z-10 rounded-full bg-white/95 p-2.5 text-brand shadow-lg transition-colors hover:bg-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold md:right-4 md:top-4"
            >
              <X size={24} aria-hidden="true" />
            </button>

            {expandedGallery.items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => moveExpandedGallery(-1)}
                  aria-label={t.ui.prev}
                  className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-2.5 text-brand shadow-lg transition-colors hover:bg-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold md:left-4 md:p-3"
                >
                  <ChevronLeft size={26} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => moveExpandedGallery(1)}
                  aria-label={t.ui.next}
                  className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-2.5 text-brand shadow-lg transition-colors hover:bg-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold md:right-4 md:p-3"
                >
                  <ChevronRight size={26} aria-hidden="true" />
                </button>
              </>
            )}

            <div className="flex min-h-0 w-full flex-1 items-center justify-center px-8 md:px-20">
              {expandedMedia.type === 'video' ? (
                <video key={expandedMedia.src} controls autoPlay playsInline className="max-h-[78vh] max-w-full rounded-2xl bg-black object-contain shadow-2xl" aria-label={expandedMedia.alt}>
                  <source src={expandedMedia.src} />
                  <a href={expandedMedia.src}>{content.updates.videoFallback}</a>
                </video>
              ) : (
                <img key={expandedMedia.src} src={expandedMedia.src} alt={expandedMedia.alt} className="max-h-[78vh] max-w-full rounded-2xl object-contain shadow-2xl" />
              )}
            </div>
            <div className="mt-3 flex max-w-3xl flex-col items-center gap-2">
              <p className="rounded-full bg-white/95 px-5 py-2 text-center text-sm text-gray-700 shadow-lg">{expandedMedia.caption}</p>
              {expandedGallery.items.length > 1 && (
                <span className="rounded-full bg-black/35 px-3 py-1 text-xs font-semibold tracking-widest text-white/80">
                  {expandedGallery.index + 1} / {expandedGallery.items.length}
                </span>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Botón fijo "Aportar" solo en celular, abajo a la izquierda (a la derecha está el WhatsApp flotante). */}
      <a
        href="#aportar"
        aria-hidden={!showSticky}
        tabIndex={showSticky ? 0 : -1}
        className={`fixed bottom-5 left-4 z-[900] inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-xs font-bold uppercase tracking-wider text-brand shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-300 md:hidden ${showSticky ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}
      >
        <TreePine size={17} aria-hidden="true" />
        {content.sticky.cta}
      </a>

      <Footer />
    </div>
  );
};

export default Reforestacion;
