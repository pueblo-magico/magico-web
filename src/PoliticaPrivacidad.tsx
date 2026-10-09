import React, { useEffect } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';


const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-10">
    <h2 className="text-xl font-serif text-brand mb-4 pb-2 border-b border-brand/10">{title}</h2>
    <div className="text-dark/80 font-light leading-relaxed space-y-3 text-sm">{children}</div>
  </div>
);

export const PoliticaPrivacidad: React.FC = () => {
  useEffect(() => {
    document.title = 'Política de Privacidad — Pueblo Mágico';
    window.scrollTo(0, 0);
  }, []);

  const fecha = '27 de abril de 2025';

  return (
    <div className="min-h-screen bg-bone font-sans antialiased">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <a
            href="/"
            className="flex items-center gap-2 text-sm text-dark/60 hover:text-brand transition-colors"
          >
            <ArrowLeft size={16} />
            Volver al inicio
          </a>
          <span className="text-gray-200">|</span>
          <img
            src="/uploads/pueblo_magico_logo_marron.svg"
            alt="Pueblo Mágico"
            className="h-7 opacity-80"
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Título */}
        <div className="mb-12">
          <p className="text-brand/60 text-xs uppercase tracking-widest font-semibold mb-3">Documento legal</p>
          <h1 className="text-4xl md:text-5xl font-serif text-brand mb-4">
            Política de Privacidad
          </h1>
          <p className="text-dark/50 text-sm font-light">
            Última actualización: {fecha}
          </p>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            Esta política describe cómo recopilamos, usamos y protegemos tu información personal, conforme a la <strong>Ley N° 25.326 de Protección de Datos Personales</strong> de la República Argentina.
          </div>
        </div>

        <Section title="1. Responsable del tratamiento">
          <p>
            <strong>Razón social:</strong> HERMANOS MÁGICOS SOCIEDAD POR ACCIONES SIMPLIFICADA
          </p>
          <p>
            <strong>Nombre comercial:</strong> Pueblo Mágico — Ecolodge de Montaña
          </p>
          <p>
            <strong>CUIT:</strong> 30-71875586-3
          </p>
          <p>
            <strong>Domicilio:</strong> Calle Aconquija 635, Villa Allende, Departamento Colón, Córdoba, Argentina.
          </p>
          <p>
            <strong>Contacto para asuntos de privacidad:</strong>{' '}
            <a href="mailto:experienciamagico@gmail.com" className="text-brand hover:underline">
              experienciamagico@gmail.com
            </a>
            {' '}/ WhatsApp{' '}
            <a href="https://wa.me/5493516765820" className="text-brand hover:underline" target="_blank" rel="noopener noreferrer">
              +54 9 351 676 5820
            </a>
          </p>
        </Section>

        <Section title="2. Datos personales que recopilamos">
          <p>Recopilamos únicamente los datos necesarios para gestionar tu reserva o consulta:</p>
          <p><strong>Datos de contacto y reserva (provistos en el sitio, vía WhatsApp o email):</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nombre y apellido.</li>
            <li>Número de teléfono / WhatsApp.</li>
            <li>Correo electrónico.</li>
            <li>Fechas de reserva y tipo de experiencia o alojamiento.</li>
            <li>Número de personas (adultos y menores, cuando corresponda).</li>
          </ul>
          <p><strong>Datos de pago (cuando aplica):</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>CBU/alias para transferencias. No almacenamos datos de tarjetas de crédito o débito.</li>
            <li>Si elegís transferencia, solicitamos el DNI asociado a la cuenta pagadora exclusivamente para conciliar el ingreso. No conservamos el número completo: almacenamos una huella criptográfica y sus últimos cuatro dígitos.</li>
          </ul>
          <p><strong>Datos de navegación (automáticos):</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Datos técnicos de visita al sitio web (dirección IP, tipo de dispositivo, páginas visitadas) a través de herramientas de analítica web (ver Sección 7).</li>
          </ul>
        </Section>

        <Section title="3. Finalidades del tratamiento">
          <p>Tus datos personales son utilizados exclusivamente para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Gestión de reservas:</strong> confirmar disponibilidad, enviar propuestas y coordinar tu estadía.</li>
            <li><strong>Comunicaciones relacionadas con tu reserva:</strong> recordatorios, indicaciones de acceso, cambios o cancelaciones.</li>
            <li><strong>Facturación y cumplimiento de obligaciones legales</strong> (impositivas, contables, turísticas).</li>
            <li><strong>Atención al cliente:</strong> resolver consultas, reclamos o solicitudes de arrepentimiento.</li>
            <li><strong>Comunicaciones comerciales:</strong> solo si otorgaste tu consentimiento expreso. Podés darte de baja en cualquier momento.</li>
          </ul>
        </Section>

        <Section title="4. Bases legales y consentimiento">
          <p>El tratamiento de tus datos se basa en:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Ejecución del contrato:</strong> los datos de reserva son necesarios para cumplir el servicio solicitado.</li>
            <li><strong>Obligación legal:</strong> datos de facturación e impositivos requeridos por AFIP y normativa turística.</li>
            <li><strong>Consentimiento:</strong> para el envío de comunicaciones comerciales o el uso de imágenes con fines promocionales. Este consentimiento puede revocarse en cualquier momento sin afectar la validez de la reserva.</li>
          </ul>
          <p>
            No tomamos decisiones automatizadas ni realizamos perfilado con tus datos personales.
          </p>
        </Section>

        <Section title="5. Cómo ejercer tus derechos (Ley 25.326)">
          <p>
            En virtud de la Ley N° 25.326, tenés los siguientes derechos sobre tus datos personales:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Acceso:</strong> conocer qué datos tenemos sobre vos.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
            <li><strong>Supresión:</strong> solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
            <li><strong>Oposición:</strong> oponerte al tratamiento para fines de comunicación comercial.</li>
          </ul>
          <p>
            <strong>Cómo ejercerlos:</strong> enviá tu solicitud por escrito a{' '}
            <a href="mailto:experienciamagico@gmail.com" className="text-brand hover:underline">
              experienciamagico@gmail.com
            </a>
            {' '}o por WhatsApp al +54 9 351 676 5820, indicando tu nombre completo y el derecho que deseás ejercer.
          </p>
          <p>
            <strong>Plazo de respuesta:</strong> dentro de los 10 días hábiles de recibida la solicitud, conforme a lo establecido por la Ley 25.326.
          </p>
          <p>
            Si considerás que tu solicitud no fue atendida correctamente, podés presentar una denuncia ante la{' '}
            <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>, organismo de control en materia de protección de datos personales en Argentina:{' '}
            <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
              www.argentina.gob.ar/aaip
            </a>.
          </p>
        </Section>

        <Section title="6. Seguridad y conservación de los datos">
          <p>
            Implementamos medidas técnicas y organizativas razonables para proteger tus datos personales contra pérdida, uso indebido, acceso no autorizado o divulgación.
          </p>
          <p>
            Tus datos de reserva son conservados por el tiempo necesario para cumplir la prestación del servicio y las obligaciones legales aplicables (en general, 5 años para documentación contable e impositiva).
          </p>
          <p>
            No compartimos tus datos con terceros sin tu consentimiento, salvo obligación legal (requerimientos de AFIP, Defensa del Consumidor u otras autoridades competentes) o con proveedores estrictamente necesarios para la prestación del servicio (ej. plataformas de pago), quienes están obligados a mantener la confidencialidad.
          </p>
        </Section>

        <Section title="7. Cookies y herramientas de analítica">
          <p>
            Este sitio web utiliza herramientas de analítica web para comprender el comportamiento de los visitantes y mejorar la experiencia:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Microsoft Clarity:</strong> herramienta de mapas de calor y grabación de sesiones (anonimizadas). No recopila datos personales identificables. Política de privacidad:{' '}
              <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                privacy.microsoft.com
              </a>.
            </li>
            <li>
              <strong>Meta Pixel (Facebook):</strong> herramienta de análisis para medir la eficacia de la publicidad y personalizar anuncios en plataformas de Meta (Facebook/Instagram). Política de privacidad:{' '}
              <a href="https://www.facebook.com/about/privacy" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                facebook.com/about/privacy
              </a>.
            </li>
            <li>
              <strong>Google Ads:</strong> herramienta para medir conversiones y personalizar anuncios basados en tus intereses. Política de privacidad:{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                policies.google.com/privacy
              </a>.
            </li>
          </ul>
          <p>
            Podés rechazar o limitar las cookies Desde la configuración de tu navegador o mediante herramientas de exclusión publicitaria como{' '}
            <a href="https://www.youronlinechoices.com/es/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
              Your Online Choices
            </a>.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Chrome: Configuración → Privacidad y seguridad → Cookies.</li>
            <li>Firefox: Opciones → Privacidad y seguridad.</li>
            <li>Safari: Preferencias → Privacidad.</li>
          </ul>
          <p>
            Deshabilitar cookies puede afectar la funcionalidad de algunos elementos del sitio.
          </p>
        </Section>

        <Section title="8. Modificaciones a esta política">
          <p>
            Podemos actualizar esta Política de Privacidad en cualquier momento. La fecha de última actualización siempre estará visible al inicio del documento. Te recomendamos revisarla periódicamente.
          </p>
          <p>
            Si realizamos cambios significativos que afecten tus derechos, te lo comunicaremos por correo electrónico o WhatsApp si ya sos cliente.
          </p>
        </Section>

        <div className="mt-12 pt-8 border-t border-gray-200 text-xs text-dark/40 text-center flex flex-col items-center gap-4">
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
              className="h-16 w-auto object-contain"
            />
          </a>
          <div>
            © {new Date().getFullYear()} HERMANOS MÁGICOS SOCIEDAD POR ACCIONES SIMPLIFICADA — Todos los derechos reservados.
            <br />
            <a href="/terminos-y-condiciones" className="hover:text-brand transition-colors">Términos y Condiciones</a>
            {' · '}
            <a href="/" className="hover:text-brand transition-colors">Volver al inicio</a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PoliticaPrivacidad;
