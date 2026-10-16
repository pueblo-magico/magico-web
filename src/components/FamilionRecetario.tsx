import React, { useState, useRef, useEffect } from 'react';
import { DownloadSimple, FilePdf, CheckCircle, CircleNotch } from '@phosphor-icons/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { submitForm } from '../lib/submitForm';
import { useAntiBot } from '../lib/useAntiBot';
import { validarEmail } from '../lib/validarContacto';

const PDF_URL = '/uploads/Recetarios/recetario-familion.pdf';
const PDF_FILENAME = 'Recetario-Familion-Pueblo-Magico.pdf';

const FamilionRecetario: React.FC = () => {
  const { t } = useLanguage();
  const tr = t.familion.recetario;
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
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

  const triggerDownload = () => {
    const link = document.createElement('a');
    link.href = PDF_URL;
    link.download = PDF_FILENAME;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    if (validarEmail(String(data.get('email') || ''))) { setErrorEmail(true); return; }
    setErrorEmail(false);
    // Bot (campo trampa o envío instantáneo): se entrega igual sin mandar nada.
    if (esBot()) { triggerDownload(); setSubmitted(true); return; }
    setSending(true);
    submitForm('recetario-familion', data).finally(() => {
      triggerDownload();
      setSending(false);
      setSubmitted(true);
    });
  };

  return (
    <section ref={sectionRef} className="py-20 md:py-32 px-6 bg-brand-green text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-brand-gold rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/3 -translate-y-1/3 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-5 -translate-x-1/2 translate-y-1/2 pointer-events-none" aria-hidden="true" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Copy */}
          <div data-reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold/20 text-brand-gold border border-brand-gold/30 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              <FilePdf weight="fill" className="w-4 h-4" aria-hidden="true" />
              <span>{tr.badge}</span>
            </div>

            <h2 className="text-3xl md:text-5xl serif-title mb-6 leading-tight">
              {tr.title}
            </h2>

            <p className="text-white/75 text-lg mb-8 leading-relaxed">
              {tr.subtitle}
            </p>

            <ul className="space-y-3">
              {tr.items.map((item: string) => (
                <li key={item} className="flex items-center gap-3 text-white/90 text-sm md:text-base">
                  <CheckCircle weight="fill" className="w-5 h-5 text-brand-gold flex-shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Formulario o estado de éxito */}
          <div data-reveal data-delay="1">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl">
              {!submitted ? (
                <>
                  <div className="mb-7 text-center">
                    <h3 className="text-xl serif-title text-brand-green mb-1">{tr.form.title}</h3>
                    <p className="text-gray-400 text-sm">{tr.form.subtitle}</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {trampa}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider" htmlFor="rec-nombre">
                        {tr.form.label_nombre}
                      </label>
                      <input
                        required
                        type="text"
                        id="rec-nombre"
                        name="nombre"
                        placeholder={tr.form.placeholder_nombre}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider" htmlFor="rec-email">
                        {tr.form.label_email}
                      </label>
                      <input
                        required
                        type="email"
                        id="rec-email"
                        name="email"
                        placeholder="tu@email.com"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider" htmlFor="rec-wa">
                        {tr.form.label_whatsapp}{' '}
                        <span className="font-normal text-gray-400 normal-case">{tr.form.whatsapp_optional}</span>
                      </label>
                      <input
                        type="tel"
                        id="rec-wa"
                        name="whatsapp"
                        placeholder={tr.form.placeholder_whatsapp}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-colors"
                      />
                    </div>

                    {errorEmail && (
                      <p role="alert" className="text-sm font-semibold text-red-600">{errorEmailMsg}</p>
                    )}

                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full bg-brand-gold hover:bg-yellow-400 text-brand-green font-extrabold uppercase tracking-widest text-sm py-4 rounded-xl shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 mt-2 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-wait"
                    >
                      {sending ? (
                        <>
                          <span>{tr.form.btn_loading}</span>
                          <CircleNotch weight="bold" className="w-4 h-4 animate-spin" aria-hidden="true" />
                        </>
                      ) : (
                        <>
                          <span>{tr.form.btn}</span>
                          <DownloadSimple weight="bold" className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" aria-hidden="true" />
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-400 text-center">{tr.form.footer}</p>
                  </form>
                </>
              ) : (
                <div className="py-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-5">
                    <CheckCircle weight="fill" className="w-9 h-9 text-brand-green" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl serif-title text-brand-green mb-2">{tr.success.title}</h3>
                  <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-xs">
                    {tr.success.text}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <a
                      href={PDF_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border-2 border-brand-green text-brand-green rounded-xl font-bold text-sm hover:bg-brand-green hover:text-white transition-colors"
                    >
                      <FilePdf weight="fill" className="w-4 h-4" aria-hidden="true" />
                      {tr.success.btn_view}
                    </a>
                    <a
                      href={PDF_URL}
                      download={PDF_FILENAME}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-brand-gold text-brand-green rounded-xl font-bold text-sm hover:bg-yellow-400 transition-colors"
                    >
                      <DownloadSimple weight="bold" className="w-4 h-4" aria-hidden="true" />
                      {tr.success.btn_download}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FamilionRecetario;
