import React, { useEffect, useMemo, useState } from 'react';
import { X, ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, MessageCircle, Download, AlertTriangle, Search, LogIn, LogOut, CalendarClock, Plus, Copy, Link2 } from 'lucide-react';

// Dashboard interno de reservas — /admin/reservas. La API valida sesión,
// permisos por rol y CSRF en cada mutación; la UI nunca decide autorización.
//
// Tres pestañas, pensadas para dos personas distintas que usan esto:
//   Operativa — "¿quién llega hoy / esta semana?" — cards rápidas + la
//               grilla de ocupación, para asignar camas al vuelo.
//   Métricas  — plata y números de negocio, para quien se sienta a analizar.
//   Historial — buscar cualquier reserva pasada, cualquier estado.
//
// Un mismo modal (ModalReserva) sirve para crear reservas manuales (falla de
// ManyChat, reserva cerrada por teléfono, otro canal como Airbnb) y para
// editar/cancelar las que ya existen. Cancelar NUNCA borra — pone
// estado='cancelada', así queda registrada en el Historial.
//
// Aislamiento de CSS: todo vive bajo la clase .admin-panel-scope. El sitio
// público define reglas globales (`* { font-family: 'Jost' }`,
// `h1,h2,h3,h4 { font-family: 'Gilda Display' }` en index.css) que de otra
// forma se colarían acá — el <style> de abajo las neutraliza con selectores
// más específicos, sin tocar el CSS global del sitio.

type TipoAlojamiento = 'domo' | 'refugio';
type VistaActiva = 'operativa' | 'ocupacion' | 'metricas' | 'historial' | 'consultas' | 'usuarios' | 'actividad';
type EstadoReserva = 'pendiente_pago' | 'confirmada' | 'cancelada' | 'vencida' | 'rechazada';

type Alojamiento = {
  id: number;
  nombre: string;
  tipo: TipoAlojamiento;
  capacidad_total: number;
};

type Reserva = {
  id: number;
  version: number;
  cliente_nombre: string;
  cliente_telefono: string | null;
  cliente_email: string | null;
  alojamiento_id: number;
  alojamiento_nombre: string;
  alojamiento_tipo: TipoAlojamiento;
  fecha_checkin: string;
  fecha_checkout: string;
  cantidad_personas: number;
  monto_total: number;
  monto_sena: number | null;
  estado: EstadoReserva;
  unidad_asignada: string | null;
  canal_origen: string | null;
  manychat_user_id: string | null;
  created_at: string;
  excepcion_capacidad?: {
    id: number;
    capacidad_autorizada: number;
    motivo: string;
    plan_camas: string;
    fecha_desde: string | null;
    fecha_hasta: string | null;
    estado: 'solicitada' | 'aprobada' | 'rechazada' | 'revocada';
    solicitada_por: string;
    decidida_por: string | null;
    solicitada_at: string;
    decidida_at: string | null;
  } | null;
};

type ReservaAdminV1 = {
  id: number; version: number; titular: string;
  clienteTelefono: string | null; clienteEmail: string | null;
  fechaCheckin: string; fechaCheckout: string; cantidadPersonas: number;
  estado: string; estadoFlujo: string; canalOrigen: string | null;
  alojamientoId: number; alojamientoTipo: string;
  espacioCodigo: string | null; espacioNombre: string | null; modalidad: string;
  montoTotalCentavos: number; montoSenaCentavos: number | null;
  unidadAsignada: string | null; manychatUserId: string | null; createdAt: string;
  excepciones?: Array<Record<string, any>>;
};

type MetaPaginaReservas = { pagina: number; limite: number; total: number; total_paginas: number };

const reservaDesdeV1 = (item: ReservaAdminV1): Reserva => {
  const excepcion = item.excepciones?.[0];
  return {
    id: item.id,
    version: item.version,
    cliente_nombre: item.titular,
    cliente_telefono: item.clienteTelefono,
    cliente_email: item.clienteEmail,
    alojamiento_id: item.alojamientoId,
    alojamiento_nombre: item.espacioNombre || (item.alojamientoId === 1 ? 'Domo 1' : item.alojamientoId === 2 ? 'Domo 2' : 'Refugio'),
    alojamiento_tipo: item.alojamientoTipo as TipoAlojamiento,
    fecha_checkin: item.fechaCheckin,
    fecha_checkout: item.fechaCheckout,
    cantidad_personas: item.cantidadPersonas,
    monto_total: item.montoTotalCentavos / 100,
    monto_sena: item.montoSenaCentavos == null ? null : item.montoSenaCentavos / 100,
    estado: item.estadoFlujo as EstadoReserva,
    unidad_asignada: item.unidadAsignada,
    canal_origen: item.canalOrigen,
    manychat_user_id: item.manychatUserId,
    created_at: item.createdAt,
    excepcion_capacidad: excepcion ? {
      id: Number(excepcion.id), capacidad_autorizada: Number(excepcion.capacidad_autorizada),
      motivo: String(excepcion.motivo), plan_camas: String(excepcion.plan_camas),
      fecha_desde: excepcion.fecha_desde ?? null, fecha_hasta: excepcion.fecha_hasta ?? null,
      estado: excepcion.estado, solicitada_por: String(excepcion.solicitada_por),
      decidida_por: excepcion.decidida_por ?? null, solicitada_at: String(excepcion.solicitada_at),
      decidida_at: excepcion.decidida_at ?? null,
    } : null,
  };
};

async function paginaReservasV1(params: URLSearchParams): Promise<{ reservas: Reserva[]; meta: MetaPaginaReservas }> {
  const res = await adminFetch(`/api/v1/admin/reservas?${params.toString()}`);
  if (res.status === 401) throw new Error('__unauthorized__');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body: any = await res.json();
  return { reservas: (body.data || []).map(reservaDesdeV1), meta: body.meta };
}

async function todasLasReservasV1(params: URLSearchParams): Promise<Reserva[]> {
  const primera = await paginaReservasV1(params);
  const paginas = [primera.reservas];
  for (let pagina = 2; pagina <= primera.meta.total_paginas; pagina++) {
    const siguientes = new URLSearchParams(params);
    siguientes.set('pagina', String(pagina));
    paginas.push((await paginaReservasV1(siguientes)).reservas);
  }
  return paginas.flat();
}

type Consulta = {
  id: number;
  cliente_nombre: string;
  cliente_telefono: string | null;
  alojamiento_interes: string | null;
  fecha_desde: string | null;
  fecha_hasta: string | null;
  cantidad_personas: number | null;
  monto_estimado: number | null;
  subscriber_id: string | null;
  fecha_consulta: string;
};

type Rol = 'super_admin' | 'editor' | 'viewer';

type Usuario = {
  id: number;
  email: string;
  rol: Rol;
  activo: number;
  created_at: string;
};

type RegistroActividad = {
  id: number;
  email: string;
  accion: string;
  entidad_tipo: string | null;
  entidad_id: string | null;
  motivo: string | null;
  metadata_json: string | null;
  created_at: string;
};

type RegistroOcupacionOperativa = {
  id: number;
  codigo: string;
  clase: 'bloqueo' | 'estadia_no_comercial';
  tipo: string;
  estado: 'activo' | 'cancelado' | 'activa' | 'cancelada';
  espacioId: number | null;
  unidadInventarioId: number | null;
  fechaDesde: string;
  fechaHasta: string;
  detalle: string;
  cantidadPersonas: number;
  creadoPor: string;
  createdAt: string;
};

type EspacioOcupacion = {
  id: number; codigo: string; nombre: string; tipo: string; parentId: number | null;
  capacidadOperativaMaxima: number; estado: string;
};

type UnidadOcupacion = {
  id: number; espacioId: number; codigo: string; nombre: string; tipo: string;
  capacidad: number; estado: string;
};

const ROL_LABEL: Record<Rol, string> = {
  super_admin: 'Súper admin',
  editor: 'Editor',
  viewer: 'Solo ver',
};

type PendienteVieja = {
  id: number;
  cliente_nombre: string;
  cliente_telefono: string | null;
  monto_sena: number | null;
  created_at: string;
  alojamiento_nombre: string;
};

type Metricas = {
  total_confirmadas: number;
  ingresos_senas: number;
  checkins_hoy: number;
  checkins_semana: number;
  checkouts_hoy: number;
  saldo_pendiente_total: number;
  total_a_facturar: number;
  pendientes_viejas: { cantidad: number; umbral_dias: number; items: PendienteVieja[] };
  conversion_manychat: { total: number; confirmadas: number; pct: number | null };
};

const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;
const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const fechaOperativaLocal = (instante: Date) => {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Cordoba', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(instante);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find(p => p.type === tipo)?.value || '';
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
};
const csrfToken = () => decodeURIComponent(
  document.cookie.split('; ').find(value => value.startsWith('pm_admin_csrf='))?.split('=').slice(1).join('=') || ''
);
const adminFetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers.set('X-CSRF-Token', csrfToken());
  return fetch(input, { ...init, headers });
};
const addDays = (iso: string, days: number) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
};
const fmtDateShort = (iso: string) => {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
};
const fmtDateLong = (iso: string) => {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
};
const diasDesde = (iso: string) => {
  const normalizado = iso.includes('T') ? iso : iso.replace(' ', 'T');
  const instante = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalizado) ? normalizado : `${normalizado}Z`;
  return Math.floor((Date.now() - Date.parse(instante)) / 86400000);
};

const VENTANA_DIAS = 14;
const CANALES_SUGERIDOS = ['ManyChat', 'WhatsApp', 'Instagram', 'Airbnb', 'Teléfono', 'Manual'];

// La reserva ocupa [checkin, checkout) — el día de checkout ya no cuenta como ocupado.
const ocupaFecha = (r: Reserva, fecha: string) => r.fecha_checkin <= fecha && fecha < r.fecha_checkout;

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2';

const waLink = (telefono: string) => `https://wa.me/${telefono.replace(/\D/g, '')}`;

const MetricCard: React.FC<{ label: string; value: string; accent?: 'brand' | 'gold' | 'red'; hint?: string; compact?: boolean; icon?: React.ReactNode }> = ({
  label, value, accent = 'brand', hint, compact, icon,
}) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${compact ? 'p-4' : 'p-5'}`}>
    <div className="flex items-center gap-1.5 mb-2">
      {icon}
      <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 truncate">{label}</p>
    </div>
    <p className={`${compact ? 'text-xl sm:text-2xl' : 'text-2xl'} font-bold tabular-nums ${accent === 'gold' ? 'text-gold' : accent === 'red' ? 'text-red-600' : 'text-brand'}`}>
      {value}
    </p>
    {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
  </div>
);

function useEscapeKey(onEscape: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onEscape(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onEscape]);
}

const ModalBase: React.FC<{ onClose: () => void; children: React.ReactNode; titulo: string; ancho?: string }> = ({ onClose, children, titulo, ancho = 'sm:max-w-md' }) => {
  useEscapeKey(onClose);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ backgroundColor: 'rgba(15,20,18,0.55)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div
        className={`bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full ${ancho} p-6 max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-800">{titulo}</h3>
          <button onClick={onClose} className={`text-gray-400 hover:text-gray-700 rounded-full p-1 -m-1 ${FOCUS_RING}`} aria-label="Cerrar">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

type FormReserva = {
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email: string;
  alojamiento_id: string;
  fecha_checkin: string;
  fecha_checkout: string;
  cantidad_personas: string;
  monto_total: string;
  monto_sena: string;
  estado: EstadoReserva;
  canal_origen: string;
  unidad_asignada: string;
};

const TIPOS_ESTADIA = [
  { value: 'huesped', label: 'Huésped' },
  { value: 'staff', label: 'Staff' },
  { value: 'voluntario', label: 'Voluntario' },
  { value: 'residente', label: 'Residente' },
];

const ESPACIO_POR_ALOJAMIENTO: Record<number, string> = {
  1: 'domo-1',
  2: 'domo-2',
  3: 'refugio',
};

const modalidadPara = (alojamiento: Alojamiento | undefined): 'privada' | 'compartida' =>
  alojamiento?.tipo === 'domo' ? 'privada' : 'compartida';

const ModalReserva: React.FC<{
  modo: 'crear' | 'editar';
  reserva: Reserva | null;
  alojamientos: Alojamiento[];
  soloLectura?: boolean;
  rol?: Rol;
  onClose: () => void;
  onGuardado: () => void;
}> = ({ modo, reserva, alojamientos, soloLectura, rol, onClose, onGuardado }) => {
  const [form, setForm] = useState<FormReserva>(() => ({
    cliente_nombre: reserva?.cliente_nombre || '',
    cliente_telefono: reserva?.cliente_telefono || '',
    cliente_email: reserva?.cliente_email || '',
    alojamiento_id: reserva ? String(reserva.alojamiento_id) : (alojamientos[0] ? String(alojamientos[0].id) : ''),
    fecha_checkin: reserva ? reserva.fecha_checkin.slice(0, 10) : '',
    fecha_checkout: reserva ? reserva.fecha_checkout.slice(0, 10) : '',
    cantidad_personas: reserva ? String(reserva.cantidad_personas) : '2',
    monto_total: reserva ? String(reserva.monto_total) : '',
    monto_sena: reserva?.monto_sena != null ? String(reserva.monto_sena) : '',
    estado: reserva?.estado || 'confirmada',
    canal_origen: reserva?.canal_origen || 'Manual',
    unidad_asignada: reserva?.unidad_asignada || '',
  }));
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState('');
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [confirmandoReserva, setConfirmandoReserva] = useState(false);
  const [motivoConfirmacion, setMotivoConfirmacion] = useState('');
  const [excepcion, setExcepcion] = useState(reserva?.excepcion_capacidad || null);
  const [capacidadExcepcional, setCapacidadExcepcional] = useState('8');
  const [motivoExcepcion, setMotivoExcepcion] = useState('');
  const [planCamas, setPlanCamas] = useState('');
  const [gestionandoCapacidad, setGestionandoCapacidad] = useState(false);

  const setCampo = (campo: keyof FormReserva, valor: string) => setForm(f => ({ ...f, [campo]: valor }));

  const validar = (): string | null => {
    if (!form.cliente_nombre.trim()) return 'Falta el nombre del huésped.';
    if (modo === 'editar') return null;
    if (!form.alojamiento_id) return 'Elegí un alojamiento.';
    if (!form.fecha_checkin || !form.fecha_checkout) return 'Faltan las fechas.';
    if (form.fecha_checkout <= form.fecha_checkin) return 'El check-out debe ser posterior al check-in.';
    if (!form.cantidad_personas || Number(form.cantidad_personas) < 1) return 'Cantidad de personas inválida.';
    if (form.monto_total === '' || Number(form.monto_total) < 0) return 'Falta el monto total.';
    return null;
  };

  const guardar = async () => {
    const problema = validar();
    if (problema) { setError(problema); return; }

    setGuardando(true);
    setError('');
    try {
      if (modo === 'crear') {
        const alojamiento = alojamientos.find(item => item.id === Number(form.alojamiento_id));
        const espacioCodigo = ESPACIO_POR_ALOJAMIENTO[Number(form.alojamiento_id)];
        if (!alojamiento || !espacioCodigo) throw new Error('El alojamiento no tiene un espacio operativo configurado.');
        const res = await adminFetch('/api/v1/admin/reservas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cliente_nombre: form.cliente_nombre.trim(),
            cliente_telefono: form.cliente_telefono.trim() || null,
            cliente_email: form.cliente_email.trim() || null,
            espacio_codigo: espacioCodigo,
            modalidad: modalidadPara(alojamiento),
            fecha_checkin: form.fecha_checkin,
            fecha_checkout: form.fecha_checkout,
            cantidad_personas: Number(form.cantidad_personas),
            monto_total_centavos: Math.round(Number(form.monto_total) * 100),
            monto_sena_centavos: form.monto_sena !== '' ? Math.round(Number(form.monto_sena) * 100) : null,
            canal_origen: form.canal_origen.trim() || 'Manual',
          }),
        });
        const data: any = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo crear.');
      } else if (reserva) {
        const res = await adminFetch(`/api/v1/admin/reservas/${reserva.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expected_version: reserva.version,
            cambios: {
              cliente_nombre: form.cliente_nombre.trim(),
              cliente_telefono: form.cliente_telefono.trim() || null,
              cliente_email: form.cliente_email.trim() || null,
              canal_origen: form.canal_origen.trim() || 'Admin',
            },
          }),
        });
        const data: any = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo guardar.');
      }
      setGuardado(true);
      onGuardado();
      setTimeout(onClose, 700);
    } catch (e: any) {
      setError(e.message || 'Ocurrió un error.');
    } finally {
      setGuardando(false);
    }
  };

  const cancelarReserva = async () => {
    if (!reserva) return;
    if (motivoCancelacion.trim().length < 5) {
      setError('Indicá un motivo de al menos 5 caracteres para cancelar.');
      return;
    }
    setCancelando(true);
    setError('');
    try {
      const res = await adminFetch(`/api/v1/admin/reservas/${reserva.id}/estado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expected_version: reserva.version,
          accion: 'cancelar',
          motivo: motivoCancelacion.trim(),
        }),
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cancelar.');
      onGuardado();
      onClose();
    } catch (e: any) {
      setCancelando(false);
      setError(e.message || 'No se pudo cancelar. Probá de nuevo.');
    }
  };

  const confirmarReserva = async () => {
    if (!reserva) return;
    if (motivoConfirmacion.trim().length < 5) {
      setError('Indicá un motivo de al menos 5 caracteres para confirmar.');
      return;
    }
    setConfirmandoReserva(true);
    setError('');
    try {
      const res = await adminFetch(`/api/v1/admin/reservas/${reserva.id}/estado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expected_version: reserva.version,
          accion: 'confirmar',
          motivo: motivoConfirmacion.trim(),
        }),
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo confirmar.');
      onGuardado();
      onClose();
    } catch (e: any) {
      setConfirmandoReserva(false);
      setError(e.message || 'No se pudo confirmar. Probá de nuevo.');
    }
  };

  const gestionarCapacidad = async (accion: 'solicitar' | 'aprobar' | 'rechazar' | 'revocar') => {
    if (!reserva) return;
    setGestionandoCapacidad(true);
    setError('');
    try {
      const body = accion === 'solicitar'
        ? {
            accion,
            reserva_id: reserva.id,
            capacidad_autorizada: Number(capacidadExcepcional),
            motivo: motivoExcepcion.trim(),
            plan_camas: planCamas.trim(),
          }
        : { accion, excepcion_id: excepcion?.id };
      const res = await adminFetch('/api/admin/excepciones-capacidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo gestionar la capacidad.');
      setExcepcion(data.excepcion);
      onGuardado();
    } catch (e: any) {
      setError(e.message || 'No se pudo gestionar la capacidad.');
    } finally {
      setGestionandoCapacidad(false);
    }
  };

  const inputCls = `w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 ${FOCUS_RING}`;
  const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1';

  return (
    <ModalBase titulo={modo === 'crear' ? 'Nueva reserva' : 'Editar reserva'} onClose={onClose} ancho="sm:max-w-lg">
      {modo === 'crear' && (
        <p className="text-xs text-gray-500 mb-4 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          Para cargar reservas comerciales confirmadas que se cerraron por teléfono u otro canal. Las estadías de staff, voluntariado o residentes se registran en Ocupación.
        </p>
      )}

      {modo === 'editar' && (
        <p className="text-xs text-gray-500 mb-4 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          Acá podés corregir datos del huésped y el canal. Las fechas, importes y asignaciones se conservan para no alterar inventario ni trazabilidad.
        </p>
      )}

      {soloLectura && (
        <p className="text-xs text-gray-500 mb-4 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          Modo solo lectura — tu usuario no tiene permiso para crear, editar ni cancelar reservas.
        </p>
      )}

      <fieldset disabled={soloLectura} className="space-y-3 mb-4 border-0 p-0 m-0 min-w-0">
        <div>
          <label className={labelCls} htmlFor="f_nombre">Nombre del huésped *</label>
          <input id="f_nombre" autoFocus className={inputCls} value={form.cliente_nombre} onChange={e => setCampo('cliente_nombre', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="f_tel">Teléfono</label>
            <input id="f_tel" className={inputCls} value={form.cliente_telefono} onChange={e => setCampo('cliente_telefono', e.target.value)} placeholder="+54 9 ..." />
          </div>
          <div>
            <label className={labelCls} htmlFor="f_email">Email</label>
            <input id="f_email" type="email" className={inputCls} value={form.cliente_email} onChange={e => setCampo('cliente_email', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="f_aloj">Alojamiento *</label>
            <select id="f_aloj" disabled={modo === 'editar'} className={`${inputCls} disabled:bg-gray-100 disabled:text-gray-500`} value={form.alojamiento_id} onChange={e => setCampo('alojamiento_id', e.target.value)}>
              {alojamientos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="f_estado">Estado *</label>
            <select id="f_estado" disabled className={`${inputCls} disabled:bg-gray-100 disabled:text-gray-500`} value={form.estado} onChange={e => setCampo('estado', e.target.value)}>
              <option value="confirmada">Confirmada</option>
              <option value="pendiente_pago">Pendiente de pago</option>
              <option value="cancelada">Cancelada</option>
              <option value="vencida">Vencida</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="f_in">Check-in *</label>
            <input id="f_in" type="date" disabled={modo === 'editar'} className={`${inputCls} tabular-nums disabled:bg-gray-100 disabled:text-gray-500`} value={form.fecha_checkin} onChange={e => setCampo('fecha_checkin', e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="f_out">Check-out *</label>
            <input id="f_out" type="date" disabled={modo === 'editar'} className={`${inputCls} tabular-nums disabled:bg-gray-100 disabled:text-gray-500`} value={form.fecha_checkout} onChange={e => setCampo('fecha_checkout', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="f_personas">Personas *</label>
            <input id="f_personas" type="number" inputMode="numeric" min={1} disabled={modo === 'editar'} className={`${inputCls} disabled:bg-gray-100 disabled:text-gray-500`} value={form.cantidad_personas} onChange={e => setCampo('cantidad_personas', e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="f_canal">Canal</label>
            <input id="f_canal" list="canales-sugeridos" className={inputCls} value={form.canal_origen} onChange={e => setCampo('canal_origen', e.target.value)} />
            <datalist id="canales-sugeridos">
              {CANALES_SUGERIDOS.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="f_total">Monto total *</label>
            <input id="f_total" type="number" inputMode="decimal" min={0} disabled={modo === 'editar'} className={`${inputCls} tabular-nums disabled:bg-gray-100 disabled:text-gray-400`} value={form.monto_total} onChange={e => setCampo('monto_total', e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="f_sena">Seña</label>
            <input id="f_sena" type="number" inputMode="decimal" min={0} disabled={modo === 'editar'} className={`${inputCls} tabular-nums disabled:bg-gray-100 disabled:text-gray-400`} value={form.monto_sena} onChange={e => setCampo('monto_sena', e.target.value)} />
          </div>
        </div>

        {modo === 'editar' && (
          <div>
            <label className={labelCls} htmlFor="f_unidad">Cama / unidad asignada</label>
            <input id="f_unidad" disabled className={`${inputCls} disabled:bg-gray-100 disabled:text-gray-500`} value={form.unidad_asignada} onChange={e => setCampo('unidad_asignada', e.target.value)} placeholder="Se gestiona desde la asignación de inventario" />
          </div>
        )}

        {modo === 'editar' && reserva?.cliente_telefono && (
          <a href={waLink(reserva.cliente_telefono)} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-xs text-brand hover:underline rounded ${FOCUS_RING}`}>
            <MessageCircle size={13} aria-hidden="true" /> Escribirle por WhatsApp
          </a>
        )}
      </fieldset>

      {modo === 'editar' && reserva?.alojamiento_tipo === 'domo' && (
        <section className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3" aria-label="Capacidad excepcional">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">Capacidad excepcional</p>
          {excepcion ? (
            <div className="mt-2 space-y-1 text-xs text-amber-900">
              <p><strong>{excepcion.capacidad_autorizada} personas</strong> · {excepcion.estado}</p>
              <p>Motivo: {excepcion.motivo}</p>
              <p>Plan de camas: {excepcion.plan_camas}</p>
              <p className="text-amber-700">Solicitada por {excepcion.solicitada_por}</p>
              {rol === 'super_admin' && excepcion.estado === 'solicitada' && (
                <div className="flex gap-2 pt-2">
                  <button disabled={gestionandoCapacidad} onClick={() => gestionarCapacidad('aprobar')} className={`text-xs font-semibold rounded-lg bg-brand px-3 py-2 text-white disabled:opacity-60 ${FOCUS_RING}`}>Aprobar</button>
                  <button disabled={gestionandoCapacidad} onClick={() => gestionarCapacidad('rechazar')} className={`text-xs font-semibold rounded-lg border border-red-300 px-3 py-2 text-red-700 disabled:opacity-60 ${FOCUS_RING}`}>Rechazar</button>
                </div>
              )}
              {rol === 'super_admin' && excepcion.estado === 'aprobada' && (
                <button disabled={gestionandoCapacidad} onClick={() => gestionarCapacidad('revocar')} className={`mt-2 text-xs font-semibold text-red-700 hover:underline disabled:opacity-60 ${FOCUS_RING}`}>Revocar excepción</button>
              )}
              {!soloLectura && (excepcion.estado === 'rechazada' || excepcion.estado === 'revocada') && (
                <div className="mt-3 grid gap-2 border-t border-amber-200 pt-3">
                  <p className="text-xs font-semibold text-amber-800">Nueva solicitud</p>
                  <div className="grid grid-cols-[7rem_1fr] gap-2">
                    <input aria-label="Nueva capacidad solicitada" type="number" min={8} max={10} className={inputCls} value={capacidadExcepcional} onChange={e => setCapacidadExcepcional(e.target.value)} />
                    <input aria-label="Nuevo motivo de la excepción" className={inputCls} placeholder="Motivo obligatorio" value={motivoExcepcion} onChange={e => setMotivoExcepcion(e.target.value)} />
                  </div>
                  <textarea aria-label="Nuevo plan de camas" className={inputCls} rows={2} placeholder="Plan de camas obligatorio" value={planCamas} onChange={e => setPlanCamas(e.target.value)} />
                  <button disabled={gestionandoCapacidad} onClick={() => gestionarCapacidad('solicitar')} className={`justify-self-start text-xs font-semibold rounded-lg bg-amber-700 px-3 py-2 text-white disabled:opacity-60 ${FOCUS_RING}`}>Solicitar nueva excepción</button>
                </div>
              )}
            </div>
          ) : !soloLectura ? (
            <div className="mt-2 grid gap-2">
              <div className="grid grid-cols-[7rem_1fr] gap-2">
                <input aria-label="Capacidad solicitada" type="number" min={8} max={10} className={inputCls} value={capacidadExcepcional} onChange={e => setCapacidadExcepcional(e.target.value)} />
                <input aria-label="Motivo de la excepción" className={inputCls} placeholder="Motivo obligatorio" value={motivoExcepcion} onChange={e => setMotivoExcepcion(e.target.value)} />
              </div>
              <textarea aria-label="Plan de camas" className={inputCls} rows={2} placeholder="Plan de camas obligatorio" value={planCamas} onChange={e => setPlanCamas(e.target.value)} />
              <button disabled={gestionandoCapacidad} onClick={() => gestionarCapacidad('solicitar')} className={`justify-self-start text-xs font-semibold rounded-lg bg-amber-700 px-3 py-2 text-white disabled:opacity-60 ${FOCUS_RING}`}>Solicitar excepción</button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-amber-700">No hay una excepción registrada.</p>
          )}
        </section>
      )}

      {error && <p className="text-xs text-red-600 mb-3" role="alert">{error}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className={`text-sm font-semibold px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 ${FOCUS_RING}`}>
          Cerrar
        </button>
        {!soloLectura && (
          <button
            onClick={guardar}
            disabled={guardando || guardado}
            className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-lg text-white bg-brand disabled:opacity-60 ${FOCUS_RING}`}
          >
            {guardando && 'Guardando…'}
            {guardado && (<><CheckCircle2 size={16} aria-hidden="true" /> Guardado</>)}
            {!guardando && !guardado && 'Guardar'}
          </button>
        )}
      </div>

      {!soloLectura && modo === 'editar' && reserva?.estado === 'pendiente_pago' && (
        <div className="mt-5 pt-4 border-t border-gray-100 grid gap-2 rounded-lg bg-emerald-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-emerald-800">Confirmar reserva pendiente</p>
          <label className="text-xs text-emerald-800" htmlFor="f_motivo_confirmacion">Motivo de confirmación *</label>
          <textarea
            id="f_motivo_confirmacion"
            rows={2}
            maxLength={500}
            value={motivoConfirmacion}
            onChange={e => setMotivoConfirmacion(e.target.value)}
            placeholder="Ej. Pago verificado manualmente"
            className={`${inputCls} border-emerald-200`}
          />
          <button
            type="button"
            onClick={confirmarReserva}
            disabled={confirmandoReserva}
            className={`justify-self-end text-xs font-semibold text-white bg-emerald-700 rounded-lg px-3 py-2 disabled:opacity-60 ${FOCUS_RING}`}
          >
            {confirmandoReserva ? 'Confirmando…' : 'Confirmar reserva'}
          </button>
        </div>
      )}

      {!soloLectura && modo === 'editar' && reserva && reserva.estado !== 'cancelada' && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          {!confirmandoCancelar ? (
            <button onClick={() => setConfirmandoCancelar(true)} className={`text-xs font-semibold text-red-600 hover:underline rounded ${FOCUS_RING}`}>
              Cancelar esta reserva
            </button>
          ) : (
            <div className="grid gap-2 bg-red-50 rounded-lg px-3 py-2.5">
              <p className="text-xs text-red-700">¿Seguro? No se borra — queda registrada como "cancelada".</p>
              <label className="text-xs font-semibold text-red-700" htmlFor="f_motivo_cancelacion">Motivo de cancelación *</label>
              <textarea
                id="f_motivo_cancelacion"
                rows={2}
                maxLength={500}
                value={motivoCancelacion}
                onChange={e => setMotivoCancelacion(e.target.value)}
                placeholder="Ej. Solicitud expresa del huésped"
                className={`${inputCls} border-red-200`}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmandoCancelar(false)} className={`text-xs font-semibold text-gray-500 hover:text-gray-700 rounded ${FOCUS_RING}`}>
                  No
                </button>
                <button
                  onClick={cancelarReserva}
                  disabled={cancelando}
                  className={`text-xs font-semibold text-white bg-red-600 rounded-lg px-2.5 py-1.5 disabled:opacity-60 ${FOCUS_RING}`}
                >
                  {cancelando ? 'Cancelando…' : 'Sí, cancelar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </ModalBase>
  );
};

const ModalSeleccionarReserva: React.FC<{
  alojamiento: Alojamiento;
  fecha: string;
  reservas: Reserva[];
  onClose: () => void;
  onSeleccionar: (r: Reserva) => void;
}> = ({ alojamiento, fecha, reservas, onClose, onSeleccionar }) => (
  <ModalBase titulo={`${alojamiento.nombre} · ${fmtDateLong(fecha)}`} onClose={onClose}>
    <ul className="space-y-2">
      {reservas.map(r => (
        <li key={r.id}>
          <button
            onClick={() => onSeleccionar(r)}
            className={`w-full text-left text-sm border border-gray-200 rounded-lg px-3 py-2.5 hover:border-brand hover:bg-brand/5 transition-colors ${FOCUS_RING}`}
          >
            <p className="font-semibold text-gray-800">{r.cliente_nombre}</p>
            <p className="text-xs text-gray-500">
              {r.cantidad_personas} persona(s) · {r.unidad_asignada ? `Asignado: ${r.unidad_asignada}` : 'Sin asignar'}
            </p>
          </button>
        </li>
      ))}
    </ul>
  </ModalBase>
);

const PendientesViejasAlerta: React.FC<{ data: Metricas['pendientes_viejas']; onClickReserva: (id: number) => void }> = ({ data, onClickReserva }) => {
  if (data.cantidad === 0) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-6">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800 mb-2">
            {data.cantidad} reserva{data.cantidad !== 1 ? 's' : ''} pendiente{data.cantidad !== 1 ? 's' : ''} hace más de {data.umbral_dias} días sin confirmar pago
          </p>
          <ul className="space-y-1.5">
            {data.items.map(p => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-xs bg-white/60 rounded-lg px-3 py-2">
                <button onClick={() => onClickReserva(p.id)} className={`text-left font-medium text-gray-700 hover:text-brand truncate rounded ${FOCUS_RING}`}>
                  {p.cliente_nombre} · {p.alojamiento_nombre} · hace {diasDesde(p.created_at)} días
                </button>
                {p.cliente_telefono && (
                  <a
                    href={waLink(p.cliente_telefono)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 text-brand font-semibold flex-shrink-0 hover:underline rounded ${FOCUS_RING}`}
                  >
                    <MessageCircle size={12} aria-hidden="true" /> Escribir
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const ESTADO_BADGE: Record<string, string> = {
  confirmada: 'bg-green-100 text-green-800',
  pendiente_pago: 'bg-amber-100 text-amber-800',
  cancelada: 'bg-gray-100 text-gray-500',
  vencida: 'bg-gray-100 text-gray-500',
  rechazada: 'bg-red-100 text-red-700',
};

const ESTADO_LABEL: Record<string, string> = {
  confirmada: 'Confirmada', pendiente_pago: 'Pendiente de pago', cancelada: 'Cancelada',
  vencida: 'Vencida', rechazada: 'Rechazada',
};

const EstadoBadge: React.FC<{ estado: string }> = ({ estado }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${ESTADO_BADGE[estado] || 'bg-gray-100 text-gray-600'}`}>
    {ESTADO_LABEL[estado] || estado}
  </span>
);

const TablaHistorial: React.FC<{ reservas: Reserva[]; onSeleccionar: (r: Reserva) => void }> = ({ reservas, onSeleccionar }) => (
  <>
    {/* Tabla — pantallas sm y más grandes */}
    <div className="hidden sm:block overflow-x-auto">
      <table className="text-sm border-collapse w-full">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50">
            <th scope="col" className="border-b border-gray-200 px-3 py-2.5">Huésped</th>
            <th scope="col" className="border-b border-gray-200 px-3 py-2.5">Alojamiento</th>
            <th scope="col" className="border-b border-gray-200 px-3 py-2.5 tabular-nums">Fechas</th>
            <th scope="col" className="border-b border-gray-200 px-3 py-2.5">Estado</th>
            <th scope="col" className="border-b border-gray-200 px-3 py-2.5">Canal</th>
            <th scope="col" className="border-b border-gray-200 px-3 py-2.5 text-right tabular-nums">Total</th>
            <th scope="col" className="border-b border-gray-200 px-3 py-2.5">Unidad</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map(r => (
            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2.5">
                <button onClick={() => onSeleccionar(r)} className={`font-semibold text-gray-800 hover:text-brand text-left rounded ${FOCUS_RING}`}>
                  {r.cliente_nombre}
                </button>
                {r.cliente_telefono && <p className="text-xs text-gray-400">{r.cliente_telefono}</p>}
              </td>
              <td className="px-3 py-2.5 text-gray-600">{r.alojamiento_nombre}</td>
              <td className="px-3 py-2.5 text-gray-600 tabular-nums whitespace-nowrap">{fmtDateShort(r.fecha_checkin)}–{fmtDateShort(r.fecha_checkout)}</td>
              <td className="px-3 py-2.5"><EstadoBadge estado={r.estado} /></td>
              <td className="px-3 py-2.5 text-gray-500">{r.canal_origen || '—'}</td>
              <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums">{fmtMoney(r.monto_total)}</td>
              <td className="px-3 py-2.5 text-gray-500">{r.unidad_asignada || '—'}</td>
            </tr>
          ))}
          {reservas.length === 0 && (
            <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-400">Sin resultados para esa búsqueda.</td></tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Lista de tarjetas — mobile */}
    <div className="sm:hidden divide-y divide-gray-100">
      {reservas.map(r => (
        <button
          key={r.id}
          onClick={() => onSeleccionar(r)}
          className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 ${FOCUS_RING}`}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-semibold text-gray-800 text-sm truncate">{r.cliente_nombre}</p>
            <EstadoBadge estado={r.estado} />
          </div>
          <p className="text-xs text-gray-500 tabular-nums mb-0.5">
            {r.alojamiento_nombre} · {fmtDateShort(r.fecha_checkin)}–{fmtDateShort(r.fecha_checkout)}
          </p>
          <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
            <span>{r.canal_origen || 'Sin canal'}{r.unidad_asignada ? ` · ${r.unidad_asignada}` : ''}</span>
            <span className="font-semibold text-gray-600 tabular-nums">{fmtMoney(r.monto_total)}</span>
          </div>
        </button>
      ))}
      {reservas.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-gray-400">Sin resultados para esa búsqueda.</p>
      )}
    </div>
  </>
);

const TablaConsultas: React.FC<{ consultas: Consulta[] }> = ({ consultas }) => (
  <>
    {/* Tabla — pantallas sm y más grandes */}
    <div className="hidden sm:block overflow-x-auto">
      <table className="text-sm border-collapse w-full">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50">
            <th scope="col" className="border-b border-gray-200 px-3 py-2.5">Consulta</th>
            <th scope="col" className="border-b border-gray-200 px-3 py-2.5">Interés</th>
            <th scope="col" className="border-b border-gray-200 px-3 py-2.5 tabular-nums">Fechas</th>
            <th scope="col" className="border-b border-gray-200 px-3 py-2.5 text-right tabular-nums">Monto cotizado</th>
            <th scope="col" className="border-b border-gray-200 px-3 py-2.5 tabular-nums">Última interacción</th>
          </tr>
        </thead>
        <tbody>
          {consultas.map(c => (
            <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2.5">
                <p className="font-semibold text-gray-800">{c.cliente_nombre}</p>
                <div className="flex items-center gap-2">
                  {c.cliente_telefono && <p className="text-xs text-gray-400">{c.cliente_telefono}</p>}
                  {c.cliente_telefono && (
                    <a
                      href={waLink(c.cliente_telefono)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 text-xs text-brand font-semibold hover:underline rounded ${FOCUS_RING}`}
                    >
                      <MessageCircle size={11} aria-hidden="true" /> Escribir
                    </a>
                  )}
                </div>
              </td>
              <td className="px-3 py-2.5 text-gray-600">
                {c.alojamiento_interes || '—'}{c.cantidad_personas ? ` · ${c.cantidad_personas}p` : ''}
              </td>
              <td className="px-3 py-2.5 text-gray-600 tabular-nums whitespace-nowrap">
                {c.fecha_desde ? fmtDateShort(c.fecha_desde) : '—'}{c.fecha_hasta ? `–${fmtDateShort(c.fecha_hasta)}` : ''}
              </td>
              <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums">
                {c.monto_estimado != null ? fmtMoney(c.monto_estimado) : '—'}
              </td>
              <td className="px-3 py-2.5 text-gray-500 tabular-nums whitespace-nowrap">{fmtDateShort(c.fecha_consulta)}</td>
            </tr>
          ))}
          {consultas.length === 0 && (
            <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-400">No hay consultas sin convertir.</td></tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Lista de tarjetas — mobile */}
    <div className="sm:hidden divide-y divide-gray-100">
      {consultas.map(c => (
        <div key={c.id} className="px-4 py-3.5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-semibold text-gray-800 text-sm truncate">{c.cliente_nombre}</p>
            {c.monto_estimado != null && <span className="font-semibold text-gray-600 text-xs tabular-nums">{fmtMoney(c.monto_estimado)}</span>}
          </div>
          <p className="text-xs text-gray-500 tabular-nums mb-0.5">
            {c.alojamiento_interes || 'Sin especificar'}
            {c.fecha_desde ? ` · ${fmtDateShort(c.fecha_desde)}${c.fecha_hasta ? `–${fmtDateShort(c.fecha_hasta)}` : ''}` : ''}
          </p>
          <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
            <span>Consultó el {fmtDateShort(c.fecha_consulta)}</span>
            {c.cliente_telefono && (
              <a
                href={waLink(c.cliente_telefono)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-brand font-semibold hover:underline rounded ${FOCUS_RING}`}
              >
                <MessageCircle size={11} aria-hidden="true" /> Escribir
              </a>
            )}
          </div>
        </div>
      ))}
      {consultas.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-gray-400">No hay consultas sin convertir.</p>
      )}
    </div>
  </>
);

type ResumenSync = Record<string, { nuevas: number; actualizadas: number; canceladas: number } | { error: string }>;

const SeccionAirbnb: React.FC<{ alojamientos: Alojamiento[]; onSincronizado: () => void }> = ({ alojamientos, onSincronizado }) => {
  const [copiado, setCopiado] = useState<number | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [resumen, setResumen] = useState<ResumenSync | null>(null);
  const [error, setError] = useState('');

  const copiarLink = (id: number) => {
    const link = `${window.location.origin}/api/ical?alojamiento_id=${id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiado(id);
      setTimeout(() => setCopiado(null), 1800);
    });
  };

  const sincronizar = async () => {
    setSincronizando(true);
    setError('');
    setResumen(null);
    try {
      const res = await adminFetch('/api/admin/sync-airbnb', { method: 'POST' });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo sincronizar.');
      setResumen(data.resumen);
      onSincronizado();
    } catch (e: any) {
      setError(e.message || 'Ocurrió un error.');
    } finally {
      setSincronizando(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm col-span-2 lg:col-span-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Integración con Airbnb</p>

      <div className="grid sm:grid-cols-3 gap-2 mb-4">
        {alojamientos.map(a => (
          <button
            key={a.id}
            onClick={() => copiarLink(a.id)}
            className={`flex items-center justify-between gap-2 text-xs border border-gray-200 rounded-lg px-3 py-2.5 hover:bg-gray-50 ${FOCUS_RING}`}
          >
            <span className="flex items-center gap-1.5 text-gray-600"><Link2 size={13} className="text-gray-400 flex-shrink-0" aria-hidden="true" />{a.nombre}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-brand flex-shrink-0">
              <Copy size={12} aria-hidden="true" /> {copiado === a.id ? 'Copiado' : 'Copiar link'}
            </span>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 mb-4">
        Pegá el link de cada alojamiento en Airbnb → Calendario → Sincronizar calendarios → Importar calendario. Así Airbnb bloquea tus fechas ocupadas acá.
      </p>

      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={sincronizar}
          disabled={sincronizando}
          className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-lg text-white bg-brand disabled:opacity-60 ${FOCUS_RING}`}
        >
          <RefreshCw size={15} className={sincronizando ? 'animate-spin' : ''} aria-hidden="true" />
          {sincronizando ? 'Sincronizando…' : 'Sincronizar con Airbnb'}
        </button>
        <p className="text-[11px] text-gray-400 mt-2">
          Trae las reservas del calendario de Airbnb hacia acá. Hay que configurar la URL del .ics de Airbnb de cada alojamiento primero (variables de entorno AIRBNB_ICS_URL_1/2/3) — sin eso, no hay nada para sincronizar.
        </p>

        {error && <p className="text-xs text-red-600 mt-3" role="alert">{error}</p>}

        {resumen && (
          <ul className="mt-3 space-y-1">
            {Object.entries(resumen).map(([nombre, r]) => (
              <li key={nombre} className="text-xs text-gray-600">
                <span className="font-semibold">{nombre}:</span>{' '}
                {'error' in r ? <span className="text-red-600">{r.error}</span> : `${r.nuevas} nueva(s), ${r.actualizadas} actualizada(s), ${r.canceladas} cancelada(s)`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const INSTALAR_DESCARTADO_KEY = 'pm_reservas_instalar_descartado';

// Cartel de instalación propio de este dashboard (no el del sitio público:
// éste usa manifest-reservas.json, con su propio ícono/nombre — ver
// scripts/prerender.mjs). Chrome/Edge/Android disparan 'beforeinstallprompt'
// y ofrecemos el prompt nativo con un botón. Safari/iOS nunca dispara ese
// evento, así que le mostramos el paso a paso manual en su lugar.
const InstalarBanner: React.FC = () => {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [descartado, setDescartado] = useState(() => {
    try { return localStorage.getItem(INSTALAR_DESCARTADO_KEY) === '1'; } catch { return false; }
  });
  const [instalando, setInstalando] = useState(false);

  const esIOS = useMemo(() => /iphone|ipad|ipod/i.test(navigator.userAgent), []);
  const yaInstalada = useMemo(
    () => window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true,
    []
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const descartar = () => {
    setDescartado(true);
    try { localStorage.setItem(INSTALAR_DESCARTADO_KEY, '1'); } catch { /* localStorage puede estar bloqueado — no es crítico */ }
  };

  if (yaInstalada || descartado || !(promptEvent || esIOS)) return null;

  return (
    <div className="bg-brand text-white px-4 sm:px-6 py-3" role="region" aria-label="Instalar app de Reservas">
      <div className="max-w-6xl mx-auto flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <Download size={18} className="flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug">Instalá "Reservas" en tu celular</p>
            {esIOS && !promptEvent ? (
              <p className="text-xs text-white/80 leading-snug mt-0.5">
                Tocá Compartir (el ícono □↑ abajo en Safari) y elegí "Agregar a inicio". Vas a tener un acceso directo, separado del sitio público.
              </p>
            ) : (
              <p className="text-xs text-white/80 leading-snug mt-0.5">
                Acceso rápido desde tu pantalla de inicio, separado del sitio público.
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {promptEvent && (
            <button
              disabled={instalando}
              onClick={async () => {
                setInstalando(true);
                try {
                  promptEvent.prompt();
                  await promptEvent.userChoice;
                } finally {
                  setPromptEvent(null);
                  setInstalando(false);
                }
              }}
              className={`text-xs font-semibold rounded-lg px-3 py-2 bg-white text-brand hover:opacity-90 transition-opacity ${FOCUS_RING}`}
            >
              {instalando ? 'Instalando…' : 'Instalar'}
            </button>
          )}
          <button
            onClick={descartar}
            aria-label="Cerrar"
            className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${FOCUS_RING}`}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- LOGIN Y GESTIÓN DE USUARIOS DEL PANEL ---
// Reemplaza el One-Time PIN de Cloudflare Access: login propio (usuario +
// contraseña) contra D1, sesión de 30 días por cookie HttpOnly. Ver
// functions/api/admin/login.ts y functions/_lib/authGuard.ts.

const INPUT_CLS = 'w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2';
const LABEL_CLS = 'block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1';

const PanelLogin: React.FC<{ onLogin: (email: string, rol: Rol) => void; avisoInicial?: string }> = ({ onLogin, avisoInicial }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(avisoInicial || '');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo iniciar sesión.');
      onLogin(data.email, data.rol);
    } catch (e: any) {
      setError(e.message || 'Ocurrió un error.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="admin-panel-scope min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <style>{`
        .admin-panel-scope, .admin-panel-scope * {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif;
        }
      `}</style>
      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 w-full max-w-sm">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Pueblo Mágico</p>
        <h1 className="text-lg font-bold text-brand mb-6">Panel de Reservas</h1>
        <div className="space-y-3 mb-4">
          <div>
            <label className={LABEL_CLS} htmlFor="login_email">Email</label>
            <input id="login_email" type="email" autoFocus required autoComplete="username" className={INPUT_CLS} value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLS} htmlFor="login_password">Contraseña</label>
            <input id="login_password" type="password" required autoComplete="current-password" className={INPUT_CLS} value={password} onChange={e => setPassword(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-xs text-red-600 mb-4" role="alert">{error}</p>}
        <button type="submit" disabled={enviando} className={`w-full text-sm font-semibold px-4 py-2.5 rounded-lg text-white bg-brand disabled:opacity-60 ${FOCUS_RING}`}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
};

// Modal genérico para pedir una contraseña (y opcionalmente un email + rol) —
// lo usa tanto "Nuevo usuario" como "Resetear contraseña" en SeccionUsuarios.
const ModalCredencial: React.FC<{
  titulo: string;
  pedirEmail?: boolean;
  onClose: () => void;
  onGuardar: (email: string, password: string, rol: Rol) => Promise<void>;
}> = ({ titulo, pedirEmail, onClose, onGuardar }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Rol>('editor');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const guardar = async () => {
    if (pedirEmail && !email.trim()) { setError('Falta el email.'); return; }
    if (password.length < 12) { setError('La contraseña debe tener al menos 12 caracteres.'); return; }
    setGuardando(true);
    setError('');
    try {
      await onGuardar(email.trim(), password, rol);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Ocurrió un error.');
      setGuardando(false);
    }
  };

  return (
    <ModalBase titulo={titulo} onClose={onClose}>
      <div className="space-y-3 mb-4">
        {pedirEmail && (
          <>
            <div>
              <label className={LABEL_CLS} htmlFor="cred_email">Email</label>
              <input id="cred_email" type="email" autoFocus className={INPUT_CLS} value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="cred_rol">Rol</label>
              <select id="cred_rol" className={INPUT_CLS} value={rol} onChange={e => setRol(e.target.value as Rol)}>
                <option value="viewer">Solo ver</option>
                <option value="editor">Editor</option>
                <option value="super_admin">Súper admin</option>
              </select>
            </div>
          </>
        )}
        <div>
          <label className={LABEL_CLS} htmlFor="cred_password">{pedirEmail ? 'Contraseña' : 'Nueva contraseña'}</label>
          <input id="cred_password" type="password" autoFocus={!pedirEmail} className={INPUT_CLS} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 12 caracteres" />
        </div>
      </div>
      {error && <p className="text-xs text-red-600 mb-3" role="alert">{error}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className={`text-sm font-semibold px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 ${FOCUS_RING}`}>Cerrar</button>
        <button onClick={guardar} disabled={guardando} className={`text-sm font-semibold px-4 py-2.5 rounded-lg text-white bg-brand disabled:opacity-60 ${FOCUS_RING}`}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </ModalBase>
  );
};

const SeccionUsuarios: React.FC<{ emailActual: string }> = ({ emailActual }) => {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [error, setError] = useState('');
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalReset, setModalReset] = useState<Usuario | null>(null);

  const cargar = () => {
    adminFetch('/api/admin/usuarios')
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => setUsuarios(data.usuarios || []))
      .catch(err => setError(err.message || 'Error al cargar usuarios'));
  };

  useEffect(() => { cargar(); }, []);

  const cambiarEstado = async (u: Usuario) => {
    const res = await adminFetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: u.activo ? 'desactivar' : 'reactivar', id: u.id }),
    });
    const data: any = await res.json();
    if (!res.ok) { setError(data.error || 'No se pudo actualizar.'); return; }
    setError('');
    cargar();
  };

  const cambiarRol = async (u: Usuario, rol: Rol) => {
    const res = await adminFetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'cambiar_rol', id: u.id, rol }),
    });
    const data: any = await res.json();
    if (!res.ok) { setError(data.error || 'No se pudo cambiar el rol.'); return; }
    setError('');
    cargar();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Usuarios con acceso al panel</h2>
        <button
          onClick={() => setModalNuevo(true)}
          className={`inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-2 text-white bg-brand hover:opacity-90 transition-opacity ${FOCUS_RING}`}
        >
          <Plus size={15} aria-hidden="true" /> Nuevo usuario
        </button>
      </div>

      {error && <p className="text-xs text-red-600 px-4 sm:px-5 py-3" role="alert">{error}</p>}

      <ul className="divide-y divide-gray-100">
        {(usuarios || []).map(u => (
          <li key={u.id} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {u.email}{u.email.toLowerCase() === emailActual.toLowerCase() && <span className="text-gray-400 font-normal"> (vos)</span>}
              </p>
              <p className="text-xs text-gray-400">{u.activo ? 'Activo' : 'Desactivado'} · desde {fmtDateLong(u.created_at.slice(0, 10))}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {u.email.toLowerCase() === emailActual.toLowerCase() ? (
                <span className="text-xs font-semibold text-gray-500">{ROL_LABEL[u.rol]}</span>
              ) : (
                <select
                  aria-label={`Rol de ${u.email}`}
                  value={u.rol}
                  onChange={e => cambiarRol(u, e.target.value as Rol)}
                  className={`text-xs border border-gray-300 rounded-lg px-2 py-1.5 ${FOCUS_RING}`}
                >
                  <option value="viewer">Solo ver</option>
                  <option value="editor">Editor</option>
                  <option value="super_admin">Súper admin</option>
                </select>
              )}
              <button onClick={() => setModalReset(u)} className={`text-xs font-semibold text-brand hover:underline rounded ${FOCUS_RING}`}>
                Resetear contraseña
              </button>
              {u.email.toLowerCase() !== emailActual.toLowerCase() && (
                <button
                  onClick={() => cambiarEstado(u)}
                  className={`text-xs font-semibold rounded ${FOCUS_RING} ${u.activo ? 'text-red-600 hover:underline' : 'text-green-700 hover:underline'}`}
                >
                  {u.activo ? 'Desactivar' : 'Reactivar'}
                </button>
              )}
            </div>
          </li>
        ))}
        {usuarios !== null && usuarios.length === 0 && (
          <li className="px-4 sm:px-5 py-8 text-center text-sm text-gray-400">Todavía no hay usuarios cargados.</li>
        )}
      </ul>

      {modalNuevo && (
        <ModalCredencial
          titulo="Nuevo usuario"
          pedirEmail
          onClose={() => setModalNuevo(false)}
          onGuardar={async (email, password, rol) => {
            const res = await adminFetch('/api/admin/usuarios', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accion: 'crear', email, password, rol }),
            });
            const data: any = await res.json();
            if (!res.ok) throw new Error(data.error || 'No se pudo crear.');
            cargar();
          }}
        />
      )}

      {modalReset && (
        <ModalCredencial
          titulo={`Resetear contraseña — ${modalReset.email}`}
          onClose={() => setModalReset(null)}
          onGuardar={async (_email, password) => {
            const res = await adminFetch('/api/admin/usuarios', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accion: 'resetear_password', id: modalReset.id, password }),
            });
            const data: any = await res.json();
            if (!res.ok) throw new Error(data.error || 'No se pudo resetear.');
          }}
        />
      )}
    </div>
  );
};

type GrupoMetricaEstadia = {
  tipo_estadia: string;
  total_personas: number;
  total_noches: number;
};

// Cards de "Métricas Operativas" — personas y noches por tipo_estadia desde
// el 06/08, para que contabilidad cruce volumen de gente alojada/alimentada
// contra gastos reales. Ver functions/api/admin/metricas.ts.
const SeccionMetricasOperativas: React.FC = () => {
  const [grupos, setGrupos] = useState<GrupoMetricaEstadia[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch('/api/admin/metricas')
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => setGrupos(data.grupos || []))
      .catch(err => setError(err.message || 'Error al cargar métricas operativas'));
  }, []);

  if (error) {
    return <p className="text-xs text-red-600 mb-6" role="alert">No se pudieron cargar las métricas operativas: {error}</p>;
  }

  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Métricas Operativas</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {TIPOS_ESTADIA.map(t => {
          const grupo = grupos?.find(g => g.tipo_estadia === t.value);
          return (
            <MetricCard
              key={t.value}
              compact
              label={t.label}
              value={grupo ? `${grupo.total_personas} personas` : (grupos === null ? '—' : '0 personas')}
              hint={grupo ? `${Math.round(grupo.total_noches)} noches` : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};

const ACCION_LABEL: Record<string, string> = {
  crear_reserva: 'Creó reserva',
  editar_reserva: 'Editó reserva',
  cancelar_reserva: 'Canceló reserva',
  asignar_unidad: 'Asignó unidad',
  sync_airbnb: 'Sincronizó Airbnb',
  crear_usuario: 'Creó usuario',
  resetear_password: 'Reseteó contraseña',
  cambiar_rol: 'Cambió rol',
  desactivar_usuario: 'Desactivó usuario',
  reactivar_usuario: 'Reactivó usuario',
  solicitar_excepcion_capacidad: 'Solicitó una excepción de capacidad',
  aprobar_excepcion_capacidad: 'Aprobó una excepción de capacidad',
  rechazar_excepcion_capacidad: 'Rechazó una excepción de capacidad',
  revocar_excepcion_capacidad: 'Revocó una excepción de capacidad',
  crear_bloqueo_inventario: 'Creó un bloqueo operativo',
  cancelar_bloqueo_inventario: 'Canceló un bloqueo operativo',
  crear_estadia_no_comercial: 'Registró una estadía no comercial',
  cancelar_estadia_no_comercial: 'Canceló una estadía no comercial',
};

const fmtFechaHora = (iso: string) => {
  const d = new Date(iso.replace(' ', 'T') + (iso.endsWith('Z') ? '' : 'Z'));
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
};

const TIPO_OCUPACION_LABEL: Record<string, string> = {
  mantenimiento: 'Mantenimiento',
  cierre: 'Cierre operativo',
  uso_interno: 'Uso interno',
  bloqueo_propietario: 'Bloqueo del propietario',
  staff: 'Staff',
  voluntario: 'Voluntariado',
  residente: 'Residencia',
};

const SeccionOcupacionOperativa: React.FC = () => {
  const hoy = fechaOperativaLocal(new Date());
  const [registros, setRegistros] = useState<RegistroOcupacionOperativa[]>([]);
  const [espacios, setEspacios] = useState<EspacioOcupacion[]>([]);
  const [unidades, setUnidades] = useState<UnidadOcupacion[]>([]);
  const [clase, setClase] = useState<'bloqueo' | 'estadia_no_comercial'>('bloqueo');
  const [objetivo, setObjetivo] = useState('');
  const [fechaDesde, setFechaDesde] = useState(hoy);
  const [fechaHasta, setFechaHasta] = useState(addDays(hoy, 1));
  const [tipo, setTipo] = useState('mantenimiento');
  const [detalle, setDetalle] = useState('');
  const [cantidadPersonas, setCantidadPersonas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await adminFetch('/api/admin/ocupacion-operativa');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setRegistros(data.registros || []);
      setEspacios(data.espacios || []);
      setUnidades(data.unidades || []);
      if (!objetivo && data.espacios?.length) setObjetivo(`espacio:${data.espacios[0].id}`);
    } catch (e: any) {
      setError(e.message || 'No se pudo cargar la ocupación operativa.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cambiarClase = (nuevaClase: 'bloqueo' | 'estadia_no_comercial') => {
    setClase(nuevaClase);
    setTipo(nuevaClase === 'bloqueo' ? 'mantenimiento' : 'staff');
    setDetalle('');
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    const [objetivoTipo, objetivoId] = objetivo.split(':');
    const comun = {
      espacio_id: objetivoTipo === 'espacio' ? Number(objetivoId) : null,
      unidad_inventario_id: objetivoTipo === 'unidad' ? Number(objetivoId) : null,
      tipo,
    };
    const body = clase === 'bloqueo'
      ? { accion: 'crear_bloqueo', ...comun, fecha_desde: fechaDesde, fecha_hasta: fechaHasta, motivo: detalle }
      : {
          accion: 'crear_estadia_no_comercial', ...comun, fecha_checkin: fechaDesde,
          fecha_checkout: fechaHasta, referencia_operativa: detalle, cantidad_personas: cantidadPersonas,
        };
    try {
      const res = await adminFetch('/api/admin/ocupacion-operativa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setDetalle('');
      await cargar();
    } catch (e: any) {
      setError(e.message || 'No se pudo registrar la ocupación.');
    } finally {
      setGuardando(false);
    }
  };

  const cancelar = async (registro: RegistroOcupacionOperativa) => {
    if (!window.confirm(`¿Cancelar ${registro.codigo}? El inventario volverá a quedar disponible.`)) return;
    setError('');
    try {
      const res = await adminFetch('/api/admin/ocupacion-operativa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: registro.clase === 'bloqueo' ? 'cancelar_bloqueo' : 'cancelar_estadia_no_comercial',
          id: registro.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      await cargar();
    } catch (e: any) {
      setError(e.message || 'No se pudo cancelar el registro.');
    }
  };

  const nombreObjetivo = (registro: RegistroOcupacionOperativa) => {
    if (registro.espacioId) return espacios.find(item => item.id === registro.espacioId)?.nombre || `Espacio #${registro.espacioId}`;
    const unidad = unidades.find(item => item.id === registro.unidadInventarioId);
    const espacio = espacios.find(item => item.id === unidad?.espacioId);
    return unidad ? `${espacio?.nombre || 'Espacio'} · ${unidad.nombre}` : `Unidad #${registro.unidadInventarioId}`;
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,360px)_1fr] gap-5 items-start">
      <form onSubmit={guardar} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Nueva ocupación</h2>
          <p className="text-xs text-gray-500 mt-1">Bloqueá inventario o registrá una estadía sin ingreso comercial.</p>
        </div>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Clase de ocupación">
          {([['bloqueo', 'Bloqueo'], ['estadia_no_comercial', 'Estadía interna']] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => cambiarClase(value)} className={`text-sm font-semibold rounded-lg px-3 py-2 border ${FOCUS_RING} ${clase === value ? 'bg-brand text-white border-brand' : 'border-gray-300 text-gray-600'}`}>{label}</button>
          ))}
        </div>
        <label className="block text-xs font-semibold text-gray-600">Inventario
          <select required className={`${INPUT_CLS} mt-1`} value={objetivo} onChange={e => setObjetivo(e.target.value)}>
            <option value="" disabled>Elegir espacio o unidad</option>
            <optgroup label="Espacios">
              {espacios.map(item => <option key={`e-${item.id}`} value={`espacio:${item.id}`}>{item.nombre} · capacidad {item.capacidadOperativaMaxima}</option>)}
            </optgroup>
            <optgroup label="Unidades">
              {unidades.map(item => <option key={`u-${item.id}`} value={`unidad:${item.id}`}>{espacios.find(e => e.id === item.espacioId)?.nombre} · {item.nombre}</option>)}
            </optgroup>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-semibold text-gray-600">Desde (inclusive)
            <input required type="date" className={`${INPUT_CLS} mt-1`} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
          </label>
          <label className="block text-xs font-semibold text-gray-600">Hasta (checkout)
            <input required type="date" className={`${INPUT_CLS} mt-1`} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
          </label>
        </div>
        <label className="block text-xs font-semibold text-gray-600">Tipo
          <select className={`${INPUT_CLS} mt-1`} value={tipo} onChange={e => setTipo(e.target.value)}>
            {(clase === 'bloqueo'
              ? ['mantenimiento', 'cierre', 'uso_interno', 'bloqueo_propietario']
              : ['staff', 'voluntario', 'residente']).map(value => <option key={value} value={value}>{TIPO_OCUPACION_LABEL[value]}</option>)}
          </select>
        </label>
        {clase === 'estadia_no_comercial' && (
          <label className="block text-xs font-semibold text-gray-600">Personas
            <input required min={1} type="number" className={`${INPUT_CLS} mt-1`} value={cantidadPersonas} onChange={e => setCantidadPersonas(Number(e.target.value))} />
          </label>
        )}
        <label className="block text-xs font-semibold text-gray-600">{clase === 'bloqueo' ? 'Motivo' : 'Referencia operativa'}
          <textarea required minLength={3} rows={3} className={`${INPUT_CLS} mt-1`} value={detalle} onChange={e => setDetalle(e.target.value)} placeholder={clase === 'bloqueo' ? 'Ej. reparación de techo' : 'Ej. voluntariado de huerta'} />
        </label>
        <button disabled={guardando || cargando} className={`w-full text-sm font-semibold rounded-lg px-4 py-2.5 text-white bg-brand disabled:opacity-60 ${FOCUS_RING}`}>{guardando ? 'Guardando…' : 'Registrar ocupación'}</button>
      </form>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div><h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Bloqueos y estadías internas</h2><p className="text-xs text-gray-400 mt-1">El historial cancelado se conserva para auditoría.</p></div>
          <button onClick={cargar} disabled={cargando} aria-label="Actualizar ocupación" className={`p-2 rounded-lg border border-gray-300 disabled:opacity-60 ${FOCUS_RING}`}><RefreshCw size={15} className={cargando ? 'animate-spin' : ''} /></button>
        </div>
        {error && <p className="m-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">{error}</p>}
        <ul className="divide-y divide-gray-100">
          {registros.map(registro => {
            const activo = registro.estado === 'activo' || registro.estado === 'activa';
            return (
              <li key={`${registro.clase}-${registro.id}`} className={`px-4 sm:px-5 py-4 ${activo ? '' : 'opacity-60'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap"><span className="font-semibold text-sm text-gray-800">{nombreObjetivo(registro)}</span><span className={`text-[10px] uppercase font-bold tracking-wide rounded-full px-2 py-0.5 ${activo ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>{activo ? 'Activo' : 'Cancelado'}</span></div>
                    <p className="text-xs text-gray-600 mt-1">{TIPO_OCUPACION_LABEL[registro.tipo] || registro.tipo} · {fmtDateLong(registro.fechaDesde)} → {fmtDateLong(registro.fechaHasta)}{registro.cantidadPersonas > 0 ? ` · ${registro.cantidadPersonas} personas` : ''}</p>
                    <p className="text-xs text-gray-500 mt-1">{registro.detalle}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{registro.codigo} · {registro.creadoPor} · {fmtFechaHora(registro.createdAt)}</p>
                  </div>
                  {activo && <button type="button" onClick={() => cancelar(registro)} className={`text-xs font-semibold text-red-700 border border-red-200 rounded-lg px-2.5 py-1.5 hover:bg-red-50 ${FOCUS_RING}`}>Cancelar</button>}
                </div>
              </li>
            );
          })}
          {!cargando && registros.length === 0 && <li className="px-5 py-10 text-center text-sm text-gray-400">No hay ocupaciones operativas registradas.</li>}
        </ul>
      </section>
    </div>
  );
};

const SeccionActividad: React.FC = () => {
  const [registros, setRegistros] = useState<RegistroActividad[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch('/api/admin/actividad')
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => setRegistros(data.registros || []))
      .catch(err => setError(err.message || 'Error al cargar la actividad'));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Actividad reciente</h2>
      </div>
      {error && <p className="text-xs text-red-600 px-4 sm:px-5 py-3" role="alert">{error}</p>}
      <ul className="divide-y divide-gray-100">
        {(registros || []).map(r => (
          <li key={r.id} className="px-4 sm:px-5 py-3">
            <p className="text-sm text-gray-800">
              <span className="font-semibold">{r.email}</span> — {ACCION_LABEL[r.accion] || r.accion}
            </p>
            {r.entidad_tipo && <p className="text-xs text-gray-500 mt-0.5">{r.entidad_tipo}{r.entidad_id ? ` #${r.entidad_id}` : ''}</p>}
            {r.motivo && <p className="text-xs text-gray-500 mt-0.5">Motivo: {r.motivo}</p>}
            <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">{fmtFechaHora(r.created_at)}</p>
          </li>
        ))}
        {registros !== null && registros.length === 0 && (
          <li className="px-4 sm:px-5 py-8 text-center text-sm text-gray-400">Todavía no hay actividad registrada.</li>
        )}
      </ul>
    </div>
  );
};

const PanelReservas: React.FC = () => {
  const [auth, setAuth] = useState<{ email: string; rol: Rol } | null | 'cargando'>('cargando');
  const [sesionExpirada, setSesionExpirada] = useState(false);
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('operativa');
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [reservasHistorial, setReservasHistorial] = useState<Reserva[] | null>(null);
  const [historialPagina, setHistorialPagina] = useState(1);
  const [historialTotalPaginas, setHistorialTotalPaginas] = useState(1);
  const [historialTotal, setHistorialTotal] = useState(0);
  const [consultas, setConsultas] = useState<Consulta[] | null>(null);
  const [alojamientos, setAlojamientos] = useState<Alojamiento[]>([]);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ventanaInicio, setVentanaInicio] = useState(() => fechaOperativaLocal(new Date()));
  const [busqueda, setBusqueda] = useState('');

  const [celdaMultiple, setCeldaMultiple] = useState<{ alojamiento: Alojamiento; fecha: string; reservas: Reserva[] } | null>(null);
  const [modalReserva, setModalReserva] = useState<{ modo: 'crear' | 'editar'; reserva: Reserva | null } | null>(null);

  // Si la sesión venció a mitad de uso, el servidor devuelve 401 — volvemos
  // a mostrar el login en vez de un error genérico de carga.
  const manejarNoAutenticado = () => {
    setSesionExpirada(true);
    setAuth(null);
  };

  const cargarOperativa = () => {
    setLoading(true);
    setError(null);
    const parametros = (estado: string) => new URLSearchParams({
      pagina: '1', limite: '100', fecha_desde: fechaOperativaLocal(new Date()), estado,
    });
    Promise.all([
      todasLasReservasV1(parametros('confirmada')),
      todasLasReservasV1(parametros('pendiente_pago')),
      adminFetch('/api/v1/admin/reservas/panel'),
    ])
      .then(async ([confirmadas, pendientes, contextoResponse]) => {
        if (contextoResponse.status === 401) { manejarNoAutenticado(); throw new Error('__unauthorized__'); }
        if (!contextoResponse.ok) throw new Error(`HTTP ${contextoResponse.status}`);
        const contexto: any = await contextoResponse.json();
        setReservas([...confirmadas, ...pendientes]);
        setAlojamientos(contexto.data?.alojamientos || []);
        setMetricas(contexto.data?.metricas || null);
      })
      .catch(err => {
        if (err.message === '__unauthorized__') manejarNoAutenticado();
        else setError(err.message || 'Error al cargar las reservas');
      })
      .finally(() => setLoading(false));
  };

  const cargarHistorial = (pagina = historialPagina, titular = busqueda) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ pagina: String(pagina), limite: '25' });
    if (titular.trim()) params.set('titular', titular.trim());
    return paginaReservasV1(params)
      .then(({ reservas: items, meta }) => {
        setReservasHistorial(items);
        setHistorialPagina(meta.pagina);
        setHistorialTotalPaginas(Math.max(meta.total_paginas, 1));
        setHistorialTotal(meta.total);
        return items;
      })
      .catch(err => {
        if (err.message === '__unauthorized__') manejarNoAutenticado();
        else setError(err.message || 'Error al cargar el historial');
        return [];
      })
      .finally(() => setLoading(false));
  };

  const cargarConsultas = () => {
    setLoading(true);
    setError(null);
    adminFetch('/api/admin/consultas')
      .then(res => {
        if (res.status === 401) { manejarNoAutenticado(); throw new Error('__unauthorized__'); }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setConsultas(data.consultas || []))
      .catch(err => { if (err.message !== '__unauthorized__') setError(err.message || 'Error al cargar las consultas'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    adminFetch('/api/admin/me')
      .then(res => { if (!res.ok) throw new Error('401'); return res.json(); })
      .then(data => setAuth({ email: data.email, rol: data.rol }))
      .catch(() => setAuth(null));
  }, []);

  useEffect(() => {
    if (auth === 'cargando' || !auth) return;
    document.title = 'Dashboard — Pueblo Mágico';
    cargarOperativa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const cerrarSesion = async () => {
    await adminFetch('/api/admin/logout', { method: 'POST' });
    setSesionExpirada(false);
    setAuth(null);
  };

  const [descargandoReporte, setDescargandoReporte] = useState(false);

  // Reporte financiero minimizado: el servidor aplica permisos y filtros y
  // no incluye PII salvo solicitud explícita de un flujo autorizado.
  const descargarReporteServidor = async (filtros?: { titular?: string }) => {
    setDescargandoReporte(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtros?.titular) params.set('titular', filtros.titular);
      const query = params.size > 0 ? `?${params.toString()}` : '';
      const res = await adminFetch(`/api/v1/admin/reservas/exportar${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sugerido = res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1];
      a.download = sugerido || `reservas_${fechaOperativaLocal(new Date())}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(`No se pudo descargar el reporte (${e.message || 'error desconocido'}).`);
    } finally {
      setDescargandoReporte(false);
    }
  };

  useEffect(() => {
    if (vistaActiva === 'historial' && reservasHistorial === null) cargarHistorial(1, busqueda);
    if (vistaActiva === 'consultas' && consultas === null) cargarConsultas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vistaActiva]);

  useEffect(() => {
    if (vistaActiva !== 'historial' || reservasHistorial === null) return;
    const timeout = window.setTimeout(() => cargarHistorial(1, busqueda), 300);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  const actualizar = () => (vistaActiva === 'historial' ? cargarHistorial(historialPagina, busqueda) : cargarOperativa());

  // Después de crear/editar/cancelar, refrescamos desde el servidor en vez de
  // parchear el estado a mano — los cambios pueden tocar fechas, alojamiento,
  // montos, todo lo que alimenta la grilla y las métricas.
  const handleGuardado = () => {
    cargarOperativa();
    if (reservasHistorial !== null) cargarHistorial(historialPagina, busqueda);
  };

  const abrirPorId = async (id: number) => {
    let r = reservas.find(x => x.id === id) || (reservasHistorial || []).find(x => x.id === id);
    try {
      const res = await adminFetch(`/api/v1/admin/reservas/${id}`);
      if (res.status === 401) { manejarNoAutenticado(); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body: any = await res.json();
      r = reservaDesdeV1(body.data.reserva);
    } catch (e: any) {
      if (!r) setError(e.message || 'No se pudo cargar la reserva.');
    }
    if (r) setModalReserva({ modo: 'editar', reserva: r });
  };

  const dias = useMemo(
    () => Array.from({ length: VENTANA_DIAS }, (_, i) => addDays(ventanaInicio, i)),
    [ventanaInicio]
  );

  // % de ocupación de la ventana visible: domo cuenta como unidad completa
  // ocupada (se alquila entero), refugio cuenta por personas/capacidad.
  const ocupacionPct = useMemo(() => {
    if (alojamientos.length === 0) return null;
    let ocupado = 0;
    let total = 0;
    for (const aloj of alojamientos) {
      for (const fecha of dias) {
        total += aloj.capacidad_total;
        const enCelda = reservas.filter(r => r.alojamiento_id === aloj.id && ocupaFecha(r, fecha));
        if (enCelda.length === 0) continue;
        if (aloj.tipo === 'domo') ocupado += aloj.capacidad_total;
        else ocupado += Math.min(enCelda.reduce((s, r) => s + r.cantidad_personas, 0), aloj.capacidad_total);
      }
    }
    return total > 0 ? Math.round((ocupado / total) * 1000) / 10 : null;
  }, [alojamientos, reservas, dias]);

  const abrirCelda = (alojamiento: Alojamiento, fecha: string) => {
    const enEsaCelda = reservas.filter(r => r.alojamiento_id === alojamiento.id && ocupaFecha(r, fecha));
    if (enEsaCelda.length === 0) return;
    if (enEsaCelda.length === 1) abrirPorId(enEsaCelda[0].id);
    else setCeldaMultiple({ alojamiento, fecha, reservas: enEsaCelda });
  };

  const reservasHistorialFiltradas = reservasHistorial || [];

  if (auth === 'cargando') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="animate-spin text-gray-300" size={28} aria-hidden="true" />
      </div>
    );
  }

  if (!auth) {
    return (
      <PanelLogin
        avisoInicial={sesionExpirada ? 'Tu sesión expiró — iniciá sesión de nuevo.' : undefined}
        onLogin={(email, rol) => { setSesionExpirada(false); setAuth({ email, rol }); }}
      />
    );
  }

  // A partir de acá, TypeScript ya sabe que auth es { email, rol } (no 'cargando' ni null).
  const esSuperAdmin = auth.rol === 'super_admin';
  const puedeEditar = auth.rol === 'super_admin' || auth.rol === 'editor';

  const TABS: { key: VistaActiva; label: string }[] = [
    { key: 'operativa', label: 'Operativa' },
    ...(puedeEditar ? [{ key: 'ocupacion' as VistaActiva, label: 'Bloqueos' }] : []),
    { key: 'metricas', label: 'Métricas' },
    { key: 'historial', label: 'Historial' },
    { key: 'consultas', label: 'Consultas' },
    ...(esSuperAdmin ? [{ key: 'usuarios' as VistaActiva, label: 'Usuarios' }, { key: 'actividad' as VistaActiva, label: 'Actividad' }] : []),
  ];

  return (
    <div className="admin-panel-scope min-h-screen bg-gray-50">
      <style>{`
        .admin-panel-scope, .admin-panel-scope * {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif;
        }
        .admin-panel-scope h1, .admin-panel-scope h2, .admin-panel-scope h3, .admin-panel-scope h4 {
          font-family: inherit;
        }
      `}</style>

      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-5 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-0">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gray-400">Pueblo Mágico</p>
              <h1 className="text-lg sm:text-xl font-bold text-brand">Dashboard de Reservas</h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {esSuperAdmin && (
                <button
                  onClick={() => descargarReporteServidor()}
                  disabled={descargandoReporte}
                  aria-label="Descargar Reporte (CSV)"
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 sm:px-4 py-2.5 text-white bg-brand hover:opacity-90 transition-opacity disabled:opacity-60 ${FOCUS_RING}`}
                >
                  <Download size={15} className={descargandoReporte ? 'animate-pulse' : ''} aria-hidden="true" />
                  <span className="hidden sm:inline">{descargandoReporte ? 'Descargando…' : 'Descargar Reporte (CSV)'}</span>
                </button>
              )}
              {puedeEditar && (
                <button
                  onClick={() => setModalReserva({ modo: 'crear', reserva: null })}
                  aria-label="Nueva reserva"
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 sm:px-4 py-2.5 text-white bg-brand hover:opacity-90 transition-opacity ${FOCUS_RING}`}
                >
                  <Plus size={15} aria-hidden="true" />
                  <span className="hidden sm:inline">Nueva reserva</span>
                </button>
              )}
              <button
                onClick={actualizar}
                disabled={loading}
                aria-label="Actualizar"
                className={`inline-flex items-center gap-2 text-sm font-semibold border border-gray-300 rounded-lg px-3 py-2.5 hover:bg-gray-100 transition-colors disabled:opacity-60 ${FOCUS_RING}`}
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
              </button>
              <button
                onClick={cerrarSesion}
                aria-label="Cerrar sesión"
                title={auth.email}
                className={`inline-flex items-center gap-1.5 text-sm font-semibold border border-gray-300 rounded-lg px-3 py-2.5 hover:bg-gray-100 transition-colors ${FOCUS_RING}`}
              >
                <LogOut size={15} aria-hidden="true" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1 sm:inline-flex sm:mt-3" role="tablist" aria-label="Vista">
            {TABS.map(t => (
              <button
                key={t.key}
                role="tab"
                aria-selected={vistaActiva === t.key}
                onClick={() => setVistaActiva(t.key)}
                className={`flex-1 sm:flex-none text-sm font-semibold px-3 sm:px-4 py-2 rounded-md transition-colors ${FOCUS_RING} ${
                  vistaActiva === t.key ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <InstalarBanner />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6" role="alert">
            No se pudo cargar: {error}
          </div>
        )}

        {vistaActiva === 'operativa' && (
          <>
            {metricas && <PendientesViejasAlerta data={metricas.pendientes_viejas} onClickReserva={abrirPorId} />}

            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
              <MetricCard compact label="Llegan" value={metricas ? String(metricas.checkins_hoy) : '—'} hint="Hoy" icon={<LogIn size={13} className="text-gray-400 flex-shrink-0" aria-hidden="true" />} />
              <MetricCard compact label="Semana" value={metricas ? String(metricas.checkins_semana) : '—'} hint="Llegan" icon={<CalendarClock size={13} className="text-gray-400 flex-shrink-0" aria-hidden="true" />} />
              <MetricCard compact label="Se van" value={metricas ? String(metricas.checkouts_hoy) : '—'} hint="Hoy" icon={<LogOut size={13} className="text-gray-400 flex-shrink-0" aria-hidden="true" />} />
            </div>

            <SeccionMetricasOperativas />

            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Grilla de ocupación {loading && <span className="font-normal normal-case text-gray-400">(cargando…)</span>}
              </h2>
              <div className="flex items-center gap-2" role="group" aria-label="Navegar semanas">
                <button onClick={() => setVentanaInicio(prev => addDays(prev, -7))} className={`inline-flex items-center gap-1 text-xs font-semibold border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-100 ${FOCUS_RING}`}>
                  <ChevronLeft size={14} aria-hidden="true" /> <span className="hidden xs:inline">Anterior</span>
                </button>
                <button onClick={() => setVentanaInicio(fechaOperativaLocal(new Date()))} className={`text-xs font-semibold border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-100 ${FOCUS_RING}`}>
                  Hoy
                </button>
                <button onClick={() => setVentanaInicio(prev => addDays(prev, 7))} className={`inline-flex items-center gap-1 text-xs font-semibold border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-100 ${FOCUS_RING}`}>
                  <span className="hidden xs:inline">Siguiente</span> <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
              {!loading && reservas.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Todavía no hay reservas cargadas</p>
                  <p className="text-xs text-gray-400 mb-4">Cuando se confirme una reserva (o se cargue el histórico), va a aparecer acá.</p>
                  {puedeEditar && (
                    <button
                      onClick={() => setModalReserva({ modo: 'crear', reserva: null })}
                      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline rounded ${FOCUS_RING}`}
                    >
                      <Plus size={15} aria-hidden="true" /> Cargar una reserva manual
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="text-sm border-collapse w-full">
                    <caption className="sr-only">Ocupación por alojamiento y fecha, {fmtDateLong(dias[0])} a {fmtDateLong(dias[dias.length - 1])}</caption>
                    <thead>
                      <tr>
                        <th scope="col" className="sticky left-0 bg-gray-50 border-b border-r border-gray-200 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                          Alojamiento
                        </th>
                        {dias.map(fecha => (
                          <th key={fecha} scope="col" className="bg-gray-50 border-b border-gray-200 px-2 py-2.5 text-center text-xs font-semibold text-gray-500 whitespace-nowrap min-w-[56px] sm:min-w-[64px] tabular-nums">
                            {fmtDateShort(fecha)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {alojamientos.map(aloj => (
                        <tr key={aloj.id} className="border-b border-gray-100 last:border-0">
                          <th scope="row" className="sticky left-0 bg-white border-r border-gray-200 px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap text-xs sm:text-sm">
                            {aloj.nombre}
                          </th>
                          {dias.map(fecha => {
                            const enCelda = reservas.filter(r => r.alojamiento_id === aloj.id && ocupaFecha(r, fecha));
                            const vacia = enCelda.length === 0;
                            const hayPendiente = enCelda.some(r => r.estado === 'pendiente_pago');

                            let contenido: string;
                            let colorClases: string;
                            let estadoTexto: string;
                            if (vacia) {
                              contenido = '';
                              colorClases = 'bg-white text-gray-300';
                              estadoTexto = 'libre';
                            } else if (aloj.tipo === 'refugio') {
                              const ocupadas = enCelda.reduce((s, r) => s + r.cantidad_personas, 0);
                              contenido = `${ocupadas}/${aloj.capacidad_total}`;
                              const ratio = ocupadas / aloj.capacidad_total;
                              if (hayPendiente) { colorClases = 'bg-amber-100 text-amber-800'; estadoTexto = 'con reserva pendiente'; }
                              else if (ratio >= 0.9) { colorClases = 'bg-red-100 text-red-800'; estadoTexto = 'casi lleno'; }
                              else { colorClases = 'bg-green-100 text-green-800'; estadoTexto = 'confirmado'; }
                            } else {
                              contenido = enCelda.length === 1 ? enCelda[0].cliente_nombre.split(' ')[0] : `${enCelda.length} res.`;
                              colorClases = hayPendiente ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800';
                              estadoTexto = hayPendiente ? 'con reserva pendiente' : 'confirmado';
                            }

                            const etiqueta = vacia
                              ? `${aloj.nombre}, ${fmtDateLong(fecha)}, libre`
                              : `${aloj.nombre}, ${fmtDateLong(fecha)}, ${estadoTexto}: ${enCelda.map(r => r.cliente_nombre).join(', ')}`;

                            return (
                              <td key={fecha} className="border-b border-gray-100 p-1 text-center align-middle">
                                <button
                                  onClick={() => abrirCelda(aloj, fecha)}
                                  disabled={vacia}
                                  aria-label={etiqueta}
                                  title={enCelda.map(r => r.cliente_nombre).join(', ')}
                                  className={`w-full h-11 rounded-md text-[11px] font-semibold px-1 truncate tabular-nums transition-transform ${FOCUS_RING} ${colorClases} ${
                                    vacia ? 'cursor-default' : 'cursor-pointer active:scale-95 sm:hover:scale-105'
                                  }`}
                                >
                                  {contenido}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block" aria-hidden="true" /> Confirmada</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200 inline-block" aria-hidden="true" /> Pendiente</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" aria-hidden="true" /> Refugio casi lleno</span>
              <span className="w-full sm:w-auto">Tocá una celda ocupada para editar, asignar cama o cancelar.</span>
            </div>
          </>
        )}

        {vistaActiva === 'ocupacion' && puedeEditar && <SeccionOcupacionOperativa />}

        {vistaActiva === 'metricas' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard label="Reservas confirmadas" value={metricas ? String(metricas.total_confirmadas) : '—'} />
            <MetricCard label="Ingresos por señas" value={metricas ? fmtMoney(metricas.ingresos_senas) : '—'} accent="gold" />
            <MetricCard label="Saldo pendiente a cobrar" value={metricas ? fmtMoney(metricas.saldo_pendiente_total) : '—'} hint="Al check-in, confirmadas" />
            <MetricCard label="Total a facturar" value={metricas ? fmtMoney(metricas.total_a_facturar) : '—'} accent="gold" hint="Si se cobra todo" />
            <MetricCard label="Ocupación (14 días)" value={ocupacionPct !== null ? `${ocupacionPct}%` : '—'} />
            <MetricCard
              label="Conversión ManyChat"
              value={metricas?.conversion_manychat.pct !== null && metricas ? `${metricas.conversion_manychat.pct}%` : 'Sin datos'}
              hint={metricas ? `${metricas.conversion_manychat.confirmadas} de ${metricas.conversion_manychat.total} pagaron` : undefined}
            />
            {esSuperAdmin && <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Exportar</p>
              <button
                onClick={() => descargarReporteServidor()}
                className={`inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline rounded ${FOCUS_RING}`}
              >
                <Download size={15} aria-hidden="true" /> Descargar reporte minimizado
              </button>
            </div>}
            {puedeEditar && <SeccionAirbnb alojamientos={alojamientos} onSincronizado={handleGuardado} />}
          </div>
        )}

        {vistaActiva === 'historial' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Historial completo {loading && <span className="font-normal normal-case text-gray-400">(cargando…)</span>}
              </h2>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre…"
                    aria-label="Buscar reservas"
                    className={`text-sm border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 sm:py-2 w-full sm:w-64 ${FOCUS_RING}`}
                  />
                </div>
                {esSuperAdmin && (
                  <button
                    onClick={() => descargarReporteServidor(busqueda.trim() ? { titular: busqueda.trim() } : undefined)}
                    aria-label="Descargar CSV filtrado"
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 hover:bg-gray-100 flex-shrink-0 ${FOCUS_RING}`}
                  >
                    <Download size={15} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <TablaHistorial reservas={reservasHistorialFiltradas} onSeleccionar={r => abrirPorId(r.id)} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
              <span>{historialTotal} reserva{historialTotal === 1 ? '' : 's'} · página {historialPagina} de {historialTotalPaginas}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={loading || historialPagina <= 1}
                  onClick={() => cargarHistorial(historialPagina - 1, busqueda)}
                  className={`rounded-lg border border-gray-300 px-3 py-2 font-semibold disabled:opacity-40 ${FOCUS_RING}`}
                >Anterior</button>
                <button
                  type="button"
                  disabled={loading || historialPagina >= historialTotalPaginas}
                  onClick={() => cargarHistorial(historialPagina + 1, busqueda)}
                  className={`rounded-lg border border-gray-300 px-3 py-2 font-semibold disabled:opacity-40 ${FOCUS_RING}`}
                >Siguiente</button>
              </div>
            </div>
          </>
        )}

        {vistaActiva === 'consultas' && (
          <>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
              Consultas sin convertir {loading && <span className="font-normal normal-case text-gray-400">(cargando…)</span>}
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Llegaron al último paso del flujo de ManyChat (fecha, alojamiento y monto ya cotizados) pero no completaron el pago.
            </p>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <TablaConsultas consultas={consultas || []} />
            </div>
          </>
        )}

        {vistaActiva === 'usuarios' && esSuperAdmin && <SeccionUsuarios emailActual={auth.email} />}
        {vistaActiva === 'actividad' && esSuperAdmin && <SeccionActividad />}
      </main>

      {celdaMultiple && (
        <ModalSeleccionarReserva
          alojamiento={celdaMultiple.alojamiento}
          fecha={celdaMultiple.fecha}
          reservas={celdaMultiple.reservas}
          onClose={() => setCeldaMultiple(null)}
          onSeleccionar={r => { setCeldaMultiple(null); abrirPorId(r.id); }}
        />
      )}

      {modalReserva && (
        <ModalReserva
          modo={modalReserva.modo}
          reserva={modalReserva.reserva}
          alojamientos={alojamientos}
          soloLectura={!puedeEditar}
          rol={auth.rol}
          onClose={() => setModalReserva(null)}
          onGuardado={handleGuardado}
        />
      )}
    </div>
  );
};

export default PanelReservas;
