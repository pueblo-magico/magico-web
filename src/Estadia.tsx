import React, { useEffect, useState } from 'react';
import { LanguageProvider } from '../contexts/LanguageContext';
import { Accordion, AccordionMediaHeader } from '@pueblo-magico/react-ui';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SectionRegeneracion } from '../components/SectionRegeneracion';
import { BookingWidget } from '../components/BookingWidget';
import { WithdrawalAccessLink } from '../components/WithdrawalAccessLink';
import {
  Bed, ForkKnife, Leaf, WifiHigh, Tree, UsersThree,
  CheckCircle, ArrowRight, Sun, Mountains, Campfire,
  Laptop, HeartStraight, Compass, ChartLineUp, CurrencyCircleDollar,
  Star, CaretDown, CaretLeft, CaretRight, WhatsappLogo, Drop, Globe, Towel,
  CaretDownIcon, HouseIcon, WifiHighIcon, MountainsIcon, MapPinIcon,
  ClockIcon, UsersThreeIcon, CalendarIcon, WhatsappLogoIcon,
  ForkKnifeIcon, PawPrintIcon, WheelchairIcon
} from '@phosphor-icons/react';
import { RESERVATION_START_PATH, WA_MAGICO, SITE_URL } from './data/config';
import { ESTADIA_PRICES } from './data/retreats';
import { ROUTES } from './routes';
import {
  type AccommodationType,
  type PublicPriceRule,
  type PublicPricingSummary,
} from '../components/booking/bookingApi';
import { usePublicPricingSummary } from '../components/booking/usePublicPricingSummary';

const WA = (msg: string) =>
  `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(msg)}`;

const WA_ESTADIA = WA('Hola! Vengo de la web y quiero consultar una estadía en Pueblo Mágico ✨');

const ETIQUETAS_ALOJAMIENTO: Record<AccommodationType, string> = {
  domo: 'Domo geodésico',
  refugio: 'Refugio de Piedra',
  camping: 'Camping',
};

const ETIQUETAS_MODALIDAD: Record<string, string> = {
  cualquiera: 'Cualquier modalidad',
  compartida: 'Compartida',
  privada: 'Privada',
  camping: 'Camping',
};

const pesos = (centavos: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
    .format(centavos / 100);

const reglasDe = (precios: PublicPricingSummary | null, tipo: AccommodationType) =>
  precios?.opciones.find(opcion => opcion.tipo_alojamiento === tipo)?.tarifas || [];

function tarifaDesde(reglas: PublicPriceRule[]): { importe: number; unidad: string } | null {
  const porPersona = reglas.filter(regla => regla.base_calculo === 'persona_noche');
  const candidatas = porPersona.length > 0 ? porPersona : reglas;
  if (candidatas.length === 0) return null;
  const menor = candidatas.reduce((actual, regla) =>
    regla.importe_centavos < actual.importe_centavos ? regla : actual
  );
  return {
    importe: menor.importe_centavos,
    unidad: menor.base_calculo === 'persona_noche' ? 'persona/noche' : 'unidad/noche',
  };
}

function textoTarifas(reglas: PublicPriceRule[], cargado: boolean): string {
  if (!cargado) return 'Cargando tarifas vigentes…';
  if (reglas.length === 0) return 'Consultá disponibilidad y precio para tus fechas';
  const persona = tarifaDesde(reglas.filter(regla => regla.base_calculo === 'persona_noche'));
  const unidad = tarifaDesde(reglas.filter(regla => regla.base_calculo === 'unidad_noche'));
  return [
    persona && `desde ${pesos(persona.importe)} por persona/noche`,
    unidad && `desde ${pesos(unidad.importe)} por unidad/noche`,
  ].filter(Boolean).join(' · ');
}

function textoModalidades(precios: PublicPricingSummary | null, tipo: AccommodationType, cargado: boolean): string {
  if (!cargado) return 'consultando modalidades…';
  if (!precios) return 'consultá las modalidades disponibles en la reserva online';
  const opcion = precios?.opciones.find(item => item.tipo_alojamiento === tipo);
  if (!opcion) return 'no disponible para nuevas reservas online';
  return opcion.modalidades.map(modalidad =>
    (opcion.nombres_modalidades?.[modalidad] || ETIQUETAS_MODALIDAD[modalidad]).toLocaleLowerCase('es-AR')
  ).join(' y ');
}

function etiquetaModalidad(
  precios: PublicPricingSummary | null,
  tipo: AccommodationType,
  modalidad: string,
): string {
  if (modalidad === 'cualquiera') return ETIQUETAS_MODALIDAD.cualquiera;
  const opcion = precios?.opciones.find(item => item.tipo_alojamiento === tipo);
  return opcion?.nombres_modalidades?.[modalidad as keyof typeof opcion.nombres_modalidades]
    || ETIQUETAS_MODALIDAD[modalidad]
    || modalidad;
}

function textoPrecioRegla(regla: PublicPriceRule, adicionalPersona = 0): string {
  if (regla.base_calculo === 'persona_noche') {
    return `${pesos(regla.importe_centavos + adicionalPersona)}/persona`;
  }
  return adicionalPersona > 0
    ? `${pesos(regla.importe_centavos)}/unidad + ${pesos(adicionalPersona)}/persona`
    : `${pesos(regla.importe_centavos)}/unidad`;
}

function textoComidasOpcionales(precios: PublicPricingSummary | null): string {
  const pension = precios?.alimentacion.pension_completa;
  const almuerzo = pension?.precio_almuerzo_centavos ?? pension?.precio_comida_centavos ?? 0;
  const cena = pension?.precio_cena_centavos ?? pension?.precio_comida_centavos ?? 0;
  if (almuerzo <= 0 && cena <= 0) return 'Comidas opcionales';
  if (almuerzo === cena) return `Almuerzo o cena +${pesos(almuerzo)} c/u`;
  return `Almuerzo +${pesos(almuerzo)} · cena +${pesos(cena)}`;
}

function textoComidaDesdePorPersona(precios: PublicPricingSummary | null): string {
  const pension = precios?.alimentacion.pension_completa;
  const preciosPublicados = [
    pension?.precio_almuerzo_centavos ?? pension?.precio_comida_centavos ?? 0,
    pension?.precio_cena_centavos ?? pension?.precio_comida_centavos ?? 0,
  ].filter(precio => precio > 0);

  if (preciosPublicados.length === 0) return 'Comidas opcionales';
  return `Desde +${pesos(Math.min(...preciosPublicados))} por persona/comida`;
}

function textoTarifasPublicadas(precios: PublicPricingSummary | null, cargado: boolean): string {
  if (!cargado) return 'Cargando las tarifas vigentes…';
  if (!precios || precios.opciones.length === 0) {
    return 'Consultá el precio y la disponibilidad para tus fechas en la reserva online.';
  }

  const opciones = precios.opciones
    .map(opcion => {
      const resumen = textoTarifas(opcion.tarifas, true);
      return resumen.startsWith('Consultá')
        ? null
        : `${ETIQUETAS_ALOJAMIENTO[opcion.tipo_alojamiento]} ${resumen}`;
    })
    .filter((opcion): opcion is string => Boolean(opcion));

  if (opciones.length === 0) {
    return 'Consultá el precio y la disponibilidad para tus fechas en la reserva online.';
  }

  return `${opciones.join(' · ')}. El total se calcula con tus fechas, ocupación y modalidad.`;
}

function textoPensionCompleta(precios: PublicPricingSummary | null, cargado: boolean): string {
  if (!cargado) return 'Cargando la política de alimentación vigente…';
  const pension = precios?.alimentacion.pension_completa;
  if (!pension) return 'Consultá las opciones de alimentación disponibles al reservar.';
  const adicional = pension.adicional_por_persona_noche_centavos;
  return adicional > 0
    ? `Suma ${pesos(adicional)} por persona/noche a la tarifa del alojamiento. La reserva muestra el total cerrado antes de confirmar.`
    : 'La reserva calcula el total cerrado según el alojamiento, la ocupación y las noches elegidas.';
}

function textoHorarioComida(
  precios: PublicPricingSummary | null,
  comida: 'desayuno' | 'almuerzo' | 'cena',
  cargado: boolean,
): string {
  if (!cargado) return 'Cargando…';
  const horario = precios?.horarios_comidas[comida];
  return horario ? `${horario.desde}–${horario.hasta}` : 'Consultar';
}

// ── Sección Hero ─────────────────────────────────────────────────────────────
const Hero: React.FC<{ tarifaDesdeActual: { importe: number; unidad: string } | null; cargado: boolean }> = ({ tarifaDesdeActual, cargado }) => (
  <section className="relative h-[92vh] min-h-[600px] w-full flex items-end overflow-hidden">
    <img
      src="/uploads/hero-estadia.webp"
      alt="Pueblo Mágico — vista del campo"
      className="absolute inset-0 w-full h-full object-cover object-center"
      {...{ fetchpriority: 'high' }}
      decoding="async"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-[#002d1a]/90 via-[#002d1a]/30 to-transparent" />
    <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-16 md:pb-24">
      <p className="text-gold/80 text-[10px] uppercase tracking-[0.3em] font-bold mb-4">
        ECOLODGE DE MONTAÑA · COMUNIDAD · BUEN VIVIR
      </p>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white leading-tight mb-5 drop-shadow-xl font-light max-w-3xl">
        Filosofía del<br />Buen Vivir
      </h1>
      <p className="text-white/75 text-base font-light max-w-xl mb-2 leading-relaxed">
        Ecolodge de montaña en las Sierras Grandes: Refugio de Piedra, domos geodésicos y camping. Elegí cómo querés vivir Pueblo Mágico.
      </p>
      <p className="text-gold text-xs font-bold uppercase tracking-widest mb-5">
        ✦ {tarifaDesdeActual
          ? `Desde ${pesos(tarifaDesdeActual.importe)}/${tarifaDesdeActual.unidad} con desayuno — sumá comidas y experiencias a tu gusto`
          : cargado ? 'Consultá disponibilidad y precio real antes de reservar' : 'Cargando tarifas vigentes…'}
      </p>
      <div className="flex flex-wrap gap-2 mb-7">
        {['Para emprendedores & creativos', 'Parejas', 'Grupos & familias'].map(chip => (
          <span key={chip} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/25 text-white/70">
            {chip}
          </span>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <a
          href={RESERVATION_START_PATH}
          className="inline-flex items-center justify-center gap-2 bg-gold text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-brand transition-[background-color,color] duration-300 shadow-lg"
        >
          <CalendarIcon className="w-4 h-4 flex-shrink-0" weight="bold" />
          Reservar mi lugar
        </a>
        <a
          href="#alojamientos"
          className="inline-flex items-center justify-center gap-2 border border-white/40 text-white/90 px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors duration-300"
        >
          Ver alojamientos
          <ArrowRight className="w-4 h-4 flex-shrink-0" />
        </a>
      </div>
    </div>
  </section>
);

// ── Strip de inclusiones ──────────────────────────────────────────────────────
const Inclusiones: React.FC<{ tarifaDesdeActual: { importe: number; unidad: string } | null; cargado: boolean }> = ({ tarifaDesdeActual, cargado }) => {
  const items = [
    { icon: <Bed className="w-5 h-5" weight="duotone" />,      label: 'Alojamiento' },
    { icon: <Towel className="w-5 h-5" weight="duotone" />,    label: 'Ropa blanca' },
    { icon: <Drop className="w-5 h-5" weight="duotone" />,     label: 'Biokit Ecológico' },
    { icon: <Leaf className="w-5 h-5" weight="duotone" />,      label: 'Guía Reset Vital PDF' },
    { icon: <WifiHigh className="w-5 h-5" weight="duotone" />,  label: 'Starlink' },
    { icon: <Mountains className="w-5 h-5" weight="duotone" />, label: 'Espacios naturales' },
    { icon: <Sun className="w-5 h-5" weight="duotone" />,       label: 'Energía solar' },
    { icon: <Drop className="w-5 h-5" weight="duotone" />,     label: 'Baños secos' },
    { icon: <Leaf className="w-5 h-5" weight="duotone" />,     label: 'Compost' },
    { icon: <ForkKnife className="w-5 h-5" weight="duotone" />, label: 'Desayuno incluido · +Comidas opcionales' },
  ];

  return (
    <div className="bg-brand text-white py-5 px-6">
      <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-white/85">
            <span className="text-gold">{item.icon}</span>
            {item.label}
          </div>
        ))}
        <div className="w-full text-center mt-1">
          <span className="text-gold/60 text-[10px] uppercase tracking-widest font-bold">
            Ecolodge: energía solar casi al 100% · baños secos que no contaminan el agua · compostamos todos los residuos compostables
          </span>
        </div>
        <div className="w-full text-center">
          <span className="text-gold/60 text-[10px] uppercase tracking-widest font-bold">
            {tarifaDesdeActual
              ? `Desde ${pesos(tarifaDesdeActual.importe)}/${tarifaDesdeActual.unidad} con desayuno · sumá almuerzo, cena o pensión completa a tu gusto · Sin sorpresas ocultas`
              : cargado ? 'Consultá precio y disponibilidad en la reserva online · Sin sorpresas ocultas' : 'Cargando tarifas vigentes…'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Alojamientos ─────────────────────────────────────────────────────────────
const ALOJAMIENTOS = [
  {
    tipo: 'domo' as const,
    name: 'Domo Geodésico',
    tag: 'MÁS SOLICITADO',
    tagColor: 'bg-gold text-white',
    shortLead: '7 camas de una plaza',
    desc: 'Esfera geométrica en plena montaña con ventanas panorámicas al cielo. 7 camas de una plaza, ropa blanca incluida y baños compartidos a metros del domo. Las modalidades disponibles se muestran según la configuración vigente.',
    image: '/uploads/domos.webp',
    details: ['7 camas de 1 plaza', 'Ropa blanca incluida', 'Baños compartidos fuera del domo', 'Desayuno incluido · sumá comidas', 'Programa Reset Vital'],
  },
  {
    tipo: 'refugio' as const,
    name: 'Refugio de Piedra',
    tag: 'COLIVING',
    tagColor: 'bg-bone text-brand border border-brand/20',
    shortLead: 'Casa de piedra · habitaciones compartidas o una entera para tu grupo',
    desc: 'La casa de piedra es el corazón de Pueblo Mágico: recepción, salón y comedor, con las habitaciones a pasos. No es un hotel: es una casa grande de montaña para vivir en comunidad. Baños compartidos. Las modalidades disponibles se muestran según la configuración vigente.',
    image: '/uploads/habitaciones.webp',
    details: ['Programa Reset Vital', 'Camas individuales', 'Baños compartidos', 'Habitación entera para tu grupo', 'Desayuno incluido · sumá comidas'],
  },
  {
    tipo: 'camping' as const,
    name: 'Camping',
    tag: 'LA MÁS ECONÓMICA',
    tagColor: 'bg-bone text-brand border border-brand/20',
    shortLead: 'Bajo las estrellas · duchas calientes · traé tu carpa',
    desc: 'Instalá tu carpa en pleno campo y dormí bajo las estrellas de los Gigantes. Para quienes buscan la experiencia más cruda y auténtica de la montaña, con la puerta de entrada más accesible a Pueblo Mágico. Duchas calientes y baños disponibles.',
    image: '/uploads/exterior.webp',
    details: ['Programa Reset Vital', 'Traé tu carpa', 'Duchas calientes y baños', 'Fogón comunitario', 'Desayuno incluido · sumá comidas'],
  },
];

const Alojamientos: React.FC<{ precios: PublicPricingSummary | null; cargado: boolean }> = ({ precios, cargado }) => {
  const adicionalPension = precios?.alimentacion.pension_completa?.adicional_por_persona_noche_centavos || 0;
  const precioAlmuerzo = precios?.alimentacion.pension_completa?.precio_almuerzo_centavos
    ?? precios?.alimentacion.pension_completa?.precio_comida_centavos ?? 0;
  const precioCena = precios?.alimentacion.pension_completa?.precio_cena_centavos
    ?? precios?.alimentacion.pension_completa?.precio_comida_centavos ?? 0;
  const filasTarifa = precios?.opciones.flatMap(opcion => opcion.tarifas.map(regla => ({
    ...regla,
    tipo: opcion.tipo_alojamiento,
  }))) || [];

  return (
    <section id="alojamientos" className="py-20 bg-bone">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div data-reveal className="text-center mb-10">
          <p className="inline-block bg-brand text-white font-bold tracking-widest uppercase text-[10px] px-4 py-2 rounded-full mb-4">Puerta de entrada</p>
          <h2 className="text-3xl md:text-4xl font-serif text-brand mb-2">Elegí tu alojamiento</h2>
          <p className="text-dark/60 text-sm max-w-md mx-auto">Conocé las opciones disponibles — las modalidades habilitadas y sus tarifas se actualizan desde la configuración de reservas.</p>
        </div>

        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] gap-8 items-start">

          {/* Acordeón de cards + precios */}
          <div className="min-w-0">
            <Accordion
              className="estadia-accommodations-accordion mb-5"
              defaultExpandedItems={[ALOJAMIENTOS[0].tipo]}
              headingLevel={3}
              items={ALOJAMIENTOS.map(aloj => ({
                id: aloj.tipo,
                headerLayout: 'media' as const,
                triggerLabel: `Ver detalles de ${aloj.name}`,
                header: (
                  <AccordionMediaHeader
                    media={<img src={aloj.image} alt="" loading="lazy" />}
                    eyebrow={<span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block ${aloj.tagColor}`}>{aloj.tag}</span>}
                    heading={aloj.name}
                    description={`${aloj.shortLead} · ${textoModalidades(precios, aloj.tipo, cargado)} · ${textoTarifas(reglasDe(precios, aloj.tipo), cargado)}`}
                  />
                ),
                content: (
                  <div>
                    <p className="text-dark/65 text-sm leading-relaxed mb-3">{aloj.desc}</p>
                    <ul className="flex flex-wrap gap-2 mb-4">
                      {aloj.details.map(detail => (
                        <li key={detail} className="flex items-center gap-1.5 text-xs text-dark/60 bg-bone rounded-full px-3 py-1">
                          <CheckCircle className="w-3.5 h-3.5 text-gold flex-shrink-0" weight="duotone" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                    <a href={RESERVATION_START_PATH}
                      className="inline-flex items-center justify-center gap-2 bg-brand text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gold transition-colors w-full">
                      <CalendarIcon className="w-4 h-4" weight="bold" />
                      Reservar ahora
                    </a>
                  </div>
                ),
              }))}
              type="single"
            />

            {/* Nota de disponibilidad privada */}
            {precios?.opciones.some(opcion => opcion.modalidades.includes('privada')) && <div className="bg-brand/5 border border-brand/10 rounded-2xl px-5 py-4 mb-4 flex gap-3 items-start">
              <span className="text-gold text-base flex-shrink-0 mt-0.5">✦</span>
              <p className="text-dark/70 text-sm leading-relaxed">
                <strong className="text-brand font-semibold">Uso privado disponible</strong> — según las fechas, podés reservar un domo exclusivo o habitaciones privadas en el Refugio de Piedra, tanto para grupos como para personas solas cuando el espacio tiene poca ocupación.{' '}
                <a href={WA_ESTADIA} target="_blank" rel="noopener noreferrer" className="text-brand font-semibold underline underline-offset-2 hover:text-gold transition-colors">Consultá disponibilidad por WhatsApp.</a>
              </p>
            </div>}

            {/* Tabla de precios compacta */}
            <div className="bg-white rounded-2xl p-5 border border-gold/30 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <CurrencyCircleDollar className="w-5 h-5 text-gold flex-shrink-0" weight="duotone" />
                <p className="text-brand font-serif text-lg">Tarifas</p>
              </div>
              <p className="inline-block bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
                ✦ Plan publicado {precios ? `v${precios.plan.version}` : ''} · valores por noche
              </p>
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-end px-1 mb-1.5">
                <span />
                <span className="text-dark/40 text-[10px] uppercase tracking-widest text-center w-24">Con desayuno</span>
                <span className="text-gold text-[10px] uppercase tracking-widest font-bold text-center w-24">Pensión completa</span>
              </div>
              {!cargado && <p className="rounded-xl bg-bone px-4 py-4 text-sm text-dark/60">Cargando tarifas vigentes…</p>}
              {cargado && filasTarifa.length === 0 && <p className="rounded-xl bg-bone px-4 py-4 text-sm text-dark/60">No hay tarifas publicadas aplicables hoy. Consultá el precio en la reserva online.</p>}
              {filasTarifa.map((row, indice) => (
                <div key={`${row.tipo}-${row.modalidad}-${row.ocupacion_min}-${row.ocupacion_max}-${indice}`} className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center bg-bone rounded-xl px-4 py-3 border mb-2 border-brand/10">
                  <div>
                    <p className="text-brand text-sm font-semibold leading-tight">{ETIQUETAS_ALOJAMIENTO[row.tipo]}</p>
                    <p className="text-dark/45 text-[11px] mt-0.5">
                      {etiquetaModalidad(precios, row.tipo, row.modalidad)} · {row.ocupacion_min}–{row.ocupacion_max} personas
                    </p>
                  </div>
                  <p className="text-brand text-sm font-serif text-center w-24">{textoPrecioRegla(row)}</p>
                  <p className="text-gold text-sm font-serif text-center w-24">{textoPrecioRegla(row, adicionalPension)}</p>
                </div>
              ))}
              <p className="text-dark/50 text-xs leading-relaxed mt-2">
                <strong className="text-brand">Con desayuno:</strong> alojamiento + desayuno. {precioAlmuerzo > 0 || precioCena > 0 ? <>Podés sumar {precioAlmuerzo === precioCena ? <>almuerzo o cena a +{pesos(precioAlmuerzo)} c/u.</> : <>almuerzo a +{pesos(precioAlmuerzo)} y cena a +{pesos(precioCena)}.</>}</> : 'Consultá las comidas opcionales al reservar.'}<br />
                <strong className="text-gold">Pensión completa:</strong> alojamiento + desayuno, almuerzo y cena, precio total cerrado.
              </p>
              {precios && <p className="text-dark/40 text-[11px] leading-relaxed mt-2">Vigencia consultada: {precios.fecha_referencia}. El total final depende de las fechas, la ocupación y la modalidad elegida, y se confirma antes de reservar.</p>}
              <p className="text-center text-dark/40 text-xs mt-3">
                ¿Dudas para armar tu estadía? —{' '}
                <a href="#escalera" className="text-brand font-semibold underline underline-offset-2 hover:text-gold transition-colors">ver cómo armar tu estadía</a>. Sin sorpresas ocultas.
              </p>
            </div>
          </div>

          {/* Widget de reserva sticky — aparece primero en mobile */}
          {/* top-36: debajo del header + la barra de secciones (~123px). Con
              max-h + scroll interno el widget nunca queda más alto que la
              pantalla, aunque crezca al cambiar de opción. */}
          <div id="reservar" className="order-first min-w-0 max-w-full lg:order-none lg:sticky lg:top-36 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:rounded-2xl">
            <BookingWidget />
            <WithdrawalAccessLink embedded />
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Escalera de valor ─────────────────────────────────────────────────────────
const EscaleraDeValor: React.FC<{
  tarifaDesdeActual: { importe: number; unidad: string } | null;
  precios: PublicPricingSummary | null;
  cargado: boolean;
}> = ({ tarifaDesdeActual, precios, cargado }) => {
  const escalera = [
    {
      icon: <Bed className="w-6 h-6" weight="duotone" />,
      step: '1',
      title: 'Vení a Pueblo Mágico',
      price: tarifaDesdeActual
        ? `Desde ${pesos(tarifaDesdeActual.importe)}/${tarifaDesdeActual.unidad}`
        : cargado ? 'Consultá el precio para tus fechas' : 'Cargando tarifa vigente…',
      desc: 'Alojamiento + desayuno. Refugio de Piedra, domo compartido o privado, o camping, según disponibilidad online.',
    },
    {
      icon: <ForkKnife className="w-6 h-6" weight="duotone" />,
      step: '2',
      title: 'Quedate a comer',
      price: textoComidaDesdePorPersona(precios),
      desc: 'O sumá la pensión completa. La reserva calcula el total cerrado según tu alojamiento, ocupación y cantidad de noches.',
    },
    {
      icon: <Leaf className="w-6 h-6" weight="duotone" />,
      step: '3',
      title: 'Viví Reset Vital',
      price: 'Programa digital incluido',
      desc: `Guía autoguiada gratis en toda estadía. Sumá las actividades grupales presenciales por +$${ESTADIA_PRICES.resetVitalPresencial.toLocaleString('es-AR')} por persona, tarifa única.`,
    },
    {
      icon: <HeartStraight className="w-6 h-6" weight="duotone" />,
      step: '4',
      title: 'Personalizá tu experiencia',
      price: 'Precio independiente',
      desc: 'Cabalgatas, trekking guiado, masajes, reiki, coaching, talleres artesanales y más. Consultanos.',
    },
  ];

  return (
  <section id="escalera" className="py-20 bg-white border-t border-brand/5">
    <div className="max-w-6xl mx-auto px-6 lg:px-12">
      <div data-reveal className="text-center mb-12">
        <p className="text-brand font-bold tracking-widest uppercase text-xs mb-4">Cómo funciona</p>
        <h2 className="text-3xl md:text-4xl font-serif text-brand mb-3">Elegí cómo querés vivir Pueblo Mágico</h2>
        <p className="text-dark/60 text-sm max-w-lg mx-auto">Una puerta de entrada accesible, y un camino claro para ir sumando lo que quieras. Nada es obligatorio.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {escalera.map((s, i) => (
          <div key={i} data-reveal data-delay={`${i + 1}` as any} className="relative bg-bone rounded-2xl p-5 border border-brand/5">
            <span className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">{s.step}</span>
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-brand mb-3 shadow-sm">
              {s.icon}
            </div>
            <h3 className="font-serif text-base text-brand mb-1">{s.title}</h3>
            <p className="text-gold font-bold text-xs uppercase tracking-wide mb-2">{s.price}</p>
            <p className="text-dark/60 text-xs leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <a href="/reset-vital" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-brand font-semibold text-sm underline underline-offset-2 hover:text-gold transition-colors">
          Conocé el programa Reset Vital <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  </section>
  );
};

// ── Horarios y Pensión Completa de Montaña ───────────────────────────────────
const HorariosPension: React.FC<{
  precios: PublicPricingSummary | null;
  cargado: boolean;
}> = ({ precios, cargado }) => {
  const desayunoHabilitado = Boolean(precios?.alimentacion.desayuno_incluido);
  const pensionHabilitada = Boolean(precios?.alimentacion.pension_completa);

  return (
  <section className="py-14 bg-bone">
    <div className="max-w-4xl mx-auto px-6">
      <div data-reveal className="bg-white rounded-2xl border border-brand/10 shadow-sm p-6 md:p-8">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-brand/5 flex items-center justify-center flex-shrink-0">
            <ClockIcon className="w-5 h-5 text-gold" weight="duotone" />
          </div>
          <div>
            <h2 className="font-serif text-xl md:text-2xl text-brand leading-tight">Horarios y Gastronomía de Montaña</h2>
            <p className="inline-block bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mt-2">
              ✦ {desayunoHabilitado ? 'Desayuno incluido' : 'Alimentación configurable'} · {textoComidasOpcionales(precios)}
            </p>
          </div>
        </div>

        <p className="text-dark/70 text-sm leading-relaxed mb-5">
          <strong className="text-brand font-semibold">Tarifas publicadas:</strong>{' '}
          {textoTarifasPublicadas(precios, cargado)}
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div className="bg-bone rounded-xl px-4 py-3 text-center">
            <p className="text-dark/40 text-xs uppercase tracking-widest mb-0.5">Check-In</p>
            <p className="text-brand text-lg font-serif">13:00 hs</p>
          </div>
          <div className="bg-bone rounded-xl px-4 py-3 text-center">
            <p className="text-dark/40 text-xs uppercase tracking-widest mb-0.5">Check-Out</p>
            <p className="text-brand text-lg font-serif">11:00 hs</p>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-brand font-semibold text-sm mb-2">Cómo sumar comidas</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-dark/65">
              <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" weight="duotone" />
              <span><strong className="text-brand font-medium">Desayuno:</strong> {desayunoHabilitado ? 'incluido según la política publicada.' : 'la disponibilidad se confirma al cotizar.'}</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-dark/65">
              <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" weight="duotone" />
              <span><strong className="text-brand font-medium">Almuerzo y cena:</strong> {textoComidasOpcionales(precios)} — menú del día; la reserva aplica los valores publicados.</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-dark/65">
              <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" weight="duotone" />
              <span><strong className="text-brand font-medium">Pensión completa:</strong> {pensionHabilitada ? textoPensionCompleta(precios, cargado) : 'no está habilitada en la política publicada para esta fecha.'}</span>
            </li>
          </ul>
        </div>

        <div className="mb-5">
          <p className="text-brand font-semibold text-sm mb-2">Horarios del servicio de comidas</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-bone rounded-lg px-2 py-2 text-center">
              <p className="text-dark/40 text-[10px] uppercase tracking-widest">Desayuno</p>
              <p className="text-brand text-sm font-semibold">{textoHorarioComida(precios, 'desayuno', cargado)}</p>
            </div>
            <div className="bg-bone rounded-lg px-2 py-2 text-center">
              <p className="text-dark/40 text-[10px] uppercase tracking-widest">Almuerzo</p>
              <p className="text-brand text-sm font-semibold">{textoHorarioComida(precios, 'almuerzo', cargado)}</p>
            </div>
            <div className="bg-bone rounded-lg px-2 py-2 text-center">
              <p className="text-dark/40 text-[10px] uppercase tracking-widest">Cena</p>
              <p className="text-brand text-sm font-semibold">{textoHorarioComida(precios, 'cena', cargado)}</p>
            </div>
          </div>
          <p className="text-dark/50 text-xs leading-relaxed">
            Fuera de estos horarios no se presta servicio de cocina. El día del check-in contás con la cena dentro del horario publicado; las comidas no consumidas por llegadas tardías sin aviso no son acumulables ni reembolsables.
          </p>
        </div>

        <div className="bg-brand/5 border border-brand/10 rounded-xl px-5 py-4">
          <p className="text-brand font-semibold text-sm mb-2">Uso extendido del predio (flexibilidad)</p>
          <p className="text-dark/65 text-sm leading-relaxed mb-2">
            Podés llegar antes de las 13:00 hs o quedarte después de las 11:00 hs disfrutando del río y las 200 hectáreas del predio, sin problema.
          </p>
          <p className="text-dark/50 text-xs leading-relaxed mb-2">
            Durante ese lapso no vas a contar con la habitación/domo, ya que va a estar en proceso de limpieza y orden para los próximos ingresos.
          </p>
          <p className="text-dark/65 text-sm leading-relaxed">
            Si querés almorzar en el refugio el día de tu check-out, se ofrece el almuerzo como consumo extra.
          </p>
        </div>

        <div className="bg-gold/5 border border-gold/20 rounded-xl px-5 py-4 mt-3">
          <p className="text-brand font-semibold text-sm mb-1">Saldo y cambios de fecha</p>
          <p className="text-dark/60 text-xs leading-relaxed">
            Si reservaste con seña, el saldo pendiente se cancela hasta el check-out. Reprogramaciones de fecha o ajustes de comidas: mínimo 24 hs de anticipación. Política completa de cancelación en{' '}
            <a href="/terminos-y-condiciones" className="text-brand underline">Términos y Condiciones</a>.
          </p>
        </div>

        <div className="mt-5 pt-5 border-t border-brand/10">
          <p className="text-brand font-semibold text-sm mb-3">Infraestructura y servicios incluidos</p>
          <ul className="grid sm:grid-cols-2 gap-2.5">
            <li className="flex items-start gap-2 text-sm text-dark/65">
              <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" weight="duotone" />
              <span>Uso libre de las <strong className="text-brand font-medium">200 hectáreas</strong> de reserva natural</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-dark/65">
              <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" weight="duotone" />
              <span>Calefacción en todos los espacios y agua caliente las 24 hs</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-dark/65">
              <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" weight="duotone" />
              <span>WiFi Starlink disponible para trabajo remoto</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-dark/65">
              <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" weight="duotone" />
              <span>Programa <strong className="text-brand font-medium">Reset Vital digital</strong> incluido en toda estadía · upgrade a actividades grupales presenciales por +$5.000 por persona, tarifa única</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-dark/65">
              <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" weight="duotone" />
              <span><strong className="text-brand font-medium">Capacidad:</strong> Refugio de Piedra para 15 personas + 2 domos geodésicos de 7 personas c/u (14 en total), adaptables a domo privado para 1 persona, pareja o grupo</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-dark/65">
              <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" weight="duotone" />
              <span><strong className="text-brand font-medium">Baños:</strong> 1 baño y ducha dentro del refugio, 4 baños secos y 2 duchas cerca del refugio, y 8 baños y 8 duchas cerca de los domos</span>
            </li>
          </ul>
          <p className="text-dark/60 text-sm leading-relaxed mt-3">
            <strong className="text-brand font-semibold">Grupos:</strong> domo privado hasta 7 personas, y para grupos más grandes podríamos ofrecer una o más habitaciones privadas dentro del Refugio de Piedra, solo para ustedes — consultanos la disponibilidad por WhatsApp. Ideal para familias, amigos o instituciones que viajan juntas.
          </p>
          <p className="text-dark/50 text-xs leading-relaxed mt-2">
            Actividades y traslados a consultar: temazcal ceremonial, cabalgatas, traslado desde Córdoba / Villa Carlos Paz.
          </p>
        </div>
      </div>
    </div>
  </section>
  );
};

// ── Galería del lugar ─────────────────────────────────────────────────────────
const GALERIA = [
  { src: '/uploads/dji_0074.webp',                                   caption: 'Vista aérea — los domos, el refugio y el bosque en medio de la sierra' },
  { src: '/uploads/494815924_1424799465353456_392615711940557767_n.webp', caption: 'El paraje completo, visto desde el aire' },
  { src: '/uploads/refu.webp',                                       caption: 'El refugio de piedra al atardecer' },
  { src: '/uploads/img_6948.webp',                                   caption: 'Las Sierras Grandes de Córdoba' },
  { src: '/uploads/mesadas.webp',                                    caption: 'La cocina — el corazón de la casa' },
  { src: '/uploads/origen.webp',                                     caption: 'El salón, con vista abierta a la sierra' },
  { src: '/uploads/yoga_salon.webp',                                  caption: 'Espacio para prácticas y dinámicas grupales' },
  { src: '/uploads/469742031_941240881439467_8316347989568757415_n.webp', caption: 'El salón, listo para la próxima sesión' },
  { src: '/uploads/coworking.webp',                                  caption: 'Rincón de coworking con WiFi Starlink' },
  { src: '/uploads/bienestar-balance.webp',                          caption: 'Círculo de meditación al amanecer' },
  { src: '/uploads/botica.webp',                                     caption: 'Comidas compartidas, en comunidad' },
  { src: '/uploads/469280911_444096748740233_2818770490495002077_n.webp', caption: 'Desayuno servido — pensión completa' },
  { src: '/uploads/f2d5nat1pa6uihnwj480.webp',                       caption: 'Círculo junto al fogón, de día' },
  { src: '/uploads/fogon_nocturno.webp',                              caption: 'Noches de fogón bajo un cielo sin contaminación lumínica' },
  { src: '/uploads/img_8475.webp',                                    caption: 'Comunidad — lo que hace a Pueblo Mágico' },
];

const Galeria: React.FC = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % GALERIA.length), 4500);
    return () => clearInterval(t);
  }, []);

  const prev = () => setIdx(i => (i - 1 + GALERIA.length) % GALERIA.length);
  const next = () => setIdx(i => (i + 1) % GALERIA.length);

  return (
    <section className="py-16 md:py-20 bg-white border-t border-brand/5">
      <div className="max-w-5xl mx-auto px-6">
        <div data-reveal className="text-center mb-8">
          <p className="text-brand font-bold tracking-widest uppercase text-xs mb-2">Conocé el lugar</p>
          <h2 className="text-2xl md:text-4xl font-serif text-brand">Así se vive Pueblo Mágico</h2>
        </div>

        <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ height: '62vh', minHeight: 360, maxHeight: 600 }}>
          {GALERIA.map((photo, i) => (
            <div key={photo.src} className="absolute inset-0 transition-opacity duration-700 flex items-center justify-center bg-bone"
              style={{ opacity: i === idx ? 1 : 0 }}>
              <img src={photo.src} alt={photo.caption} className="w-full h-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'} />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          <button onClick={prev} aria-label="Foto anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white/90 hover:bg-white transition-colors">
            <CaretLeft weight="bold" className="w-4 h-4 text-brand" />
          </button>
          <button onClick={next} aria-label="Foto siguiente"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white/90 hover:bg-white transition-colors">
            <CaretRight weight="bold" className="w-4 h-4 text-brand" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 z-10 text-center pb-5 px-6">
            <p className="text-white text-sm mb-3 drop-shadow">{GALERIA[idx].caption}</p>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {GALERIA.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} aria-label={`Foto ${i + 1}`}
                  className="rounded-full transition-all duration-300"
                  style={{ width: i === idx ? 18 : 6, height: 6, backgroundColor: i === idx ? '#D4AF37' : 'rgba(255,255,255,0.5)' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Ritmo de la semana ────────────────────────────────────────────────────────
const RITMO = [
  { icon: <Sun className="w-5 h-5" weight="duotone" />, hora: 'Mañana', texto: 'Despertar natural. Desayuno compartido. Práctica de yoga o meditación (opcional, sin obligación).' },
  { icon: <Laptop className="w-5 h-5" weight="duotone" />, hora: 'Mediodía', texto: 'Trabajo con Starlink o tiempo libre. Almuerzo casero con ingredientes de la región. Caminata o trekking.' },
  { icon: <Campfire className="w-5 h-5" weight="duotone" />, hora: 'Atardecer', texto: 'Temazcal ceremonial (según disponibilidad), lectura, contemplación o conversación al pie de la montaña.' },
  { icon: <Star className="w-5 h-5" weight="duotone" />, hora: 'Noche', texto: 'Cena en comunidad. Fogón. Cielo estrellado sin contaminación lumínica. El silencio como lujo máximo.' },
];

const RitmoDeLaSemana: React.FC = () => (
  <section className="py-12 bg-white border-t border-brand/5">
    <div className="max-w-5xl mx-auto px-6">
      <div data-reveal className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-brand font-bold tracking-widest uppercase text-xs mb-1">Reset Vital</p>
          <h2 className="text-2xl font-serif text-brand">Un día en Mágico</h2>
        </div>
        <p className="text-dark/50 text-sm max-w-xs">Sin horarios obligatorios — vos elegís cómo habitarlo.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {RITMO.map((item, i) => (
          <div key={i} data-reveal data-delay={`${i + 1}` as any} className="flex gap-3 items-start bg-bone rounded-xl p-4">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand flex-shrink-0 mt-0.5">
              {item.icon}
            </div>
            <div>
              <p className="text-gold font-bold text-[10px] uppercase tracking-widest mb-1">{item.hora}</p>
              <p className="text-dark/65 text-xs leading-relaxed">{item.texto}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── Para quién es ─────────────────────────────────────────────────────────────
const AVATARES = [
  {
    icon: <Laptop className="w-6 h-6" weight="duotone" />,
    perfil: 'Emprendedores y Creativos',
    desc: 'Nómades, emprendedores, artistas, músicos y escritores. Buscás un entorno de concentración real, conectividad Starlink y comunidad que inspire.',
    wa: WA('Hola! Soy emprendedor/creativo y quiero consultar sobre el co-living en Pueblo Mágico 💻'),
  },
  {
    icon: <ChartLineUp className="w-6 h-6" weight="duotone" />,
    perfil: 'El profesional en burnout',
    desc: 'Necesitás parar. No un spa de fin de semana: algo que te resetee de verdad. El Reset Vital te da herramientas concretas para bajar el ritmo y volver con claridad.',
    wa: WA('Hola! Necesito un reset y quiero saber más sobre las estadías en Pueblo Mágico 🌿'),
  },
  {
    icon: <HeartStraight className="w-6 h-6" weight="duotone" />,
    perfil: 'La pareja',
    desc: 'Querés reconectar sin distracciones. Comida rica, paisaje brutal, intimidad. Sin itinerario forzado, sin actividades grupales si no querés. Solo tiempo de calidad juntos.',
    wa: WA('Hola! Somos una pareja y queremos consultar una estadía en Pueblo Mágico 💚'),
  },
  {
    icon: <Compass className="w-6 h-6" weight="duotone" />,
    perfil: 'El buscador en tránsito',
    desc: 'Estás en un momento de cambio y necesitás espacio para escucharte. El silencio de la montaña, las caminatas y las herramientas del Reset Vital te acompañan en el proceso.',
    wa: WA('Hola! Estoy en un momento de búsqueda personal y me interesa una estadía en Pueblo Mágico 🧭'),
  },
  {
    icon: <UsersThree className="w-6 h-6" weight="duotone" />,
    perfil: 'Grupos y Familias',
    desc: 'Para tu grupo de amigos y amigas, o grupos familiares que incluyen a tu tío, abuelos, padres e hijos. Buscan desconectar de las pantallas y reconectar en la montaña.',
    wa: WA('Hola! Queremos ir en grupo o familia a Pueblo Mágico. ¿Qué opciones de alojamiento tienen?'),
  },
  {
    icon: <Globe className="w-6 h-6" weight="duotone" />,
    perfil: 'El ciudadano del mundo',
    desc: 'Buscás nutrirte de otras culturas sin tomarte un avión. Disfrutás de compartir un fogón con viajeros y voluntarios de todas partes del mundo.',
    wa: WA('Hola! Me encanta la vibra internacional de Pueblo Mágico. ¿Qué opciones de estadía tienen?'),
  },
];

const ParaQuienEs: React.FC = () => (
  <section className="py-24 bg-bone">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div data-reveal className="text-center mb-14">
        <p className="text-brand font-bold tracking-widest uppercase text-xs mb-4">¿Es para mí?</p>
        <h2 className="text-3xl md:text-5xl font-serif text-brand">Quiénes vienen a Mágico</h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AVATARES.map((av, i) => (
          <div key={i} data-reveal data-delay={`${i + 1}` as any} className="bg-white rounded-2xl p-6 md:p-8 border border-brand/5 shadow-sm flex flex-col">
            <div className="w-12 h-12 bg-bone rounded-full flex items-center justify-center text-brand mb-4">
              {av.icon}
            </div>
            <h3 className="font-serif text-lg text-brand mb-3">{av.perfil}</h3>
            <p className="text-dark/65 text-sm leading-relaxed flex-grow">{av.desc}</p>
            <a
              href={av.wa}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 text-gold font-bold text-xs uppercase tracking-widest hover:text-brand transition-colors inline-flex items-center gap-1"
            >
              Consultar <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── Testimonios ───────────────────────────────────────────────────────────────
const TESTIMONIOS = [
  {
    text: 'Me sentí parte de la vida de la montaña, como en casa. Un refugio de paz inigualable.',
    name: 'Sofía R.',
    rol: 'Viajera',
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
  },
  {
    text: 'Una experiencia transformadora. La comida consciente y los espacios son de otro mundo.',
    name: 'Marcos D.',
    rol: 'Huésped',
    image: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    text: 'Lo más importante: el amor y la entrega de todo el equipo, y la capacidad de sentirte uno con la naturaleza.',
    name: 'Julieta C.',
    rol: 'Facilitadora',
    image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg',
  },
];

const Testimonios: React.FC = () => (
  <section className="py-24 bg-brand text-white">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div data-reveal className="text-center mb-14">
        <h2 className="text-3xl md:text-5xl font-serif mb-4">Lo que dicen quienes vivieron la experiencia</h2>
        <a
          href="https://maps.app.goo.gl/4c1nrpBbQf5hYrsE9"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-gold/30 rounded-full px-4 py-1.5 hover:bg-gold/10 transition-colors"
        >
          <span className="text-yellow-300 text-sm">★★★★★</span>
          <span className="text-white/80 text-xs font-semibold">5.0 · 64 reseñas en Google Maps</span>
        </a>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {TESTIMONIOS.map((t, i) => (
          <div key={i} data-reveal data-delay={`${i + 1}` as any} className="bg-white/10 rounded-2xl p-6 border border-white/10">
            <p className="text-white/85 italic text-sm leading-relaxed mb-5">"{t.text}"</p>
            <div className="flex items-center gap-3">
              <img src={t.image} alt={t.name} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
              <div>
                <p className="font-bold text-sm text-white">{t.name}</p>
                <p className="text-white/50 text-xs">{t.rol}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    Icon: HouseIcon,
    q: '¿Qué incluye el precio?',
    a: 'El precio base incluye alojamiento, desayuno, acceso a todos los espacios del refugio, el programa autoguiado Reset Vital y Starlink para trabajo remoto. Almuerzo, cena (menú del día) y pensión completa se suman aparte según lo que quieras sumar. Sin sorpresas ocultas.',
  },
  {
    Icon: MountainsIcon,
    q: '¿Necesito experiencia previa en yoga o meditación?',
    a: 'Para nada. El Reset Vital es un retiro autoguiado: vos decidís qué practicás y cuándo. Las herramientas están disponibles, nada es obligatorio. Podés venir simplemente a descansar y caminar.',
  },
  {
    Icon: WifiHighIcon,
    q: '¿Hay conectividad real para trabajar?',
    a: 'Sí. Contamos con Starlink de alta velocidad, ideal para videollamadas, trabajo remoto o simplemente estar disponible cuando lo necesitás. Dicho esto, la montaña tiene una señal mucho más potente 😄',
  },
  {
    Icon: MapPinIcon,
    q: '¿Cómo llego?',
    a: 'El paraje está a unos 90-100 km de Córdoba Capital: 1 h desde Tanti y 1:30 h desde Villa Carlos Paz por la Ruta Provincial 28, con acceso para todo tipo de vehículos. También podemos coordinar traslado desde la ciudad.',
  },
  {
    Icon: ClockIcon,
    q: '¿Cuál es el check-in y check-out?',
    a: 'Check-in: a partir de las 13:00 hs. Check-out: hasta las 11:00 hs. Podés llegar antes o quedarte después disfrutando del río y las 200 hectáreas del predio — solo que durante ese lapso no vas a contar con la habitación/domo, que estará en limpieza para el próximo ingreso.',
  },
  {
    Icon: UsersThreeIcon,
    q: '¿Es para ir solo o en grupo?',
    a: 'Ambos. Muchos llegan solos y se encuentran con una comunidad genuina de viajeros afines. Si venís en grupo, también hay opciones de uso exclusivo del espacio.',
  },
  {
    Icon: CalendarIcon,
    q: '¿Hay mínimo de noches?',
    a: 'Recomendamos mínimo 3 noches para sentir el impacto real del Reset Vital. Pero podés consultar disponibilidad para estancias más cortas.',
  },
  {
    Icon: ForkKnifeIcon,
    q: '¿Tienen opciones para dietas o alergias?',
    a: 'Sí, tenemos opciones de comida para todo tipo de dietas y restricciones alimentarias, incluidas opciones sin gluten. Lo que no podemos garantizar es un ambiente 100% libre de contaminación cruzada: cocinamos en una cocina y mesada compartida, sin productos envasados al vacío ni un proceso aislado. Para celiaquía severa o intolerancia alta al gluten no podemos asegurar inocuidad total, pero sí podemos garantizar platos que no llevan gluten entre sus ingredientes. Contanos tu caso al reservar.',
  },
  {
    Icon: PawPrintIcon,
    q: '¿Puedo llevar a mi mascota?',
    a: 'No, por el momento no aceptamos mascotas: en el campo hay animales de granja cerca y no contamos con instalaciones adecuadas para recibirlas.',
  },
  {
    Icon: WheelchairIcon,
    q: '¿Tienen accesibilidad para sillas de ruedas?',
    a: 'Por el momento no contamos con rampas ni espacios especialmente preparados para sillas de ruedas. Si tenés dudas puntuales sobre accesibilidad, escribinos por WhatsApp y lo vemos juntos.',
  },
];

const FAQ: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const toggle = (index: number) => setActiveIndex(activeIndex === index ? null : index);

  return (
    <section className="py-24 bg-[#F9F8F4]">
      <div className="max-w-4xl mx-auto px-6">
        <div data-reveal className="text-center mb-12">
          <p className="text-brand font-bold tracking-widest uppercase text-xs mb-4">Preguntas frecuentes</p>
          <h2 className="text-3xl md:text-5xl serif-title brand-green">Todo lo que querés saber</h2>
          <p className="text-gray-500 text-base md:text-lg font-light mt-2">Respuestas para tu tranquilidad antes de viajar.</p>
        </div>

        <div className="space-y-3 md:space-y-4">
          {FAQS.map((faq, index) => {
            const isActive = activeIndex === index;
            const Icon = faq.Icon;

            return (
              <div key={index} data-reveal>
                <div
                  className={`bg-white rounded-2xl border transition-colors duration-300 overflow-hidden ${
                    isActive ? 'border-[#D4AF37] shadow-md' : 'border-gray-100 hover:border-gray-200 shadow-sm'
                  }`}
                >
                  <button
                    className="w-full text-left px-6 py-5 md:px-8 md:py-6 flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005333]/40"
                    onClick={() => toggle(index)}
                    aria-expanded={isActive}
                  >
                    <span className={`flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-[#005333]' : 'text-[#005333]/30'}`}>
                      <Icon weight="light" className="w-5 h-5" aria-hidden="true" />
                    </span>

                    <h3 className={`flex-1 serif-title text-base md:text-lg leading-snug transition-colors duration-300 ${isActive ? 'text-[#005333]' : 'text-gray-800'}`}>
                      {faq.q}
                    </h3>

                    <span
                      className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-[transform,background-color,color] duration-300 ${
                        isActive ? 'bg-[#005333] text-[#D4AF37] rotate-180' : 'bg-gray-100 text-[#005333]'
                      }`}
                      aria-hidden="true"
                    >
                      <CaretDownIcon weight="bold" className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </span>
                  </button>

                  <div
                    className="transition-all duration-500 ease-in-out overflow-hidden"
                    style={{
                      display: 'grid',
                      gridTemplateRows: isActive ? '1fr' : '0fr',
                      opacity: isActive ? 1 : 0
                    }}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="pl-[3.75rem] pr-6 md:pl-[4.5rem] md:pr-8 pb-6 md:pb-7 pt-1">
                        <div className="w-full h-px bg-gray-100 mb-5"></div>
                        <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ── CTA Final ─────────────────────────────────────────────────────────────────
const CTAFinal: React.FC = () => (
  <section className="py-24 bg-bone">
    <div className="max-w-3xl mx-auto px-6 text-center">
      <div data-reveal>
        <Tree className="w-10 h-10 text-gold mx-auto mb-6" weight="duotone" />
        <h2 className="text-3xl md:text-5xl font-serif text-brand mb-4">
          La montaña espera
        </h2>
        <p className="text-dark/60 font-light text-lg leading-relaxed mb-2 max-w-xl mx-auto">
          Escribinos por WhatsApp y en menos de 24 horas te damos disponibilidad, precios y cualquier consulta que tengas.
        </p>
        <p className="text-dark/40 text-xs mb-8 font-light">
          Pueblo Mágico · Habilitación Agencia Córdoba Turismo N° 000258 · CUIT 30-71875586-3
        </p>
        <a
          href={WA_ESTADIA}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-brand text-white px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-gold transition-colors duration-300 shadow-lg"
        >
          <WhatsappLogo className="w-5 h-5 flex-shrink-0" weight="fill" />
          Consultar disponibilidad
        </a>
        <p className="mt-6 text-dark/40 text-xs">
          También podés escribirnos a{' '}
          <a href="mailto:experienciamagico@gmail.com" className="hover:text-brand transition-colors underline underline-offset-2">
            experienciamagico@gmail.com
          </a>
        </p>
      </div>
    </div>
  </section>
);

// ── Página principal ──────────────────────────────────────────────────────────
const Estadia: React.FC = () => {
  const { data: preciosPublicos, loaded: preciosCargados } = usePublicPricingSummary();
  const todasLasReglas = preciosPublicos?.opciones.flatMap(opcion => opcion.tarifas) || [];
  const tarifaDesdeActual = tarifaDesde(todasLasReglas);

  useEffect(() => {
    const TITLE = 'Ecolodge de Montaña en Córdoba — Refugio de Piedra, Domos y Camping | Pueblo Mágico';
    const desdeSeo = tarifaDesde(todasLasReglas);
    const DESC = `Ecolodge de montaña en Los Gigantes, Córdoba: Refugio de Piedra, domos geodésicos y camping. Energía solar, baños secos y compost.${desdeSeo ? ` Desde ${pesos(desdeSeo.importe)}/${desdeSeo.unidad} con desayuno.` : ' Consultá disponibilidad y precio en línea.'}`;
    const URL = SITE_URL + ROUTES.ESTADIA;
    const IMG = `${SITE_URL}/uploads/campoentero.webp`;
    const prevTitle = document.title;

    document.title = TITLE;

    const setMeta = (sel: string, attr: string, val: string) => {
      let el = document.querySelector(sel) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
      el.setAttribute(attr, val);
    };
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
      el.setAttribute('href', href);
    };

    setMeta('meta[name="description"]',        'content', DESC);
    setMeta('meta[property="og:title"]',       'property', 'og:title');
    setMeta('meta[property="og:title"]',       'content',  TITLE);
    setMeta('meta[property="og:description"]', 'property', 'og:description');
    setMeta('meta[property="og:description"]', 'content',  DESC);
    setMeta('meta[property="og:image"]',        'property', 'og:image');
    setMeta('meta[property="og:image"]',        'content',  IMG);
    setMeta('meta[property="og:url"]',         'property', 'og:url');
    setMeta('meta[property="og:url"]',         'content',  URL);
    setMeta('meta[property="og:type"]',        'property', 'og:type');
    setMeta('meta[property="og:type"]',        'content',  'website');
    setLink('canonical', URL);

    setMeta('meta[name="twitter:card"]',        'name',    'twitter:card');
    setMeta('meta[name="twitter:card"]',        'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]',       'name',    'twitter:title');
    setMeta('meta[name="twitter:title"]',       'content', TITLE);
    setMeta('meta[name="twitter:description"]', 'name',    'twitter:description');
    setMeta('meta[name="twitter:description"]', 'content', DESC);
    setMeta('meta[name="twitter:image"]',       'name',    'twitter:image');
    setMeta('meta[name="twitter:image"]',       'content', IMG);

    const ofertas = preciosPublicos?.opciones.flatMap(opcion => opcion.tarifas.map(regla => ({
      '@type': 'Offer',
      name: `${ETIQUETAS_ALOJAMIENTO[opcion.tipo_alojamiento]} · ${etiquetaModalidad(preciosPublicos, opcion.tipo_alojamiento, regla.modalidad)}`,
      price: String(regla.importe_centavos / 100),
      priceCurrency: preciosPublicos.plan.moneda,
      priceValidUntil: regla.fecha_hasta,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: String(regla.importe_centavos / 100),
        priceCurrency: preciosPublicos.plan.moneda,
        unitText: regla.base_calculo === 'persona_noche' ? 'por persona por noche' : 'por unidad por noche',
      },
    }))) || [];
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LodgingBusiness',
      'name': 'Pueblo Mágico — Ecolodge de Montaña',
      'description': DESC,
      'url': URL,
      'image': IMG,
      'telephone': '+5493516765820',
      'priceRange': '$$',
      'currenciesAccepted': 'ARS',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': 'Los Gigantes / Cuchilla Nevada',
        'addressRegion': 'Córdoba',
        'addressCountry': 'AR',
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '5.0',
        'reviewCount': '64',
        'bestRating': '5',
      },
      'checkinTime': '13:00',
      'checkoutTime': '11:00',
      'amenityFeature': [
        'Refugio de Piedra: recepción, salón y comedor; habitaciones compartidas o una entera para tu grupo',
        'Domos geodésicos de 7 camas, compartidos o privados',
        'Camping',
        'Energía solar casi al 100%',
        'Baños secos que no contaminan el agua',
        'Compostamos todos los residuos compostables',
        'Starlink',
      ].map(name => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
      ...(ofertas.length > 0 ? { makesOffer: ofertas } : {}),
    };
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id   = 'ld-estadia';
    ld.textContent = JSON.stringify(schema);
    document.getElementById('ld-estadia')?.remove();
    document.head.appendChild(ld);

    return () => { document.title = prevTitle; document.getElementById('ld-estadia')?.remove(); };
  }, [preciosPublicos]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <LanguageProvider>
      <div className="font-sans antialiased">
        <Header />
        <main>
          <Hero tarifaDesdeActual={tarifaDesdeActual} cargado={preciosCargados} />
          <Inclusiones tarifaDesdeActual={tarifaDesdeActual} cargado={preciosCargados} />
          <Alojamientos precios={preciosPublicos} cargado={preciosCargados} />
          <SectionRegeneracion />
          <EscaleraDeValor tarifaDesdeActual={tarifaDesdeActual} precios={preciosPublicos} cargado={preciosCargados} />
          <HorariosPension precios={preciosPublicos} cargado={preciosCargados} />
          <Galeria />
          {/* Mini CTA puente */}
          <div style={{ background: '#005333', padding: '24px', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontFamily: 'Georgia, serif', fontWeight: 400, marginBottom: 12 }}>
              ¿Tenés dudas? Escribinos y te respondemos en menos de 24 horas.
            </p>
            <a href={WA_ESTADIA} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25D366', color: 'white', borderRadius: 999, padding: '10px 24px', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
              💬 Consultar por WhatsApp
            </a>
          </div>
          <RitmoDeLaSemana />
          <Testimonios />
          <FAQ />
          <CTAFinal />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
};

export default Estadia;
