import React, { useState } from 'react';
import { TrendingDown, Plus, Minus, X } from 'lucide-react';
import { WA_MAGICO } from '../data/config';
import { formatPrice, RETREATS_DATA, type PricingLanguage } from '../data/retreats';
import { useLanguage } from '../../contexts/LanguageContext';

const C = {
  green: '#005333',
  gold:  '#D4AF37',
  dark:  '#1A2B3C',
  muted: '#4A6070',
  faint: '#6B8090',
  fire:  '#AA3E11',
};

function precioNino(age: number, precioAdulto: number): number {
  if (age <= 3)  return 0;
  if (age <= 7)  return precioAdulto * 0.70;
  if (age <= 12) return precioAdulto * 0.85;
  return precioAdulto;
}

function labelNino(age: number): string {
  if (age <= 3)  return 'Sin cargo';
  if (age <= 7)  return '30% OFF';
  if (age <= 12) return '15% OFF';
  return 'Tarifa adulto';
}

let nextId = 1;

// ── Contador ──────────────────────────────────────────────────────────────────
const Counter: React.FC<{
  label: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
  min?: number;
}> = ({ label, value, onDec, onInc, min = 0 }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
    <span className="text-white/80 text-sm font-medium">{label}</span>
    <div className="flex items-center gap-3">
      <button
        onClick={onDec}
        disabled={value <= min}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
        style={{ background: 'rgba(255,255,255,0.12)' }}
        aria-label={`Reducir ${label}`}
      >
        <Minus size={14} className="text-white" />
      </button>
      <span className="text-white font-bold text-xl w-7 text-center tabular-nums">{value}</span>
      <button
        onClick={onInc}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
        style={{ background: 'rgba(212,175,55,0.35)' }}
        aria-label={`Aumentar ${label}`}
      >
        <Plus size={14} className="text-white" />
      </button>
    </div>
  </div>
);

// ── Calculadora ───────────────────────────────────────────────────────────────
const Calculadora: React.FC<{ language: PricingLanguage }> = ({ language }) => {
  const [noches, setNoches]   = useState(2);
  const [adultos, setAdultos] = useState(2);
  const [ninos, setNinos]     = useState<{ id: number; age: number }[]>([]);

  const addNino  = () => setNinos(prev => [...prev, { id: nextId++, age: 6 }]);
  const removeNino = (id: number) => setNinos(prev => prev.filter(n => n.id !== id));
  const setAge = (id: number, raw: string) => {
    const age = Math.max(0, Math.min(17, parseInt(raw) || 0));
    setNinos(prev => prev.map(n => n.id === id ? { ...n, age } : n));
  };

  const precioAdulto = language === 'en' ? 35 : 50_000;
  const fmt = (amount: number) => formatPrice(Math.round(amount), language);
  const totalAdultos = adultos * precioAdulto * noches;
  const totalNinos   = ninos.reduce((s, n) => s + precioNino(n.age, precioAdulto) * noches, 0);
  const totalEfectivo = totalAdultos + totalNinos;
  const cuotaValor    = Math.round(totalEfectivo * 1.2 / 3);

  return (
    <div className="bg-white/5 border border-white/20 rounded-2xl p-6 md:p-8 mb-8">
      <p className="text-[10px] uppercase tracking-widest font-bold text-white/60 mb-5">
        Calculá el precio de tu familia
      </p>

      {/* Controles */}
      <div className="mb-4">
        <Counter label="Noches"   value={noches}  min={1} onDec={() => setNoches(n => Math.max(1, n - 1))} onInc={() => setNoches(n => n + 1)} />
        <Counter label="Adultos"  value={adultos} min={1} onDec={() => setAdultos(n => Math.max(1, n - 1))} onInc={() => setAdultos(n => n + 1)} />
      </div>

      {/* Infancias */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/70 text-sm">Infancias <span className="text-white/40 text-[10px]">(edad 0–17)</span></span>
          <button
            onClick={addNino}
            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'rgba(212,175,55,0.25)', color: C.gold }}
          >
            <Plus size={11} /> Agregar niño/a
          </button>
        </div>

        {ninos.length === 0 && (
          <p className="text-white/30 text-xs italic">Sin infancias — el precio aplica solo adultos.</p>
        )}

        <div className="space-y-2">
          {ninos.map(n => (
            <div key={n.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5">
              <span className="text-white/60 text-xs w-16 flex-shrink-0">Edad</span>
              <input
                type="number"
                min={0}
                max={17}
                value={n.age}
                onChange={e => setAge(n.id, e.target.value)}
                onFocus={e => e.target.select()}
                className="w-14 text-center font-bold text-white bg-white/10 rounded-lg px-2 py-1 text-sm border border-white/20 focus:outline-none focus:border-white/50"
                style={{ MozAppearance: 'textfield' } as React.CSSProperties}
              />
              <span className="flex-1 text-[11px] font-semibold" style={{ color: n.age <= 3 ? '#6ee7b7' : C.gold }}>
                {labelNino(n.age)}
                {n.age > 3 && (
                  <span className="ml-1 text-white/50 font-normal">
                    · {fmt(precioNino(n.age, precioAdulto))}/noche
                  </span>
                )}
              </span>
              <button
                onClick={() => removeNino(n.id)}
                className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
                aria-label="Quitar"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Desglose */}
      {totalEfectivo > 0 && (
        <div className="border-t border-white/15 pt-4 space-y-1.5 mb-4">
          <div className="flex justify-between text-sm text-white/60">
            <span>{adultos} adulto{adultos !== 1 ? 's' : ''} × {fmt(precioAdulto)}/noche × {noches} noche{noches !== 1 ? 's' : ''}</span>
            <span>{fmt(totalAdultos)}</span>
          </div>
          {ninos.map(n => n.age > 3 && (
            <div key={n.id} className="flex justify-between text-sm text-white/60">
              <span>Niño/a {n.age} años × {fmt(precioNino(n.age, precioAdulto))}/noche × {noches}</span>
              <span>{fmt(precioNino(n.age, precioAdulto) * noches)}</span>
            </div>
          ))}
          {ninos.some(n => n.age <= 3) && (
            <div className="flex justify-between text-sm" style={{ color: '#6ee7b7' }}>
              <span>Infancia{ninos.filter(n => n.age <= 3).length > 1 ? 's' : ''} 0–3 años</span>
              <span>Sin cargo</span>
            </div>
          )}
        </div>
      )}

      {/* Total */}
      <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-end justify-between mb-1">
          <span className="text-white/70 text-xs uppercase tracking-widest font-semibold">Total efectivo</span>
          <span className="text-3xl font-bold serif-title" style={{ color: C.gold }}>{fmt(totalEfectivo)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/40 text-xs">En cuotas · 3 pagos</span>
          <span className="text-white/60 text-sm font-semibold">3 × {fmt(cuotaValor)}</span>
        </div>
        {noches !== 2 && (
          <p className="text-white/30 text-[10px] mt-2">
            Base: {fmt(precioAdulto)}/noche adulto · Niños con descuento según edad
          </p>
        )}
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const FamilionPrecios: React.FC = () => {
  const { t, language } = useLanguage();
  const p = (t.familion as any).precios;
  const waLink = 'https://wa.me/' + WA_MAGICO + '?text=' + encodeURIComponent(RETREATS_DATA.familion.message);

  return (
    <section id="precios" className="py-16 md:py-24 px-6 bg-brand-green text-white rounded-3xl relative overflow-hidden">
      <div className="absolute inset-0 border border-white/20 rounded-3xl backdrop-blur-sm pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block border border-white/30 bg-white/10 text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold">
            {p.badge}
          </span>
          <h2 className="text-3xl md:text-5xl serif-title mb-4 tracking-[0.1em] uppercase text-white/90">
            {p.title}
          </h2>
          <p className="text-white/75 text-sm md:text-base max-w-2xl mx-auto">{p.subtitle}</p>
        </div>

        {/* Date chip */}
        <div className="flex justify-center mb-10">
          <div className="bg-white/10 border border-[#D4AF37]/40 rounded-2xl px-8 py-4 text-center">
            <p className="text-[10px] uppercase tracking-widest text-white/60 mb-1">{p.editions?.[0]}</p>
            <p className="text-lg serif-title font-bold text-white">
              {(t.familion as any).cronograma?.dates?.[0]?.split('·')[0].trim()}
            </p>
            <p className="text-xs font-bold mt-1" style={{ color: C.gold }}>{p.spots?.[0]}</p>
          </div>
        </div>

        {/* Precio por noche + infancias */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">

          {/* Adultos */}
          <div className="bg-white rounded-2xl p-7 text-left">
            <p className="text-[10px] tracking-widest uppercase font-semibold mb-4" style={{ color: '#A0866E' }}>
              {p.adulto_label}
            </p>

            <div className="flex items-baseline gap-2 mb-1">
              <p className="text-5xl font-bold serif-title" style={{ color: C.green }}>{language === 'en' ? `USD ${p.adulto_noche}` : `$${p.adulto_noche}`}</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(170,62,17,0.12)', color: C.fire }}>
                🌨 invierno
              </span>
            </div>
            <p className="text-sm mb-5" style={{ color: C.muted }}>{p.por_noche}</p>

            <div className="pt-4 border-t" style={{ borderColor: 'rgba(0,83,51,0.15)' }}>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: C.green }}>
                Opciones de pago · 2 noches
              </p>
              <p className="text-sm font-bold mb-3" style={{ color: C.dark }}>{p.adulto_2n}</p>

              <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: C.faint }}>En cuotas</p>
              <p className="text-[11px] font-semibold mb-1 inline-block px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(212,175,55,0.22)', color: '#8B6A00' }}>
                {p.adulto_cuotas}
              </p>
              <p className="text-[10px] mb-3 font-semibold" style={{ color: C.muted }}>
                Total en cuotas: {language === 'en' ? `USD ${p.adulto_lista}` : `$${p.adulto_lista}`}
              </p>

              <p className="text-[11px] font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(0,83,51,0.08)', color: '#8B6A00' }}>
                <TrendingDown size={12} /> {p.adulto_ahorro}
              </p>
            </div>
          </div>

          {/* Infancias */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-7">
            <p className="text-[10px] uppercase tracking-widest font-bold mb-1 text-white/70">{p.kids_title}</p>
            <p className="text-[10px] text-white/50 mb-5">{p.kids_subtitle}</p>
            <ul className="space-y-3">
              {p.kids?.map((kid: any, i: number) => (
                <li key={i} className="flex items-center justify-between text-sm border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-white/80">{kid.rango}</p>
                    <p className="text-white/40 text-[10px]">{kid.desc}{kid.note ? ` · ${kid.note}` : ''}</p>
                  </div>
                  <div className="text-right">
                    {kid.noche ? (
                      <>
                        <p className="font-bold text-white">
                          {language === 'en' ? `USD ${kid.noche}` : `$${kid.noche}`}<span className="text-[10px] font-normal text-white/50">/noche</span>
                        </p>
                        <p className="text-[10px] text-white/50">2 noches: {language === 'en' ? `USD ${kid.price}` : `$${kid.price}`}</p>
                      </>
                    ) : (
                      <span className="text-white/60 text-[10px]">{kid.desc}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Calculadora ── */}
        <Calculadora language={language} />

        {/* Incluye */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 md:p-8 mb-8">
          <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-4">{p.includes?.title}</h4>
          <ul className="grid md:grid-cols-2 gap-2.5">
            {p.includes?.items?.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/85">
                <span className="flex-shrink-0 mt-0.5" style={{ color: C.gold }}>✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a href={waLink} className="btn-gold w-full md:w-auto block md:inline-block mb-5">
            {p.btn}
          </a>
          <p className="text-white/50 text-xs italic">{p.footer}</p>
        </div>

      </div>
    </section>
  );
};

export default FamilionPrecios;
