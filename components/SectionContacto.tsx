import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { marked } from 'marked';
import { submitForm } from '../src/lib/submitForm';

export const SectionContacto = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    message: '',
    consent: false,
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      await submitForm('Formulario de Contacto', formData);

      setStatus('success');
      setFormData({ name: '', email: '', whatsapp: '', message: '', consent: false });
      
      // Resetear mensaje de éxito después de 5 segundos
      setTimeout(() => setStatus('idle'), 5000);

    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus('error');
    }
  };

  return (
    <section id="contacto" className="py-24 bg-bone relative">
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div data-reveal className="text-center mb-12">
          <h2
            className="text-4xl md:text-5xl text-brand mb-4 font-serif"
            dangerouslySetInnerHTML={{ __html: marked.parse(t.contact.title as string) as string }}
          />
          <p className="text-dark/70 font-light text-lg">{t.contact.subtitle}</p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl border border-brand/5">
          <form
            className="grid gap-6"
            onSubmit={handleSubmit}
          >
            <input type="hidden" name="consent" value={formData.consent ? 'si' : 'no'} />

            <div className="grid md:grid-cols-2 gap-6">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t.contact.placeholders.name}
                className="w-full px-4 py-3 bg-bone border border-transparent focus:border-gold focus:bg-white focus:outline-none transition-[border-color,background-color] duration-200 rounded-lg font-light text-dark"
                required
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t.contact.placeholders.email}
                className="w-full px-4 py-3 bg-bone border border-transparent focus:border-gold focus:bg-white focus:outline-none transition-[border-color,background-color] duration-200 rounded-lg font-light text-dark"
                required
              />
            </div>
            <input
              type="tel"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder={t.contact.placeholders.whatsapp}
              className="w-full px-4 py-3 bg-bone border border-transparent focus:border-gold focus:bg-white focus:outline-none transition-[border-color,background-color] duration-200 rounded-lg font-light text-dark"
            />
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              placeholder={t.contact.placeholders.message}
              className="w-full px-4 py-3 bg-bone border border-transparent focus:border-gold focus:bg-white focus:outline-none transition-[border-color,background-color] duration-200 rounded-lg font-light text-dark"
              required
            ></textarea>

            {/* Checkbox de consentimiento — requerido por Ley 25.326 para uso en marketing */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleChange}
                required
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand accent-brand flex-shrink-0 cursor-pointer"
              />
              <span className="text-xs text-dark/60 leading-relaxed">
                {t.contact.consent.prefix}{' '}
                <a href="/terminos-y-condiciones/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">{t.contact.consent.termsLink}</a>{' '}
                {t.contact.consent.middle}{' '}
                <a href="/politica-de-privacidad/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">{t.contact.consent.privacyLink}</a>.
                {' '}{t.contact.consent.suffix}
              </span>
            </label>

            <div className="flex flex-col items-center gap-4">
              <button
                type="submit"
                disabled={status === 'submitting' || status === 'success'}
                className={`
                  w-full md:w-auto px-12 py-4 rounded-full text-sm font-bold uppercase tracking-widest shadow-lg mt-4 flex items-center justify-center gap-2
                  ${status === 'success'
                    ? 'bg-green-600 text-white cursor-default'
                    : 'bg-brand text-white hover:bg-gold disabled:opacity-70 disabled:cursor-not-allowed transition-[background-color,opacity] duration-300'}
                `}
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> {t.contact.status.sending}
                  </>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle className="w-4 h-4" /> {t.contact.status.sent}
                  </>
                ) : (
                  t.contact.btn
                )}
              </button>

              {status === 'success' && (
                <p className="text-green-600 text-sm animate-fadeIn font-medium">
                  {t.contact.status.successMsg}
                </p>
              )}
              {status === 'error' && (
                <p className="text-red-500 text-sm animate-fadeIn flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {t.contact.status.errorMsg}
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8 text-center text-dark/80 text-sm">
          <div>
            <p className="font-bold text-brand mb-1 font-serif text-base">{t.contact.labels.email}</p>
            <a href="mailto:experienciamagico@gmail.com" className="hover:text-gold transition-colors font-light">
              {t.contact.values.email}
            </a>
          </div>
          <div>
            <p className="font-bold text-brand mb-1 font-serif text-base">{t.contact.labels.whatsapp}</p>
            <a href={t.contact.values.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors font-light">
              {t.contact.labels.phone}
            </a>
          </div>
          <div>
            <p className="font-bold text-brand mb-1 font-serif text-base">{t.contact.labels.social}</p>
            <a
              href="https://instagram.com/experienciamagico"
              target="_blank"
              rel="noreferrer"
              className="hover:text-gold transition-colors font-light"
            >
              {t.contact.values.socialTag}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
