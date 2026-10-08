import React, { useEffect } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import { useLanguage } from '../contexts/LanguageContext';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-serif text-brand mb-4 pb-2 border-b border-brand/10">{title}</h2>
    <div className="text-dark/80 font-light leading-relaxed space-y-3 text-sm">{children}</div>
  </section>
);

export const PoliticaPrivacidad: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();
  const en = language === 'en';

  useEffect(() => {
    document.title = en ? 'Privacy Policy — Pueblo Mágico' : 'Política de Privacidad — Pueblo Mágico';
    window.scrollTo(0, 0);
  }, [en]);

  return (
    <div className="min-h-screen bg-bone font-sans antialiased">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 text-sm text-dark/60 hover:text-brand transition-colors">
            <ArrowLeft size={16} /> {en ? 'Back to home' : 'Volver al inicio'}
          </a>
          <span className="text-gray-200">|</span>
          <img src="/uploads/pueblo_magico_logo_marron.svg" alt="Pueblo Mágico" className="h-7 opacity-80" />
          <button type="button" onClick={toggleLanguage} className="ml-auto text-xs font-bold text-brand underline underline-offset-4">
            {en ? 'ES' : 'EN'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-brand/60 text-xs uppercase tracking-widest font-semibold mb-3">{en ? 'Legal document' : 'Documento legal'}</p>
          <h1 className="text-4xl md:text-5xl font-serif text-brand mb-4">{en ? 'Privacy Policy' : 'Política de Privacidad'}</h1>
          <p className="text-dark/50 text-sm font-light">{en ? 'Last updated: October 8, 2026' : 'Última actualización: 8 de octubre de 2026'}</p>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
            {en ? 'This policy explains how we process information used for inquiries, online bookings and stays under Argentine Personal Data Protection Law 25,326.' : 'Esta política explica cómo tratamos la información utilizada para consultas, reservas online y estadías conforme a la Ley argentina 25.326 de Protección de Datos Personales.'}
          </div>
        </div>

        <Section title={en ? '1. Data controller' : '1. Responsable del tratamiento'}>
          <p><strong>{en ? 'Legal name:' : 'Razón social:'}</strong> HERMANOS MÁGICOS SOCIEDAD POR ACCIONES SIMPLIFICADA</p>
          <p><strong>{en ? 'Trade name:' : 'Nombre comercial:'}</strong> Pueblo Mágico — Eco-Refugio & Glamping</p>
          <p><strong>CUIT:</strong> 30-71875586-3</p>
          <p><strong>{en ? 'Address:' : 'Domicilio:'}</strong> Calle Aconquija 635, Villa Allende, Departamento Colón, Córdoba, Argentina.</p>
          <p><strong>{en ? 'Privacy contact:' : 'Contacto de privacidad:'}</strong>{' '}<a href="mailto:experienciamagico@gmail.com" className="text-brand hover:underline">experienciamagico@gmail.com</a>{' · '}<a href="https://wa.me/5493516765820" className="text-brand hover:underline" target="_blank" rel="noopener noreferrer">+54 9 351 676 5820</a></p>
        </Section>

        <Section title={en ? '2. Information we process' : '2. Información que tratamos'}>
          <p>{en ? 'Depending on how you interact with us, we process only the information needed for the stated purpose:' : 'Según cómo interactúes con nosotros, tratamos únicamente la información necesaria para la finalidad informada:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{en ? 'Name, telephone or WhatsApp number, and optional email address.' : 'Nombre, teléfono o WhatsApp y correo electrónico opcional.'}</li>
            <li>{en ? 'Dates, number of guests, accommodation, meal plan, quote and booking code.' : 'Fechas, cantidad de huéspedes, alojamiento, régimen de comidas, cotización y código de reserva.'}</li>
            <li>{en ? 'Booking status, accepted commercial snapshot and payment-verification references.' : 'Estado de la reserva, snapshot comercial aceptado y referencias de verificación del pago.'}</li>
            <li>{en ? 'Transactional history, cancellation requests, consent and audit records required to resolve the booking.' : 'Historial transaccional, solicitudes de cancelación, consentimiento y registros de auditoría necesarios para resolver la reserva.'}</li>
            <li>{en ? 'Technical security and traffic data, with identifiers minimized or hashed where the system supports it.' : 'Datos técnicos de seguridad y tráfico, con identificadores minimizados o hasheados cuando el sistema lo permite.'}</li>
          </ul>
          <p>{en ? 'Payment providers process the financial credentials entered on their own services. Pueblo Mágico does not need to store card numbers or online-banking credentials to verify a payment.' : 'Los proveedores de pago tratan las credenciales financieras ingresadas en sus propios servicios. Pueblo Mágico no necesita almacenar números de tarjeta ni credenciales bancarias para verificar un pago.'}</p>
        </Section>

        <Section title={en ? '3. Purposes and legal basis' : '3. Finalidades y bases del tratamiento'}>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{en ? 'Requested service:' : 'Servicio solicitado:'}</strong> {en ? 'quote, hold inventory, create and manage the booking, verify payment and provide the stay.' : 'cotizar, retener inventario, crear y gestionar la reserva, verificar el pago y prestar la estadía.'}</li>
            <li><strong>{en ? 'Transactional communications:' : 'Comunicaciones transaccionales:'}</strong> {en ? 'send booking, payment, expiration, change and cancellation information.' : 'informar sobre reserva, pago, vencimiento, cambios y cancelación.'}</li>
            <li><strong>{en ? 'Legal obligations:' : 'Obligaciones legales:'}</strong> {en ? 'accounting, tax, tourism, consumer-protection and dispute records.' : 'registros contables, impositivos, turísticos, de consumo y reclamos.'}</li>
            <li><strong>{en ? 'Security and service improvement:' : 'Seguridad y mejora del servicio:'}</strong> {en ? 'prevent abuse, diagnose failures and understand site use according to cookie choices.' : 'prevenir abusos, diagnosticar fallas y comprender el uso del sitio según las preferencias de cookies.'}</li>
            <li><strong>{en ? 'Marketing:' : 'Marketing:'}</strong> {en ? 'only with a valid legal basis or separate consent; unsubscribing does not affect a booking.' : 'solo con base legal válida o consentimiento separado; la baja no afecta una reserva.'}</li>
          </ul>
          <p>{en ? 'A failed communication or external integration does not decide or reverse the booking automatically.' : 'Una comunicación o integración externa fallida no decide ni revierte automáticamente el estado de la reserva.'}</p>
        </Section>

        <Section title={en ? '4. Recipients and processors' : '4. Destinatarios y encargados'}>
          <p>{en ? 'We may share the minimum necessary information with infrastructure, payment, communications, accounting and professional-service providers acting for the purposes described above, as well as with authorities when legally required.' : 'Podemos compartir la información mínima necesaria con proveedores de infraestructura, pagos, comunicaciones, contabilidad y servicios profesionales que actúan para las finalidades descritas, y con autoridades cuando exista obligación legal.'}</p>
          <p>{en ? 'The booking database remains the operational source of truth. External systems receive only the data and permissions required for their integration.' : 'La base de reservas permanece como fuente operativa de verdad. Los sistemas externos reciben únicamente los datos y permisos necesarios para su integración.'}</p>
        </Section>

        <Section title={en ? '5. Retention and security' : '5. Conservación y seguridad'}>
          <p>{en ? 'Information is retained while needed to provide the service, address claims and meet applicable accounting, tax and other legal obligations. Operational retention periods are not invented by the application: they must be configured and approved before automated deletion is enabled.' : 'La información se conserva mientras sea necesaria para prestar el servicio, atender reclamos y cumplir obligaciones contables, impositivas y legales aplicables. La aplicación no inventa plazos operativos: deben configurarse y aprobarse antes de habilitar eliminaciones automáticas.'}</p>
          <p>{en ? 'We apply reasonable access controls, audit trails, environment separation and data-minimization measures. No internet service can promise absolute security.' : 'Aplicamos controles razonables de acceso, auditoría, separación de ambientes y minimización de datos. Ningún servicio de Internet puede prometer seguridad absoluta.'}</p>
        </Section>

        <Section title={en ? '6. Your rights' : '6. Tus derechos'}>
          <p>{en ? 'You may request access to your personal data free of charge at intervals no shorter than six months. We must respond to access requests within ten calendar days.' : 'Podés solicitar acceso a tus datos personales gratuitamente en intervalos no inferiores a seis meses. Debemos responder el acceso dentro de diez días corridos.'}</p>
          <p>{en ? 'You may request rectification, updating or deletion when legally applicable. Those requests must be handled within five business days. Deletion may be limited where information must be retained by law or to protect legitimate third-party rights.' : 'Podés solicitar rectificación, actualización o supresión cuando corresponda legalmente. Esas solicitudes deben atenderse dentro de cinco días hábiles. La supresión puede limitarse cuando exista obligación legal de conservación o derechos legítimos de terceros.'}</p>
          <p>{en ? 'Send the request through the privacy contact above, identifying yourself and the right you wish to exercise. If the response is absent or insufficient, you may complain to the Argentine Agency for Access to Public Information (AAIP): ' : 'Enviá la solicitud al contacto de privacidad indicado arriba, acreditando identidad e indicando el derecho que querés ejercer. Si no recibís respuesta suficiente, podés reclamar ante la Agencia de Acceso a la Información Pública (AAIP): '}<a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">argentina.gob.ar/aaip</a>.</p>
        </Section>

        <Section title={en ? '7. Cookies and analytics' : '7. Cookies y analítica'}>
          <p>{en ? 'Essential storage supports language and security preferences. Optional analytics or advertising tools are used only according to the consent choices presented by the site. You may change browser controls or reject optional cookies without preventing the core booking API from operating.' : 'El almacenamiento esencial sostiene preferencias de idioma y seguridad. Las herramientas opcionales de analítica o publicidad se usan según las opciones de consentimiento presentadas por el sitio. Podés modificar el navegador o rechazar cookies opcionales sin impedir el funcionamiento básico de la API de reservas.'}</p>
          <p>{en ? 'The site may use Microsoft Clarity and, when enabled with the required consent, Meta or Google measurement tools. Their own privacy notices govern data they process as independent providers.' : 'El sitio puede usar Microsoft Clarity y, cuando estén habilitadas con el consentimiento requerido, herramientas de medición de Meta o Google. Sus avisos de privacidad rigen los datos que tratan como proveedores independientes.'}</p>
        </Section>

        <Section title={en ? '8. Changes to this policy' : '8. Cambios a esta política'}>
          <p>{en ? 'We may update this policy when the booking flow, providers or legal requirements change. The current revision date appears at the top. Material changes affecting an active booking will be communicated through an appropriate contact channel when required.' : 'Podemos actualizar esta política cuando cambien el flujo de reservas, los proveedores o los requisitos legales. La fecha vigente figura al inicio. Los cambios relevantes que afecten una reserva activa se comunicarán por un canal de contacto adecuado cuando corresponda.'}</p>
        </Section>

        <div className="mt-12 pt-8 border-t border-gray-200 text-xs text-dark/40 text-center">
          © {new Date().getFullYear()} HERMANOS MÁGICOS SOCIEDAD POR ACCIONES SIMPLIFICADA
          <br />
          <a href="/terminos-y-condiciones" className="hover:text-brand transition-colors">{en ? 'Terms and Conditions' : 'Términos y Condiciones'}</a>{' · '}
          <a href="/" className="hover:text-brand transition-colors">{en ? 'Back to home' : 'Volver al inicio'}</a>
        </div>
      </main>
    </div>
  );
};

export default PoliticaPrivacidad;
