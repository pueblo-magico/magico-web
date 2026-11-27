import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CookieBanner } from '../components/CookieBanner';
import { PageSectionNav } from '../components/PageSectionNav';
import { WA_MAGICO } from './data/config';

const photos = {
  mountain: '/uploads/reforestacion/montana-hero.webp',
  hall: '/uploads/yoga_salon.webp',
  river: '/uploads/sunset-rio-rio-real.webp',
  aerial: '/uploads/campoentero.webp',
  room: '/uploads/habitaciones.webp',
  food: '/uploads/comida.jpg',
};
const sections = [
  {id:'experiencia',label:'Experiencia'}, {id:'programa',label:'Programa'},
  {id:'facilitadoras',label:'Facilitadoras'}, {id:'lugar',label:'El lugar'},
  {id:'estadia',label:'Estadía'}, {id:'inversion',label:'Inversión'}, {id:'preguntas',label:'Preguntas'}
];
const button = 'inline-flex items-center justify-center rounded-full bg-[#E8C79C] px-7 py-4 text-center text-xs font-semibold uppercase tracking-widest text-[#422B2C] hover:bg-[#F5E0C7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';
const heading = 'serif-title text-4xl leading-tight md:text-5xl';
const section = 'scroll-mt-36 mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28';
const href = 'https://wa.me/' + WA_MAGICO + '?text=' + encodeURIComponent('¡Hola! Quiero recibir información sobre Mujer Diamante, del 10 al 12 de febrero de 2027.');
const CTA = ({label='Quiero más información'}:{label?:string}) => <a href={href} target="_blank" rel="noopener noreferrer" className={button}>{label}</a>;
const Photo = ({src,alt}:{src:string;alt:string}) => <img src={src} alt={alt} loading="lazy" decoding="async" className="h-80 w-full rounded-[2rem] object-cover md:h-[420px]" />;

export default function MujerDiamante() {
  const [sticky,setSticky] = useState(false);
  useEffect(() => {
    const previous = document.title;
    document.title = 'Mujer Diamante — Sanar el linaje femenino | Pueblo Mágico';
    const scroll = () => setSticky(window.scrollY > window.innerHeight * .85);
    scroll();
    window.addEventListener('scroll',scroll,{passive:true});
    return () => { document.title = previous; window.removeEventListener('scroll',scroll); };
  },[]);
  return <div className="min-h-screen overflow-x-hidden bg-[#F8EFE8] text-[#422B2C] pb-20 md:pb-0">
    <Header subNavigation={<PageSectionNav navigation={{ariaLabel:'Navegación del retiro',pageEyebrow:'Retiro de mujeres',pageTitle:'Mujer Diamante',sections}} />} />
    <main>
      <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-[#422B2C] text-[#FFF7EF]">
        <img src={photos.mountain} alt="Sierras de Córdoba en Pueblo Mágico" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#352022] via-[#352022]/65 to-[#352022]/30" />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-36 md:px-10 md:pb-24">
          <p className="text-xs uppercase tracking-[.25em] text-[#E8C79C]">Mujeres Cósmicas · Pueblo Mágico</p>
          <p className="mt-4 text-xs uppercase tracking-widest">Retiro de mujeres</p>
          <h1 className="serif-title mt-5 text-[clamp(3.5rem,10vw,8rem)] leading-[.95]">Mujer<br/>Diamante</h1>
          <p className="serif-title mt-5 text-3xl italic text-[#E8C79C] md:text-5xl">Sanar el linaje femenino</p>
          <p className="mt-6 max-w-xl text-lg leading-8">Un encuentro para mirar nuestras raíces, honrar nuestra historia y abrir espacio a una forma más consciente de habitar lo femenino.</p>
          <p className="mt-8 text-sm uppercase tracking-widest">10 al 12 de febrero de 2027 · 3 días / 2 noches</p>
          <p className="mt-3 text-sm">Pueblo Mágico · Sierras de Córdoba, Argentina</p>
          <p className="mt-5 text-[#E8C79C]">Inscripción anticipada: $690.000 ARS</p>
          <div className="mt-8 flex flex-wrap items-center gap-4"><CTA/><a href="#experiencia" className="rounded-full border border-current px-7 py-4 text-xs uppercase tracking-widest">Conocer la experiencia</a></div>
        </div>
      </section>
      <section id="experiencia" className={section}>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div><h2 className={heading}>Volver a nuestras raíces</h2><p className="mt-6 text-lg leading-8">Cada mujer lleva consigo una historia que dialoga con las generaciones que la precedieron. Mujer Diamante propone un espacio de encuentro para explorar ese linaje, reconocer lo que nos acompaña y reflexionar sobre aquello que deseamos transformar.</p><p className="mt-5 text-lg leading-8">Tres días en la montaña para compartir con otras mujeres y acercarnos a nuestra propia historia con respeto, sensibilidad y libertad.</p></div>
          <Photo src={photos.river} alt="Río de Pueblo Mágico"/>
        </div>
      </section>
      <div className="bg-[#693F43] px-6 py-20 text-center text-[#FFF7EF]"><p className="serif-title mx-auto max-w-4xl text-3xl leading-snug md:text-5xl">Honrar de dónde venimos. Elegir cómo queremos seguir.</p></div>
      <section id="programa" className={section}><h2 className={heading}>Tres días de encuentro</h2><p className="mt-5 max-w-2xl text-lg leading-8">El programa y las actividades se compartirán próximamente.</p><div className="mt-10 grid gap-4 md:grid-cols-3">{['10 de febrero','11 de febrero','12 de febrero'].map((date,i)=><article key={date} className="rounded-[2rem] bg-[#EEDDD3] p-8"><p className="text-xs uppercase tracking-widest">Día {i+1}</p><h3 className="serif-title mt-3 text-3xl">{date}</h3><p className="mt-4">Programa por confirmar.</p></article>)}</div></section>
      <section id="facilitadoras" className="scroll-mt-36 bg-[#EEDDD3]"><div className={section}><p className="text-xs uppercase tracking-widest">Quiénes acompañan</p><h2 className={heading+' mt-4'}>Equipo Mujeres Cósmicas</h2><p className="mt-6 max-w-2xl text-lg leading-8">El equipo Mujeres Cósmicas facilitará este encuentro. Pronto compartiremos la presentación de las facilitadoras.</p></div></section>
      <section id="lugar" className={section}><h2 className={heading}>Un refugio en la montaña</h2><p className="mt-6 max-w-3xl text-lg leading-8">Pueblo Mágico es un eco-centro de montaña en las Sierras Grandes de Córdoba. Un entorno natural de río, sierras y espacios de encuentro, lejos del ritmo cotidiano.</p><div className="mt-10 grid gap-5 md:grid-cols-2"><div className="md:col-span-2"><Photo src={photos.aerial} alt="Vista del predio de Pueblo Mágico"/></div><Photo src={photos.hall} alt="Salón de encuentro"/><Photo src={photos.river} alt="Río en la montaña"/></div></section>
      <section id="estadia" className={section}><h2 className={heading}>Habitar la experiencia</h2><div className="mt-12 grid items-center gap-10 md:grid-cols-2"><Photo src={photos.room} alt="Habitaciones del eco-lodge"/><div><h3 className="serif-title text-3xl">Alojamiento en la montaña</h3><p className="mt-4 leading-8">Dos noches en habitaciones compartidas del eco-lodge, con ropa blanca, toalla y toallón. Condiciones a confirmar con la organización.</p></div><Photo src={photos.food} alt="Gastronomía de Pueblo Mágico"/><div><h3 className="serif-title text-3xl">Gastronomía casera</h3><p className="mt-4 leading-8">Una propuesta de alimentación casera durante el retiro. El menú y las condiciones de pensión completa se confirmarán próximamente.</p></div></div></section>
      <section id="inversion" className="scroll-mt-36 bg-[#422B2C] text-[#FFF7EF]"><div className={section+' grid gap-12 md:grid-cols-2'}><div><h2 className={heading}>Tu inversión</h2><p className="mt-8 text-xs uppercase tracking-widest text-[#E8C79C]">Inscripción anticipada</p><p className="serif-title mt-3 text-6xl md:text-7xl">$690.000</p><p className="mt-3 text-[#E8C79C]">Ahorrás $110.000 ARS</p><p className="mt-8 border-t border-white/20 pt-6">Precio regular</p><p className="serif-title mt-2 text-4xl">$800.000 ARS</p></div><div><h3 className="serif-title text-3xl">Mujer Diamante</h3><p className="mt-5 leading-8">Retiro del 10 al 12 de febrero. Consultanos por la vigencia de la promoción, lo incluido, la reserva y las opciones de pago.</p><div className="mt-8"><CTA label="Consultar inscripción"/></div></div></div></section>
      <section id="preguntas" className={section}><h2 className={heading}>Preguntas frecuentes</h2><div className="mt-8">{[['¿Dónde se realiza?','En Pueblo Mágico, Sierras Grandes de Córdoba.'],['¿Cuál es el programa?','Las actividades se anunciarán próximamente.'],['¿Cómo puedo inscribirme?','Escribinos por WhatsApp para consultar disponibilidad y condiciones de reserva.']].map(([q,a])=><details key={q} className="border-t border-[#422B2C]/20 py-5"><summary className="cursor-pointer serif-title text-xl">{q}</summary><p className="mt-4 leading-8">{a}</p></details>)}</div></section>
      <section className="relative overflow-hidden bg-[#422B2C] text-[#FFF7EF]"><img src={photos.mountain} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-30"/><div className="relative mx-auto max-w-3xl px-6 py-28 text-center"><h2 className={heading}>Un encuentro con tu historia</h2><p className="mt-6 text-lg">10 al 12 de febrero de 2027 · Pueblo Mágico</p><div className="mt-8"><CTA/></div></div></section>
    </main><Footer/><CookieBanner/>
    {sticky && <div className="fixed inset-x-0 bottom-0 z-[80] bg-[#422B2C] p-3 text-center md:hidden"><CTA/></div>}
  </div>;
}
