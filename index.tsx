import React, { lazy, Suspense, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { UpdateBanner } from './components/UpdateBanner';
import './src/i18n';
import { LanguageProvider } from './contexts/LanguageContext';
import Main from './Main';
import './index.css';
import Familion from './src/Familion';
import Gondorbows from './src/Gondorbows';
import AulaVerde from './src/AulaVerde';
import AchalaViva from './src/AchalaViva';
import VueloDelCondor from './src/VueloDelCondor';
import CicloVitalFemenino from './src/CicloVitalFemenino';

const PropuestaCalmaYoga = lazy(() => import('./src/PropuestaCalmaYoga'));
const OrganizamosTuExperiencia = lazy(() => import('./src/OrganizamosTuExperiencia'));
const IntiRaymi = lazy(() => import('./src/IntiRaymi'));
const PachamamaFest = lazy(() => import('./src/PachamamaFest'));
const KillaRaymi = lazy(() => import('./src/KillaRaymi'));
const AlmaDeLobo = lazy(() => import('./src/AlmaDeLobo'));
const Empresas = lazy(() => import('./src/Empresas'));
const CordobaFlyFishing = lazy(() => import('./src/CordobaFlyFishing'));
const Voluntariado = lazy(() => import('./src/Voluntariado'));
const Reforestacion = lazy(() => import('./src/Reforestacion'));
const Despertar = lazy(() => import('./src/Despertar'));
const WinterCamp = lazy(() => import('./src/WinterCamp'));
const WinterRedirection = lazy(() => import('./src/WinterRedirection'));
const PropuestaNicoGrupe = lazy(() => import('./src/PropuestaNicoGrupe'));
const ResetVitalApp = lazy(() => import('./ResetVital.jsx'));
const Estadia = lazy(() => import('./src/Estadia'));
const Coliving = lazy(() => import('./src/Coliving'));
const TerminosYCondiciones = lazy(() => import('./src/TerminosYCondiciones'));
const PoliticaPrivacidad = lazy(() => import('./src/PoliticaPrivacidad'));
const NotFound = lazy(() => import('./src/NotFound'));
const PanelReservas = lazy(() => import('./src/PanelReservas'));
const EstadoPagoReserva = lazy(() => import('./src/EstadoPagoReserva'));

const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Navigating to /#section (e.g. a menu/footer link clicked from another
      // page) — scroll to that section instead of forcing the top of the page.
      // Several sections use content-visibility:auto for perf; a manual
      // getBoundingClientRect + scrollTo measures their placeholder size, not
      // the real one. scrollIntoView is what makes browsers resolve those
      // sections correctly along the way.
      const id = hash.slice(1);
      const headerOffset = 80;
      const raf = requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
        window.scrollBy({ top: -headerOffset, left: 0, behavior: 'instant' as ScrollBehavior });
      });
      return () => cancelAnimationFrame(raf);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
};

const PageLoader = () => (
  <div id="loader-container" style={{ minHeight: '100vh', background: '#FDFBF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTopColor: '#A8971C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <BrowserRouter>
          <ScrollToTop />
          <UpdateBanner />
          <PWAInstallBanner />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Main />} />
              <Route path="/reset-vital" element={<ResetVitalApp />} />
              <Route path="/familion" element={<Familion />} />
              <Route path="/gondorbows" element={<Gondorbows />} />
              <Route path="/escuelas" element={<AulaVerde />} />
              <Route path="/achala-viva" element={<AchalaViva />} />
              <Route path="/el-vuelo-del-condor" element={<VueloDelCondor />} />
              <Route path="/ciclo-vital-femenino" element={<CicloVitalFemenino />} />
              <Route path="/propuesta/calma-magico" element={<PropuestaCalmaYoga />} />
              <Route path="/organizamos-tu-experiencia" element={<OrganizamosTuExperiencia />} />
              <Route path="/inti-raymi" element={<IntiRaymi />} />
              <Route path="/pachamama-fest" element={<PachamamaFest />} />
              <Route path="/killa-raymi" element={<KillaRaymi />} />
              <Route path="/alma-de-lobo" element={<AlmaDeLobo />} />
              <Route path="/empresas" element={<Empresas />} />
              <Route path="/cordoba-fly-fishing" element={<CordobaFlyFishing />} />
              <Route path="/voluntariado" element={<Voluntariado />} />
              <Route path="/reforestacion" element={<Reforestacion />} />
              <Route path="/despertar" element={<Despertar />} />
              <Route path="/winter-camp" element={<WinterCamp />} />
              <Route path="/winter-redirection" element={<WinterRedirection />} />
              <Route path="/propuesta/nico-grupe" element={<PropuestaNicoGrupe />} />
              <Route path="/estadia" element={<Estadia />} />
              <Route path="/coliving" element={<Coliving />} />
              <Route path="/terminos-y-condiciones" element={<TerminosYCondiciones />} />
              <Route path="/politica-de-privacidad" element={<PoliticaPrivacidad />} />
              <Route path="/admin/reservas" element={<PanelReservas />} />
              <Route path="/reserva-confirmada" element={<EstadoPagoReserva returnState="success" />} />
              <Route path="/reserva-pendiente" element={<EstadoPagoReserva returnState="pending" />} />
              <Route path="/reserva-fallida" element={<EstadoPagoReserva returnState="failure" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>
);
