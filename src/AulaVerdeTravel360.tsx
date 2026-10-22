import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, MapPin, Mountain, Users, Leaf, BookOpen, Compass, Home, Utensils, Check, Plus } from 'lucide-react';
import { WA_MAGICO } from './data/config';
import './AulaVerdeTravel360.css';

const programs = {
  A: { name: 'Explorar y convivir', duration: '4 días · 3 noches', price: '360.000', intro: 'Una primera inmersión de naturaleza, cooperación y acción ambiental.', features: ['Caminata interpretativa', 'Desafíos cooperativos', 'Bitácora colectiva'], days: [
    ['Llegar y encontrarse', 'Recepción, instalación y almuerzo. Reconocimiento del predio, acuerdos de convivencia y primera exploración.', 'Integración y bienvenida'],
    ['Descubrir la naturaleza', 'Exploración de biodiversidad y paisaje, registro de hallazgos y taller de sustentabilidad. Desafíos cooperativos.', 'Observar y hacerse preguntas'],
    ['Aprender haciendo', 'Roles y resolución de problemas. Tarea ambiental o agroecológica y una producción creativa para compartir lo aprendido.', 'Una contribución concreta'],
    ['Integrar y volver', 'Presentación de descubrimientos, evaluación compartida y un compromiso para la escuela. Almuerzo y regreso.', 'Llevar la experiencia al aula'],
  ] },
  B: { name: 'Investigar y crear', duration: '5 días · 4 noches', price: '450.000', intro: 'Más tiempo para desarrollar un proyecto grupal y compartir sus resultados.', features: ['Exploración del territorio', 'Autonomía y liderazgo', 'Proyecto ambiental por equipos'], days: [
    ['Llegar y encontrarse', 'Recepción, instalación y almuerzo. Reconocimiento del predio, acuerdos, integración y exploración inicial.', 'Construir el grupo'],
    ['Investigar el territorio', 'Expedición por el entorno, observación y preguntas de investigación. Interpretación del paisaje y taller ambiental.', 'Comprender las conexiones'],
    ['Autonomía y liderazgo', 'Organización por equipos, distribución de roles y toma de decisiones. Comunicación, desafíos y reflexión compartida.', 'Decidir y colaborar'],
    ['Crear y participar', 'Planificación y desarrollo de un proyecto. Tarea ambiental, producción y registro de resultados. Celebración grupal.', 'Transformar preguntas en acción'],
    ['Compartir y volver', 'Presentación de proyectos, devolución y evaluación compartida. Una acción para la escuela, almuerzo y regreso.', 'Compartir lo que descubrimos'],
  ] },
};
type Program = keyof typeof programs;
const photo = (name: string) => `/uploads/Aula%20Verde/${name}.jpg`;

export default function AulaVerdeTravel360() {
  const [selected, setSelected] = useState<Program>('A');
  useEffect(() => {
    const title = document.title;
    document.title = 'Aula Verde · Propuesta para Travel 360';
    const existing = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previous = existing?.content;
    const meta = existing || document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex, nofollow, noarchive, nosnippet';
    if (!existing) document.head.appendChild(meta);
    return () => { document.title = title; if (existing) existing.content = previous || ''; else meta.remove(); };
  }, []);
  const consult = (program?: Program) => `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(`Hola, somos Travel 360. Queremos coordinar una propuesta de Aula Verde para 40 estudiantes${program ? `, Programa ${program} (${programs[program].duration})` : ''}. Fechas tentativas: `)}`;
  const show = (p: Program) => { setSelected(p); document.getElementById('itinerario')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
  return <div className="av360">
    <a className="av-skip" href="#contenido">Ir al contenido</a>
    <header className="av-header">
      <a href="#inicio" aria-label="Pueblo Mágico, inicio de la propuesta"><img src="/uploads/pueblo_magico_logo_marron.svg" width="112" height="58" alt="Pueblo Mágico" /></a>
      <nav aria-label="Secciones de la propuesta"><a href="#experiencia">La experiencia</a><a href="#programas">Programas</a><a href="#lugar">El lugar</a><a href="#tarifas">Tarifas</a></nav>
      <a className="av-outline" href="#contacto">Conversemos <ArrowRight size={15} /></a>
    </header>
    <main id="contenido">
      <section className="av-hero" id="inicio">
        <div className="av-hero-copy"><p className="av-eyebrow">Pueblo Mágico × Travel 360 · Marzo a julio de 2027</p><h1>Aprender afuera.<br /><em>Descubrir más.</em></h1><p className="av-lead">Naturaleza, convivencia y proyectos reales para estudiantes de 14 a 17 años.</p><p className="av-hero-note">Una propuesta de campamentos educativos inmersivos en las Sierras Grandes de Córdoba.</p><a className="av-button" href="#programas">Conocé los programas <ArrowRight size={18} /></a><a className="av-text-link" href="#tarifas">Ver propuesta para la agencia <ArrowDown size={15} /></a></div>
        <figure><img src={photo('IMG-20251118-WA0085')} width="1368" height="1824" fetchPriority="high" alt="Grupo de estudiantes observando y tomando notas en la naturaleza de Pueblo Mágico" /><figcaption>El territorio también enseña.</figcaption></figure>
      </section>
      <div className="av-facts"><span><MapPin /> Los Gigantes, Córdoba</span><span><Mountain /> 4 o 5 días en la naturaleza</span><span><Users /> Propuesta para 40 estudiantes</span></div>
      <section className="av-section" id="experiencia"><div className="av-section-heading"><div><p className="av-eyebrow">Aprendizaje que se vive</p><h2>Un viaje que sigue<br />en la escuela.</h2></div><p>Salir de lo cotidiano para observar con otros ojos, asumir responsabilidades y descubrir lo que podemos hacer juntos.</p></div>
        <div className="av-pillars">{[
          [Compass, 'Explorar', 'Conocer el territorio desde la observación, la curiosidad y la experiencia directa.'],
          [Users, 'Convivir', 'Fortalecer vínculos, trabajar en equipo y compartir la vida en un entorno natural.'],
          [BookOpen, 'Crear', 'Desarrollar producciones que integren descubrimientos, aprendizajes y acción.'],
          [Leaf, 'Cuidar', 'Comprender el entorno y participar en una tarea real de cuidado del lugar.'],
        ].map(([Icon, title, body]) => { const I = Icon as typeof Leaf; return <article key={String(title)}><I size={34} strokeWidth={1} /><h3>{String(title)}</h3><p>{String(body)}</p></article>; })}</div>
      </section>
      <section className="av-section av-programs" id="programas"><p className="av-eyebrow">Dos formatos, un propósito compartido</p><h2>Dos formas de vivir Aula Verde.</h2><div className="av-program-grid">{(['A', 'B'] as Program[]).map(p => <article key={p}><span className="av-eyebrow">Programa {p}</span><h3>{programs[p].name}</h3><p className="av-duration">{programs[p].duration}</p><p>{programs[p].intro}</p><ul>{programs[p].features.map(f => <li key={f}><Check size={17} />{f}</li>)}</ul><button className="av-text-link" onClick={() => show(p)}>Ver itinerario {p} <ArrowRight size={17} /></button></article>)}</div><p className="av-small">Los días corresponden a la estadía en destino. El tiempo de viaje desde Buenos Aires se organiza por separado.</p></section>
      <section className="av-itinerary" id="itinerario"><div className="av-section"><div className="av-section-heading"><div><p className="av-eyebrow">El recorrido, día por día</p><h2>Así se vive la experiencia.</h2></div><div className="av-selector" role="group" aria-label="Elegir programa">{(['A', 'B'] as Program[]).map(p => <button key={p} aria-pressed={selected === p} onClick={() => setSelected(p)} aria-controls="av-days">Programa {p} · {p === 'A' ? '4' : '5'} días</button>)}</div></div><div className="av-days" id="av-days" style={{ '--days': programs[selected].days.length } as React.CSSProperties} aria-live="polite">{programs[selected].days.map(([title, body, purpose], i) => <article key={`${selected}-${i}`}><span className="av-day-number">0{i + 1}</span><h3>{title}</h3><p>{body}</p><span className="av-purpose">{purpose}</span></article>)}</div><p className="av-small"><Leaf size={17} /> Cada jornada contempla comidas, descanso y convivencia supervisada. Recorridos, fogones y observación del cielo según condiciones.</p></div></section>
      <section className="av-place" id="lugar"><img src="/uploads/domos_2.jpg" width="549" height="366" loading="lazy" alt="Domos geodésicos de Pueblo Mágico entre el paisaje serrano" /><div><p className="av-eyebrow">Pueblo Mágico · Los Gigantes</p><h2>Un aula abierta<br />en las Sierras Grandes.</h2><p>El paisaje, las personas y los proyectos del lugar forman parte del aprendizaje. Una experiencia conectada con las necesidades reales del territorio.</p><ul><li><Home /> Alojamiento grupal</li><li><Utensils /> Comidas compartidas</li><li><Mountain /> Espacios para aprender y encontrarse</li></ul><p className="av-small">Configuración del alojamiento, capacidad, accesos y disponibilidad a confirmar para cada grupo.</p></div></section>
      <section className="av-section" id="organizacion"><p className="av-eyebrow">Una experiencia preparada en conjunto</p><h2>De la planificación al regreso.</h2><div className="av-process">{[['Antes', 'Acordamos objetivos con la institución, relevamos las necesidades del grupo y preparamos el programa y la documentación.'], ['Durante', 'Pueblo Mágico organiza alojamiento, alimentación y actividades contratadas, en coordinación con los docentes.'], ['Después', 'Compartimos producciones y aprendizajes. La síntesis para el colegio se define según el alcance acordado.']].map(([title, body], i) => <article key={title}><span className="av-eyebrow">0{i + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div><details><summary>Cómo nos organizamos con Travel 360 y el colegio <Plus size={19} /></summary><div className="av-responsibilities"><p><strong>Pueblo Mágico:</strong> servicios en destino y ejecución del programa contratado.</p><p><strong>Travel 360:</strong> vínculo comercial y logística según el acuerdo de colaboración.</p><p><strong>Institución educativa:</strong> docentes, autorizaciones, información relevante del grupo y supervisión acordada.</p><p>Antes de confirmar: responsabilidades, coberturas, ratios de acompañamiento y protocolos documentados. Especialistas y módulos sujetos al programa acordado y a disponibilidad.</p></div></details></section>
      <section className="av-rates" id="tarifas"><div className="av-section"><p className="av-eyebrow">Propuesta comercial para Travel 360</p><h2>Tarifas netas para la agencia.</h2><p className="av-rates-intro">Base de cotización: <strong>40 estudiantes</strong>, sujeta a capacidad. Presupuesto preliminar para estadías de marzo a julio de 2027.</p><div className="av-rate-grid">{(['A', 'B'] as Program[]).map(p => <article key={p}><span className="av-eyebrow">Programa {p} · {programs[p].duration}</span><p className="av-price"><small>ARS</small> {programs[p].price}</p><span>por estudiante · neto para agencia</span><a href={consult(p)} target="_blank" rel="noopener noreferrer" className="av-button">Consultar Programa {p} <ArrowRight size={17} /></a></article>)}</div><p>Alojamiento, pensión completa, programa pedagógico, actividades acordadas, facilitación, materiales y cierre. B suma una jornada de investigación y proyecto.</p><p className="av-small">Transporte no incluido. Docentes a definir. Travel 360 establece su precio de reventa, sin comisión adicional a descontar de estas tarifas. Valores pendientes de costeo y aprobación. Fechas, impuestos, vigencia, pagos y cancelaciones se confirman en la cotización definitiva.</p></div></section>
      <section className="av-contact" id="contacto"><p className="av-eyebrow">Una primera escuela, un proyecto compartido</p><h2>Diseñemos la próxima<br />experiencia juntos.</h2><p>Elegimos el formato, acordamos los objetivos de la escuela piloto y coordinamos fechas, programa y logística.</p><a className="av-button" href={consult()} target="_blank" rel="noopener noreferrer">Coordinar la propuesta por WhatsApp <ArrowRight size={18} /></a><span className="av-small">Propuesta de colaboración para Travel 360. Alianza sujeta a acuerdo.</span></section>
    </main><footer className="av-footer"><img src="/uploads/pueblo_magico_logo_marron.svg" width="100" height="52" alt="Pueblo Mágico" /><span>Los Gigantes, Córdoba, Argentina</span><span>Aula Verde × Travel 360 · Marzo a julio de 2027</span></footer>
  </div>;
}
