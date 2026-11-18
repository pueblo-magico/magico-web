import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CookieBanner } from '../components/CookieBanner';
import { usePrivateProposalMeta } from './hooks/usePrivateProposalMeta';
import { img } from './lib/img';

// Editable proposal data. Commercial terms require internal approval before publication.
export const CORPORATE_PROPOSAL = {
  client: 'La Casa de la Cerradura',
  participants: 18,
  dates: 'Del 10 al 13 de diciembre de 2026, a coordinar',
  packages: [
    { name: 'Escapada Mágica', duration: '2 días / 1 noche', nights: 1, price: 180000, description: 'Una experiencia breve y significativa para salir de la rutina, celebrar y compartir.', extras: ['Dinámica de integración facilitada', 'Tiempo libre'] },
    { name: 'Experiencia Mágica', duration: '3 días / 2 noches', nights: 2, price: 265000, description: 'Una experiencia más completa para disfrutar, descansar, conectar y celebrar sin apuros.', extras: ['Dinámicas de integración facilitadas', 'Espacios de celebración y convivencia', 'Tiempo libre y descanso'], recommended: true },
  ],
  conditions: ['Valores para un grupo de 18 participantes.', 'Fechas a coordinar entre el 10 y el 13 de diciembre de 2026.', 'Disponibilidad sujeta a confirmación.', 'Alojamiento compartido según distribución acordada.', 'Transporte hasta Pueblo Mágico no incluido.', 'Experiencias adicionales no incluidas en el precio base.', 'Actividades sujetas a condiciones climáticas.', 'Seña, saldo, facturación, cancelaciones y vigencia de la propuesta pendientes de aprobación interna.'],
};
const money = (value: number) => '$' + new Intl.NumberFormat('es-AR').format(value);
const wa = (message: string) => 'https://wa.me/5493516765820?text=' + encodeURIComponent(message);
const baseMessage = 'Hola! Queremos conversar sobre la propuesta corporativa para La Casa de la Cerradura.';
const shared = ['Alojamiento compartido en eco-refugio y domos geodésicos', 'Pensión completa según itinerario', 'Brunchs y aguas saborizadas naturales durante las jornadas', 'Trekking guiado y disfrute en el río', 'Experiencia de reforestación con árboles nativos', 'Fogón de encuentro', 'Uso de espacios comunes y naturales'];
const amenities = ['Alojamiento compartido en eco-refugio y domos geodésicos', 'Cocina casera y pensión completa', 'Brunchs y aguas saborizadas naturales', 'Salón panorámico y espacios comunes', 'Senderos, arroyo y río', 'Baños y duchas con agua caliente', 'Energía solar y WiFi en áreas comunes', 'Fogón y espacios de encuentro'];
const experiences = [
  { icon: '', title: 'Trekking guiado y disfrute en el río', text: 'Recorridos por los paisajes de las Sierras Grandes, descubriendo senderos y rincones junto al río para disfrutar y descansar.' },
  { icon: '', title: 'Fogón de encuentro', text: 'Un espacio para compartir historias, conversaciones y celebrar juntos bajo el cielo de la montaña.' },
  { icon: '', title: 'Dinámicas de integración', text: 'Experiencias grupales facilitadas, participativas y divertidas para fortalecer vínculos, fomentar la colaboración y generar conexiones.' },
  { icon: '', title: 'Reforestación con árboles nativos', text: 'Una experiencia colectiva para contribuir a la regeneración del bosque nativo y dejar una huella positiva en la montaña. Sujeta al clima y a condiciones apropiadas de plantación; árboles y materiales incluidos según cantidad acordada.' },
  { icon: '', title: 'Tiempo libre y descanso', text: 'Momentos para descansar, disfrutar del paisaje, compartir un mate o contemplar la naturaleza.' },
];
const itineraries = [
  [
    ['Llegada y bienvenida', 'Almuerzo compartido', 'Dinámica de integración', 'Tiempo libre y disfrute del entorno', 'Cena y fogón'],
    ['Desayuno y brunch', 'Trekking guiado y disfrute en el río', 'Experiencia de reforestación', 'Almuerzo y cierre grupal', 'Despedida'],
  ],
  [
    ['Llegada y bienvenida', 'Almuerzo compartido', 'Dinámica de integración', 'Tiempo libre', 'Cena y fogón'],
    ['Desayuno y brunch', 'Trekking guiado y disfrute en el río', 'Almuerzo compartido', 'Dinámica en la naturaleza', 'Experiencia de reforestación con árboles nativos', 'Tiempo libre', 'Cena y encuentro grupal'],
    ['Desayuno y brunch', 'Mañana libre para descansar y disfrutar', 'Almuerzo de despedida', 'Cierre y celebración del camino compartido'],
  ],
];
const additions = [
  { icon: '', title: 'Astroturismo', text: 'Descubrir la inmensidad del cielo serrano, contemplar las estrellas y conectar con el universo lejos de las luces de la ciudad.' },
  { icon: '', title: 'Armonización sonora', text: 'Relajación y bienestar a través de sonidos, vibraciones e instrumentos que invitan a aquietar la mente y reconectar con el presente.' },
  { icon: '', title: 'Temazcal', text: 'Ceremonia ancestral de encuentro con los elementos, el calor y la naturaleza, guiada por facilitadores especializados.' },
  { icon: '', title: 'Otras experiencias a medida', text: 'Propuestas personalizadas de bienestar, creatividad, naturaleza e integración según los intereses y objetivos del equipo.' },
];
const section = 'mx-auto max-w-6xl px-5 py-24 md:px-12 md:py-36';
const heading = 'serif-title mb-9 max-w-4xl text-4xl leading-[1.08] text-[#005333] md:text-6xl';
const card = 'border-t border-[#b9aa8f] bg-transparent py-9 md:py-12';
const button = 'inline-flex items-center justify-center rounded-full bg-[#005333] px-7 py-4 text-center text-sm font-bold text-white transition hover:bg-[#003D27] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D4AF37]';
const Label = ({ children }: { children: React.ReactNode }) => <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#AA3E11]">{children}</p>;
const Contact = ({ children, message = baseMessage }: { children: React.ReactNode; message?: string }) => <a className={button} href={wa(message)} target="_blank" rel="noopener noreferrer">{children} →</a>;

export default function PropuestaCasaCerradura() {
  usePrivateProposalMeta('Propuesta Corporativa La Casa de la Cerradura | Pueblo Mágico');
  const [selected, setSelected] = useState(1);
  return <div className="min-h-screen overflow-x-hidden bg-[#FDFBF7] text-[#2A1708]">
    <Header autoSubNavigation />
    <main>
      <section className="relative flex min-h-[100svh] items-end overflow-hidden pb-20 pt-40 text-white md:pb-28">
        <img src={img('/uploads/sunset-rio-rio-real.webp', 1800)} alt="Río y paisaje natural de Pueblo Mágico en las Sierras Grandes" className="absolute inset-0 h-full w-full object-cover" loading="eager" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        <div className="relative mx-auto w-full max-w-6xl px-5 md:px-12">
          <Label>Propuesta especialmente diseñada para La Casa de la Cerradura</Label>
          <h1 className="serif-title max-w-4xl text-5xl leading-[1.05] md:text-7xl lg:text-8xl">Un encuentro para reconectar, inspirar y fortalecer al equipo.</h1>
          <p className="mt-6 max-w-2xl text-lg text-white/90 md:text-2xl">Una experiencia para celebrar, compartir y reconectar con lo que nos une.</p>
          <p className="my-8 text-sm tracking-[0.12em] text-white/80">10–13 diciembre 2026 · 18 participantes · Sierras Grandes, Córdoba · 1 o 2 noches</p>
          <a className="inline-flex rounded-full bg-[#D4AF37] px-8 py-4 font-bold text-[#2A1708]" href="#propuestas">Explorar la propuesta</a>
        </div>
      </section>
      <section className={section}>
        <Label>El espíritu del encuentro</Label><h2 className={heading}>Un momento para celebrar el camino recorrido.</h2>
        <div className="max-w-3xl space-y-5 text-lg leading-relaxed text-[#6B4A33]"><p>Después de un año de trabajo, desafíos y logros compartidos, llega el momento de hacer una pausa.</p><p>En Pueblo Mágico los invitamos a vivir una experiencia diferente: salir de la rutina, disfrutar de la naturaleza y encontrarse como equipo en un ambiente relajado, cálido y auténtico.</p><p>Un espacio para compartir conversaciones, risas, buenos momentos y celebrar todo lo construido durante el año.</p><p className="serif-title text-2xl text-[#005333]">Porque los mejores equipos también se fortalecen cuando se permiten disfrutar juntos.</p></div>
      </section>
      <section className="bg-[#003D27] px-5 py-24 text-white md:py-32">
        <div className="mx-auto max-w-6xl">
          <Label>La experiencia de estar aquí</Label>
          <h2 className="serif-title mb-10 max-w-3xl text-4xl leading-tight md:text-6xl">La montaña tiene otra manera de reunirnos.</h2>
          <video className="aspect-video w-full rounded-sm bg-black object-cover" controls playsInline preload="none" poster="/uploads/atardeser/atardeser-hero-video-poster-desktop-v2.webp" aria-label="Paisajes y encuentros en Pueblo Mágico">
            <source src="/uploads/atardeser/atardeser-hero-video-desktop-v1.webm" type="video/webm" />
            <source src="/uploads/atardeser/atardeser-hero-video-desktop-v1.mp4" type="video/mp4" />
            Tu navegador no admite la reproducción de video.
          </video>
          <p className="mt-4 text-sm text-white/65">Imágenes reales de experiencias en Pueblo Mágico.</p>
        </div>
      </section>
      <section id="lugar" className="bg-[#F3EEE5] scroll-mt-24"><div className={section}>
        <Label>Nuestro hogar en la montaña</Label><h2 className={heading}>Bienvenidos a Pueblo Mágico </h2>
        <p className="max-w-3xl text-lg leading-relaxed">En el corazón de las Sierras Grandes de Córdoba, Pueblo Mágico es un eco-centro de montaña rodeado de naturaleza, paisajes abiertos, arroyos y senderos. Un espacio para desconectar del ritmo cotidiano y disfrutar de lo simple: buena comida, aire puro, encuentros alrededor del fuego y tiempo de calidad.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2"><div className="grid grid-cols-2 gap-3"><img className="col-span-2 h-56 w-full rounded-2xl object-cover" src={img('/uploads/dji_0074.webp', 1000)} alt="Vista panorámica del predio de Pueblo Mágico" loading="lazy" /><img className="h-40 w-full rounded-2xl object-cover" src={img('/uploads/domos.webp', 600)} alt="Domos geodésicos de Pueblo Mágico" loading="lazy" /><img className="h-40 w-full rounded-2xl object-cover" src={img('/uploads/flyfishing-refugio-interior.jpg', 600)} alt="Interior del eco-refugio" loading="lazy" /><img className="h-40 w-full rounded-2xl object-cover" src={img('/uploads/sunset-rio-rio-real.webp', 600)} alt="Río y naturaleza de Los Gigantes" loading="lazy" /><img className="h-40 w-full rounded-2xl object-cover" src={img('/uploads/pachamama-interior-ventanales.webp', 600)} alt="Espacios comunes con vista a la montaña" loading="lazy" /></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{amenities.map(a=><div className="border-b border-[#d8cdbd] py-4 text-sm" key={a}>{a}</div>)}</div></div>
      </div></section>
      <section id="experiencias" className={section+' scroll-mt-24'}>
        <Label>Incluidas en ambos paquetes</Label><h2 className={heading}>Momentos para compartir, conectar y dejar huella.</h2>
        <div className="grid gap-x-14 md:grid-cols-2">{experiences.map(e=><article className={card} key={e.title}><h3 className="serif-title mt-4 text-2xl text-[#005333]">{e.title}</h3><p className="mt-3 leading-relaxed text-[#6B4A33]">{e.text}</p></article>)}</div>
        <p className="mt-8 rounded-xl bg-[#F3EEE5] p-5 text-sm">Las actividades se adaptan al grupo. La facilitación de las dinámicas de integración está incluida en ambos paquetes sin costo adicional.</p>
      </section>
      <section id="propuestas" className="scroll-mt-24 bg-[#F3EEE5]"><div className={section}>
        <Label>Elegí tu experiencia</Label><h2 className={heading}>Dos maneras de vivir la magia.</h2><p className="mb-10 max-w-3xl text-lg">Diseñamos dos alternativas para que puedan elegir la experiencia que mejor se adapte a los tiempos y objetivos de su equipo.</p>
        <div className="grid gap-6 md:grid-cols-2">{CORPORATE_PROPOSAL.packages.map((p,i)=><article key={p.name} className={'relative rounded-3xl border-2 bg-white p-7 md:p-9 '+(p.recommended?'border-[#D4AF37] shadow-xl':'border-[#e9e0d2]')}>
          {p.recommended&&<span className="absolute -top-4 left-6 rounded-full bg-[#D4AF37] px-5 py-2 text-xs font-bold text-[#2A1708]">Experiencia recomendada</span>}
          <Label>Opción {i+1} · {p.duration}</Label><h3 className="serif-title text-3xl text-[#005333]">{p.name}</h3><p className="mt-4 text-[#6B4A33]">{p.description}</p>
          <ul className="my-8 space-y-3">{[...shared,...p.extras].map(x=><li key={x} className="flex gap-3 border-b border-[#e9e0d2] py-2 text-sm">{x}</li>)}</ul>
          <p className="text-sm">Por persona</p><p className="serif-title text-4xl text-[#005333]">{money(p.price)}</p><p className="mt-2 font-bold">Total para 18: {money(p.price*CORPORATE_PROPOSAL.participants)}</p><p className="my-5 text-xs text-[#6B4A33]">Fechas a coordinar del 10 al 13 de diciembre.</p><Contact message={baseMessage+' Nos interesa '+p.name+'.'}>Consultar esta opción</Contact>
        </article>)}</div><p className="mt-7 text-center text-sm">Ambos paquetes incluyen alojamiento, alimentación, actividades y facilitación.</p>
      </div></section>
      <section className={section}><Label>Compartir la mesa</Label><h2 className={heading}>Sabores que también son parte de la experiencia. 🍃</h2>
        <div className="max-w-3xl space-y-4 text-lg leading-relaxed"><p>Creemos que compartir la mesa es una de las mejores maneras de encontrarnos. Durante su estadía disfrutarán de nuestra cocina casera, con platos abundantes, sabrosos y preparados con dedicación.</p><p>Proponemos una experiencia gastronómica completa, con comidas compartidas, brunchs y aguas saborizadas naturales para acompañar los encuentros.</p></div>
        <div className="mt-8 grid gap-x-10 md:grid-cols-3">{['Desayunos','Almuerzos','Cenas','Brunchs durante las jornadas','Aguas saborizadas naturales','Agua potable'].map(x=><span key={x} className="border-b border-[#d8cdbd] py-4 text-sm">{x}</span>)}</div><p className="mt-6 text-sm text-[#6B4A33]">Las comidas se adaptarán a las necesidades alimentarias informadas previamente. El menú y la modalidad de los brunchs se coordinarán antes del encuentro.</p>
      </section>
      <section id="programa" className="scroll-mt-24 bg-[#F3EEE5]"><div className={section}>
        <Label>Programa orientativo</Label><h2 className={heading}>Así podría ser nuestro encuentro.</h2>
        <div role="tablist" aria-label="Elegir itinerario" className="mb-8 flex flex-wrap gap-3">{CORPORATE_PROPOSAL.packages.map((p,i)=><button key={p.name} type="button" role="tab" aria-selected={selected===i} onClick={()=>setSelected(i)} className={'rounded-full px-6 py-3 text-sm font-bold '+(selected===i?'bg-[#005333] text-white':'bg-white text-[#005333]')}>{p.duration}</button>)}</div>
        <div role="tabpanel" className="grid gap-5 md:grid-cols-3">{itineraries[selected].map((day,i)=><article key={i} className={card}><h3 className="serif-title mb-5 text-2xl text-[#005333]">Día {i+1}</h3><ul className="space-y-3">{day.map(x=><li key={x} className="border-l-2 border-[#D4AF37] pl-4 text-sm leading-relaxed">{x}</li>)}</ul></article>)}</div>
        <p className="mt-7 text-sm text-[#6B4A33]">Los horarios y el orden de las actividades son orientativos y se ajustarán junto a la empresa según la duración elegida y las condiciones climáticas.</p>
      </div></section>
      <section id="adicionales" className={section+' scroll-mt-24'}>
        <Label>Experiencias opcionales</Label><h2 className={heading}>Experiencias para llevar el encuentro aún más lejos. </h2><p className="mb-9 max-w-3xl text-lg">Cada equipo es único. Podemos enriquecer la estadía con experiencias especiales para profundizar la conexión, el bienestar y el desarrollo personal y grupal.</p>
        <article className="overflow-hidden rounded-3xl bg-[#003D27] text-white"><div><div className="mx-auto max-w-4xl p-8 md:p-12"><p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#D4AF37]"> Experiencia destacada · presupuesto adicional</p><h3 className="serif-title text-3xl md:text-4xl">Liderazgo consciente: una experiencia transformadora junto a los caballos.</h3><div className="mt-6 space-y-4 leading-relaxed text-white/85"><p>Una jornada vivencial de liderazgo y trabajo en equipo a través de experiencias asistidas con caballos.</p><p>Exploramos comunicación, confianza, presencia, cooperación y liderazgo desde una perspectiva diferente, con dinámicas facilitadas por profesionales especializados.</p><p>Los participantes podrán observar sus formas de vincularse, reconocer fortalezas y abrir nuevas conversaciones dentro del equipo.</p></div><a href={wa(baseMessage+' Queremos consultar por Liderazgo con Caballos.')} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex rounded-full bg-[#D4AF37] px-6 py-4 font-bold text-[#2A1708]">Consultar por Liderazgo con Caballos →</a></div></div></article>
        <div className="mt-10 grid gap-x-12 md:grid-cols-2">{additions.map(e=><article className={card} key={e.title}><h3 className="serif-title mt-4 text-2xl text-[#005333]">{e.title}</h3><p className="mt-3 text-sm leading-relaxed">{e.text}</p></article>)}</div>
        <p className="my-7 text-sm text-[#6B4A33]">Todas estas experiencias son opcionales, se presupuestan por separado y están sujetas a disponibilidad, condiciones de realización y coordinación previa.</p><Contact message={baseMessage+' Queremos personalizar nuestra experiencia.'}>Personalizar nuestra experiencia</Contact>
      </section>
      <section id="inversion" className="scroll-mt-24 bg-[#F3EEE5]"><div className={section}>
        <Label>Inversión y condiciones</Label><h2 className={heading}>Compará las propuestas.</h2>
        <div className="overflow-x-auto rounded-2xl bg-white"><table className="w-full min-w-[540px] border-collapse text-left text-sm"><thead className="bg-[#005333] text-white"><tr><th className="p-4">Concepto</th><th className="p-4">1 noche</th><th className="p-4">2 noches · recomendada</th></tr></thead><tbody>{[['Duración','2 días','3 días'],['Participantes','18','18'],['Alojamiento','Compartido','Compartido'],['Pensión completa','Incluida','Incluida'],['Brunchs y aguas saborizadas','Incluidos','Incluidos'],['Trekking y río','Incluidos','Incluidos'],['Dinámicas facilitadas','Incluidas','Incluidas'],['Reforestación','Incluida','Incluida'],['Fogón','Incluido','Incluido'],['Valor por persona',money(180000),money(265000)],['Total del grupo',money(3240000),money(4770000)]].map(([name,a,b])=><tr className="border-b border-[#eee5d8] last:font-bold" key={name}><th scope="row" className="p-4 font-medium">{name}</th><td className="p-4">{a}</td><td className="p-4">{b}</td></tr>)}</tbody></table></div>
        <h3 className="serif-title mt-10 text-2xl text-[#005333]">Condiciones comerciales</h3><ul className="my-6 grid gap-x-12 md:grid-cols-2">{CORPORATE_PROPOSAL.conditions.map(c=><li key={c} className="flex gap-2 text-sm">{c}</li>)}</ul>
        <p className="mb-7 rounded-xl border border-[#D4AF37] bg-white p-4 text-sm font-semibold">Propuesta sujeta a aprobación comercial interna. Disponibilidad y condiciones pendientes de confirmación.</p><Contact>Quiero coordinar esta experiencia</Contact>
      </div></section>
      <section id="contacto" className={section+' scroll-mt-24 text-center'}><Label>Hasta pronto en la montaña</Label><h2 className={heading}>Los mejores recuerdos también se construyen en equipo.</h2><div className="mx-auto max-w-3xl space-y-5 text-lg leading-relaxed"><p>Queremos invitarlos a terminar el año de una manera diferente, con tiempo para disfrutar, reconocer el camino recorrido, fortalecer los vínculos y llevarse nuevos recuerdos compartidos.</p><p>Y también con la posibilidad de dejar una huella positiva en la montaña, contribuyendo a la regeneración del bosque nativo.</p><p>Desde Pueblo Mágico estaremos felices de recibir al equipo de La Casa de la Cerradura y acompañarlos en esta celebración.</p><p className="serif-title text-2xl text-[#005333]">¡Los esperamos en la montaña! </p><p className="font-semibold">Equipo Pueblo Mágico</p></div><div className="mt-9 flex flex-wrap justify-center gap-4"><Contact>Quiero coordinar esta experiencia</Contact><a className="inline-flex items-center rounded-full border border-[#005333] px-7 py-4 text-sm font-bold text-[#005333]" href="https://experienciamagico.com">Conocer Pueblo Mágico</a></div></section>
    </main><Footer /><CookieBanner />
  </div>;
}
