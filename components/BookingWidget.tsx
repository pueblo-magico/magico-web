import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { WA_MAGICO } from '../src/data/config';
import { BLOCKED_DATES_DOMO, BLOCKED_DATES_REFUGIO, RETIRO_DATES_DOMO, RETIRO_DATES_REFUGIO, DOMO_DISPONIBLE_DESDE, DOMO_FINDES_A_CONSULTAR, MONTHLY_URGENCY } from '../src/data/availability';
import { preciosPorNoche, type AlojamientoTarifa } from '../src/data/pricing';
import { formatPrice } from '../src/data/retreats';

// ── Constantes ────────────────────────────────────────────────────────────────
// Las etiquetas salen de booking.months en data.json (mismo orden y largo).
const MONTH_DATES = [
  { year: 2026, month: 10 },
  { year: 2026, month: 11 },
  { year: 2026, month: 12 },
  { year: 2027, month: 1 },
  { year: 2027, month: 2 },
];
const TODAY = new Date().toISOString().slice(0, 10);
// Rango que cubre el calendario del widget (1° del primer mes hasta el 1°
// del mes siguiente al último), para pedirle a /api/disponibilidad solo lo
// que se va a mostrar.
const DISPONIBILIDAD_DESDE = `${MONTH_DATES[0].year}-${String(MONTH_DATES[0].month).padStart(2, '0')}-01`;
const DISPONIBILIDAD_HASTA = (() => {
  const ultimo = MONTH_DATES[MONTH_DATES.length - 1];
  return new Date(ultimo.year, ultimo.month, 1).toISOString().slice(0, 10); // mes 1° del mes siguiente
})();
// Días del calendario anteriores a DOMO_DISPONIBLE_DESDE (domos todavía no
// habilitados) y noches de finde a consultar (ver DOMO_FINDES_A_CONSULTAR).
const DIAS_CALENDARIO = (() => {
  const dias: string[] = [];
  for (let d = new Date(`${DISPONIBILIDAD_DESDE}T00:00:00Z`); d.toISOString().slice(0, 10) < DISPONIBILIDAD_HASTA; d.setUTCDate(d.getUTCDate() + 1)) {
    dias.push(d.toISOString().slice(0, 10));
  }
  return dias;
})();
const DOMO_NO_HABILITADO = DIAS_CALENDARIO.filter(iso => iso < DOMO_DISPONIBLE_DESDE);
const DOMO_FINDES = DOMO_FINDES_A_CONSULTAR
  ? DIAS_CALENDARIO.filter(iso => iso >= DOMO_DISPONIBLE_DESDE && [5, 6].includes(new Date(`${iso}T00:00:00Z`).getUTCDay()))
  : [];
export const G = { green: '#005333', gold: '#D4AF37', muted: '#4A6070' };

export function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
export function fmt(iso: string, monthAbbr: string[]) {
  const [, m, d] = iso.split('-');
  return `${parseInt(d)} ${monthAbbr[parseInt(m) - 1]}`;
}
export function nightsBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}
export function getStatus(iso: string, blockedList: string[], retiroList: string[] = []): 'available' | 'blocked' | 'retiro' | 'past' {
  if (iso < TODAY) return 'past';
  if (blockedList.includes(iso)) return 'blocked';
  if (retiroList.includes(iso)) return 'retiro';
  return 'available';
}
// 'retiro' se puede elegir igual que 'available' — solo cambia el color y
// dispara el aviso de consultar por WhatsApp (ver RETIRO_DATES_* arriba).
export function esPickable(status: ReturnType<typeof getStatus>): boolean {
  return status === 'available' || status === 'retiro';
}
export function initialMonth() {
  const i = MONTH_DATES.findIndex(mo => toISO(mo.year, mo.month, new Date(mo.year, mo.month, 0).getDate()) >= TODAY);
  return i >= 0 ? i : 0;
}
function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
function fillTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

// ── Widget ────────────────────────────────────────────────────────────────────
export const BookingWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t, language } = useLanguage();
  const b = (t as any).booking;
  const MONTHS = MONTH_DATES.map((d, i) => ({ ...d, label: b.months[i].label, short: b.months[i].short }));

  const [calOpen, setCalOpen]   = useState(false);
  const [monthIdx, setMonthIdx] = useState(initialMonth);
  const [start, setStart]       = useState<string | null>(null);
  const [end, setEnd]           = useState<string | null>(null);
  const [pickEnd, setPickEnd]   = useState(false);
  const [personas, setPersonas] = useState(2);
  // Sin selección inicial: si domo apareciera pre-marcado por defecto, el
  // calendario se ve "siempre lleno" (por los findes bloqueados) antes de
  // que la persona elija algo. Que elija ella misma tipo y habitación.
  const [tipo, setTipo]         = useState<'domo' | 'refugio' | 'carpa' | null>(null);
  const [habitacion, setHabitacion] = useState<'compartida' | 'privada' | null>(null);
  const [comidas, setComidas]   = useState<'desayuno' | 'pension'>('desayuno');
  const tipoEfectivo: 'domo' | 'refugio' | 'carpa' = tipo ?? 'domo';
  const esCarpa = tipoEfectivo === 'carpa';

  // Disponibilidad real desde D1 (Panel de Reservas). Arranca con el
  // fallback estático y, si /api/disponibilidad responde a tiempo, lo
  // reemplaza — así el calendario nunca queda "todo disponible" mientras
  // carga, y sigue funcionando si la consulta falla (p. ej. en dev local).
  const [blockedDomo, setBlockedDomo] = useState<string[]>(BLOCKED_DATES_DOMO);
  const [blockedRefugio, setBlockedRefugio] = useState<string[]>(BLOCKED_DATES_REFUGIO);
  // Carpa todavía no tiene disponibilidad real cargada en D1 — de momento
  // queda siempre "disponible" y toda la coordinación se resuelve por
  // WhatsApp con los datos que la persona completó acá.
  const CARPA_SIN_BLOQUEOS: string[] = [];
  const retiroByTipo = useMemo(() => ({ domo: [...RETIRO_DATES_DOMO, ...DOMO_FINDES], refugio: RETIRO_DATES_REFUGIO, carpa: CARPA_SIN_BLOQUEOS }), []);

  useEffect(() => {
    let cancelado = false;
    fetch(`/api/disponibilidad?desde=${DISPONIBILIDAD_DESDE}&hasta=${DISPONIBILIDAD_HASTA}`)
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`status ${res.status}`))))
      .then(data => {
        if (cancelado) return;
        if (Array.isArray(data?.domo?.blocked)) setBlockedDomo(data.domo.blocked);
        if (Array.isArray(data?.refugio?.blocked)) setBlockedRefugio(data.refugio.blocked);
      })
      .catch(() => { /* se queda con el fallback estático */ });
    return () => { cancelado = true; };
  }, []);

  const blockedByTipo = useMemo(() => ({ domo: [...DOMO_NO_HABILITADO, ...blockedDomo], refugio: blockedRefugio, carpa: CARPA_SIN_BLOQUEOS }), [blockedDomo, blockedRefugio]);

  // En vez de borrar las fechas elegidas cuando no aplican al otro tipo de
  // alojamiento, directamente deshabilitamos ese botón — así la persona ve
  // por qué no puede cambiar, en lugar de perder su selección sin aviso.
  function tipoDisponibleParaFechas(op: 'domo' | 'refugio' | 'carpa'): boolean {
    if (start && !esPickable(getStatus(start, blockedByTipo[op], retiroByTipo[op]))) return false;
    if (end && !esPickable(getStatus(end, blockedByTipo[op], retiroByTipo[op]))) return false;
    return true;
  }

  const mo          = MONTHS[monthIdx];
  const firstDay    = new Date(mo.year, mo.month - 1, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(mo.year, mo.month, 0).getDate();
  const monthKey     = `${mo.year}-${String(mo.month).padStart(2, '0')}`;
  const monthUrgency = MONTHLY_URGENCY[monthKey] ?? 'normal';

  const handleDay = useCallback((iso: string) => {
    if (!esPickable(getStatus(iso, blockedByTipo[tipoEfectivo], retiroByTipo[tipoEfectivo]))) return;
    if (!pickEnd || !start) {
      setStart(iso); setEnd(null); setPickEnd(true);
    } else {
      if (iso <= start) { setStart(iso); setEnd(null); }
      // Al elegir la salida se cierra el calendario: las fechas quedan a la
      // vista arriba y el widget no crece de más (ver sticky en Estadía).
      else { setEnd(iso); setPickEnd(false); setCalOpen(false); }
    }
  }, [pickEnd, start, tipoEfectivo, blockedByTipo, retiroByTipo]);

  function dayStyle(iso: string) {
    const s = getStatus(iso, blockedByTipo[tipoEfectivo], retiroByTipo[tipoEfectivo]);
    const isStart = iso === start;
    const isEnd   = iso === end;
    const inRange = !!(start && end && iso > start && iso < end);
    if (s === 'past')     return { bg: 'transparent', color: '#cbd5e1', cursor: 'default',      opacity: 0.35, radius: 6 };
    if (s === 'blocked')  return { bg: '#f1f5f9',     color: '#cbd5e1', cursor: 'not-allowed',  opacity: 0.6,  radius: 6 };
    if (isStart || isEnd) return { bg: G.green,        color: 'white',   cursor: 'pointer',      opacity: 1,    radius: 6 };
    if (inRange)          return { bg: 'rgba(0,83,51,0.1)', color: G.green, cursor: 'pointer',  opacity: 1,    radius: 0 };
    if (s === 'retiro')   return { bg: 'rgba(212,175,55,0.16)', color: '#8B6A00', cursor: 'pointer', opacity: 1, radius: 6 };
    return                       { bg: 'transparent', color: '#1A2B3C', cursor: 'pointer',      opacity: 1,    radius: 6 };
  }

  // Capacidad física real: un domo entra hasta 7 personas (7 camas — por
  // ahora todas individuales, sin armar la opción matrimonial), el refugio
  // hasta 15. Por encima de eso no se puede reservar solo — se coordina por
  // WhatsApp (combinar domos + refugio, etc.).
  const CAPACIDAD_DOMO = 7;
  const CAPACIDAD_REFUGIO = 15;
  const capacidadMax = tipoEfectivo === 'domo' ? CAPACIDAD_DOMO : CAPACIDAD_REFUGIO;
  // Carpa no tiene un tope de capacidad cargado (sin inventario real en D1
  // todavía) — cualquier grupo se coordina por WhatsApp, nunca la bloqueamos acá.
  const excedeCapacidad = !esCarpa && personas > capacidadMax;

  // Privada en domo: $50.000 por persona/noche con desayuno ($75.000 con
  // pensión completa), de 2 a 7 personas — no se ofrece para 1 persona sola.
  const domoPrivadaDisponible = personas >= 2 && personas <= CAPACIDAD_DOMO;
  // Privada en refugio: de 3 personas hasta el tope real (15) no tiene costo
  // extra (misma tarifa que compartida) — a esa escala ya estás usando la
  // mayor parte o todo el refugio igual. El recargo es solo para 1-2
  // personas, que ocupan en exclusiva un espacio pensado para muchos más.
  // Camping no tiene distinción compartida/privada — es siempre "compartida" a estos efectos.
  const privadaDisponible = esCarpa ? false : tipoEfectivo === 'domo' ? domoPrivadaDisponible : true;
  const habitacionEfectiva = privadaDisponible ? (habitacion ?? 'compartida') : 'compartida';
  const enRangoGrupo = esCarpa ? false : tipoEfectivo === 'domo'
    ? personas >= 3 && personas <= CAPACIDAD_DOMO
    : personas >= 3 && personas <= CAPACIDAD_REFUGIO;

  // Tarifa noche por noche (ver src/data/pricing.ts): días de semana con
  // desayuno o pensión completa; viernes y sábado siempre pensión completa.
  const conPension = comidas === 'pension';
  // Refugio privado: sin costo extra de 3 hasta el tope real (15); recargo solo para 1-2.
  const alojTarifa: AlojamientoTarifa = esCarpa ? 'carpa'
    : habitacionEfectiva !== 'privada' ? 'compartida'
    : tipoEfectivo === 'domo' ? 'domoPrivado'
    : (personas >= 3 && personas <= CAPACIDAD_REFUGIO) ? 'compartida' : 'refugioPrivado';

  // Si la estadía elegida cae en fechas de retiro/evento (ver RETIRO_DATES_*),
  // no la bloqueamos, pero avisamos que hay que confirmar por WhatsApp: puede
  // que el evento no use este alojamiento, o lo use solo parcialmente.
  // Se revisan todas las noches de la estadía (no solo llegada/salida): una
  // estadía jueves → lunes también pasa por el finde.
  const enRetiro = start != null && (end
    ? DIAS_CALENDARIO.some(iso => iso >= start && iso < end && retiroByTipo[tipoEfectivo].includes(iso))
    : retiroByTipo[tipoEfectivo].includes(start));

  const nights       = start && end ? nightsBetween(start, end) : 0;
  const noches       = start && end ? preciosPorNoche(alojTarifa, start, end, conPension, language) : [];
  const nochesBase   = start && end ? preciosPorNoche(esCarpa ? 'carpa' : 'compartida', start, end, conPension, language) : [];
  const sumar        = (ns: { precio: number }[]) => ns.reduce((acc, n) => acc + n.precio, 0);
  const totalPorPersona = sumar(noches);
  // Diferencia promedio por noche contra la tarifa compartida de las mismas noches.
  const diferenciaPorPersona = nights > 0 ? Math.round((totalPorPersona - sumar(nochesBase)) / nights) : 0;
  const total        = totalPorPersona * personas;
  const hayFinde     = noches.some(n => n.finde);
  // Noches agrupadas por precio, para mostrar "2 noches a $60.000 + 2 noches a $95.000".
  const gruposPrecio = noches.reduce<{ precio: number; n: number }[]>((acc, n) => {
    const g = acc.find(x => x.precio === n.precio);
    if (g) g.n++; else acc.push({ precio: n.precio, n: 1 });
    return acc;
  }, []);
  // Seña del 50% para congelar la tarifa; el otro 50% se abona a más tardar al llegar.
  const senaPct      = 50;
  const senaMonto    = Math.round(total * senaPct / 100);
  const tipoLabel    = tipoEfectivo === 'domo' ? b.domoFull : tipoEfectivo === 'refugio' ? b.refugioFull : b.carpaFull;
  // Camping no tiene compartida/privada: solo se indica el régimen de comidas
  // (antes decía "alojamiento + desayuno · pensión completa", contradictorio).
  const comidasLabel = conPension ? b.mealFullBoard : hayFinde ? `${b.mealBreakfast}${b.weekendRegimenSuffix}` : b.mealBreakfast;
  const habitacionLabel = esCarpa ? comidasLabel : `${habitacionEfectiva === 'privada' ? b.privateRoom : b.sharedRoom} · ${comidasLabel}`;
  const waMsg        = start && end
    ? fillTemplate(b.waTemplateWithDates, {
        tipo: tipoLabel,
        regimen: habitacionLabel,
        start: fmt(start, b.monthAbbr),
        end: fmt(end, b.monthAbbr),
        nights: plural(nights, b.nightWord),
        personas: plural(personas, b.guestWord),
      })
    : b.waTemplateDefault;
  const waUrl = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(waMsg)}`;
  const clear = () => { setStart(null); setEnd(null); setPickEnd(false); setCalOpen(false); };

  return (
    <div style={{ padding: compact ? '10px 14px 14px' : '14px 18px 18px' }}>

      {/* Fechas */}
      <p style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700, color: G.muted, marginBottom: 8 }}>
        {b.selectDates}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        {([{ label: b.arrival, val: start }, { label: b.departure, val: end }] as const).map(({ label, val }) => (
          <button key={label} onClick={() => setCalOpen(true)}
            style={{ border: `1.5px solid ${calOpen ? G.green : 'rgba(0,83,51,0.18)'}`, borderRadius: 10, padding: '9px 11px', textAlign: 'left', background: val ? 'rgba(0,83,51,0.05)' : 'white', cursor: 'pointer' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: G.muted, fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: val ? G.green : '#94a3b8', marginTop: 2 }}>{val ? fmt(val, b.monthAbbr) : '—'}</div>
          </button>
        ))}
      </div>

      {/* Calendario */}
      {calOpen && (
        <div style={{ border: '1px solid rgba(0,83,51,0.12)', borderRadius: 14, marginBottom: 12, overflow: 'hidden', background: 'white' }}>
          <div style={{ display: 'flex', padding: 5, gap: 3, borderBottom: '1px solid rgba(0,83,51,0.07)', background: 'rgba(0,83,51,0.02)' }}>
            {MONTHS.map((m, i) => (
              <button key={m.label} onClick={() => setMonthIdx(i)}
                style={{ flex: 1, padding: '5px 3px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                  background: monthIdx === i ? G.green : 'transparent', color: monthIdx === i ? 'white' : G.muted }}>
                {m.short}
              </button>
            ))}
            <button onClick={() => setCalOpen(false)}
              style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <X size={12} color={G.muted} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px 4px' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1A2B3C' }}>{mo.label} {mo.year}</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {[{ Icon: ChevronLeft, dir: -1 }, { Icon: ChevronRight, dir: 1 }].map(({ Icon, dir }) => {
                const disabled = dir < 0 ? monthIdx === 0 : monthIdx === MONTHS.length - 1;
                return (
                  <button key={dir} onClick={() => setMonthIdx(i => Math.max(0, Math.min(MONTHS.length - 1, i + dir)))} disabled={disabled}
                    style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,83,51,0.06)', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={12} color={G.muted} />
                  </button>
                );
              })}
            </div>
          </div>
          {monthUrgency !== 'normal' && (
            <div style={{ margin: '0 10px 8px', padding: '6px 10px', borderRadius: 8, background: 'rgba(212,175,55,0.14)', textAlign: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#8B6A00' }}>
                {fillTemplate(b.monthUrgency[monthUrgency === 'ultimos-lugares' ? 'ultimosLugares' : 'pocosLugares'], { month: mo.label })}
              </span>
            </div>
          )}
          <div style={{ padding: '0 10px 10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2 }}>
              {b.dayNames.map((d: string, i: number) => <div key={`${d}${i}`} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', padding: '2px 0' }}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const iso = toISO(mo.year, mo.month, day);
                const { bg, color, cursor, opacity, radius } = dayStyle(iso);
                return (
                  <button key={day} onClick={() => handleDay(iso)}
                    style={{ height: 34, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, background: bg, color, cursor, opacity, borderRadius: radius, border: 'none', padding: 0, WebkitTapHighlightColor: 'transparent' }}>
                    {day}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, textAlign: 'center' }}>
              {!start ? b.tapArrival : !end ? b.chooseDeparture : `${fmt(start, b.monthAbbr)} → ${fmt(end, b.monthAbbr)} · ${plural(nights, b.nightWord)}`}
            </p>
          </div>
        </div>
      )}

      {enRetiro && (
        <p style={{ fontSize: 11, fontWeight: 600, color: '#8B6A00', background: 'rgba(212,175,55,0.14)', borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
          {b.retiroNote}
        </p>
      )}

      {/* Personas */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: G.muted, fontWeight: 500 }}>{b.guestsLabel}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setPersonas(p => Math.max(1, p - 1))}
            style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid rgba(0,83,51,0.2)', background: 'white', cursor: 'pointer', fontSize: 16, color: G.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1A2B3C', minWidth: 18, textAlign: 'center' }}>{personas}</span>
          <button onClick={() => setPersonas(p => Math.min(CAPACIDAD_REFUGIO, p + 1))}
            style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: G.green, cursor: 'pointer', fontSize: 16, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
      </div>
      {esCarpa ? (
        <p style={{ fontSize: 10, color: '#8B6A00', marginTop: -6, marginBottom: 10, fontWeight: 600 }}>
          {b.carpaNote}
        </p>
      ) : excedeCapacidad && nights === 0 ? (
        <p style={{ fontSize: 10, color: '#94a3b8', marginTop: -6, marginBottom: 10 }}>
          {fillTemplate(b.capacityExceeded, { tipo: (tipoEfectivo === 'domo' ? b.domoShort : b.refugioShort).toLowerCase(), max: String(capacidadMax) })}
        </p>
      ) : excedeCapacidad ? null : enRangoGrupo ? (
        <p style={{ fontSize: 10, color: G.green, marginTop: -6, marginBottom: 10, fontWeight: 600 }}>
          {tipoEfectivo === 'domo' ? b.groupNote.domo : b.groupNote.refugio}
        </p>
      ) : (
        <p style={{ fontSize: 10, color: '#8B6A00', marginTop: -6, marginBottom: 10, fontWeight: 600 }}>
          {b.groupTeaser}
        </p>
      )}

      {/* Alojamiento */}
      <p style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700, color: G.muted, marginBottom: 6 }}>{b.accommodation}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
        {(['domo', 'refugio', 'carpa'] as const).map(op => {
          const disabled = !tipoDisponibleParaFechas(op);
          const active = tipo === op;
          return (
            <button key={op} disabled={disabled} onClick={() => !disabled && setTipo(op)}
              style={{
                padding: '9px 6px', borderRadius: 9,
                border: `1.5px solid ${active ? G.green : 'rgba(0,83,51,0.18)'}`,
                background: active ? G.green : disabled ? '#f1f5f9' : 'white',
                color: active ? 'white' : disabled ? '#cbd5e1' : G.muted,
                fontSize: 11, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
              }}>
              {op === 'domo' ? `⬡ ${b.domoShort}` : op === 'refugio' ? `🏔 ${b.refugioShort}` : `⛺ ${b.carpaShort}`}
            </button>
          );
        })}
      </div>
      {(!tipoDisponibleParaFechas('domo') || !tipoDisponibleParaFechas('refugio')) && (
        <p style={{ fontSize: 10, color: '#94a3b8', marginTop: -2, marginBottom: 10 }}>{b.unavailableForDates}</p>
      )}

      {/* Tipo de habitación — Camping no tiene esta distinción */}
      {!esCarpa && (
        <>
          <p style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700, color: G.muted, marginBottom: 6 }}>{b.roomType}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: privadaDisponible ? 12 : 4 }}>
            {(['compartida', 'privada'] as const).map(op => {
              const disabled = op === 'privada' && !privadaDisponible;
              const active = habitacion !== null && habitacionEfectiva === op;
              return (
                <button key={op} disabled={disabled} onClick={() => !disabled && setHabitacion(op)}
                  style={{
                    padding: '9px 8px', borderRadius: 9,
                    border: `1.5px solid ${active ? G.green : 'rgba(0,83,51,0.18)'}`,
                    background: active ? G.green : disabled ? '#f1f5f9' : 'white',
                    color: active ? 'white' : disabled ? '#cbd5e1' : G.muted,
                    fontSize: 11, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
                  }}>
                  {op === 'privada' ? b.privateRoom : b.sharedRoom}
                </button>
              );
            })}
          </div>
          {!privadaDisponible && (
            <p style={{ fontSize: 10, color: '#94a3b8', marginTop: -6, marginBottom: 12 }}>{b.privateDomoNote}</p>
          )}
        </>
      )}

      {/* Comidas — dejar claro el precio solo con desayuno vs. pensión completa */}
      <p style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700, color: G.muted, marginBottom: 6 }}>{b.mealPlan}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 4 }}>
        {(['desayuno', 'pension'] as const).map(op => {
          const active = comidas === op;
          return (
            <button key={op} onClick={() => setComidas(op)}
              style={{
                padding: '9px 8px', borderRadius: 9,
                border: `1.5px solid ${active ? G.green : 'rgba(0,83,51,0.18)'}`,
                background: active ? G.green : 'white',
                color: active ? 'white' : G.muted,
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>
              {op === 'pension' ? b.mealFullBoard : b.mealBreakfast}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: hayFinde && !conPension ? 4 : 12 }}>{conPension ? b.mealFullBoardNote : b.mealBreakfastNote}</p>
      {hayFinde && !conPension && (
        <p style={{ fontSize: 10, color: '#8B6A00', fontWeight: 600, marginBottom: 12 }}>{b.weekendNote}</p>
      )}

      {/* Resumen — sin precio si el grupo excede la capacidad real: esas
          tarifas por persona no aplican a un grupo que no entra en el
          alojamiento, así que no mostramos un total inventado. */}
      {nights > 0 && excedeCapacidad && (
        <div style={{ background: 'rgba(212,175,55,0.14)', borderRadius: 9, padding: '9px 11px', marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#8B6A00', margin: 0 }}>
            {fillTemplate(b.capacityExceeded, { tipo: (tipoEfectivo === 'domo' ? b.domoShort : b.refugioShort).toLowerCase(), max: String(capacidadMax) })}
          </p>
          <button onClick={clear} style={{ fontSize: 11, color: '#8B6A00', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 6, textDecoration: 'underline' }}>{b.clear}</button>
        </div>
      )}
      {nights > 0 && !excedeCapacidad && (
        <div style={{ background: 'rgba(0,83,51,0.05)', borderRadius: 9, padding: '9px 11px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 11, color: G.muted, margin: 0 }}>{plural(nights, b.nightWord)} · {plural(personas, b.guestWord)}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                {habitacionLabel.toLowerCase()}
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                {gruposPrecio.length === 1
                  ? `${formatPrice(gruposPrecio[0].precio, language)}/${b.perPersonPerNight}`
                  : `${gruposPrecio.map(g => fillTemplate(b.nightsAt, { nights: plural(g.n, b.nightWord), precio: formatPrice(g.precio, language) })).join(' + ')} (${b.perPersonPerNight})`}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 700, fontSize: 17, color: G.green, margin: 0 }}>{formatPrice(total, language)}</p>
              <button onClick={clear} style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>{b.clear}</button>
            </div>
          </div>
          {!esCarpa && diferenciaPorPersona < 0 && (
            <p style={{ fontSize: 10, fontWeight: 700, color: G.green, margin: '6px 0 0' }}>
              {fillTemplate(b.discountApplied, { ahorro: formatPrice(Math.abs(diferenciaPorPersona), language) })}
            </p>
          )}
          {!esCarpa && diferenciaPorPersona === 0 && habitacionEfectiva === 'privada' && (
            <p style={{ fontSize: 10, fontWeight: 700, color: G.green, margin: '6px 0 0' }}>{b.privacyIncluded}</p>
          )}
          {!esCarpa && diferenciaPorPersona > 0 && (
            <p style={{ fontSize: 10, fontWeight: 600, color: G.muted, margin: '6px 0 0' }}>
              {fillTemplate(b.privacySurcharge, { extra: formatPrice(diferenciaPorPersona, language) })}
            </p>
          )}
          <p style={{ fontSize: 10, color: '#94a3b8', margin: '6px 0 0', paddingTop: 6, borderTop: '1px solid rgba(0,83,51,0.08)' }}>
            {fillTemplate(b.senaNote, { monto: formatPrice(senaMonto, language), pct: String(senaPct) })}
          </p>
        </div>
      )}

      {/* CTA — "Confirmar" solo tiene sentido si hay un total real; si el
          grupo excede la capacidad, siempre se deriva a consultar. */}
      <a href={waUrl} target="_blank" rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: nights > 0 && !excedeCapacidad ? '#25D366' : G.green, color: 'white', borderRadius: 11, padding: '12px 14px', fontWeight: 700, fontSize: 12, textDecoration: 'none', width: '100%', boxSizing: 'border-box' }}>
        💬 {nights > 0 && !excedeCapacidad ? b.confirmWhatsapp : b.checkAvailability}
      </a>
    </div>
  );
};
