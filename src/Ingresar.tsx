import React, { useEffect } from 'react';
import { ArrowRight, SpinnerGap, UserCircle } from '@phosphor-icons/react';
import { Alert, AlertDescription, Card, CardBody, CardDescription, CardFooter, CardHeader, CardTitle, buttonVariants } from '@pueblo-magico/react-ui';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { useWebsiteAccount } from './account';
import { COMPANION_PORTAL_URL } from './data/config';

const copy = {
  es: {
    eyebrow: 'Tu cuenta',
    title: 'Una cuenta para tu experiencia en Pueblo Mágico.',
    intro: 'Ingresá una sola vez desde el sitio. Después vas a ver los espacios disponibles para tu cuenta.',
    signedOutTitle: 'Ingresá con tu cuenta Pueblo Mágico',
    signedOutDescription: 'Usamos Mágico Auth para verificar tu identidad de forma segura.',
    signIn: 'Ingresar',
    loading: 'Consultando tu cuenta…',
    unavailable: 'No pudimos consultar tu cuenta en este momento.',
    retry: 'Volver a intentar',
    welcome: 'Tu cuenta está activa',
    companionDescription: 'Consultá tus reservas, pagos y datos de tu estadía.',
    openCompanion: 'Abrir Mi cuenta',
    staffNote: 'Si formás parte del equipo, el acceso al Portal del equipo aparece en el menú de tu cuenta después de verificar tu membresía.',
  },
  en: {
    eyebrow: 'Your account',
    title: 'One account for your Pueblo Mágico experience.',
    intro: 'Sign in once from the website. You will then see the spaces available to your account.',
    signedOutTitle: 'Sign in with your Pueblo Mágico account',
    signedOutDescription: 'We use Mágico Auth to verify your identity securely.',
    signIn: 'Sign in',
    loading: 'Checking your account…',
    unavailable: 'We could not check your account right now.',
    retry: 'Try again',
    welcome: 'Your account is active',
    companionDescription: 'View your bookings, payments and stay details.',
    openCompanion: 'Open My account',
    staffNote: 'If you are part of the team, Staff Portal access appears in your account menu after your membership is verified.',
  },
} as const;

export const Ingresar: React.FC = () => {
  const { language } = useLanguage();
  const content = copy[language];
  const account = useWebsiteAccount();

  useEffect(() => {
    document.title = `${content.eyebrow} | Pueblo Mágico`;
  }, [content.eyebrow]);

  return (
    <div className="min-h-screen bg-bone font-sans text-dark">
      <Header />
      <main>
        <section className="bg-brand-green px-6 pb-24 pt-36 text-white md:pb-28 md:pt-44">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-brand-gold">{content.eyebrow}</p>
            <h1 className="font-serif text-4xl leading-tight md:text-6xl">{content.title}</h1>
            <p className="mx-auto mt-6 max-w-2xl text-base font-light leading-relaxed text-white/80 md:text-lg">{content.intro}</p>
          </div>
        </section>

        <section aria-label={content.eyebrow} className="relative mx-auto -mt-12 w-full max-w-3xl px-6 pb-24 md:-mt-14 md:pb-32">
          <Card as="article" tone="accent" variant="elevated" className="rounded-[28px] border border-brand-gold/25 p-1 shadow-xl">
            <CardHeader className="items-start p-6 pb-3 md:p-8 md:pb-4">
              <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-green text-white">
                {account.state.status === 'loading'
                  ? <SpinnerGap className="animate-spin" size={28} aria-hidden="true" />
                  : <UserCircle size={30} weight="light" aria-hidden="true" />}
              </span>
              <CardTitle as="h2" variant="editorial" className="text-3xl text-brand-green md:text-4xl">
                {account.state.status === 'authenticated' ? content.welcome : content.signedOutTitle}
              </CardTitle>
            </CardHeader>
            <CardBody className="px-6 pb-6 md:px-8 md:pb-8">
              {account.state.status === 'loading' ? <CardDescription className="text-base text-white/80">{content.loading}</CardDescription> : null}
              {account.state.status === 'unavailable' ? (
                <Alert variant="danger"><AlertDescription>{content.unavailable}</AlertDescription></Alert>
              ) : null}
              {account.state.status === 'signed_out' || account.state.status === 'unavailable' ? (
                <>
                  <CardDescription className="max-w-xl text-base leading-relaxed text-white/80 md:text-lg">{content.signedOutDescription}</CardDescription>
                  <CardFooter className="px-0 pb-0 pt-8">
                    <a href="/api/v1/auth/login" className={buttonVariants({ variant: 'primary', size: 'lg', shape: 'pill', className: 'min-h-12 w-full justify-center gap-2' })}>
                      {account.state.status === 'unavailable' ? content.retry : content.signIn}
                      <ArrowRight size={19} weight="bold" aria-hidden="true" />
                    </a>
                  </CardFooter>
                </>
              ) : null}
              {account.state.status === 'authenticated' ? (
                <>
                  <p className="text-xl font-semibold text-white">{account.state.user.displayName}</p>
                  {account.state.user.email ? <p className="mt-1 text-sm text-white/65">{account.state.user.email}</p> : null}
                  <CardDescription className="mt-6 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">{content.companionDescription}</CardDescription>
                  <CardFooter className="px-0 pb-0 pt-8">
                    <a href={COMPANION_PORTAL_URL} className={buttonVariants({ variant: 'primary', size: 'lg', shape: 'pill', className: 'min-h-12 w-full justify-center gap-2' })}>
                      {content.openCompanion}
                      <ArrowRight size={19} weight="bold" aria-hidden="true" />
                    </a>
                  </CardFooter>
                  <p className="mt-6 text-sm leading-relaxed text-white/65">{content.staffNote}</p>
                </>
              ) : null}
            </CardBody>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Ingresar;
