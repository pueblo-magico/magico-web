import React, { useState } from 'react';
import { ClipboardCheck, Compass, Receipt, Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

type Tab = 'accounts' | 'working' | 'next';

// Rendición de cuentas + hoja de ruta (t.roadmap, compartida con /empresas) +
// compromisos y validación, en una sola sección con pestañas para no alargar la
// landing. Reemplaza a <SectionHojaDeRuta /> en /reforestacion.
const ReforestacionTransparencia: React.FC<{ raised: string }> = ({ raised }) => {
  const { t } = useLanguage();
  const tr = t.reforestation.transparency;
  const roadmap = t.roadmap;
  const [tab, setTab] = useState<Tab>('accounts');

  const tabs: { id: Tab; label: string; Icon: typeof Receipt }[] = [
    { id: 'accounts', label: tr.tabs.accounts, Icon: Receipt },
    { id: 'working', label: tr.tabs.working, Icon: ClipboardCheck },
    { id: 'next', label: tr.tabs.next, Icon: Compass },
  ];

  return (
    <section id="hoja-de-ruta" className="scroll-mt-24 bg-white px-6 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div data-reveal>
          <div className="mb-8 max-w-3xl">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[#D4AF37]">{tr.eyebrow}</p>
            <h2 className="serif-title brand-green mb-4 text-3xl md:text-5xl" style={{ lineHeight: '1.1' }}>{tr.title}</h2>
            <p className="text-base font-light leading-relaxed text-gray-600 md:text-lg">{tr.description}</p>
          </div>
        </div>

        <div className="scrollbar-hide -mx-6 mb-6 flex gap-2 overflow-x-auto px-6 sm:mx-0 sm:px-0" role="tablist" aria-label={tr.eyebrow}>
          {tabs.map(({ id, label, Icon }) => {
            const selected = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`transparencia-tab-${id}`}
                aria-selected={selected}
                aria-controls={`transparencia-panel-${id}`}
                onClick={() => setTab(id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${selected ? 'border-brand bg-brand text-white' : 'border-brand/15 bg-white text-brand hover:border-brand/40'}`}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl border border-brand/10 bg-bone/60 p-5 md:p-8">
          {tab === 'accounts' && (
            <div role="tabpanel" id="transparencia-panel-accounts" aria-labelledby="transparencia-tab-accounts">
              <dl className="grid gap-3 md:grid-cols-3">
                {tr.accounts.rows.map((row: { label: string; value: string; detail: string }) => (
                  <div key={row.label} className="rounded-2xl border border-brand/10 bg-white p-5">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand/60">{row.label}</dt>
                    <dd className="mt-2 font-serif text-2xl text-brand md:text-3xl">{row.value.replace('{raised}', raised)}</dd>
                    <dd className="mt-2 text-sm font-light leading-relaxed text-gray-500">{row.detail}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 flex gap-3 text-sm leading-relaxed text-gray-600">
                <Receipt size={18} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                {tr.accounts.expenses}
              </p>
              <p className="mt-2 pl-[30px] text-xs leading-relaxed text-gray-400">{tr.accounts.tax}</p>
            </div>
          )}

          {tab === 'working' && (
            <div role="tabpanel" id="transparencia-panel-working" aria-labelledby="transparencia-tab-working">
              <p className="mb-5 text-sm leading-relaxed text-gray-600">{roadmap.intro}</p>
              <ul className="grid gap-3 md:grid-cols-2">
                {roadmap.items.map((item: { status: string; title: string; text: string }) => (
                  <li key={item.title} className="rounded-2xl border border-brand/10 bg-white p-4">
                    <span className="mb-2 inline-flex rounded-full bg-gold/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#76570d]">{item.status}</span>
                    <p className="font-semibold leading-snug text-brand">{item.title}</p>
                    <p className="mt-1 text-sm font-light leading-relaxed text-gray-500">{item.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === 'next' && (
            <div role="tabpanel" id="transparencia-panel-next" aria-labelledby="transparencia-tab-next" className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand/60">{tr.commitmentsTitle}</p>
                <ul className="space-y-3">
                  {tr.commitments.map((c: { title: string; text: string }) => (
                    <li key={c.title} className="flex gap-3 rounded-2xl border border-gold/40 bg-white p-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white"><Check size={15} aria-hidden="true" /></span>
                      <span>
                        <span className="block font-semibold text-brand">{c.title}</span>
                        <span className="mt-1 block text-sm font-light leading-relaxed text-gray-600">{c.text}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand/60">{tr.nextTitle}</p>
                <ol className="relative space-y-4 border-l border-brand/15 pl-5">
                  {tr.next.map((step: { when: string; title: string; text: string }) => (
                    <li key={step.title} className="relative">
                      <span className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-gold" aria-hidden="true" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#76570d]">{step.when}</p>
                      <p className="font-semibold leading-snug text-brand">{step.title}</p>
                      <p className="text-sm font-light leading-relaxed text-gray-500">{step.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReforestacionTransparencia;
