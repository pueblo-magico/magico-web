import React, { useEffect } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';

const DATA_FISCAL_URL = '/uploads/F960.pdf';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-10">
    <h2 className="text-xl font-serif text-brand mb-4 pb-2 border-b border-brand/10">{title}</h2>
    <div className="text-dark/80 font-light leading-relaxed space-y-3 text-sm">{children}</div>
  </div>
);

export const TerminosYCondiciones: React.FC = () => {
  useEffect(() => {
    document.title = 'Términos y Condiciones — Pueblo Mágico';
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
            Términos y Condiciones
          </h1>
          <p className="text-dark/50 text-sm font-light">
            Última actualización: {fecha}
          </p>
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>Nota:</strong> Este sitio web es de carácter informativo. Las reservas y contrataciones se formalizan a través de WhatsApp o correo electrónico, no mediante carrito de compras.
          </div>
        </div>

        <Section title="1. Identificación de la empresa">
          <p>
            <strong>Razón social:</strong> HERMANOS MÁGICOS SOCIEDAD POR ACCIONES SIMPLIFICADA
          </p>
          <p>
            <strong>Nombre comercial:</strong> Pueblo Mágico — Ecolodge de Montaña
          </p>
          <p>
            <strong>Domicilio legal:</strong> Calle Aconquija 635, Villa Allende, Departamento Colón, Provincia de Córdoba, República Argentina.
          </p>
          <p>
            <strong>CUIT:</strong> 30-71875586-3
          </p>
          <p>
            <strong>Email de atención al consumidor:</strong>{' '}
            <a href="mailto:experienciamagico@gmail.com" className="text-brand hover:underline">
              experienciamagico@gmail.com
            </a>
          </p>
          <p>
            <strong>WhatsApp:</strong>{' '}
            <a href="https://wa.me/5493516765820" className="text-brand hover:underline" target="_blank" rel="noopener noreferrer">
              +54 9 351 676 5820
            </a>
          </p>
          <p>
            <strong>Formulario N° 960/D — Data Fiscal (AFIP):</strong>{' '}
            <a href={DATA_FISCAL_URL} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
              Ver constancia F960/D (PDF)
            </a>
          </p>
        </Section>

        <Section title="2. Naturaleza de la relación y del sitio web">
          <p>
            El sitio web <em>experienciamagico.com</em> es un canal informativo. No cuenta con carrito de compras ni pasarela de pago en línea. La información publicada tiene por fin describir las experiencias, alojamientos y retiros que ofrece Pueblo Mágico.
          </p>
          <p>
            El contrato de reserva o prestación de servicio se perfecciona Desde que el/la consumidor/a confirma la aceptación de la propuesta remitida por WhatsApp o correo electrónico, y el prestador confirma la disponibilidad.
          </p>
          <p>
            Toda la información básica del proveedor y de los servicios es previa y fácilmente accesible en el sitio, conforme a la Resolución 270/2020 de la Secretaría de Comercio Interior.
          </p>
        </Section>

        <Section title="3. Oferta, precios e impuestos">
          <p>
            Los precios publicados en el sitio o informados por WhatsApp se expresan en pesos argentinos (ARS) e incluyen IVA cuando corresponda, salvo indicación en contrario.
          </p>
          <p>
            Los precios pueden variar por temporada, tipo de experiencia o paquete contratado. El precio definitivo será el que se informe en la propuesta de reserva confirmada por escrito.
          </p>
          <p>
            <strong>Medios de pago aceptados:</strong> efectivo, transferencia bancaria, tarjeta de crédito y tarjeta de débito (terminal física en destino). Los medios de pago vigentes también se encuentran declarados en el Formulario N° 960/D (Data Fiscal) ante AFIP.
          </p>
        </Section>

        <Section title="4. Reservas y condiciones de pago">
          <p>
            Para iniciar una reserva, el/la interesado/a debe contactarse por WhatsApp (+54 9 351 676 5820) o correo electrónico (experienciamagico@gmail.com) indicando:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fechas deseadas de check-in y check-out.</li>
            <li>Número de personas (adultos y menores).</li>
            <li>Tipo de alojamiento o experiencia de interés.</li>
            <li>Datos de contacto.</li>
          </ul>
          <p>
            El prestador responderá dentro de las 24 a 48 horas hábiles con disponibilidad y propuesta de precio. La reserva quedará confirmada una vez abonado el anticipo requerido (cuando corresponda) dentro del plazo indicado en la propuesta.
          </p>
          <p>
            El check-in se realiza a partir de las 13:00 hs y el check-out hasta las 11:00 hs, salvo acuerdo previo.
          </p>
          <p>
            <strong>Horarios de comidas:</strong> desayuno de 09:00 a 10:00 hs, almuerzo de 14:00 a 15:00 hs y cena de 20:00 a 21:00 hs. Fuera de esos horarios no se presta servicio de cocina; quienes ingresen a partir de las 19:00 hs cuentan con el servicio de cena en su horario habitual. Las comidas no consumidas por llegadas tardías sin aviso previo no son acumulables ni reembolsables.
          </p>
          <p>
            En caso de haber abonado un anticipo, el saldo pendiente deberá cancelarse a más tardar al momento del check-out.
          </p>
        </Section>

        <Section title="5. Derecho de arrepentimiento (Res. 424/2020 — Art. 34, Ley 24.240)">
          <p>
            En los términos de la Ley 24.240 de Defensa del Consumidor y la Resolución 424/2020, todo/a consumidor/a tiene derecho a revocar la aceptación de la reserva o servicio contratado a distancia —incluyendo reservas realizadas por WhatsApp— dentro de los <strong>10 (diez) días corridos</strong> posteriores a la fecha de celebración del contrato, siempre que el servicio no haya sido iniciado.
          </p>
          <p>
            <strong>Cómo ejercer el derecho de arrepentimiento:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Comunicarse al WhatsApp +54 9 351 676 5820 o al correo experienciamagico@gmail.com.</li>
            <li>Indicar nombre completo, fecha de la reserva y el número o referencia de la misma.</li>
            <li>Solicitar expresamente la revocación de la reserva.</li>
          </ul>
          <p>
            Dentro de las 24 horas hábiles de recibida la solicitud, confirmaremos la cancelación por escrito (WhatsApp o email) con un número de referencia para que quede constancia. No se cobrarán costos adicionales, salvo gastos vinculados a servicios ya prestados.
          </p>
          <p>
            Una vez iniciado el servicio (check-in realizado), el derecho de arrepentimiento no se aplica en su totalidad; solo podrá solicitarse la devolución proporcional a la parte del servicio no utilizada, conforme a la política de cancelación vigente.
          </p>
        </Section>

        <Section title="6. Política de cancelaciones y no-show">
          <p>
            <strong>Cancelación por parte del cliente:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Con más de 10 días corridos de anticipación: cancelación sin cargo o reprogramación sin costo.</li>
            <li>Entre 5 y 10 días corridos de anticipación: se retiene el 50% del anticipo abonado.</li>
            <li>Con menos de 5 días corridos de anticipación: se retiene el 100% del anticipo abonado.</li>
          </ul>
          <p>
            <strong>Ausencia sin aviso previo:</strong> Si el/la huésped no se presenta en la fecha pactada sin haber comunicado cancelación o demora, se perderá el anticipo abonado y la reserva quedará cancelada automáticamente.
          </p>
          <p>
            <strong>Modificación de fechas:</strong> sujeta a disponibilidad y sin costo adicional si se solicita con más de 10 días de anticipación. En todos los casos, las reprogramaciones de fecha o ajustes en las comidas deben solicitarse con un mínimo de 24 horas de anticipación; vencido ese plazo, la reserva no podrá modificarse.
          </p>
          <p>
            Las políticas anteriores no afectan el derecho de arrepentimiento regulado en la Sección 5, que prevalece en su plazo legal.
          </p>
        </Section>

        <Section title="7. Normativa turística — Ley 25.997 y provincia de Córdoba">
          <p>
            Pueblo Mágico opera conforme a la Ley Nacional de Turismo N° 25.997 y su reglamentación, así como a la normativa provincial y municipal de hospedaje turístico de la Provincia de Córdoba.
          </p>
          <p>
            <strong>Inscripción ante autoridad de turismo:</strong> Resolución N° 000258 — Agencia Córdoba Turismo (14 ABR 2025). Clase: Alojamiento Alternativo. 3 Habitaciones Compartidas, 3 Domos, 1 Yurta — 48 plazas.
          </p>
          <p>
            El/la turista tiene derecho a:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Recibir información clara, veraz y completa sobre los servicios contratados antes de celebrar el contrato.</li>
            <li>Recibir los servicios en las condiciones acordadas y conforme a la oferta publicada.</li>
            <li>Acceder a mecanismos de reclamo ante la autoridad de turismo de la provincia de Córdoba (cordobaturismo.gov.ar).</li>
            <li>Recurrir ante la Subsecretaría de Defensa del Consumidor de la Nación en caso de conflicto.</li>
          </ul>
          <p>
            Los servicios básicos del establecimiento incluyen: alojamiento, alimentación según el paquete contratado, acceso a espacios naturales y actividades indicadas en la oferta. Las condiciones específicas de cada experiencia (check-in/check-out, capacidad, uso de espacios comunes, políticas de mascotas) serán informadas al momento de confirmar la reserva.
          </p>
        </Section>

        <Section title="8. Limitaciones de responsabilidad">
          <p>
            HERMANOS MÁGICOS S.A.S. no asume responsabilidad por:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Daños causados a terceros por el/la huésped durante su estadía.</li>
            <li>Daños materiales ocasionados por el/la huésped dentro del alojamiento, los cuales serán cobrados al responsable de la reserva.</li>
            <li>Situaciones de fuerza mayor: condiciones climáticas extremas, emergencias sanitarias, cortes de servicios públicos, desastres naturales u otras causas ajenas a la voluntad del prestador que impidan o alteren la prestación del servicio. En estos casos se ofrecerá reprogramación o devolución proporcional según corresponda.</li>
            <li>Pérdida o daño de bienes personales del/la huésped dentro del establecimiento, salvo dolo o culpa grave del prestador.</li>
          </ul>
        </Section>

        <Section title="9. Política de compensación y garantía de servicio">
          <p>
            En caso de que el establecimiento no pueda cumplir con alguno de los servicios esenciales pactados por causas imputables a la organización:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Inconvenientes operativos o fallas menores de servicio:</strong> se ofrecerá como compensación noches de estadía sin cargo para ser utilizadas en una futura fecha, sujeto a disponibilidad.</li>
            <li><strong>Contingencias graves o imposibilidad total de prestación del servicio:</strong> se procederá al reintegro o devolución proporcional o total del importe abonado, según corresponda.</li>
          </ul>
          <p>
            Quedan excluidas de esta garantía las interrupciones de servicios derivadas de fuerza mayor o condiciones climáticas extremas propias del entorno de montaña (ver Sección 8).
          </p>
        </Section>

        <Section title="10. Ley aplicable y foro">
          <p>
            Los presentes Términos y Condiciones se rigen por las leyes de la República Argentina, en particular:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ley N° 24.240 de Defensa del Consumidor y normas complementarias.</li>
            <li>Ley N° 25.997 Nacional de Turismo.</li>
            <li>Código Civil y Comercial de la Nación.</li>
            <li>Normativa provincial y municipal de la Provincia de Córdoba.</li>
          </ul>
          <p>
            Para cualquier controversia, las partes acuerdan someterse a la jurisdicción de los Tribunales Ordinarios de la Ciudad de Córdoba, Provincia de Córdoba, República Argentina, renunciando a cualquier otro fuero que pudiera corresponder.
          </p>
          <p>
            Ante consultas o reclamos de consumidores: Dirección Nacional de Defensa del Consumidor —{' '}
            <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
              www.argentina.gob.ar/produccion/defensadelconsumidor
            </a>
            .
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
            <a href="/politica-de-privacidad" className="hover:text-brand transition-colors">Política de Privacidad</a>
            {' · '}
            <a href="/" className="hover:text-brand transition-colors">Volver al inicio</a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TerminosYCondiciones;
