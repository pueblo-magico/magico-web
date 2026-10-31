import React, { useEffect } from 'react';
import { ArrowDown, ArrowRight, MapPin, Mountain, Users, Leaf, BookOpen, Compass, Home, Utensils, Check, Plus } from 'lucide-react';
import { WA_MAGICO } from './data/config';
import './AulaVerdeTravel360.css';
import './AulaVerdeSalvadorMazza.css';

const program = { name: 'Investigar y crear', duration: '5 días · 4 noches', price: '230.000', intro: 'Cinco días para explorar el territorio, desarrollar un proyecto grupal y compartir sus resultados.', features: ['Exploración del territorio', 'Autonomía y liderazgo', 'Proyecto ambiental por equipos'], days: [
    ['Llegar y encontrarse', 'Recepción, instalación y almuerzo. Reconocimiento del predio, acuerdos, integración y exploración inicial.', 'Construir el grupo'],
    ['Investigar el territorio', 'Expedición por el entorno, observación y preguntas de investigación. Interpretación del paisaje y taller ambiental.', 'Comprender las conexiones'],
    ['Autonomía y liderazgo', 'Organización por equipos, distribución de roles y toma de decisiones. Comunicación, desafíos y reflexión compartida.', 'Decidir y colaborar'],
    ['Crear y participar', 'Planificación y desarrollo de un proyecto. Tarea ambiental, producción y registro de resultados. Celebración grupal.', 'Transformar preguntas en acción'],
    ['Compartir y volver', 'Presentación de proyectos, devolución y evaluación compartida. Una acción para la escuela, almuerzo y regreso.', 'Compartir lo que descubrimos'],
  ] };
const photo = (name: string) => `/uploads/Aula%20Verde/${name}.jpg`;

export default function AulaVerdeSalvadorMazza() {
  useEffect(() => {
    const title = document.title;
    document.title = 'Aula Verde · Escuela N.º 729 Dr. Salvador Mazza';
    const existing = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previous = existing?.content;
    const meta = existing || document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex, nofollow, noarchive, nosnippet';
    if (!existing) document.head.appendChild(meta);
    return () => { document.title = title; if (existing) existing.content = previous || ''; else meta.remove(); };
  }, []);
  const consult = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('Hola, somos de la Escuela N.º 729 "Dr. Salvador Mazza". Queremos coordinar la propuesta de Aula Verde para 50 estudiantes, 5 días y 4 noches, en octubre o noviembre de 2027. Valor por estudiante: ARS 230.000. Fechas tentativas: ')}`;
  return <div className="av360 av729">
    <a className="av-skip" href="#contenido">Ir al contenido</a>
    <header className="av-header">
      <a href="#inicio" aria-label="Pueblo Mágico, inicio de la propuesta"><img src="/uploads/pueblo_magico_logo_marron.svg" width="112" height="58" alt="Pueblo Mágico" /></a>
      <nav aria-label="Secciones de la propuesta"><a href="#experiencia">La experiencia</a><a href="#programas">El programa</a><a href="#lugar">El lugar</a><a href="#tarifas">Presupuesto</a></nav>
      <a className="av-outline" href="#contacto">Conversemos <ArrowRight size={15} /></a>
    </header>
    <main id="contenido">
      <section className="av-hero" id="inicio">
        <div className="av-hero-copy"><p className="av-eyebrow">Escuela N.º 729 “Dr. Salvador Mazza” · Octubre–noviembre de 2027</p><h1>Aprender afuera.<br /><em>Descubrir más.</em></h1><p className="av-lead">Naturaleza, convivencia y proyectos reales para compartir con los 50 estudiantes de la Escuela N.º 729 “Dr. Salvador Mazza”.</p><p className="av-hero-note">Una propuesta de campamentos educativos inmersivos en las Sierras Grandes de Córdoba.</p><a className="av-button" href="#programas">Conocé el programa <ArrowRight size={18} /></a><a className="av-text-link" href="#tarifas">Ver presupuesto para la escuela <ArrowDown size={15} /></a></div>
        <figure><img src={photo('IMG-20251118-WA0085')} width="1368" height="1824" fetchPriority="high" alt="Grupo de estudiantes observando y tomando notas en la naturaleza de Pueblo Mágico" /><figcaption>El territorio también enseña.</figcaption></figure>
      </section>
      <div className="av-facts"><span><MapPin /> Los Gigantes, Córdoba</span><span><Mountain /> 5 días · 4 noches</span><span><Users /> Propuesta para 50 estudiantes</span></div>
      <section className="av-section" id="experiencia"><div className="av-section-heading"><div><p className="av-eyebrow">Aprendizaje que se vive</p><h2>Un viaje que sigue<br />en la escuela.</h2></div><p>Salir de lo cotidiano para observar con otros ojos, asumir responsabilidades y descubrir lo que podemos hacer juntos.</p></div>
        <div className="av-pillars">{[
          [Compass, 'Explorar', 'Conocer el territorio desde la observación, la curiosidad y la experiencia directa.'],
          [Users, 'Convivir', 'Fortalecer vínculos, trabajar en equipo y compartir la vida en un entorno natural.'],
          [BookOpen, 'Crear', 'Desarrollar producciones que integren descubrimientos, aprendizajes y acción.'],
          [Leaf, 'Cuidar', 'Comprender el entorno y participar en una tarea real de cuidado del lugar.'],
        ].map(([Icon, title, body]) => { const I = Icon as typeof Leaf; return <article key={String(title)}><I size={34} strokeWidth={1} /><h3>{String(title)}</h3><p>{String(body)}</p></article>; })}</div>
      </section>
      <section className="av-section av-programs" id="programas"><p className="av-eyebrow">Una propuesta para la Escuela N.º 729 “Dr. Salvador Mazza”</p><h2>Investigar, crear y aprender juntos.</h2><div className="av-school-program"><article><span className="av-eyebrow">Programa educativo</span><h3>{program.name}</h3><p className="av-duration">{program.duration}</p><p>{program.intro}</p><ul>{program.features.map(f => <li key={f}><Check size={17} />{f}</li>)}</ul><a className="av-text-link" href="#itinerario">Ver itinerario de los cinco días <ArrowRight size={17} /></a></article><img src={photo('IMG-20251120-WA0036')} width="1200" height="900" loading="lazy" alt="Encuentro de un grupo con un referente en el entorno natural de Pueblo Mágico" /></div><p className="av-small">Los cinco días corresponden a la estadía en destino. El transporte y los tiempos de viaje se coordinan por separado con la escuela.</p></section>
      <section className="av-itinerary" id="itinerario"><div className="av-section"><div className="av-section-heading"><div><p className="av-eyebrow">5 días · 4 noches · Octubre–noviembre de 2027</p><h2>Así se vive la experiencia.</h2></div></div><div className="av-days" id="av-days" style={{ '--days': program.days.length } as React.CSSProperties}>{program.days.map(([title, body, purpose], i) => <article key={title}><span className="av-day-number">0{i + 1}</span><h3>{title}</h3><p>{body}</p><span className="av-purpose">{purpose}</span></article>)}</div><p className="av-small"><Leaf size={17} /> Cada jornada contempla comidas, descanso y convivencia supervisada. Recorridos, fogones y observación del cielo según condiciones.</p></div></section>
      <section className="av-place" id="lugar"><img src="/uploads/domos_2.jpg" width="549" height="366" loading="lazy" alt="Domos geodésicos de Pueblo Mágico entre el paisaje serrano" /><div><p className="av-eyebrow">Pueblo Mágico · Los Gigantes</p><h2>Un aula abierta<br />en las Sierras Grandes.</h2><p>El paisaje, las personas y los proyectos del lugar forman parte del aprendizaje. Una experiencia conectada con las necesidades reales del territorio.</p><ul><li><Home /> Alojamiento grupal</li><li><Utensils /> Comidas compartidas</li><li><Mountain /> Espacios para aprender y encontrarse</li></ul><p className="av-small">Configuración del alojamiento, capacidad, accesos y disponibilidad a confirmar para cada grupo.</p></div></section>
      <section className="av-section" id="organizacion"><p className="av-eyebrow">Una experiencia preparada en conjunto</p><h2>De la planificación al regreso.</h2><div className="av-process">{[['Antes', 'Acordamos objetivos con la institución, relevamos las necesidades del grupo y preparamos el programa y la documentación.'], ['Durante', 'Pueblo Mágico organiza alojamiento, alimentación y actividades contratadas, en coordinación con los docentes.'], ['Después', 'Compartimos producciones y aprendizajes. La síntesis para el colegio se define según el alcance acordado.']].map(([title, body], i) => <article key={title}><span className="av-eyebrow">0{i + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div><details><summary>Cómo nos organizamos con la escuela <Plus size={19} /></summary><div className="av-responsibilities"><p><strong>Pueblo Mágico:</strong> servicios en destino y ejecución del programa contratado.</p><p><strong>Escuela N.º 729:</strong> docentes, autorizaciones, información relevante del grupo y supervisión acordada.</p><p>Antes de confirmar: responsabilidades, coberturas, ratios de acompañamiento y protocolos documentados. Especialistas y módulos sujetos al programa acordado y a disponibilidad.</p></div></details></section>
      <section className="av-rates" id="tarifas"><div className="av-section"><p className="av-eyebrow">Presupuesto directo para la escuela</p><h2>Una experiencia para todo el grupo.</h2><p className="av-rates-intro">Propuesta para <strong>50 estudiantes</strong> de la Escuela N.º 729 “Dr. Salvador Mazza”. Estadía de <strong>5 días y 4 noches</strong> en <strong>octubre o noviembre de 2027</strong>, con fechas y capacidad a confirmar.</p><div className="av-school-price"><div><span className="av-eyebrow">Valor por estudiante</span><p className="av-price"><small>ARS</small> {program.price}</p><span>por estudiante · contratación directa con Pueblo Mágico</span></div><div><span className="av-eyebrow">Total para 50 estudiantes</span><p className="av-school-total">ARS 11.500.000</p><p className="av-validity">Presupuesto válido por 15 días desde su emisión.</p></div></div><p><strong>Incluye:</strong> alojamiento, pensión completa, actividades acordadas, facilitación, materiales y cierre.</p><p className="av-small">Transporte no incluido. Condiciones de los docentes acompañantes a definir. La reserva queda sujeta a disponibilidad y a la confirmación de fechas, impuestos, condiciones de pago y cancelación.</p><a href={consult} target="_blank" rel="noopener noreferrer" className="av-button">Consultar el presupuesto de la escuela <ArrowRight size={17} /></a></div></section>
      <section className="av-contact" id="contacto"><p className="av-eyebrow">Escuela N.º 729 “Dr. Salvador Mazza” · Pueblo Mágico</p><h2>Preparemos el próximo<br />viaje de la escuela.</h2><p>Acordamos los objetivos del grupo y coordinamos las fechas de octubre o noviembre de 2027, el programa y los detalles de la estadía.</p><a className="av-button" href={consult} target="_blank" rel="noopener noreferrer">Coordinar la propuesta por WhatsApp <ArrowRight size={18} /></a><span className="av-small">5 días · 4 noches · 50 estudiantes. Presupuesto válido por 15 días desde su emisión.</span></section>
    </main><footer className="av-footer"><img src="/uploads/pueblo_magico_logo_marron.svg" width="100" height="52" alt="Pueblo Mágico" /><span>Los Gigantes, Córdoba, Argentina</span><span>Escuela N.º 729 · Octubre–noviembre de 2027</span></footer>
  </div>;
}
