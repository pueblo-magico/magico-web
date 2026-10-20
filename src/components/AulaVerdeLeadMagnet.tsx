import React, { useState, useEffect, useRef } from 'react';
import { DownloadSimple, CheckCircle, FilePdf, CircleNotch } from '@phosphor-icons/react';
import { pdf } from '@react-pdf/renderer';
import DossierAulaVerde from './pdf/DossierAulaVerde';
import { useLanguage } from '../../contexts/LanguageContext';
import { submitForm } from '../lib/submitForm';
import { useAntiBot } from '../lib/useAntiBot';
import { validarEmail } from '../lib/validarContacto';

const AulaVerdeLeadMagnet: React.FC = () => {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { trampa, esBot } = useAntiBot();
  const [errorEmail, setErrorEmail] = useState(false);
  const errorEmailMsg = t.contact.status.invalidEmail;
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    sectionRef.current.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const myForm = e.target as HTMLFormElement;
    const formData = new FormData(myForm);
    const data = formData;
    if (validarEmail(String(data.get('email') || ''))) { setErrorEmail(true); return; }
    setErrorEmail(false);
    // Bot (campo trampa o envío instantáneo): se entrega igual sin mandar nada.
    const enviar = !esBot();

    setIsGenerating(true);

    // La captura del lead (email) no debe bloquear la entrega del PDF prometido.
    (enviar ? submitForm('dossier-aula-verde', formData) : Promise.resolve())
      .catch((error) => console.error("Error al enviar el formulario", error))
      .finally(async () => {
        try {
          // Generar PDF usando react-pdf/renderer al vuelo
          const blob = await pdf(<DossierAulaVerde />).toBlob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'Propuesta-Pueblo-Magico-Aula-Verde.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (pdfError) {
          console.error("Error generando el PDF:", pdfError);
        } finally {
          setIsGenerating(false);
          setSubmitted(true);
        }
      });
  };

  return (
    <section ref={sectionRef} className="py-20 md:py-32 px-6 bg-brand relative overflow-hidden text-white">
      {/* Elementos decorativos */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-50 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Columna Izquierda: Copy / Explicación del PDF */}
          <div data-reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/20 text-gold border border-gold/30 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              <FilePdf weight="fill" className="w-4 h-4" />
              <span>{t.aula_verde.lead_magnet.badge}</span>
            </div>

            <h2 className="text-3xl md:text-5xl serif-title mb-6 leading-tight">
              {t.aula_verde.lead_magnet.title}
            </h2>
            
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              {t.aula_verde.lead_magnet.subtitle}
            </p>

            <div className="space-y-4 mb-10">
              {t.aula_verde.lead_magnet.items.map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-4">
                  <CheckCircle weight="fill" className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-white/90" dangerouslySetInnerHTML={{ __html: item }} />
                </div>
              ))}
            </div>

          </div>

          {/* Columna Derecha: Formulario */}
          <div data-reveal data-delay="1">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl relative">
              
              {!submitted ? (
                <>
                  <div className="mb-8 text-center">
                    <h3 className="text-2xl serif-title text-brand mb-2">{t.aula_verde.lead_magnet.form.title}</h3>
                    <p className="text-gray-500 text-sm">{t.aula_verde.lead_magnet.form.subtitle}</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {trampa}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1" htmlFor="nombre_apellido">{t.aula_verde.lead_magnet.form.label_name}</label>
                      <input required type="text" id="nombre_apellido" name="nombre_apellido" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand transition-colors text-gray-800" placeholder={t.aula_verde.lead_magnet.form.placeholder_name} />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1" htmlFor="colegio">{t.aula_verde.lead_magnet.form.label_school}</label>
                      <input required type="text" id="colegio" name="colegio" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand transition-colors text-gray-800" placeholder={t.aula_verde.lead_magnet.form.placeholder_school} />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1" htmlFor="email">{t.aula_verde.lead_magnet.form.label_email}</label>
                      <input required type="email" id="email" name="email" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand transition-colors text-gray-800" placeholder={t.aula_verde.lead_magnet.form.placeholder_email} />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1" htmlFor="whatsapp">{t.aula_verde.lead_magnet.form.label_whatsapp}</label>
                      <input required type="tel" id="whatsapp" name="whatsapp" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand transition-colors text-gray-800" placeholder={t.aula_verde.lead_magnet.form.placeholder_whatsapp} />
                    </div>

                    {errorEmail && (
                      <p role="alert" className="text-sm font-semibold text-red-600">{errorEmailMsg}</p>
                    )}
                    <button type="submit" disabled={isGenerating} className="w-full bg-gold hover:bg-yellow-500 text-brand font-extrabold uppercase tracking-widest text-sm py-4 rounded-xl shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 mt-4 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-wait">
                      {isGenerating ? (
                        <>
                          <span>{t.aula_verde.lead_magnet.form.btn_generating}</span>
                          <CircleNotch weight="bold" className="w-5 h-5 animate-spin" />
                        </>
                      ) : (
                        <>
                          <span>{t.aula_verde.lead_magnet.form.btn_download}</span>
                          <DownloadSimple weight="bold" className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                        </>
                      )}
                    </button>
                    
                    <p className="text-xs text-gray-400 text-center mt-4">{t.aula_verde.lead_magnet.form.footer}</p>
                  </form>
                </>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle weight="fill" className="w-12 h-12 text-brand" />
                  </div>
                  <h3 className="text-2xl serif-title text-brand mb-4">{t.aula_verde.lead_magnet.success.title}</h3>
                  <p className="text-gray-600 mb-8 px-4">
                    {t.aula_verde.lead_magnet.success.text}
                  </p>
                  <button onClick={() => setSubmitted(false)} className="text-brand font-bold uppercase text-sm tracking-widest border border-brand/20 py-2 px-6 rounded-full hover:bg-brand/5 transition-colors">
                    {t.aula_verde.lead_magnet.success.btn}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AulaVerdeLeadMagnet;
