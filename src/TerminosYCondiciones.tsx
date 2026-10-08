import React, { useEffect } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import { useLanguage } from '../contexts/LanguageContext';

const DATA_FISCAL_URL = '/uploads/F960.pdf';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-serif text-brand mb-4 pb-2 border-b border-brand/10">{title}</h2>
    <div className="text-dark/80 font-light leading-relaxed space-y-3 text-sm">{children}</div>
  </section>
);

export const TerminosYCondiciones: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();
  const en = language === 'en';

  useEffect(() => {
    document.title = en ? 'Terms and Conditions — Pueblo Mágico' : 'Términos y Condiciones — Pueblo Mágico';
    window.scrollTo(0, 0);
  }, [en]);

  return (
    <div className="min-h-screen bg-bone font-sans antialiased">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 text-sm text-dark/60 hover:text-brand transition-colors">
            <ArrowLeft size={16} />
            {en ? 'Back to home' : 'Volver al inicio'}
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
          <h1 className="text-4xl md:text-5xl font-serif text-brand mb-4">{en ? 'Terms and Conditions' : 'Términos y Condiciones'}</h1>
          <p className="text-dark/50 text-sm font-light">{en ? 'Last updated: October 8, 2026' : 'Última actualización: 8 de octubre de 2026'}</p>
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
            <strong>{en ? 'Pre-launch legal review:' : 'Revisión legal previa al lanzamiento:'}</strong>{' '}
            {en
              ? 'this draft reflects the online booking flow currently implemented. It requires human legal and commercial approval before production reservations are enabled.'
              : 'este borrador refleja el flujo de reservas online implementado. Requiere aprobación humana legal y comercial antes de habilitar reservas productivas.'}
          </div>
        </div>

        <Section title={en ? '1. Service provider' : '1. Identificación del prestador'}>
          <p><strong>{en ? 'Legal name:' : 'Razón social:'}</strong> HERMANOS MÁGICOS SOCIEDAD POR ACCIONES SIMPLIFICADA</p>
          <p><strong>{en ? 'Trade name:' : 'Nombre comercial:'}</strong> Pueblo Mágico — Eco-Refugio & Glamping</p>
          <p><strong>{en ? 'Registered address:' : 'Domicilio legal:'}</strong> Calle Aconquija 635, Villa Allende, Departamento Colón, Córdoba, Argentina.</p>
          <p><strong>CUIT:</strong> 30-71875586-3</p>
          <p>
            <strong>{en ? 'Customer service:' : 'Atención al consumidor:'}</strong>{' '}
            <a href="mailto:experienciamagico@gmail.com" className="text-brand hover:underline">experienciamagico@gmail.com</a>{' · '}
            <a href="https://wa.me/5493516765820" className="text-brand hover:underline" target="_blank" rel="noopener noreferrer">+54 9 351 676 5820</a>
          </p>
          <p><a href={DATA_FISCAL_URL} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">{en ? 'View F960/D tax certificate (PDF)' : 'Ver constancia F960/D — Data Fiscal (PDF)'}</a></p>
        </Section>

        <Section title={en ? '2. Online booking process' : '2. Proceso de reserva online'}>
          <p>{en ? 'The website allows you to check availability, request a price quote and create a booking. A quote is an informative, time-limited offer: it does not hold inventory and is not a confirmed booking.' : 'El sitio permite consultar disponibilidad, solicitar una cotización y crear una reserva. La cotización es una propuesta informativa con vigencia limitada: no retiene inventario ni constituye una reserva confirmada.'}</p>
          <p>{en ? 'When the guest accepts a valid quote and submits the required contact details, the system creates a booking pending payment and temporarily holds the selected inventory for the period displayed on screen.' : 'Cuando el huésped acepta una cotización vigente y envía los datos de contacto requeridos, el sistema crea una reserva pendiente de pago y retiene temporalmente el inventario elegido durante el plazo mostrado en pantalla.'}</p>
          <p>{en ? 'The booking is only confirmed after Pueblo Mágico verifies receipt of the required deposit. A booking code beginning with RES identifies the request, but does not by itself prove payment or confirmation.' : 'La reserva se confirma únicamente cuando Pueblo Mágico verifica la recepción de la seña requerida. El código que comienza con RES identifica la solicitud, pero por sí solo no acredita el pago ni la confirmación.'}</p>
        </Section>

        <Section title={en ? '3. Prices, quote and payment' : '3. Precios, cotización y pago'}>
          <p>{en ? 'The quote shows the currency, total price, deposit, balance, selected meal plan and validity period. The accepted quote is stored as a versioned snapshot so later tariff changes do not alter that booking.' : 'La cotización muestra moneda, precio total, seña, saldo, régimen de alimentación elegido y vigencia. La propuesta aceptada se conserva como snapshot versionado para que cambios posteriores de tarifa no modifiquen esa reserva.'}</p>
          <p>{en ? 'The amount and proportion of the deposit are those shown in the quote. The remaining balance is payable on arrival unless the accepted offer expressly states a different deadline.' : 'El importe y la proporción de la seña son los indicados en la cotización. El saldo restante se abona al llegar, salvo que la propuesta aceptada informe expresamente otro vencimiento.'}</p>
          <p>{en ? 'When an automatic payment destination is unavailable, the booking may still be registered as pending payment and the team will send manual instructions. No booking is confirmed until the payment is verified.' : 'Si el destino de pago automático no está disponible, la reserva puede quedar registrada como pendiente de pago y el equipo enviará instrucciones manuales. Ninguna reserva se confirma hasta verificar el pago.'}</p>
        </Section>

        <Section title={en ? '4. Holds, expiration and late payments' : '4. Retención, vencimiento y pagos tardíos'}>
          <p>{en ? 'The payment hold begins when the pending booking is created. Its exact duration is configurable and is displayed as a countdown. If it expires before verification, the inventory is released and availability must be checked again.' : 'La retención de pago comienza al crear la reserva pendiente. Su duración exacta es configurable y se muestra como cuenta regresiva. Si vence antes de la verificación, el inventario se libera y se debe consultar disponibilidad nuevamente.'}</p>
          <p>{en ? 'A transfer made after the hold expires does not automatically reinstate or confirm the booking. Pueblo Mágico will reconcile the payment and contact the guest to confirm availability, offer an alternative or arrange the applicable refund.' : 'Una transferencia realizada después del vencimiento no reactiva ni confirma automáticamente la reserva. Pueblo Mágico conciliará el pago y contactará al huésped para confirmar disponibilidad, ofrecer una alternativa o gestionar la devolución que corresponda.'}</p>
        </Section>

        <Section title={en ? '5. Cancellation, changes and refunds' : '5. Cancelaciones, cambios y devoluciones'}>
          <p>{en ? 'Cancellation, rescheduling and refund rules must be communicated before acceptance and are stored with the booking when a versioned policy is published. Statutory consumer rights always prevail.' : 'Las reglas de cancelación, reprogramación y devolución deben informarse antes de la aceptación y quedan asociadas a la reserva cuando existe una política versionada publicada. Los derechos legales de consumo siempre prevalecen.'}</p>
          <p>{en ? 'The reservation system currently marks the commercial cancellation policy as pending configuration. Until a policy receives commercial and legal approval, the site does not apply automatic refund percentages. Each request is reviewed manually, without limiting rights granted by law.' : 'Actualmente el sistema de reservas marca la política comercial de cancelación como pendiente de configuración. Hasta que una versión reciba aprobación comercial y legal, el sitio no aplica porcentajes automáticos de devolución. Cada solicitud se revisa manualmente, sin limitar los derechos otorgados por la ley.'}</p>
          <p>{en ? 'To request a cancellation or date change, contact customer service and include the booking code. Changes remain subject to availability.' : 'Para solicitar cancelación o cambio de fechas, contactá a atención al consumidor e indicá el código de reserva. Los cambios quedan sujetos a disponibilidad.'}</p>
        </Section>

        <Section title={en ? '6. Right of withdrawal' : '6. Derecho de arrepentimiento'}>
          <p>{en ? 'Distance contracts are subject to the right of withdrawal under Law 24,240, the Civil and Commercial Code and Disposición 954/2025. For tourism services on a specific date, the request within the statutory ten-day period must also be submitted at least 24 hours before the service begins.' : 'Las contrataciones a distancia están alcanzadas por el derecho de arrepentimiento previsto en la Ley 24.240, el Código Civil y Comercial y la Disposición 954/2025. Para servicios turísticos con fecha determinada, la solicitud dentro del plazo legal de diez días también debe realizarse con al menos 24 horas de anticipación al inicio del servicio.'}</p>
          <p>{en ? 'A dedicated, visible withdrawal flow must be enabled before production launch. Until then, requests may be sent through the customer-service channels above; Pueblo Mágico must provide a request code within 24 hours.' : 'Antes del lanzamiento productivo debe habilitarse un flujo específico y visible de arrepentimiento. Hasta entonces, la solicitud puede enviarse por los canales de atención indicados arriba; Pueblo Mágico debe informar un código de la petición dentro de las 24 horas.'}</p>
        </Section>

        <Section title={en ? '7. Stay conditions' : '7. Condiciones de la estadía'}>
          <p>{en ? 'Check-in is from 1:00 pm and check-out is by 11:00 am, unless otherwise agreed in writing.' : 'El check-in se realiza a partir de las 13:00 y el check-out hasta las 11:00, salvo acuerdo escrito diferente.'}</p>
          <p>{en ? 'Breakfast is served from 9:00 to 10:00 am, lunch from 2:00 to 3:00 pm and dinner from 8:00 to 9:00 pm. Meals missed due to late arrival without prior notice are not cumulative.' : 'El desayuno se sirve de 09:00 a 10:00, el almuerzo de 14:00 a 15:00 y la cena de 20:00 a 21:00. Las comidas no consumidas por llegadas tardías sin aviso previo no son acumulables.'}</p>
          <p>{en ? 'Accommodation and bathrooms may be shared as described in the accepted offer. Guests must respect safety, coexistence and environmental-care rules communicated for the property.' : 'Los alojamientos y baños pueden ser compartidos según lo descrito en la propuesta aceptada. Los huéspedes deben respetar las reglas de seguridad, convivencia y cuidado ambiental comunicadas para el establecimiento.'}</p>
        </Section>

        <Section title={en ? '8. Personal data and communications' : '8. Datos personales y comunicaciones'}>
          <p>{en ? 'Booking details are processed to provide the service, verify payments, meet legal obligations and send transactional communications. Marketing communications require a separate legal basis or consent and may be unsubscribed from without affecting the booking.' : 'Los datos de la reserva se tratan para prestar el servicio, verificar pagos, cumplir obligaciones legales y enviar comunicaciones transaccionales. Las comunicaciones comerciales requieren una base legal o consentimiento separado y pueden darse de baja sin afectar la reserva.'}</p>
          <p><a href="/politica-de-privacidad/" className="text-brand hover:underline">{en ? 'Read the Privacy Policy' : 'Consultar la Política de Privacidad'}</a>.</p>
        </Section>

        <Section title={en ? '9. Liability and force majeure' : '9. Responsabilidad y fuerza mayor'}>
          <p>{en ? 'Guests are responsible for damage they cause and for following the property’s safety instructions. Pueblo Mágico remains responsible as required by applicable law.' : 'Los huéspedes responden por los daños que causen y deben seguir las indicaciones de seguridad del establecimiento. Pueblo Mágico conserva la responsabilidad que corresponda conforme a la ley aplicable.'}</p>
          <p>{en ? 'If severe weather, public emergencies or another force-majeure event prevents all or part of the service, the parties will coordinate rescheduling, an alternative or the applicable refund according to law and the accepted conditions.' : 'Si condiciones climáticas severas, emergencias públicas u otro caso de fuerza mayor impiden total o parcialmente el servicio, las partes coordinarán una reprogramación, alternativa o devolución aplicable conforme a la ley y las condiciones aceptadas.'}</p>
        </Section>

        <Section title={en ? '10. Applicable law and claims' : '10. Ley aplicable y reclamos'}>
          <p>{en ? 'These terms are governed by the laws of the Argentine Republic, including consumer, tourism and personal-data regulations. Any jurisdiction clause is subject to the mandatory rights and competent venue available to consumers.' : 'Estos términos se rigen por las leyes de la República Argentina, incluida la normativa de defensa del consumidor, turismo y datos personales. Cualquier previsión de jurisdicción queda sujeta a los derechos imperativos y al fuero competente disponible para consumidores.'}</p>
          <p>{en ? 'Consumer claims may also be filed through the official Argentine consumer-protection service: ' : 'Los reclamos también pueden presentarse ante el servicio oficial de defensa del consumidor: '}<a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">argentina.gob.ar/defensadelconsumidor</a>.</p>
        </Section>

        <div className="mt-12 pt-8 border-t border-gray-200 text-xs text-dark/40 text-center">
          © {new Date().getFullYear()} HERMANOS MÁGICOS SOCIEDAD POR ACCIONES SIMPLIFICADA
          <br />
          <a href="/politica-de-privacidad/" className="hover:text-brand transition-colors">{en ? 'Privacy Policy' : 'Política de Privacidad'}</a>{' · '}
          <a href="/" className="hover:text-brand transition-colors">{en ? 'Back to home' : 'Volver al inicio'}</a>
        </div>
      </main>
    </div>
  );
};

export default TerminosYCondiciones;
