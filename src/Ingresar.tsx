import React, { useEffect } from 'react';
import { ArrowRight, IdentificationCard, UserCircle } from '@phosphor-icons/react';
import {
  Badge,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  buttonVariants,
} from '@pueblo-magico/react-ui';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { COMPANION_PORTAL_URL, STAFF_PORTAL_URL } from './data/config';

const copy = {
  es: {
    eyebrow: 'Ingresar',
    title: 'Elegí el espacio al que querés acceder.',
    intro: 'Vas a iniciar sesión por separado en el portal que elijas.',
    customerTitle: 'Mi cuenta',
    customerDescription: 'Consultá tus reservas, pagos y datos de tu estadía en Pueblo Mágico.',
    customerAction: 'Ingresar a Mi cuenta',
    staffQuestion: '¿Trabajás en Pueblo Mágico?',
    staffBadge: 'Solo para el equipo',
    staffTitle: 'Acceso del equipo',
    staffDescription: 'Abrí las herramientas internas de Pueblo Mágico. Necesitás una cuenta autorizada.',
    staffAction: 'Ingresar al portal del equipo',
  },
  en: {
    eyebrow: 'Sign in',
    title: 'Choose the space you want to access.',
    intro: 'You will sign in separately to the portal you choose.',
    customerTitle: 'My account',
    customerDescription: 'View your bookings, payments and stay details at Pueblo Mágico.',
    customerAction: 'Sign in to My account',
    staffQuestion: 'Do you work at Pueblo Mágico?',
    staffBadge: 'Staff only',
    staffTitle: 'Staff access',
    staffDescription: 'Open Pueblo Mágico’s internal tools. You need an authorized account.',
    staffAction: 'Sign in to the staff portal',
  },
} as const;

export const Ingresar: React.FC = () => {
  const { language } = useLanguage();
  const content = copy[language];

  useEffect(() => {
    document.title = `${content.eyebrow} | Pueblo Mágico`;
  }, [content.eyebrow]);

  return (
    <div className="min-h-screen bg-bone font-sans text-dark">
      <Header />

      <main>
        <section className="bg-brand-green px-6 pb-24 pt-36 text-white md:pb-28 md:pt-44">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-brand-gold">
              {content.eyebrow}
            </p>
            <h1 className="font-serif text-4xl leading-tight md:text-6xl">
              {content.title}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base font-light leading-relaxed text-white/80 md:text-lg">
              {content.intro}
            </p>
          </div>
        </section>

        <section aria-label={content.eyebrow} className="relative mx-auto -mt-12 w-full max-w-6xl overflow-x-clip px-6 pb-24 md:-mt-14 md:pb-32">
          <div className="grid min-w-0 items-stretch gap-6 md:grid-cols-[1.08fr_0.92fr] md:gap-8">
            <Card as="article" tone="accent" variant="elevated" className="flex h-full min-w-0 flex-col rounded-[28px] border border-brand-gold/25 p-1 shadow-xl">
              <CardHeader className="items-start p-6 pb-3 md:p-8 md:pb-4">
                <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-green text-white">
                  <UserCircle size={30} weight="light" aria-hidden="true" />
                </span>
                <CardTitle as="h2" variant="editorial" className="text-3xl text-brand-green md:text-4xl">
                  {content.customerTitle}
                </CardTitle>
              </CardHeader>
              <CardBody className="flex flex-1 flex-col px-6 pb-6 md:px-8 md:pb-8">
                <CardDescription className="max-w-md text-base leading-relaxed text-dark/70 md:text-lg">
                  {content.customerDescription}
                </CardDescription>
                <CardFooter className="mt-auto px-0 pb-0 pt-8">
                  <a
                    href={COMPANION_PORTAL_URL}
                    className={buttonVariants({
                      variant: 'primary',
                      size: 'lg',
                      shape: 'pill',
                      className: 'min-h-12 w-full justify-center gap-2 whitespace-normal px-4 text-center leading-snug focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold',
                    })}
                  >
                    {content.customerAction}
                    <ArrowRight size={19} weight="bold" aria-hidden="true" />
                  </a>
                </CardFooter>
              </CardBody>
            </Card>

            <div className="flex h-full flex-col">
              <p className="mb-4 mt-3 text-center text-sm font-semibold text-brand-green md:hidden">
                {content.staffQuestion}
              </p>
              <Card as="article" tone="muted" variant="outlined" className="flex h-full min-w-0 flex-col rounded-[28px] border-brand-green/15 bg-white/90">
                <CardHeader className="items-start p-6 pb-3 md:p-8 md:pb-4">
                  <div className="mb-5 flex w-full items-start justify-between gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                      <IdentificationCard size={27} weight="light" aria-hidden="true" />
                    </span>
                    <Badge variant="outline" size="sm" className="uppercase tracking-[0.12em]">
                      {content.staffBadge}
                    </Badge>
                  </div>
                  <CardTitle as="h2" variant="editorial" className="text-3xl text-brand-green">
                    {content.staffTitle}
                  </CardTitle>
                </CardHeader>
                <CardBody className="flex flex-1 flex-col px-6 pb-6 md:px-8 md:pb-8">
                  <CardDescription className="max-w-md text-base leading-relaxed text-dark/65">
                    {content.staffDescription}
                  </CardDescription>
                  <CardFooter className="mt-auto px-0 pb-0 pt-8">
                    <a
                      href={STAFF_PORTAL_URL}
                      className={buttonVariants({
                        variant: 'secondary',
                        size: 'lg',
                        shape: 'pill',
                        className: 'min-h-12 w-full justify-center gap-2 whitespace-normal px-4 text-center leading-snug focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold',
                      })}
                    >
                      {content.staffAction}
                      <ArrowRight size={19} weight="bold" aria-hidden="true" />
                    </a>
                  </CardFooter>
                </CardBody>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Ingresar;
