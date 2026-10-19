import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, MessageCircle, Download, AlertTriangle, LogIn, LogOut, CalendarClock, Plus, Trash2, Link2, Home, CalendarDays, ClipboardList, BarChart3, BadgeDollarSign, Settings, Users, Activity, ShieldAlert, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import {
  Badge, Button, Card, Checkbox, CodeBadge, CopyButton, DateRangeField, DescriptionList,
  DescriptionListItem, EmptyState, IconButton, Input, LoadingState, Modal, MoneyField, NumberField,
  SearchField, Select, StatCard, Table, TableBody, TableCell, TableContainer, TableHead,
  TableHeader, TableRow, Textarea, ToggleGroup,
} from '@pueblo-magico/react-ui';
import { localTodayIso, type BookingMode, type MealPlan } from '../components/booking/bookingApi';
import { estimateBookingPrice } from '../components/booking/pricingPreview';
import { usePublicPricingSummary } from '../components/booking/usePublicPricingSummary';
import './PanelReservas.css';

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

type TipoAlojamiento = 'domo' | 'refugio' | 'camping';
type VistaActiva = 'operativa' | 'ocupacion' | 'metricas' | 'historial' | 'consultas' | 'arrepentimientos' | 'configuracion' | 'precios' | 'integraciones' | 'usuarios' | 'actividad';

const ADMIN_RESERVAS_BASE = '/admin/reservas';
const RUTA_POR_VISTA: Record<VistaActiva, string> = {
  operativa: ADMIN_RESERVAS_BASE,
  historial: `${ADMIN_RESERVAS_BASE}/listado`,
  ocupacion: `${ADMIN_RESERVAS_BASE}/bloqueos`,
  metricas: `${ADMIN_RESERVAS_BASE}/reportes`,
  consultas: `${ADMIN_RESERVAS_BASE}/consultas`,
  arrepentimientos: `${ADMIN_RESERVAS_BASE}/arrepentimientos`,
  configuracion: `${ADMIN_RESERVAS_BASE}/configuracion`,
  precios: `${ADMIN_RESERVAS_BASE}/precios`,
  integraciones: `${ADMIN_RESERVAS_BASE}/integraciones`,
  usuarios: `${ADMIN_RESERVAS_BASE}/usuarios`,
  actividad: `${ADMIN_RESERVAS_BASE}/actividad`,
};
const VISTA_POR_SEGMENTO = Object.fromEntries(
  Object.entries(RUTA_POR_VISTA).map(([vista, ruta]) => [ruta.slice(ADMIN_RESERVAS_BASE.length + 1), vista])
) as Record<string, VistaActiva>;

const vistaDesdeRuta = (pathname: string): VistaActiva | null => {
  const rutaNormalizada = pathname.replace(/\/+$/, '') || '/';
  if (rutaNormalizada === ADMIN_RESERVAS_BASE) return 'operativa';
  if (!rutaNormalizada.startsWith(`${ADMIN_RESERVAS_BASE}/`)) return null;
  const segmento = rutaNormalizada.slice(ADMIN_RESERVAS_BASE.length + 1);
  return VISTA_POR_SEGMENTO[segmento] ?? null;
};

const codigoReservaDesdeConsulta = (search: string): string | null => {
  const params = new URLSearchParams(search);
  const candidato = (params.get('reserva') || params.get('buscar') || '').trim();
  if (!/^RES-[A-Z0-9-]{1,116}$/i.test(candidato)) return null;
  return candidato.toUpperCase();
};
type EstadoReserva = 'pendiente_pago' | 'confirmada' | 'cancelada' | 'vencida' | 'rechazada';
type OrdenHistorial = 'creada' | 'titular' | 'alojamiento' | 'checkin' | 'estado' | 'origen' | 'total' | 'unidad';
type DireccionOrdenHistorial = 'asc' | 'desc';

type Alojamiento = {
  id: number;
  nombre: string;
  tipo: TipoAlojamiento;
  capacidad_total: number;
};

type Reserva = {
  id: number;
  codigo: string;
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
  finanzas?: {
    totalCentavos: number;
    pagadoCentavos: number;
    saldoCentavos: number;
    estado: 'sin_pagos' | 'pago_parcial' | 'sena_pagada' | 'pagado_total';
    moneda: string;
    pagos: Array<{
      id: number;
      proveedor: string;
      tipo: string;
      estado: string;
      montoCentavos: number;
      metodoRegistro: string | null;
      referenciaManual: string | null;
      pagadoAt: string | null;
      registradoPor: string | null;
      createdAt: string;
    }>;
  };
  preferencias?: Array<{ categoria: 'preparacion_cama'; codigo: string; nombre: string; descripcion: string }>;
  cuenta_cobro?: {
    proveedor: 'cucuru' | 'cucuru_mock';
    estado: 'pending' | 'provisioning' | 'ready' | 'failed' | 'disabled' | 'unknown_outcome';
    simulada: boolean;
    cvu: string | null;
    alias: string | null;
    moneda: string;
    intentos: number;
    ultimoErrorCodigo: string | null;
    proximoReintentoAt: string | null;
    ultimoIntentoAt: string | null;
    listaAt: string | null;
    revisionesPendientes: number;
  } | null;
  metodo_pago?: {
    metodo: 'mercado_pago_checkout' | 'transferencia_mp';
    documentoUltimos4: string | null;
    estado: 'pendiente' | 'confirmado' | 'revision_manual';
  } | null;
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
  id: number; codigo: string; version: number; titular: string;
  clienteTelefono: string | null; clienteEmail: string | null;
  fechaCheckin: string; fechaCheckout: string; cantidadPersonas: number;
  estado: string; estadoFlujo: string; canalOrigen: string | null;
  alojamientoId: number; alojamientoTipo: string;
  espacioCodigo: string | null; espacioNombre: string | null; modalidad: string;
  montoTotalCentavos: number; montoSenaCentavos: number | null;
  unidadAsignada: string | null; manychatUserId: string | null; createdAt: string;
  excepciones?: Array<Record<string, any>>;
  preferencias?: Array<{ categoria: 'preparacion_cama'; codigo: string; nombre: string; descripcion: string }>;
  cuentaCobro?: Reserva['cuenta_cobro'];
  metodoPago?: Reserva['metodo_pago'];
};

type HistorialAdminV1 = {
  resumenFinanciero: {
    moneda: string;
    totalCentavos: number;
    netoCentavos: number;
    saldoPendienteCentavos: number;
    estado: NonNullable<Reserva['finanzas']>['estado'];
  };
  pagos: NonNullable<Reserva['finanzas']>['pagos'];
};

type MetaPaginaReservas = { pagina: number; limite: number; total: number; total_paginas: number };

const reservaDesdeV1 = (item: ReservaAdminV1, historial?: HistorialAdminV1 | null): Reserva => {
  const excepcion = item.excepciones?.[0];
  const resumenFinanciero = historial?.resumenFinanciero;
  return {
    id: item.id,
    codigo: item.codigo,
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
    finanzas: resumenFinanciero ? {
      totalCentavos: resumenFinanciero.totalCentavos,
      pagadoCentavos: resumenFinanciero.netoCentavos,
      saldoCentavos: resumenFinanciero.saldoPendienteCentavos,
      estado: resumenFinanciero.estado,
      moneda: resumenFinanciero.moneda,
      pagos: historial?.pagos || [],
    } : undefined,
    preferencias: item.preferencias || [],
    cuenta_cobro: item.cuentaCobro ?? null,
    metodo_pago: item.metodoPago ?? null,
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
  return { reservas: (body.data || []).map((item: ReservaAdminV1) => reservaDesdeV1(item)), meta: body.meta };
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

type SolicitudArrepentimientoAdmin = {
  id: number;
  codigo: string;
  reserva_id: number | null;
  reserva_codigo: string | null;
  email: string;
  detalle: string;
  estado: 'recibida' | 'en_revision' | 'resuelta' | 'rechazada';
  idioma: 'es' | 'en';
  mensaje_cliente: string | null;
  version: number;
  notificacion_estado: string | null;
  notificacion_uid: string | null;
  notificacion_error_codigo: string | null;
  created_at: string;
  acknowledged_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
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
const fmtCentavos = (centavos: number, moneda = 'ARS') => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: moneda, maximumFractionDigits: 0,
}).format(centavos / 100);
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
const fmtFechaHora = (iso: string) => {
  const normalizado = iso.includes('T') ? iso : iso.replace(' ', 'T');
  const instante = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalizado) ? normalizado : `${normalizado}Z`;
  return new Date(instante).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  });
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
  <StatCard
    className="admin-metric-card bg-white shadow-sm"
    description={hint}
    emphasis={accent === 'gold' ? 'accent' : accent === 'red' ? 'danger' : 'brand'}
    icon={icon}
    label={label}
    size={compact ? 'compact' : 'default'}
    value={value}
    variant="metric"
  />
);

const RingMetric: React.FC<{
  label: string;
  value: number | null;
  detail: string;
  accent?: 'brand' | 'gold';
}> = ({ label, value, detail, accent = 'brand' }) => {
  const normalized = value === null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <Card className="admin-report-chart admin-report-ring-card">
      <div
        className={`admin-report-ring admin-report-ring--${accent}`}
        style={{ '--report-value': `${normalized * 3.6}deg` } as React.CSSProperties}
        role="img"
        aria-label={`${label}: ${value === null ? 'sin datos' : `${value}%`}`}
      >
        <span>{value === null ? '—' : `${value}%`}</span>
      </div>
      <div className="admin-report-ring-card__copy">
        <h3>{label}</h3>
        <p>{detail}</p>
      </div>
    </Card>
  );
};

const FinancialCompositionChart: React.FC<{ collected: number; pending: number }> = ({ collected, pending }) => {
  const total = collected + pending;
  const collectedPct = total > 0 ? (collected / total) * 100 : 0;
  const pendingPct = total > 0 ? 100 - collectedPct : 0;
  return (
    <Card className="admin-report-chart admin-report-financial">
      <div className="admin-report-chart__heading">
        <div>
          <p>Reservas confirmadas</p>
          <h3>Composición de ingresos</h3>
        </div>
        <strong>{fmtMoney(total)}</strong>
      </div>
      <div
        className={`admin-report-stacked-bar${total === 0 ? ' admin-report-stacked-bar--empty' : ''}`}
        role="img"
        aria-label={`Señas cobradas ${fmtMoney(collected)}; saldo pendiente ${fmtMoney(pending)}`}
      >
        {total > 0 && <>
          <span className="admin-report-stacked-bar__collected" style={{ width: `${collectedPct}%` }} />
          <span className="admin-report-stacked-bar__pending" style={{ width: `${pendingPct}%` }} />
        </>}
      </div>
      <div className="admin-report-legend">
        <span><i className="admin-report-key admin-report-key--brand" aria-hidden="true" />Señas cobradas <strong>{fmtMoney(collected)}</strong></span>
        <span><i className="admin-report-key admin-report-key--gold" aria-hidden="true" />Saldo pendiente <strong>{fmtMoney(pending)}</strong></span>
      </div>
    </Card>
  );
};

const ModalBase: React.FC<{ onClose: () => void; children: React.ReactNode; titulo: string; ancho?: string }> = ({ onClose, children, titulo, ancho = 'sm:max-w-md' }) => {
  return (
    <Modal
      closeLabel={`Cerrar ${titulo}`}
      isOpen
      onOpenChange={isOpen => { if (!isOpen) onClose(); }}
      size={ancho === 'sm:max-w-3xl' ? 'wide' : 'default'}
      title={titulo}
    >
      {children}
    </Modal>
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
  4: 'camping-exterior',
};

const modalidadPara = (alojamiento: Alojamiento | undefined): 'privada' | 'compartida' | 'camping' =>
  alojamiento?.tipo === 'domo' ? 'privada' : alojamiento?.tipo === 'camping' ? 'camping' : 'compartida';

const ETIQUETAS_ESTADO_CUENTA = {
  pending: 'Pendiente',
  provisioning: 'Creando cuenta',
  ready: 'Lista',
  failed: 'Fallida',
  disabled: 'Desactivada',
  unknown_outcome: 'Resultado desconocido',
} as const;

const ETIQUETAS_ESTADO_COBRO = {
  sin_pagos: 'Sin pagos registrados',
  pago_parcial: 'Pago parcial',
  sena_pagada: 'Seña pagada',
  pagado_total: 'Pagado en su totalidad',
} as const;

const OPCIONES_TIPO_PAGO = [
  { value: 'sena', label: 'Seña' },
  { value: 'saldo', label: 'Saldo' },
  { value: 'total', label: 'Pago total' },
] as const;

const OPCIONES_METODO_PAGO = [
  { value: 'transferencia_mp', label: 'Transferencia a Mercado Pago' },
  { value: 'transferencia_bancaria', label: 'Transferencia bancaria' },
  { value: 'mercado_pago', label: 'Mercado Pago verificado manualmente' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'otro', label: 'Otro' },
] as const;

const fechaHoraLocalInput = (fecha = new Date()) => {
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

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
  const [mostrandoPagoManual, setMostrandoPagoManual] = useState(false);
  const [registrandoPago, setRegistrandoPago] = useState(false);
  const senaPendiente = reserva?.finanzas
    ? Math.max(0, Math.round((reserva.monto_sena || 0) * 100) - reserva.finanzas.pagadoCentavos)
    : 0;
  const [tipoPagoManual, setTipoPagoManual] = useState<'sena' | 'saldo' | 'total'>(
    senaPendiente > 0 ? 'sena' : 'saldo'
  );
  const [metodoPagoManual, setMetodoPagoManual] = useState('transferencia_mp');
  const pagoSugerido = reserva?.finanzas
    ? (senaPendiente > 0
      ? Math.min(reserva.finanzas.saldoCentavos, senaPendiente)
      : reserva.finanzas.saldoCentavos)
    : 0;
  const [montoPagoManual, setMontoPagoManual] = useState(pagoSugerido / 100);
  const [referenciaPagoManual, setReferenciaPagoManual] = useState('');
  const [fechaPagoManual, setFechaPagoManual] = useState(fechaHoraLocalInput());
  const [motivoPagoManual, setMotivoPagoManual] = useState('');
  const [idempotenciaPagoManual, setIdempotenciaPagoManual] = useState(() => crypto.randomUUID());
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

  const registrarPagoManual = async () => {
    if (!reserva?.finanzas) return;
    const montoCentavos = Math.round(montoPagoManual * 100);
    if (!Number.isSafeInteger(montoCentavos) || montoCentavos <= 0) {
      setError('Ingresá un importe de pago mayor que cero.');
      return;
    }
    if (montoCentavos > reserva.finanzas.saldoCentavos) {
      setError('El importe no puede superar el saldo pendiente.');
      return;
    }
    if (motivoPagoManual.trim().length < 5) {
      setError('Indicá un motivo de al menos 5 caracteres para registrar el pago.');
      return;
    }
    setRegistrandoPago(true);
    setError('');
    try {
      const res = await adminFetch(`/api/v1/admin/reservas/${reserva.id}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expected_version: reserva.version,
          tipo: tipoPagoManual,
          metodo: metodoPagoManual,
          monto_centavos: montoCentavos,
          moneda: reserva.finanzas.moneda,
          referencia: referenciaPagoManual.trim() || null,
          pagado_at: new Date(fechaPagoManual).toISOString(),
          motivo: motivoPagoManual.trim(),
          idempotency_key: idempotenciaPagoManual,
        }),
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar el pago.');
      setGuardado(true);
      setIdempotenciaPagoManual(crypto.randomUUID());
      onGuardado();
      setTimeout(onClose, 900);
    } catch (e: any) {
      setError(e.message || 'No se pudo registrar el pago. Probá de nuevo.');
    } finally {
      setRegistrandoPago(false);
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
        <div className="text-xs text-gray-500 mb-4 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <p className="font-semibold text-gray-700">{reserva?.codigo} · creada el {reserva ? fmtFechaHora(reserva.created_at) : '—'}</p>
          <p className="mt-1">Acá podés corregir datos del huésped y el canal. Las fechas, importes y asignaciones se conservan para no alterar inventario ni trazabilidad.</p>
        </div>
      )}

      {soloLectura && (
        <p className="text-xs text-gray-500 mb-4 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          Modo solo lectura — tu usuario no tiene permiso para crear, editar ni cancelar reservas.
        </p>
      )}

      {modo === 'editar' && (reserva?.preferencias?.length || 0) > 0 && (
        <section className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3" aria-label="Preferencias de preparación">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Preparación solicitada</p>
          {reserva?.preferencias?.map(preferencia => (
            <div key={preferencia.categoria} className="mt-2 text-sm text-emerald-950">
              <strong>{preferencia.nombre}</strong>
              {preferencia.descripcion && <p className="mt-0.5 text-xs text-emerald-800">{preferencia.descripcion}</p>}
            </div>
          ))}
        </section>
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

      {modo === 'editar' && reserva?.finanzas && (
        <section className="mb-4 rounded-lg border border-gray-200 bg-white p-3" aria-label="Estado de pagos">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Pagos</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {ETIQUETAS_ESTADO_COBRO[reserva.finanzas.estado]}
              </p>
            </div>
            {rol === 'super_admin' && reserva.finanzas.saldoCentavos > 0 &&
             !['cancelada', 'vencida', 'rechazada'].includes(reserva.estado) && (
              <Button size="sm" variant="secondary" onPress={() => setMostrandoPagoManual(valor => !valor)}>
                {mostrandoPagoManual ? 'Cerrar registro' : 'Registrar pago'}
              </Button>
            )}
          </div>

          <dl className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-2.5 text-xs">
            <div><dt className="text-gray-500">Total</dt><dd className="mt-0.5 font-semibold tabular-nums">{fmtCentavos(reserva.finanzas.totalCentavos, reserva.finanzas.moneda)}</dd></div>
            <div><dt className="text-gray-500">Registrado</dt><dd className="mt-0.5 font-semibold tabular-nums text-emerald-700">{fmtCentavos(reserva.finanzas.pagadoCentavos, reserva.finanzas.moneda)}</dd></div>
            <div><dt className="text-gray-500">Saldo</dt><dd className="mt-0.5 font-semibold tabular-nums text-amber-700">{fmtCentavos(reserva.finanzas.saldoCentavos, reserva.finanzas.moneda)}</dd></div>
          </dl>

          {reserva.finanzas.pagos.filter(pago => pago.estado === 'aprobado').length > 0 && (
            <div className="mt-3 space-y-1.5" aria-label="Pagos registrados">
              {reserva.finanzas.pagos.filter(pago => pago.estado === 'aprobado').slice(-3).reverse().map(pago => (
                <div key={pago.id} className="flex items-start justify-between gap-3 rounded-md border border-gray-100 px-2.5 py-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-700">{pago.tipo === 'sena' ? 'Seña' : pago.tipo === 'saldo' ? 'Saldo' : 'Pago total'} · {pago.metodoRegistro
                      ? OPCIONES_METODO_PAGO.find(item => item.value === pago.metodoRegistro)?.label || pago.metodoRegistro
                      : pago.proveedor}</p>
                    <p className="mt-0.5 text-gray-500">{fmtFechaHora(pago.pagadoAt || pago.createdAt)}{pago.referenciaManual ? ` · Ref. ${pago.referenciaManual}` : ''}</p>
                  </div>
                  <strong className="shrink-0 tabular-nums text-emerald-700">{fmtCentavos(pago.montoCentavos, reserva.finanzas.moneda)}</strong>
                </div>
              ))}
            </div>
          )}

          {mostrandoPagoManual && rol === 'super_admin' && (
            <div className="mt-3 grid gap-3 border-t border-gray-200 pt-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Concepto" placeholder="Elegí el concepto" value={tipoPagoManual}
                  options={OPCIONES_TIPO_PAGO} onChange={value => value && setTipoPagoManual(value as 'sena' | 'saldo' | 'total')} />
                <Select label="Método" placeholder="Elegí el método" value={metodoPagoManual}
                  options={OPCIONES_METODO_PAGO} onChange={value => value && setMetodoPagoManual(value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <MoneyField currency={reserva.finanzas.moneda} decrementLabel="Reducir importe" incrementLabel="Aumentar importe"
                  label="Importe" minValue={0.01} maxValue={reserva.finanzas.saldoCentavos / 100} showStepper={false}
                  value={montoPagoManual} onChange={setMontoPagoManual} />
                <Input type="datetime-local" label="Fecha del pago" value={fechaPagoManual} onChange={setFechaPagoManual} />
              </div>
              <Input label="Referencia (opcional)" value={referenciaPagoManual} maxLength={160}
                description="Número de operación, comprobante o referencia interna."
                onChange={setReferenciaPagoManual} />
              <Textarea label="Motivo de registro *" rows={2} maxLength={500} value={motivoPagoManual}
                description="Quedará en la auditoría administrativa."
                onChange={setMotivoPagoManual} />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500">Registrar una seña suficiente confirma automáticamente una reserva pendiente y envía sus emails.</p>
                <Button size="sm" isLoading={registrandoPago} isDisabled={registrandoPago || montoPagoManual <= 0 || motivoPagoManual.trim().length < 5}
                  onPress={registrarPagoManual}>Confirmar pago</Button>
              </div>
            </div>
          )}
        </section>
      )}

      {modo === 'editar' && (
        <section className="mb-4 rounded-lg border border-gray-200 bg-white p-3" aria-label="Forma de pago">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Forma de pago</p>
          {!reserva?.metodo_pago ? (
            <p className="mt-2 text-xs text-gray-500">No hay una forma de pago registrada.</p>
          ) : (
            <div className="mt-2 text-xs text-gray-700">
              <p>
                <strong>{reserva.metodo_pago.metodo === 'transferencia_mp' ? 'Transferencia a Mercado Pago' : 'Checkout Mercado Pago'}</strong>
                {' · '}{reserva.metodo_pago.estado}
              </p>
              {reserva.metodo_pago.documentoUltimos4 && (
                <p className="mt-1">DNI de la cuenta pagadora: <strong>•••• {reserva.metodo_pago.documentoUltimos4}</strong></p>
              )}
            </div>
          )}
        </section>
      )}

      {modo === 'editar' && (
        <section className="mb-4 rounded-lg border border-gray-200 bg-white p-3" aria-label="Destino de transferencia">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Destino de transferencia</p>
            {reserva?.cuenta_cobro?.simulada && (
              <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
                Simulado · no usar para cobros reales
              </span>
            )}
          </div>

          {!reserva?.cuenta_cobro ? (
            <p className="mt-2 text-xs text-gray-500">Esta reserva no tiene una cuenta de cobro asignada.</p>
          ) : (
            <div className="mt-2 space-y-2 text-xs text-gray-700">
              <p>
                Estado: <strong>{ETIQUETAS_ESTADO_CUENTA[reserva.cuenta_cobro.estado]}</strong>
                {' · '}Intentos: {reserva.cuenta_cobro.intentos}
              </p>

              {reserva.cuenta_cobro.alias && (
                <div className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-2.5 py-2">
                  <span className="min-w-0"><span className="text-gray-500">Alias:</span> <strong className="break-all">{reserva.cuenta_cobro.alias}</strong></span>
                  <CopyButton
                    className="shrink-0"
                    copiedLabel="Alias copiado"
                    errorLabel="No se pudo copiar el alias"
                    label="Copiar alias"
                    showLabel
                    size="sm"
                    value={reserva.cuenta_cobro.alias}
                    variant="ghost"
                  />
                </div>
              )}

              {reserva.cuenta_cobro.cvu && (
                <div className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-2.5 py-2">
                  <span className="min-w-0"><span className="text-gray-500">CVU:</span> <strong className="break-all tabular-nums">{reserva.cuenta_cobro.cvu}</strong></span>
                  <CopyButton
                    className="shrink-0"
                    copiedLabel="CVU copiado"
                    errorLabel="No se pudo copiar el CVU"
                    label="Copiar CVU"
                    showLabel
                    size="sm"
                    value={reserva.cuenta_cobro.cvu}
                    variant="ghost"
                  />
                </div>
              )}

              {reserva.cuenta_cobro.ultimoErrorCodigo && (
                <p className="rounded-md bg-red-50 px-2.5 py-2 text-red-700">
                  Último error: <strong>{reserva.cuenta_cobro.ultimoErrorCodigo}</strong>
                  {reserva.cuenta_cobro.proximoReintentoAt && <> · próximo intento {reserva.cuenta_cobro.proximoReintentoAt}</>}
                </p>
              )}

              {reserva.cuenta_cobro.revisionesPendientes > 0 && (
                <p className="rounded-md bg-amber-50 px-2.5 py-2 font-semibold text-amber-800">
                  {reserva.cuenta_cobro.revisionesPendientes} pago(s) requieren revisión manual.
                </p>
              )}
            </div>
          )}
        </section>
      )}

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
        <div className="mt-5 pt-4 border-t border-gray-100 grid gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-amber-900">Confirmación administrativa sin pago</p>
          <p className="text-xs text-amber-800">Usá esta excepción sólo cuando corresponda confirmar la reserva sin registrar un cobro.</p>
          <label className="text-xs text-amber-800" htmlFor="f_motivo_confirmacion">Motivo de la excepción *</label>
          <textarea
            id="f_motivo_confirmacion"
            rows={2}
            maxLength={500}
            value={motivoConfirmacion}
            onChange={e => setMotivoConfirmacion(e.target.value)}
            placeholder="Ej. Invitación autorizada sin cargo"
            className={`${inputCls} border-amber-200`}
          />
          <button
            type="button"
            onClick={confirmarReserva}
            disabled={confirmandoReserva}
            className={`justify-self-end text-xs font-semibold text-white bg-amber-800 rounded-lg px-3 py-2 disabled:opacity-60 ${FOCUS_RING}`}
          >
            {confirmandoReserva ? 'Confirmando…' : 'Confirmar sin registrar pago'}
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

const CabeceraHistorialOrdenable: React.FC<{
  campo: OrdenHistorial;
  label: string;
  orden: OrdenHistorial;
  direccion: DireccionOrdenHistorial;
  onOrdenar: (campo: OrdenHistorial) => void;
  alineacion?: 'left' | 'right';
}> = ({ campo, label, orden, direccion, onOrdenar, alineacion = 'left' }) => {
  const activa = campo === orden;
  const Icono = activa ? (direccion === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th
      scope="col"
      aria-sort={activa ? (direccion === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`border-b border-gray-200 px-3 py-2.5 ${alineacion === 'right' ? 'text-right' : ''}`}
    >
      <button
        type="button"
        onClick={() => onOrdenar(campo)}
        className={`inline-flex items-center gap-1 rounded hover:text-brand ${alineacion === 'right' ? 'ml-auto' : ''} ${FOCUS_RING}`}
      >
        {label}
        <Icono size={13} aria-hidden="true" className={activa ? 'text-brand' : 'text-gray-400'} />
        <span className="sr-only">
          {activa ? `Orden ${direccion === 'asc' ? 'ascendente' : 'descendente'}. Cambiar dirección.` : 'Ordenar por esta columna.'}
        </span>
      </button>
    </th>
  );
};

const TablaHistorial: React.FC<{
  reservas: Reserva[];
  onSeleccionar: (r: Reserva) => void;
  orden: OrdenHistorial;
  direccion: DireccionOrdenHistorial;
  onOrdenar: (campo: OrdenHistorial) => void;
}> = ({ reservas, onSeleccionar, orden, direccion, onOrdenar }) => (
  <>
    {/* Tabla — pantallas sm y más grandes */}
    <div className="hidden sm:block overflow-x-auto">
      <table className="text-sm border-collapse w-full">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50">
            <CabeceraHistorialOrdenable campo="creada" label="Reserva" orden={orden} direccion={direccion} onOrdenar={onOrdenar} />
            <CabeceraHistorialOrdenable campo="titular" label="Huésped" orden={orden} direccion={direccion} onOrdenar={onOrdenar} />
            <CabeceraHistorialOrdenable campo="alojamiento" label="Alojamiento" orden={orden} direccion={direccion} onOrdenar={onOrdenar} />
            <CabeceraHistorialOrdenable campo="checkin" label="Fechas" orden={orden} direccion={direccion} onOrdenar={onOrdenar} />
            <CabeceraHistorialOrdenable campo="estado" label="Estado" orden={orden} direccion={direccion} onOrdenar={onOrdenar} />
            <CabeceraHistorialOrdenable campo="origen" label="Canal" orden={orden} direccion={direccion} onOrdenar={onOrdenar} />
            <CabeceraHistorialOrdenable campo="total" label="Total" orden={orden} direccion={direccion} onOrdenar={onOrdenar} alineacion="right" />
            <CabeceraHistorialOrdenable campo="unidad" label="Unidad" orden={orden} direccion={direccion} onOrdenar={onOrdenar} />
          </tr>
        </thead>
        <tbody>
          {reservas.map(r => (
            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2.5 whitespace-nowrap">
                <button onClick={() => onSeleccionar(r)} className={`font-mono text-xs font-semibold text-brand hover:underline rounded ${FOCUS_RING}`}>
                  {r.codigo}
                </button>
                <p className="text-[11px] text-gray-400 tabular-nums">Creada {fmtFechaHora(r.created_at)}</p>
              </td>
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
            <tr><td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-400">Sin resultados para esa búsqueda.</td></tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Lista de tarjetas — mobile */}
    <div className="sm:hidden border-b border-gray-100 bg-gray-50 px-4 py-3">
      <div className="flex items-end gap-2">
        <Select
          className="min-w-0 flex-1"
          label="Ordenar por"
          placeholder="Elegí una columna"
          value={orden}
          options={[
            { value: 'creada', label: 'Reserva creada' },
            { value: 'titular', label: 'Huésped' },
            { value: 'alojamiento', label: 'Alojamiento' },
            { value: 'checkin', label: 'Fecha de llegada' },
            { value: 'estado', label: 'Estado' },
            { value: 'origen', label: 'Canal' },
            { value: 'total', label: 'Total' },
            { value: 'unidad', label: 'Unidad' },
          ]}
          onChange={value => value && onOrdenar(value as OrdenHistorial)}
        />
        <button
          type="button"
          onClick={() => onOrdenar(orden)}
          aria-label={`Orden ${direccion === 'asc' ? 'ascendente' : 'descendente'}. Cambiar dirección.`}
          className={`mb-px inline-flex h-[42px] w-[42px] items-center justify-center rounded-lg border border-gray-300 bg-white text-brand ${FOCUS_RING}`}
        >
          {direccion === 'asc' ? <ArrowUp size={16} aria-hidden="true" /> : <ArrowDown size={16} aria-hidden="true" />}
        </button>
      </div>
    </div>

    <div className="sm:hidden divide-y divide-gray-100">
      {reservas.map(r => (
        <button
          key={r.id}
          onClick={() => onSeleccionar(r)}
          className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 ${FOCUS_RING}`}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{r.cliente_nombre}</p>
              <p className="font-mono text-[11px] font-semibold text-brand truncate">{r.codigo}</p>
            </div>
            <EstadoBadge estado={r.estado} />
          </div>
          <p className="text-xs text-gray-500 tabular-nums mb-0.5">
            {r.alojamiento_nombre} · {fmtDateShort(r.fecha_checkin)}–{fmtDateShort(r.fecha_checkout)}
          </p>
          <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
            <span>{r.canal_origen || 'Sin canal'}{r.unidad_asignada ? ` · ${r.unidad_asignada}` : ''}</span>
            <span className="font-semibold text-gray-600 tabular-nums">{fmtMoney(r.monto_total)}</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400 tabular-nums">Creada {fmtFechaHora(r.created_at)}</p>
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
  const [sincronizando, setSincronizando] = useState(false);
  const [resumen, setResumen] = useState<ResumenSync | null>(null);
  const [error, setError] = useState('');

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
          <div
            key={a.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-xs"
          >
            <span className="flex items-center gap-1.5 text-gray-600"><Link2 size={13} className="text-gray-400 flex-shrink-0" aria-hidden="true" />{a.nombre}</span>
            <CopyButton
              copiedLabel="Link copiado"
              errorLabel="No se pudo copiar el link"
              label={`Copiar link de ${a.nombre}`}
              size="sm"
              value={`${window.location.origin}/api/ical?alojamiento_id=${a.id}`}
              variant="ghost"
            />
          </div>
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

type ConfiguracionBaseApi = {
  parametros: Array<{
    codigo: 'payment_hold_minutes'; valor: number; unidad: string; version: number;
    minimo: number; maximo: number; editable: boolean; fuente: string; actualizadoAt: string;
  }>;
  horariosComidas: {
    version: number; actualizadoAt: string;
    desayuno: { desde: string; hasta: string };
    almuerzo: { desde: string; hasta: string };
    cena: { desde: string; hasta: string };
  };
  servicios: Array<{
    id: number; tipoAlojamiento: 'domo' | 'refugio' | 'camping' | 'bell_tent';
    codigo: string; nombre: string; disponibilidad: 'incluido' | 'no_disponible';
    detalle: string; visibleEnReserva: boolean; orden: number; actualizadoAt: string;
  }>;
  opcionesPreparacion: Array<{
    id: number; tipoAlojamiento: 'domo' | 'refugio' | 'camping' | 'bell_tent';
    modalidad: 'privada' | 'compartida' | 'camping'; cantidadPersonas: number;
    codigo: string; nombre: string; descripcion: string; habilitada: boolean;
    orden: number; actualizadoAt: string;
  }>;
  inventario: Array<{
    codigo: string; nombre: string; tipo: string; capacidadComercial: number;
    capacidadOperativaMaxima: number; reservableGeneral: boolean; reservableRetiro: boolean;
    estado: string; actualizadoAt: string;
    modalidades: Array<{
      id: number; modalidad: string; contexto: string; unidadVenta: string;
      habilitada: boolean; nombreComercial: string; descripcionComercial: string;
      actualizadoAt: string;
    }>;
  }>;
  tarifa: null | {
    id: number; codigo: string; nombre: string; moneda: string; version: number;
    reglasPrecio: number; reglasSena: number; publicadoAt: string;
    temporadas: Array<{
      codigo: string; nombre: string; fechaDesde: string; fechaHasta: string; prioridad: number;
      diasSemana: number[];
      reglas: Array<{
        tipoAlojamiento: 'domo' | 'refugio' | 'camping' | 'bell_tent';
        modalidad: 'cualquiera' | 'privada' | 'compartida' | 'camping';
        ocupacionMin: number; ocupacionMax: number;
        baseCalculo: 'unidad_noche' | 'persona_noche'; importeCentavos: number;
        exclusividadDesde: number | null; exclusividadHasta: number | null;
      }>;
    }>;
    senas: Array<{
      subtotalDesdeCentavos: number; subtotalHastaCentavos: number | null;
      tipo: 'porcentaje_bps' | 'importe_fijo'; valor: number;
    }>;
    ajustes: Array<{
      codigo: string; nombre: string; anticipacionDesdeDias: number; anticipacionHastaDias: number | null;
      direccion: 'descuento' | 'recargo'; tipo: 'porcentaje_bps' | 'importe_fijo'; valor: number;
    }>;
  };
  politicaCancelacion: null | {
    codigo: string; nombre: string; version: number; estado: string; vigenciaDesde: string | null;
    reglas: Array<{ horasMinimasAntes: number; porcentajeDevolucionBps: number }>;
  };
  alimentacion: Array<{
    id: number; codigo: 'desayuno_incluido' | 'pension_completa'; moneda: string; version: number;
    precioComidaCentavos: number; comidasAdicionalesPorPersonaNoche: number; publicadoAt: string;
    precioDesayunoCentavos: number; precioAlmuerzoCentavos: number; precioCenaCentavos: number;
    ajustePaqueteCentavos: number;
  }>;
};

type BorradorTarifaUi = NonNullable<ConfiguracionBaseApi['tarifa']>;
type ResumenPlanTarifaUi = {
  id: number; codigo: string; nombre: string; moneda: string; version: number;
  estado: 'borrador' | 'publicado' | 'retirado'; publicadoAt: string | null; createdAt: string;
};
type BorradorPoliticaUi = NonNullable<ConfiguracionBaseApi['politicaCancelacion']>;
type BorradorInventarioUi = ConfiguracionBaseApi['inventario'];
type BorradorServicioUi = ConfiguracionBaseApi['servicios'][number];
type BorradorOpcionPreparacionUi = ConfiguracionBaseApi['opcionesPreparacion'][number];
type TipoAlojamientoTarifa = BorradorTarifaUi['temporadas'][number]['reglas'][number]['tipoAlojamiento'];

const OPCIONES_ALOJAMIENTO_TARIFA: Array<{ value: TipoAlojamientoTarifa; label: string }> = [
  { value: 'domo', label: 'Domo' },
  { value: 'refugio', label: 'Refugio' },
  { value: 'camping', label: 'Camping' },
  { value: 'bell_tent', label: 'Carpa equipada' },
];

const ETIQUETA_ALOJAMIENTO_PUBLICO: Record<TipoAlojamiento, string> = {
  domo: 'Domo', refugio: 'Refugio', camping: 'Camping',
};
const ETIQUETA_MODALIDAD_PUBLICA: Record<BookingMode, string> = {
  compartida: 'Compartida', privada: 'Privada', camping: 'Camping',
};

const DIAS_SEMANA_TARIFA = [
  { value: 1, label: 'Lun' }, { value: 2, label: 'Mar' }, { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' }, { value: 5, label: 'Vie' }, { value: 6, label: 'Sáb' },
  { value: 7, label: 'Dom' },
] as const;

const TODOS_LOS_DIAS_TARIFA = DIAS_SEMANA_TARIFA.map(dia => dia.value);

type CambioConfiguracion = {
  campo: string;
  anterior: string;
  nuevo: string;
};

type ConfirmacionConfiguracion = {
  titulo: string;
  descripcion: string;
  cambios: CambioConfiguracion[];
  etiquetaConfirmar: string;
  ejecutar: (motivo: string) => Promise<boolean>;
};

const ETIQUETAS_CAMBIO: Record<string, string> = {
  nombre: 'Nombre', moneda: 'Moneda', temporadas: 'Temporadas', reglas: 'Reglas', senas: 'Reglas de seña',
  fechaDesde: 'Desde', fechaHasta: 'Hasta', prioridad: 'Prioridad', diasSemana: 'Días de aplicación',
  tipoAlojamiento: 'Alojamiento',
  modalidad: 'Modalidad', ocupacionMin: 'Ocupación mínima', ocupacionMax: 'Ocupación máxima',
  baseCalculo: 'Base de cálculo', importeCentavos: 'Importe', exclusividadDesde: 'Exclusividad desde',
  exclusividadHasta: 'Exclusividad hasta', subtotalDesdeCentavos: 'Subtotal desde',
  subtotalHastaCentavos: 'Subtotal hasta', tipo: 'Tipo', valor: 'Valor', vigenciaDesde: 'Vigencia desde',
  horasMinimasAntes: 'Horas mínimas', porcentajeDevolucionBps: 'Devolución', capacidadComercial: 'Capacidad comercial',
  capacidadOperativaMaxima: 'Máximo físico/operativo', reservableGeneral: 'Venta general',
  reservableRetiro: 'Retiros', estado: 'Estado comercial', contexto: 'Contexto', unidadVenta: 'Unidad de venta',
  habilitada: 'Habilitada para reservas nuevas', precioComidaCentavos: 'Precio por comida', paymentHoldMinutes: 'Plazo de retención',
};

const valorCambio = (valor: unknown): string => {
  if (valor === null || valor === undefined || valor === '') return 'Sin definir';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  return String(valor);
};

const resumirCambios = (anterior: unknown, nuevo: unknown, ruta = ''): CambioConfiguracion[] => {
  if (Array.isArray(anterior) || Array.isArray(nuevo)) {
    const antes = Array.isArray(anterior) ? anterior : [];
    const despues = Array.isArray(nuevo) ? nuevo : [];
    return Array.from({ length: Math.max(antes.length, despues.length) }, (_, indice) =>
      resumirCambios(antes[indice], despues[indice], `${ruta}${ruta ? ' · ' : ''}${indice + 1}`)
    ).flat();
  }
  if (anterior && nuevo && typeof anterior === 'object' && typeof nuevo === 'object') {
    const claves = Array.from(new Set([...Object.keys(anterior), ...Object.keys(nuevo)]));
    return claves.flatMap(clave => {
      if (['id', 'codigo', 'version', 'actualizadoAt', 'publicadoAt'].includes(clave)) return [];
      const etiqueta = ETIQUETAS_CAMBIO[clave] || clave;
      return resumirCambios((anterior as any)[clave], (nuevo as any)[clave], `${ruta}${ruta ? ' · ' : ''}${etiqueta}`);
    });
  }
  if (Object.is(anterior, nuevo)) return [];
  return [{ campo: ruta || 'Valor', anterior: valorCambio(anterior), nuevo: valorCambio(nuevo) }];
};

const normalizarRangosSena = (reglas: BorradorTarifaUi['senas']): BorradorTarifaUi['senas'] => {
  const ordenadas = [...reglas].sort((a, b) => a.subtotalDesdeCentavos - b.subtotalDesdeCentavos);
  return ordenadas.map((regla, indice) => ({
    ...regla,
    subtotalDesdeCentavos: indice === 0 ? 0 : regla.subtotalDesdeCentavos,
    subtotalHastaCentavos: indice === ordenadas.length - 1
      ? null
      : Math.max(regla.subtotalDesdeCentavos, ordenadas[indice + 1].subtotalDesdeCentavos - 1),
  }));
};

const errorReglasSena = (reglas: BorradorTarifaUi['senas']): string => {
  if (reglas.length === 0) return 'Agregá al menos una regla de seña.';
  const ordenadas = [...reglas].sort((a, b) => a.subtotalDesdeCentavos - b.subtotalDesdeCentavos);
  if (ordenadas[0].subtotalDesdeCentavos !== 0) return 'La primera regla debe comenzar en ARS 0.';
  for (let indice = 0; indice < ordenadas.length; indice += 1) {
    const regla = ordenadas[indice];
    if (!Number.isSafeInteger(regla.subtotalDesdeCentavos) || regla.subtotalDesdeCentavos < 0) {
      return 'Los límites de las reglas deben ser importes válidos.';
    }
    if (indice > 0 && regla.subtotalDesdeCentavos <= ordenadas[indice - 1].subtotalDesdeCentavos) {
      return 'Cada regla debe comenzar en un importe mayor que la anterior.';
    }
    if (!Number.isSafeInteger(regla.valor) || regla.valor < 0 ||
        (regla.tipo === 'porcentaje_bps' && regla.valor > 10_000)) {
      return regla.tipo === 'porcentaje_bps'
        ? 'El porcentaje de seña debe estar entre 0 % y 100 %.'
        : 'El importe fijo de la seña debe ser válido.';
    }
  }
  return '';
};

const opcionesModalidadParaEspacio = (espacio: BorradorInventarioUi[number]) => {
  if (espacio.tipo === 'camping') return [{ value: 'camping', label: 'Camping' }];
  if (espacio.tipo === 'bell_tent') return [{ value: 'privada', label: 'Privada' }, { value: 'camping', label: 'Camping' }];
  if (espacio.tipo === 'domo') return [{ value: 'privada', label: 'Privada' }, { value: 'compartida', label: 'Compartida' }];
  if (espacio.codigo === 'refugio-habitacion-4') return [{ value: 'privada', label: 'Privada' }, { value: 'compartida', label: 'Compartida' }];
  return [{ value: 'compartida', label: 'Compartida' }];
};

const SeccionConfiguracionBase: React.FC<{ esSuperAdmin: boolean; modo?: 'base' | 'precios' }> = ({ esSuperAdmin, modo = 'base' }) => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionBaseApi | null>(null);
  const [valor, setValor] = useState('15');
  const [confirmacion, setConfirmacion] = useState<ConfirmacionConfiguracion | null>(null);
  const [motivoConfirmacion, setMotivoConfirmacion] = useState('');
  const [tarifaDraft, setTarifaDraft] = useState<BorradorTarifaUi | null>(null);
  const [planesTarifa, setPlanesTarifa] = useState<ResumenPlanTarifaUi[]>([]);
  const [politicaDraft, setPoliticaDraft] = useState<BorradorPoliticaUi | null>(null);
  const [inventarioDraft, setInventarioDraft] = useState<BorradorInventarioUi>([]);
  const [serviciosDraft, setServiciosDraft] = useState<BorradorServicioUi[]>([]);
  const [opcionesPreparacionDraft, setOpcionesPreparacionDraft] = useState<BorradorOpcionPreparacionUi[]>([]);
  const [vigenciaPolitica, setVigenciaPolitica] = useState('');
  const [preciosComida, setPreciosComida] = useState<Record<string, string>>({});
  const [horariosComidasDraft, setHorariosComidasDraft] = useState<ConfiguracionBaseApi['horariosComidas'] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [fechaPreview, setFechaPreview] = useState(localTodayIso());
  const {
    data: resumenPreciosPublicos,
    loaded: previewPublicoCargado,
    refresh: refrescarPreviewPublico,
  } = usePublicPricingSummary(fechaPreview);

  const planesPublicados = useMemo(
    () => planesTarifa.filter(plan => plan.estado === 'publicado'),
    [planesTarifa],
  );
  const planEfectivo = useMemo(
    () => configuracion?.tarifa
      ? planesTarifa.find(plan => plan.id === configuracion.tarifa?.id) ?? null
      : null,
    [configuracion?.tarifa, planesTarifa],
  );
  const otrasVersiones = useMemo(
    () => planesTarifa.filter(plan => plan.id !== planEfectivo?.id),
    [planesTarifa, planEfectivo?.id],
  );
  const planPublicoCoincide = Boolean(
    planEfectivo && resumenPreciosPublicos &&
    planEfectivo.codigo === resumenPreciosPublicos.plan.codigo &&
    planEfectivo.version === resumenPreciosPublicos.plan.version
  );
  const publicacionInconsistente = planesPublicados.length !== 1 || (
    previewPublicoCargado && Boolean(resumenPreciosPublicos) && !planPublicoCoincide
  );
  const opcionesPreview = useMemo(() => {
    if (!resumenPreciosPublicos) return [];
    return resumenPreciosPublicos.opciones.flatMap(opcion => opcion.modalidades.map(modalidad => {
      const calcular = (mealPlan: MealPlan) => estimateBookingPrice([resumenPreciosPublicos], {
        people: 2,
        type: opcion.tipo_alojamiento,
        mode: modalidad,
        mealPlan,
      });
      return {
        key: `${opcion.tipo_alojamiento}-${modalidad}`,
        alojamiento: ETIQUETA_ALOJAMIENTO_PUBLICO[opcion.tipo_alojamiento],
        modalidad: opcion.nombres_modalidades?.[modalidad] || ETIQUETA_MODALIDAD_PUBLICA[modalidad],
        desayuno: calcular('desayuno_incluido'),
        pensionCompleta: calcular('pension_completa'),
      };
    }));
  }, [resumenPreciosPublicos]);

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const [res, resPlanes] = await Promise.all([
        adminFetch('/api/v1/admin/configuracion-reservas'),
        adminFetch('/api/admin/tarifas'),
      ]);
      const [body, bodyPlanes]: any[] = await Promise.all([res.json(), resPlanes.json()]);
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      if (!resPlanes.ok) throw new Error(bodyPlanes.error || `HTTP ${resPlanes.status}`);
      setConfiguracion(body.data);
      setValor(String(body.data?.parametros?.[0]?.valor ?? 15));
      setTarifaDraft(body.data?.tarifa ? {
        ...JSON.parse(JSON.stringify(body.data.tarifa)),
        ajustes: body.data.tarifa.ajustes || [],
      } : null);
      setPlanesTarifa(bodyPlanes.planes || []);
      setPoliticaDraft(body.data?.politicaCancelacion ? JSON.parse(JSON.stringify(body.data.politicaCancelacion)) : null);
      setInventarioDraft(JSON.parse(JSON.stringify(body.data?.inventario || [])));
      setServiciosDraft(JSON.parse(JSON.stringify(body.data?.servicios || [])));
      setOpcionesPreparacionDraft(JSON.parse(JSON.stringify(body.data?.opcionesPreparacion || [])));
      setVigenciaPolitica(body.data?.politicaCancelacion?.vigenciaDesde?.slice(0, 16) || new Date(Date.now() + 60_000).toISOString().slice(0, 16));
      setPreciosComida(Object.fromEntries((body.data?.alimentacion || []).flatMap((item: ConfiguracionBaseApi['alimentacion'][number]) => [
        [`${item.codigo}:desayuno`, String(item.precioDesayunoCentavos / 100)],
        [`${item.codigo}:almuerzo`, String(item.precioAlmuerzoCentavos / 100)],
        [`${item.codigo}:cena`, String(item.precioCenaCentavos / 100)],
        [`${item.codigo}:ajuste`, String(item.ajustePaqueteCentavos / 100)],
      ])));
      setHorariosComidasDraft(body.data?.horariosComidas
        ? JSON.parse(JSON.stringify(body.data.horariosComidas))
        : null);
    } catch (e: any) {
      setError(e.message || 'No se pudo cargar la configuración.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const parametro = configuracion?.parametros.find(item => item.codigo === 'payment_hold_minutes');
  const horariosComidasModificados = Boolean(
    horariosComidasDraft && configuracion?.horariosComidas &&
    resumirCambios(configuracion.horariosComidas, horariosComidasDraft).length > 0
  );
  const horariosComidasValidos = Boolean(horariosComidasDraft &&
    [horariosComidasDraft.desayuno, horariosComidasDraft.almuerzo, horariosComidasDraft.cena]
      .every(horario => /^\d{2}:\d{2}$/.test(horario.desde) && /^\d{2}:\d{2}$/.test(horario.hasta) && horario.desde < horario.hasta)
  );
  const ejecutar = async (clave: string, accion: () => Promise<void>, exito: string): Promise<boolean> => {
    setGuardando(clave);
    setError('');
    setMensaje('');
    try {
      await accion();
      setMensaje(exito);
      await cargar();
      return true;
    } catch (e: any) {
      setError(e.message || 'No se pudo actualizar la configuración.');
      return false;
    } finally {
      setGuardando(null);
    }
  };

  const requestJson = async (url: string, init: RequestInit) => {
    const res = await adminFetch(url, init);
    const body: any = await res.json();
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body;
  };

  const guardarPlazo = async (motivo: string) => {
    if (!parametro) return false;
    return ejecutar('plazo', async () => {
      await requestJson('/api/v1/admin/configuracion-reservas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'actualizar_parametro',
          codigo: parametro.codigo,
          valor: Number(valor),
          expected_version: parametro.version,
          motivo: motivo.trim(),
        }),
      });
    }, 'Plazo actualizado. Sólo afecta reservas nuevas.');
  };

  const guardarModalidad = async (item: ConfiguracionBaseApi['inventario'][number]['modalidades'][number], motivo: string) => {
    return ejecutar(`modalidad-${item.id}`, async () => {
      await requestJson('/api/v1/admin/configuracion-reservas', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'actualizar_modalidad', id: item.id, modalidad: item.modalidad,
          contexto: item.contexto, unidad_venta: item.unidadVenta, habilitada: item.habilitada,
          nombre_comercial: item.nombreComercial,
          descripcion_comercial: item.descripcionComercial,
          expected_updated_at: item.actualizadoAt, motivo: motivo.trim(),
        }),
      });
    }, 'Modalidad y condiciones de venta actualizadas para operaciones nuevas.');
  };

  const crearModalidad = async (espacio: BorradorInventarioUi[number], motivo: string) => {
    const opciones = opcionesModalidadParaEspacio(espacio);
    const opcion = opciones.find(candidata => !espacio.modalidades.some(item =>
      item.modalidad === candidata.value && item.contexto === 'general'
    ));
    if (!opcion) throw new Error('No quedan modalidades operativas disponibles para este alojamiento.');
    const unidadVenta = opcion.value === 'privada' ? 'espacio' : opcion.value === 'camping' ? 'parcela' : 'cama';
    return ejecutar(`modalidad-nueva-${espacio.codigo}`, async () => {
      await requestJson('/api/v1/admin/configuracion-reservas', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'crear_modalidad', espacio_codigo: espacio.codigo, modalidad: opcion.value,
          nombre_comercial: opcion.label, contexto: 'general', unidad_venta: unidadVenta,
          descripcion_comercial: '', habilitada: false, motivo,
        }),
      });
    }, 'Modalidad creada. Revisá sus condiciones antes de habilitarla.');
  };

  const guardarEspacio = async (espacio: ConfiguracionBaseApi['inventario'][number], motivo: string) => {
    return ejecutar(`espacio-${espacio.codigo}`, async () => {
      await requestJson('/api/v1/admin/configuracion-reservas', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'actualizar_espacio', codigo: espacio.codigo,
          capacidad_comercial: espacio.capacidadComercial,
          capacidad_operativa_maxima: espacio.capacidadOperativaMaxima,
          reservable_general: espacio.reservableGeneral, reservable_retiro: espacio.reservableRetiro,
          estado: espacio.estado, expected_updated_at: espacio.actualizadoAt,
          motivo: motivo.trim(),
        }),
      });
    }, 'Condiciones del alojamiento actualizadas para operaciones nuevas.');
  };

  const guardarServicio = async (item: BorradorServicioUi, motivo: string) => {
    const nuevo = item.id < 0;
    return ejecutar(`servicio-${item.id}`, async () => {
      await requestJson('/api/v1/admin/configuracion-reservas', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: nuevo ? 'crear_servicio_alojamiento' : 'actualizar_servicio_alojamiento',
          ...(!nuevo ? { id: item.id, expected_updated_at: item.actualizadoAt } : { codigo: item.codigo }),
          tipo_alojamiento: item.tipoAlojamiento, nombre: item.nombre,
          disponibilidad: item.disponibilidad, detalle: item.detalle,
          visible_en_reserva: item.visibleEnReserva, orden: item.orden, motivo,
        }),
      });
    }, nuevo ? 'Servicio agregado a las opciones de reserva.' : 'Servicio actualizado en las opciones de reserva.');
  };

  const guardarOpcionPreparacion = async (item: BorradorOpcionPreparacionUi, motivo: string) => {
    return ejecutar(`preparacion-${item.id}`, async () => {
      await requestJson('/api/v1/admin/configuracion-reservas', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'actualizar_opcion_preparacion', id: item.id,
          tipo_alojamiento: item.tipoAlojamiento, modalidad: item.modalidad,
          cantidad_personas: item.cantidadPersonas, nombre: item.nombre,
          descripcion: item.descripcion, habilitada: item.habilitada, orden: item.orden,
          expected_updated_at: item.actualizadoAt, motivo,
        }),
      });
    }, 'Opción de preparación actualizada para reservas nuevas.');
  };

  const actualizarEspacioDraft = (codigo: string, cambio: Partial<BorradorInventarioUi[number]>) => {
    setInventarioDraft(actual => actual.map(item => item.codigo === codigo ? { ...item, ...cambio } : item));
  };

  const actualizarModalidadDraft = (
    codigo: string,
    id: number,
    cambio: Partial<BorradorInventarioUi[number]['modalidades'][number]>
  ) => {
    setInventarioDraft(actual => actual.map(espacio => espacio.codigo !== codigo ? espacio : {
      ...espacio,
      modalidades: espacio.modalidades.map(item => item.id === id ? { ...item, ...cambio } : item),
    }));
  };

  const actualizarServicioDraft = (id: number, cambio: Partial<BorradorServicioUi>) => {
    setServiciosDraft(actual => actual.map(item => item.id === id ? { ...item, ...cambio } : item));
  };

  const actualizarOpcionPreparacionDraft = (id: number, cambio: Partial<BorradorOpcionPreparacionUi>) => {
    setOpcionesPreparacionDraft(actual => actual.map(item => item.id === id ? { ...item, ...cambio } : item));
  };

  const agregarServicioDraft = () => {
    const ahora = Date.now();
    setServiciosDraft(actual => [...actual, {
      id: -ahora,
      tipoAlojamiento: 'refugio',
      codigo: `servicio-${ahora}`,
      nombre: 'Nuevo servicio',
      disponibilidad: 'incluido',
      detalle: '',
      visibleEnReserva: true,
      orden: Math.min(999, Math.max(0, ...actual.map(item => item.orden)) + 10),
      actualizadoAt: '',
    }]);
  };

  const publicarComida = async (item: ConfiguracionBaseApi['alimentacion'][number], motivo: string) => {
    return ejecutar(`comida-${item.codigo}`, async () => {
      await requestJson('/api/v1/admin/configuracion-reservas', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'publicar_tarifa_alimentacion', codigo: item.codigo,
          precio_comida_centavos: Math.round(Number(preciosComida[`${item.codigo}:${item.codigo === 'pension_completa' ? 'almuerzo' : 'desayuno'}`] || 0) * 100),
          precio_desayuno_centavos: Math.round(Number(preciosComida[`${item.codigo}:desayuno`] || 0) * 100),
          precio_almuerzo_centavos: Math.round(Number(preciosComida[`${item.codigo}:almuerzo`] || 0) * 100),
          precio_cena_centavos: Math.round(Number(preciosComida[`${item.codigo}:cena`] || 0) * 100),
          ajuste_paquete_centavos: Math.round(Number(preciosComida[`${item.codigo}:ajuste`] || 0) * 100),
          expected_version: item.version, motivo: motivo.trim(),
        }),
      });
    }, 'Tarifa de alimentación publicada como una nueva versión.');
  };

  const guardarHorariosComidas = async (motivo: string) => {
    if (!horariosComidasDraft) return false;
    return ejecutar('horarios-comidas', async () => {
      await requestJson('/api/v1/admin/configuracion-reservas', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'actualizar_horarios_comidas',
          desayuno_desde: horariosComidasDraft.desayuno.desde,
          desayuno_hasta: horariosComidasDraft.desayuno.hasta,
          almuerzo_desde: horariosComidasDraft.almuerzo.desde,
          almuerzo_hasta: horariosComidasDraft.almuerzo.hasta,
          cena_desde: horariosComidasDraft.cena.desde,
          cena_hasta: horariosComidasDraft.cena.hasta,
          expected_version: horariosComidasDraft.version,
          motivo: motivo.trim(),
        }),
      });
      refrescarPreviewPublico();
    }, 'Horarios de comidas actualizados.');
  };

  const actualizarTemporada = (indice: number, cambio: Partial<BorradorTarifaUi['temporadas'][number]>) => {
    setTarifaDraft(actual => actual ? {
      ...actual, temporadas: actual.temporadas.map((item, i) => i === indice ? { ...item, ...cambio } : item),
    } : actual);
  };

  const alternarDiaTemporada = (indice: number, dia: number, seleccionado: boolean) => {
    setTarifaDraft(actual => {
      if (!actual) return actual;
      const temporada = actual.temporadas[indice];
      if (!temporada) return actual;
      const actuales = temporada.diasSemana || TODOS_LOS_DIAS_TARIFA;
      const diasSemana = seleccionado
        ? Array.from(new Set([...actuales, dia])).sort((a, b) => a - b)
        : actuales.filter(item => item !== dia);
      if (diasSemana.length === 0) return actual;
      return {
        ...actual,
        temporadas: actual.temporadas.map((item, posicion) =>
          posicion === indice ? { ...item, diasSemana } : item
        ),
      };
    });
  };

  const dividirTemporadaPorSemana = (indice: number) => {
    setTarifaDraft(actual => {
      if (!actual) return actual;
      const temporada = actual.temporadas[indice];
      if (!temporada) return actual;
      const codigos = new Set(actual.temporadas.map(item => item.codigo));
      const codigoBase = `${temporada.codigo.replace(/-(semana|fin-semana)$/i, '')}-fin-semana`.slice(0, 50);
      let codigoFinSemana = codigoBase;
      let sufijo = 2;
      while (codigos.has(codigoFinSemana)) {
        codigoFinSemana = `${codigoBase.slice(0, 47)}-${sufijo}`;
        sufijo += 1;
      }
      const entreSemana = {
        ...temporada,
        nombre: `${temporada.nombre} · entre semana`,
        diasSemana: [1, 2, 3, 4, 5],
      };
      const finSemana = {
        ...temporada,
        codigo: codigoFinSemana,
        nombre: `${temporada.nombre} · fin de semana`,
        diasSemana: [6, 7],
        reglas: temporada.reglas.map(regla => ({ ...regla })),
      };
      return {
        ...actual,
        temporadas: actual.temporadas.flatMap((item, posicion) =>
          posicion === indice ? [entreSemana, finSemana] : [item]
        ),
      };
    });
  };

  const eliminarTemporada = (indice: number) => {
    setTarifaDraft(actual => !actual || actual.temporadas.length <= 1 ? actual : {
      ...actual,
      temporadas: actual.temporadas.filter((_, posicion) => posicion !== indice),
    });
  };

  const agregarTemporada = () => setTarifaDraft(actual => {
    if (!actual) return actual;
    const base = actual.temporadas.at(-1);
    if (!base) return actual;
    const numero = actual.temporadas.length + 1;
    return {
      ...actual,
      temporadas: [...actual.temporadas, {
        ...base,
        codigo: `temporada-${numero}`,
        nombre: `Temporada ${numero}`,
        prioridad: Math.max(...actual.temporadas.map(item => item.prioridad), 0) + 1,
        reglas: base.reglas.map(regla => ({ ...regla })),
      }],
    };
  });

  const iniciarPlanAlternativo = () => setTarifaDraft(actual => actual ? ({
    ...actual,
    codigo: `plan-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`,
    nombre: `${actual.nombre} · alternativa`,
    version: 0,
  }) : actual);

  const actualizarReglaPrecio = (temporadaIndice: number, reglaIndice: number, cambio: Partial<BorradorTarifaUi['temporadas'][number]['reglas'][number]>) => {
    setTarifaDraft(actual => actual ? {
      ...actual,
      temporadas: actual.temporadas.map((temporada, i) => i !== temporadaIndice ? temporada : {
        ...temporada, reglas: temporada.reglas.map((regla, j) => j === reglaIndice ? { ...regla, ...cambio } : regla),
      }),
    } : actual);
  };

  const agregarReglaPrecio = (temporadaIndice: number) => {
    setTarifaDraft(actual => {
      if (!actual) return actual;
      const temporada = actual.temporadas[temporadaIndice];
      if (!temporada) return actual;
      const tiposActivos = OPCIONES_ALOJAMIENTO_TARIFA
        .map(opcion => opcion.value)
        .filter(tipo => inventarioDraft.some(espacio =>
          espacio.tipo === tipo && espacio.estado === 'activo' && espacio.reservableGeneral
        ));
      const tipoSinTarifa = tiposActivos.find(tipo => !temporada.reglas.some(regla => regla.tipoAlojamiento === tipo));
      const tipoAlojamiento = tipoSinTarifa ?? tiposActivos[0] ?? 'domo';
      const capacidad = Math.max(1, ...inventarioDraft
        .filter(espacio => espacio.tipo === tipoAlojamiento)
        .map(espacio => espacio.capacidadComercial));
      const nuevaRegla: BorradorTarifaUi['temporadas'][number]['reglas'][number] = {
        tipoAlojamiento,
        modalidad: tipoAlojamiento === 'camping' ? 'camping' : 'cualquiera',
        ocupacionMin: 1,
        ocupacionMax: capacidad,
        baseCalculo: 'persona_noche',
        importeCentavos: 0,
        exclusividadDesde: null,
        exclusividadHasta: null,
      };
      return {
        ...actual,
        temporadas: actual.temporadas.map((item, indice) => indice === temporadaIndice
          ? { ...item, reglas: [...item.reglas, nuevaRegla] }
          : item),
      };
    });
  };

  const eliminarReglaPrecio = (temporadaIndice: number, reglaIndice: number) => {
    setTarifaDraft(actual => actual ? {
      ...actual,
      temporadas: actual.temporadas.map((temporada, indice) => indice === temporadaIndice
        ? { ...temporada, reglas: temporada.reglas.filter((_, posicion) => posicion !== reglaIndice) }
        : temporada),
    } : actual);
  };

  const actualizarSena = (indice: number, cambio: Partial<BorradorTarifaUi['senas'][number]>) => {
    setTarifaDraft(actual => actual ? {
      ...actual,
      senas: normalizarRangosSena(actual.senas.map((item, i) => i === indice ? { ...item, ...cambio } : item)),
    } : actual);
  };

  const agregarSena = () => {
    setTarifaDraft(actual => {
      if (!actual) return actual;
      const ordenadas = [...actual.senas].sort((a, b) => a.subtotalDesdeCentavos - b.subtotalDesdeCentavos);
      const ultima = ordenadas.at(-1);
      const desde = (ultima?.subtotalDesdeCentavos ?? 0) + 15_000_000;
      return {
        ...actual,
        senas: normalizarRangosSena([
          ...ordenadas,
          { subtotalDesdeCentavos: desde, subtotalHastaCentavos: null, tipo: 'porcentaje_bps', valor: 3000 },
        ]),
      };
    });
  };

  const eliminarSena = (indice: number) => {
    setTarifaDraft(actual => {
      if (!actual || actual.senas.length <= 1) return actual;
      return { ...actual, senas: normalizarRangosSena(actual.senas.filter((_, i) => i !== indice)) };
    });
  };

  const agregarAjuste = () => setTarifaDraft(actual => actual ? ({
    ...actual,
    ajustes: [...(actual.ajustes || []), {
      codigo: `ajuste-${(actual.ajustes || []).length + 1}`,
      nombre: 'Nueva regla',
      anticipacionDesdeDias: 0,
      anticipacionHastaDias: 3,
      direccion: 'descuento',
      tipo: 'porcentaje_bps',
      valor: 1000,
    }],
  }) : actual);

  const actualizarAjuste = (indice: number, cambio: Partial<BorradorTarifaUi['ajustes'][number]>) =>
    setTarifaDraft(actual => actual ? ({
      ...actual,
      ajustes: (actual.ajustes || []).map((regla, posicion) => posicion === indice ? { ...regla, ...cambio } : regla),
    }) : actual);

  const eliminarAjuste = (indice: number) => setTarifaDraft(actual => actual ? ({
    ...actual,
    ajustes: (actual.ajustes || []).filter((_, posicion) => posicion !== indice),
  }) : actual);

  const publicarTarifa = async (motivo: string) => {
    if (!tarifaDraft) return false;
    return ejecutar('tarifa', async () => {
      const borrador = await requestJson('/api/admin/tarifas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'crear_borrador', motivo, plan: {
          codigo: tarifaDraft.codigo, nombre: tarifaDraft.nombre, moneda: tarifaDraft.moneda,
          temporadas: tarifaDraft.temporadas.map(temporada => ({
            codigo: temporada.codigo, nombre: temporada.nombre,
            fecha_desde: temporada.fechaDesde, fecha_hasta: temporada.fechaHasta, prioridad: temporada.prioridad,
            dias_semana: temporada.diasSemana,
            reglas: temporada.reglas.map(regla => ({
              tipo_alojamiento: regla.tipoAlojamiento, modalidad: regla.modalidad,
              ocupacion_min: regla.ocupacionMin, ocupacion_max: regla.ocupacionMax,
              base_calculo: regla.baseCalculo, importe_centavos: regla.importeCentavos,
              exclusividad_desde: regla.exclusividadDesde, exclusividad_hasta: regla.exclusividadHasta,
            })),
          })),
          senas: tarifaDraft.senas.map(regla => ({
            subtotal_desde_centavos: regla.subtotalDesdeCentavos,
            subtotal_hasta_centavos: regla.subtotalHastaCentavos,
            tipo: regla.tipo, valor: regla.valor,
          })),
          ajustes: (tarifaDraft.ajustes || []).map(regla => ({
            codigo: regla.codigo, nombre: regla.nombre,
            anticipacion_desde_dias: regla.anticipacionDesdeDias,
            anticipacion_hasta_dias: regla.anticipacionHastaDias,
            direccion: regla.direccion, tipo: regla.tipo, valor: regla.valor,
          })),
        } }),
      });
      await requestJson('/api/admin/tarifas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'publicar', plan_id: borrador.plan.id, motivo }),
      });
      refrescarPreviewPublico();
    }, 'Nueva versión de precios y seña publicada.');
  };

  const publicarPolitica = async (motivo: string) => {
    if (!politicaDraft) return false;
    return ejecutar('politica', async () => {
      const borrador = await requestJson('/api/admin/politicas-reserva', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'crear_borrador', motivo, politica: {
          codigo: politicaDraft.codigo, nombre: politicaDraft.nombre,
          vigencia_desde: new Date(vigenciaPolitica).toISOString(),
          reglas: politicaDraft.reglas.map(regla => ({
            horas_minimas_antes: regla.horasMinimasAntes,
            porcentaje_devolucion_bps: regla.porcentajeDevolucionBps,
          })),
        } }),
      });
      await requestJson('/api/admin/politicas-reserva', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'publicar', politica_id: borrador.politica.id, motivo }),
      });
    }, 'Nueva política de cancelación publicada.');
  };

  const pedirConfirmacion = (datos: Omit<ConfirmacionConfiguracion, 'ejecutar'> & { ejecutar: (motivo: string) => Promise<boolean> }) => {
    if (datos.cambios.length === 0) return;
    setMotivoConfirmacion('');
    setConfirmacion(datos);
  };

  const confirmarCambio = async () => {
    if (!confirmacion || motivoConfirmacion.trim().length < 5) return;
    const guardado = await confirmacion.ejecutar(motivoConfirmacion.trim());
    if (guardado) {
      setConfirmacion(null);
      setMotivoConfirmacion('');
    }
  };

  const confirmarTarifa = () => {
    if (!tarifaDraft || !configuracion?.tarifa) return;
    const errorSena = errorReglasSena(tarifaDraft.senas);
    if (errorSena) {
      setError(errorSena);
      return;
    }
    pedirConfirmacion({
      titulo: 'Publicar precios y seña',
      descripcion: 'Se creará una nueva versión para reservas futuras.',
      cambios: resumirCambios(configuracion.tarifa, tarifaDraft),
      etiquetaConfirmar: 'Publicar nueva versión',
      ejecutar: publicarTarifa,
    });
  };

  const confirmarPolitica = () => {
    if (!politicaDraft || !configuracion?.politicaCancelacion) return;
    pedirConfirmacion({
      titulo: 'Publicar política de cancelación',
      descripcion: 'La nueva versión se aplicará a operaciones futuras desde la vigencia indicada.',
      cambios: resumirCambios(
        { ...configuracion.politicaCancelacion, vigenciaDesde: configuracion.politicaCancelacion.vigenciaDesde?.slice(0, 16) || '' },
        { ...politicaDraft, vigenciaDesde: vigenciaPolitica }
      ),
      etiquetaConfirmar: 'Publicar nueva política',
      ejecutar: publicarPolitica,
    });
  };

  const confirmarEspacio = (espacio: BorradorInventarioUi[number], original: BorradorInventarioUi[number]) => {
    const seleccionar = (item: BorradorInventarioUi[number]) => ({
      capacidadComercial: item.capacidadComercial,
      capacidadOperativaMaxima: item.capacidadOperativaMaxima,
      reservableGeneral: item.reservableGeneral,
      reservableRetiro: item.reservableRetiro,
      estado: item.estado,
    });
    pedirConfirmacion({
      titulo: `Guardar condiciones de ${espacio.nombre}`,
      descripcion: 'Estas condiciones afectarán sólo a operaciones nuevas.',
      cambios: resumirCambios(seleccionar(original), seleccionar(espacio)),
      etiquetaConfirmar: 'Guardar condiciones',
      ejecutar: motivo => guardarEspacio(espacio, motivo),
    });
  };

  const confirmarModalidad = (
    espacio: BorradorInventarioUi[number],
    item: BorradorInventarioUi[number]['modalidades'][number],
    original: BorradorInventarioUi[number]['modalidades'][number]
  ) => pedirConfirmacion({
    titulo: `Guardar modalidad de ${espacio.nombre}`,
    descripcion: 'La disponibilidad para reservas existentes no se modifica.',
    cambios: resumirCambios(original, item),
    etiquetaConfirmar: 'Guardar modalidad',
    ejecutar: motivo => guardarModalidad(item, motivo),
  });

  const confirmarServicio = (item: BorradorServicioUi) => {
    const original = configuracion?.servicios.find(actual => actual.id === item.id);
    const seleccionar = (servicio: BorradorServicioUi) => ({
      alojamiento: servicio.tipoAlojamiento,
      nombre: servicio.nombre,
      disponibilidad: servicio.disponibilidad,
      detalle: servicio.detalle,
      visibleEnReserva: servicio.visibleEnReserva,
      orden: servicio.orden,
    });
    pedirConfirmacion({
      titulo: `${original ? 'Guardar' : 'Agregar'} servicio de alojamiento`,
      descripcion: 'La información se mostrará en las opciones de reserva, sin modificar precio ni disponibilidad.',
      cambios: original
        ? resumirCambios(seleccionar(original), seleccionar(item))
        : resumirCambios({}, seleccionar(item)),
      etiquetaConfirmar: original ? 'Guardar servicio' : 'Agregar servicio',
      ejecutar: motivo => guardarServicio(item, motivo),
    });
  };

  const confirmarOpcionPreparacion = (item: BorradorOpcionPreparacionUi) => {
    const original = configuracion?.opcionesPreparacion.find(actual => actual.id === item.id);
    if (!original) return;
    pedirConfirmacion({
      titulo: `Guardar preparación “${item.nombre}”`,
      descripcion: 'La opción se solicitará únicamente en reservas nuevas que coincidan con estas condiciones.',
      cambios: resumirCambios(original, item),
      etiquetaConfirmar: 'Guardar opción',
      ejecutar: motivo => guardarOpcionPreparacion(item, motivo),
    });
  };

  const confirmarComida = (item: ConfiguracionBaseApi['alimentacion'][number]) => pedirConfirmacion({
    titulo: `Publicar tarifa de ${item.codigo === 'pension_completa' ? 'pensión completa' : 'desayuno incluido'}`,
    descripcion: 'Se publicará una nueva versión para operaciones futuras.',
    cambios: resumirCambios(
      item.codigo === 'pension_completa' ? {
        desayuno: item.precioDesayunoCentavos / 100,
        almuerzo: item.precioAlmuerzoCentavos / 100,
        cena: item.precioCenaCentavos / 100,
        ajustePaquete: item.ajustePaqueteCentavos / 100,
      } : { desayuno: item.precioDesayunoCentavos / 100 },
      item.codigo === 'pension_completa' ? {
        desayuno: Number(preciosComida[`${item.codigo}:desayuno`] || 0),
        almuerzo: Number(preciosComida[`${item.codigo}:almuerzo`] || 0),
        cena: Number(preciosComida[`${item.codigo}:cena`] || 0),
        ajustePaquete: Number(preciosComida[`${item.codigo}:ajuste`] || 0),
      } : { desayuno: Number(preciosComida[`${item.codigo}:desayuno`] || 0) }
    ).map(cambio => ({ ...cambio, anterior: `ARS ${cambio.anterior}`, nuevo: `ARS ${cambio.nuevo}` })),
    etiquetaConfirmar: 'Publicar nueva versión',
    ejecutar: motivo => publicarComida(item, motivo),
  });

  const confirmarHorariosComidas = () => {
    if (!horariosComidasDraft || !configuracion?.horariosComidas) return;
    pedirConfirmacion({
      titulo: 'Guardar horarios de comidas',
      descripcion: 'Los nuevos horarios se mostrarán en la reserva online y en la página de estadías.',
      cambios: resumirCambios(configuracion.horariosComidas, horariosComidasDraft),
      etiquetaConfirmar: 'Guardar horarios',
      ejecutar: guardarHorariosComidas,
    });
  };

  const confirmarPlazo = () => {
    if (!parametro) return;
    pedirConfirmacion({
      titulo: 'Cambiar plazo de retención',
      descripcion: 'El nuevo plazo se usará al iniciar reservas futuras.',
      cambios: [{ campo: 'Plazo de retención', anterior: `${parametro.valor} minutos`, nuevo: `${Number(valor)} minutos` }],
      etiquetaConfirmar: 'Guardar plazo',
      ejecutar: guardarPlazo,
    });
  };

  if (cargando && !configuracion) {
    return <LoadingState className="py-16" label="Cargando configuración" />;
  }

  return (
    <div className="admin-config">
      <div className="admin-config__intro">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{modo === 'precios' ? 'Políticas de precios' : 'Configuración base'}</h2>
        <p className="mt-1 text-xs text-gray-500">
          {modo === 'precios'
            ? 'Construí ofertas vendibles con temporadas, tarifas, alimentación, ajustes y reglas de seña.'
            : 'Administrá estructuras, capacidades, modalidades operativas y parámetros generales.'}
        </p>
        {!esSuperAdmin && <p className="mt-2 text-xs font-semibold text-amber-700">Vista de solo lectura. Sólo un superadministrador puede publicar cambios.</p>}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{error}</p>}
      {mensaje && <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700" role="status">{mensaje}</p>}

      {modo === 'precios' && <section className="admin-pricing-overview rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Política efectiva y vista pública</h3>
            <p className="text-xs text-gray-500">Confirmá qué versión cotiza hoy y revisá el precio que recibe el huésped.</p>
          </div>
          <Badge variant={publicacionInconsistente ? 'danger' : 'success'}>
            {publicacionInconsistente ? 'Requiere revisión' : 'Publicación consistente'}
          </Badge>
        </div>

        {publicacionInconsistente && <div className="admin-pricing-alert mt-3" role="alert">
          <AlertTriangle aria-hidden="true" size={18} />
          <div>
            <strong>El estado publicado no es consistente.</strong>
            <p>
              {planesPublicados.length !== 1
                ? `Hay ${planesPublicados.length} planes marcados como publicados; debería existir exactamente uno.`
                : `La API pública responde ${resumenPreciosPublicos?.plan.codigo || 'otro plan'} v${resumenPreciosPublicos?.plan.version || '—'}, distinto de la política administrativa.`}
              {' '}Revisalo antes de habilitar nuevas ventas.
            </p>
          </div>
        </div>}

        <div className="admin-pricing-overview__grid mt-3">
          <Card tone="muted" className="admin-pricing-current p-4">
            <div className="admin-pricing-current__heading">
              <div>
                <p className="admin-pricing-eyebrow">Efectiva ahora</p>
                <h4>{planEfectivo?.nombre || 'Sin política publicada'}</h4>
              </div>
              <Badge variant={planEfectivo ? 'success' : 'danger'}>{planEfectivo ? 'Vigente' : 'Bloqueante'}</Badge>
            </div>
            {planEfectivo && <>
              <div className="admin-pricing-current__meta">
                <CodeBadge>{planEfectivo.codigo}</CodeBadge>
                <span>Versión {planEfectivo.version}</span>
                <span>{planEfectivo.moneda}</span>
              </div>
              <p className="admin-pricing-current__published">Publicada {planEfectivo.publicadoAt ? fmtFechaHora(planEfectivo.publicadoAt) : 'sin fecha registrada'}</p>
              <p className="admin-pricing-current__note">Las nuevas cotizaciones toman esta política. Las reservas existentes conservan su precio registrado.</p>
            </>}
          </Card>

          <Card className="admin-pricing-preview p-4">
            <div className="admin-pricing-preview__heading">
              <div>
                <p className="admin-pricing-eyebrow">Vista pública</p>
                <h4>2 personas · 1 noche</h4>
              </div>
              <label className="admin-pricing-preview__date">Fecha representativa
                <input type="date" value={fechaPreview} onChange={event => setFechaPreview(event.target.value)} className={FOCUS_RING} />
              </label>
            </div>

            {!previewPublicoCargado ? <LoadingState className="py-5" label="Calculando precios públicos" /> :
              !resumenPreciosPublicos ? <div className="admin-pricing-preview__empty">
                <AlertTriangle aria-hidden="true" size={18} />
                <span>No hay una política pública aplicable para esta fecha.</span>
              </div> : <>
                <p className="admin-pricing-preview__source">
                  Respuesta pública: <CodeBadge>{resumenPreciosPublicos.plan.codigo}</CodeBadge> · v{resumenPreciosPublicos.plan.version}
                </p>
                <div className="admin-pricing-preview__grid">
                  {opcionesPreview.map(opcion => <div className="admin-pricing-preview__option" key={opcion.key}>
                    <div><strong>{opcion.alojamiento}</strong><span>{opcion.modalidad}</span></div>
                    <dl>
                      <div><dt>Con desayuno</dt><dd>{opcion.desayuno ? fmtCentavos(opcion.desayuno.totalCentavos, opcion.desayuno.currency) : 'Sin tarifa'}</dd></div>
                      <div><dt>Por persona</dt><dd>{opcion.desayuno ? fmtCentavos(opcion.desayuno.perPersonCentavos, opcion.desayuno.currency) : '—'}</dd></div>
                      <div><dt>Pensión completa</dt><dd>{opcion.pensionCompleta ? fmtCentavos(opcion.pensionCompleta.totalCentavos, opcion.pensionCompleta.currency) : 'No disponible'}</dd></div>
                    </dl>
                  </div>)}
                  {opcionesPreview.length === 0 && <p className="admin-pricing-preview__empty">No hay ofertas vendibles para 2 personas en esta fecha.</p>}
                </div>
              </>}
            <a className={`admin-pricing-preview__link ${FOCUS_RING}`} href="/reservar?paso=fechas" target="_blank" rel="noreferrer">
              <Link2 aria-hidden="true" size={15} />Abrir reserva pública
            </a>
          </Card>
        </div>

        <details className="admin-pricing-history mt-3">
          <summary>
            <span>Historial y borradores</span>
            <Badge variant="neutral">{otrasVersiones.length}</Badge>
          </summary>
          {otrasVersiones.length === 0 ? <p className="admin-pricing-history__empty">Todavía no hay otras versiones.</p> :
            <div className="admin-config__horizontal-scroll mt-3 flex gap-2 pb-1">{otrasVersiones.map(plan => <Card key={plan.id} tone="muted" className="min-w-[220px] p-3">
              <div className="flex items-start justify-between gap-2">
                <strong className="text-sm">{plan.nombre}</strong>
                <Badge variant={plan.estado === 'publicado' ? 'danger' : plan.estado === 'borrador' ? 'warning' : 'neutral'}>
                  {plan.estado === 'publicado' ? 'publicado · conflicto' : plan.estado}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-gray-500"><CodeBadge>{plan.codigo}</CodeBadge> · v{plan.version} · {plan.moneda}</p>
              <p className="mt-2 text-[11px] text-gray-500">{plan.publicadoAt ? `Publicada ${fmtFechaHora(plan.publicadoAt)}` : `Creada ${fmtFechaHora(plan.createdAt)}`}</p>
            </Card>)}</div>}
        </details>
      </section>}

      {modo === 'precios' && <details open className="admin-config__section rounded-xl border border-gray-200 bg-white shadow-sm">
        <summary><span><strong>Precios y seña</strong><small>Tarifas, temporadas y anticipo requerido</small></span></summary>
        <div className="admin-config__section-body space-y-4 border-t border-gray-100">
          {!tarifaDraft ? <p className="text-sm text-amber-700">Sin tarifa publicada.</p> : <>
            <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="grid flex-1 gap-3 md:grid-cols-3">
              <label className="text-xs font-semibold text-gray-600">Nombre del plan
                <input value={tarifaDraft.nombre} disabled={!esSuperAdmin} onChange={event => setTarifaDraft({ ...tarifaDraft, nombre: event.target.value })}
                  className={`mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${FOCUS_RING}`} />
              </label>
              <label className="text-xs font-semibold text-gray-600">Código del plan
                <input value={tarifaDraft.codigo} disabled={!esSuperAdmin} onChange={event => setTarifaDraft({ ...tarifaDraft, codigo: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <div className="text-xs text-gray-500"><strong className="block text-gray-700">Versión vigente</strong>v{tarifaDraft.version} · {tarifaDraft.moneda}</div>
            </div>
            {esSuperAdmin && <Button size="sm" variant="secondary" onPress={iniciarPlanAlternativo}><Plus size={15} />Nuevo plan desde éste</Button>}
            </div>
            <div className="flex justify-end">{esSuperAdmin && <Button size="sm" variant="secondary" onPress={agregarTemporada}><Plus size={15} />Agregar temporada</Button>}</div>
            {tarifaDraft.temporadas.map((temporada, temporadaIndice) => (
              <div key={`${temporada.codigo}-${temporadaIndice}`} className="admin-config__season rounded-lg border border-gray-200 p-4">
                <div className="grid gap-3 md:grid-cols-5">
                  <label className="text-xs font-semibold text-gray-600">Temporada
                    <input value={temporada.nombre} disabled={!esSuperAdmin} onChange={event => actualizarTemporada(temporadaIndice, { nombre: event.target.value })} className={`mt-1 w-full rounded border px-2 py-2 text-sm ${FOCUS_RING}`} />
                  </label>
                  <label className="text-xs font-semibold text-gray-600">Desde
                    <input type="date" value={temporada.fechaDesde} disabled={!esSuperAdmin} onChange={event => actualizarTemporada(temporadaIndice, { fechaDesde: event.target.value })} className={`mt-1 w-full rounded border px-2 py-2 text-sm ${FOCUS_RING}`} />
                  </label>
                  <label className="text-xs font-semibold text-gray-600">Hasta
                    <input type="date" value={temporada.fechaHasta} disabled={!esSuperAdmin} onChange={event => actualizarTemporada(temporadaIndice, { fechaHasta: event.target.value })} className={`mt-1 w-full rounded border px-2 py-2 text-sm ${FOCUS_RING}`} />
                  </label>
                  <label className="text-xs font-semibold text-gray-600">Prioridad
                    <input type="number" min={0} value={temporada.prioridad} disabled={!esSuperAdmin} onChange={event => actualizarTemporada(temporadaIndice, { prioridad: Number(event.target.value) })} className={`mt-1 w-full rounded border px-2 py-2 text-sm ${FOCUS_RING}`} />
                  </label>
                  <div className="text-xs text-gray-500"><strong className="block text-gray-700">Código</strong>{temporada.codigo}</div>
                </div>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
                  <fieldset>
                    <legend className="text-xs font-semibold text-gray-600">Días en los que se aplica este precio</legend>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {DIAS_SEMANA_TARIFA.map(dia => <Checkbox
                        key={dia.value}
                        isDisabled={!esSuperAdmin || (temporada.diasSemana?.length === 1 && temporada.diasSemana.includes(dia.value))}
                        isSelected={(temporada.diasSemana || TODOS_LOS_DIAS_TARIFA).includes(dia.value)}
                        onChange={seleccionado => alternarDiaTemporada(temporadaIndice, dia.value, seleccionado)}
                      >{dia.label}</Checkbox>)}
                    </div>
                  </fieldset>
                  {esSuperAdmin && <div className="flex flex-wrap gap-2">
                    {(temporada.diasSemana || TODOS_LOS_DIAS_TARIFA).length === 7 && <Button
                      size="sm"
                      variant="secondary"
                      onPress={() => dividirTemporadaPorSemana(temporadaIndice)}
                    >Dividir semana / fin de semana</Button>}
                    <Button
                      size="sm"
                      variant="secondary"
                      isDisabled={tarifaDraft.temporadas.length <= 1}
                      onPress={() => eliminarTemporada(temporadaIndice)}
                    ><Trash2 size={14} />Eliminar período</Button>
                  </div>}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tarifas de alojamiento</p>
                    <p className="mt-1 text-xs text-gray-500">Agregá una fila por alojamiento, modalidad o rango de ocupación que quieras vender.</p>
                  </div>
                  {esSuperAdmin && <Button size="sm" variant="secondary" onPress={() => agregarReglaPrecio(temporadaIndice)}><Plus size={15} />Agregar tarifa</Button>}
                </div>
                <div className="admin-config__horizontal-scroll mt-2">
                  <table className="min-w-[940px] w-full text-left text-xs">
                    <thead><tr className="border-b text-gray-500"><th className="py-2">Alojamiento</th><th>Modalidad</th><th>Ocupación</th><th>Base</th><th>Precio ARS</th><th>Exclusividad</th>{esSuperAdmin && <th className="w-12"><span className="sr-only">Acciones</span></th>}</tr></thead>
                    <tbody>{temporada.reglas.map((regla, reglaIndice) => (
                      <tr key={reglaIndice} className="border-b border-gray-100">
                        <td className="py-2"><select aria-label={`Alojamiento de tarifa ${reglaIndice + 1}`} value={regla.tipoAlojamiento} disabled={!esSuperAdmin} onChange={event => actualizarReglaPrecio(temporadaIndice, reglaIndice, { tipoAlojamiento: event.target.value as TipoAlojamientoTarifa })} className="rounded border px-2 py-1">{OPCIONES_ALOJAMIENTO_TARIFA.map(opcion => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}</select></td>
                        <td><select value={regla.modalidad} disabled={!esSuperAdmin} onChange={event => actualizarReglaPrecio(temporadaIndice, reglaIndice, { modalidad: event.target.value as any })} className="rounded border px-2 py-1"><option value="cualquiera">Cualquiera</option><option value="privada">Privada</option><option value="compartida">Compartida</option><option value="camping">Camping</option></select></td>
                        <td><input aria-label="Ocupación mínima" type="number" min={1} value={regla.ocupacionMin} disabled={!esSuperAdmin} onChange={event => actualizarReglaPrecio(temporadaIndice, reglaIndice, { ocupacionMin: Number(event.target.value) })} className="w-14 rounded border px-2 py-1" /> – <input aria-label="Ocupación máxima" type="number" min={1} value={regla.ocupacionMax} disabled={!esSuperAdmin} onChange={event => actualizarReglaPrecio(temporadaIndice, reglaIndice, { ocupacionMax: Number(event.target.value) })} className="w-14 rounded border px-2 py-1" /></td>
                        <td><select value={regla.baseCalculo} disabled={!esSuperAdmin} onChange={event => actualizarReglaPrecio(temporadaIndice, reglaIndice, { baseCalculo: event.target.value as any })} className="rounded border px-2 py-1"><option value="persona_noche">Persona/noche</option><option value="unidad_noche">Unidad/noche</option></select></td>
                        <td><input aria-label="Precio en ARS" type="number" min={0} value={regla.importeCentavos / 100} disabled={!esSuperAdmin} onChange={event => actualizarReglaPrecio(temporadaIndice, reglaIndice, { importeCentavos: Math.round(Number(event.target.value) * 100) })} className="w-28 rounded border px-2 py-1" /></td>
                        <td><input aria-label="Exclusividad desde" type="number" min={1} placeholder="Desde" value={regla.exclusividadDesde ?? ''} disabled={!esSuperAdmin} onChange={event => actualizarReglaPrecio(temporadaIndice, reglaIndice, { exclusividadDesde: event.target.value ? Number(event.target.value) : null })} className="w-20 rounded border px-2 py-1" /> – <input aria-label="Exclusividad hasta" type="number" min={1} placeholder="Hasta" value={regla.exclusividadHasta ?? ''} disabled={!esSuperAdmin} onChange={event => actualizarReglaPrecio(temporadaIndice, reglaIndice, { exclusividadHasta: event.target.value ? Number(event.target.value) : null })} className="w-20 rounded border px-2 py-1" /></td>
                        {esSuperAdmin && <td className="pl-2"><IconButton icon={<Trash2 size={15} />} label={`Eliminar tarifa ${reglaIndice + 1}`} variant="secondary" isDisabled={temporada.reglas.length <= 1} onPress={() => eliminarReglaPrecio(temporadaIndice, reglaIndice)} /></td>}
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            ))}
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ajustes sobre el total</p>
                  <p className="mt-1 text-xs text-gray-500">Aplicá descuentos o recargos según la anticipación entre la compra y el check-in.</p>
                </div>
                {esSuperAdmin && <Button size="sm" variant="secondary" onPress={agregarAjuste}><Plus size={15} />Agregar ajuste</Button>}
              </div>
              {(tarifaDraft.ajustes || []).length === 0 ? <p className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">No hay ajustes configurados.</p> :
                <div className="mt-3 space-y-2">{(tarifaDraft.ajustes || []).map((regla, indice) => <div key={`${regla.codigo}-${indice}`} className="grid gap-2 rounded-lg bg-gray-50 p-3 md:grid-cols-[1.2fr_.8fr_.8fr_.8fr_.9fr_.8fr_auto]">
                  <label className="text-xs text-gray-600">Nombre<input value={regla.nombre} disabled={!esSuperAdmin} onChange={event => actualizarAjuste(indice, { nombre: event.target.value })} className="mt-1 w-full rounded border px-2 py-1" /></label>
                  <label className="text-xs text-gray-600">Desde (días)<input type="number" min={0} value={regla.anticipacionDesdeDias} disabled={!esSuperAdmin} onChange={event => actualizarAjuste(indice, { anticipacionDesdeDias: Number(event.target.value) })} className="mt-1 w-full rounded border px-2 py-1" /></label>
                  <label className="text-xs text-gray-600">Hasta (días)<input type="number" min={0} placeholder="Sin límite" value={regla.anticipacionHastaDias ?? ''} disabled={!esSuperAdmin} onChange={event => actualizarAjuste(indice, { anticipacionHastaDias: event.target.value === '' ? null : Number(event.target.value) })} className="mt-1 w-full rounded border px-2 py-1" /></label>
                  <label className="text-xs text-gray-600">Efecto<select value={regla.direccion} disabled={!esSuperAdmin} onChange={event => actualizarAjuste(indice, { direccion: event.target.value as any })} className="mt-1 w-full rounded border px-2 py-1"><option value="descuento">Descuento</option><option value="recargo">Recargo</option></select></label>
                  <label className="text-xs text-gray-600">Cálculo<select value={regla.tipo} disabled={!esSuperAdmin} onChange={event => actualizarAjuste(indice, { tipo: event.target.value as any })} className="mt-1 w-full rounded border px-2 py-1"><option value="porcentaje_bps">Porcentaje</option><option value="importe_fijo">Importe fijo</option></select></label>
                  <label className="text-xs text-gray-600">{regla.tipo === 'porcentaje_bps' ? 'Porcentaje' : 'ARS'}<input type="number" min={0} value={regla.valor / 100} disabled={!esSuperAdmin} onChange={event => actualizarAjuste(indice, { valor: Math.round(Number(event.target.value) * 100) })} className="mt-1 w-full rounded border px-2 py-1" /></label>
                  {esSuperAdmin && <div className="flex items-end"><IconButton icon={<Trash2 size={15} />} label={`Eliminar ajuste ${indice + 1}`} variant="secondary" onPress={() => eliminarAjuste(indice)} /></div>}
                </div>)}</div>}
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Reglas de seña</p>
                  <p className="mt-1 text-xs text-gray-500">Cada umbral comienza en el importe indicado, inclusive. El límite anterior se calcula automáticamente para evitar huecos o superposiciones.</p>
                </div>
                {esSuperAdmin && <Button size="sm" variant="secondary" onPress={agregarSena}><Plus size={15} />Agregar regla</Button>}
              </div>
              <div className="mt-2 space-y-2">{tarifaDraft.senas.map((regla, indice) => (
                <div key={`${regla.subtotalDesdeCentavos}-${indice}`} className="grid gap-2 rounded-lg bg-gray-50 p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                  <label className="text-xs text-gray-600">Desde (ARS, inclusive)<input type="number" min={0} step="0.01" value={regla.subtotalDesdeCentavos / 100} disabled={!esSuperAdmin || indice === 0} onChange={event => actualizarSena(indice, { subtotalDesdeCentavos: Math.round(Number(event.target.value) * 100) })} className="mt-1 w-full rounded border px-2 py-1 disabled:bg-gray-100" /></label>
                  <label className="text-xs text-gray-600">Hasta (ARS, inclusive)<input value={regla.subtotalHastaCentavos == null ? 'Sin límite' : (regla.subtotalHastaCentavos / 100).toFixed(2)} disabled className="mt-1 w-full rounded border bg-gray-100 px-2 py-1 text-gray-600" /></label>
                  <label className="text-xs text-gray-600">Tipo<select value={regla.tipo} disabled={!esSuperAdmin} onChange={event => actualizarSena(indice, { tipo: event.target.value as any })} className="mt-1 w-full rounded border px-2 py-1"><option value="porcentaje_bps">Porcentaje</option><option value="importe_fijo">Importe fijo</option></select></label>
                  <label className="text-xs text-gray-600">{regla.tipo === 'porcentaje_bps' ? 'Porcentaje' : 'Importe (ARS)'}<input type="number" min={0} step={regla.tipo === 'porcentaje_bps' ? '0.01' : '0.01'} max={regla.tipo === 'porcentaje_bps' ? 100 : undefined} value={regla.valor / 100} disabled={!esSuperAdmin} onChange={event => actualizarSena(indice, { valor: Math.round(Number(event.target.value) * 100) })} className="mt-1 w-full rounded border px-2 py-1" /></label>
                  {esSuperAdmin && <div className="flex items-end"><IconButton icon={<Trash2 size={16} />} label={`Eliminar regla de seña ${indice + 1}`} variant="secondary" isDisabled={tarifaDraft.senas.length <= 1} onPress={() => eliminarSena(indice)} /></div>}
                </div>
              ))}</div>
              {errorReglasSena(tarifaDraft.senas) && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{errorReglasSena(tarifaDraft.senas)}</p>}
            </div>
            {esSuperAdmin && <button type="button" onClick={confirmarTarifa} disabled={guardando !== null || !configuracion?.tarifa || Boolean(errorReglasSena(tarifaDraft.senas)) || resumirCambios(configuracion.tarifa, tarifaDraft).length === 0} className={`rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${FOCUS_RING}`}>{guardando === 'tarifa' ? 'Publicando…' : 'Publicar nueva versión de precios y seña'}</button>}
          </>}
        </div>
      </details>}

      {modo === 'base' && <details open className="admin-config__section rounded-xl border border-gray-200 bg-white shadow-sm">
        <summary><span><strong>Modalidades de reserva</strong><small>Alojamientos, capacidades y condiciones de venta</small></span></summary>
        <div className="admin-config__section-body space-y-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">Definí cuándo se puede vender cada alojamiento, su capacidad y la unidad que descuenta inventario. Los cambios afectan sólo operaciones nuevas.</p>
          {inventarioDraft.map(espacio => {
            const original = configuracion?.inventario.find(item => item.codigo === espacio.codigo);
            const espacioModificado = Boolean(original) && JSON.stringify({
              capacidadComercial: espacio.capacidadComercial,
              capacidadOperativaMaxima: espacio.capacidadOperativaMaxima,
              reservableGeneral: espacio.reservableGeneral,
              reservableRetiro: espacio.reservableRetiro,
              estado: espacio.estado,
            }) !== JSON.stringify({
              capacidadComercial: original?.capacidadComercial,
              capacidadOperativaMaxima: original?.capacidadOperativaMaxima,
              reservableGeneral: original?.reservableGeneral,
              reservableRetiro: original?.reservableRetiro,
              estado: original?.estado,
            });
            return <Card key={espacio.codigo} variant="outlined" className="admin-config__lodging space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><strong>{espacio.nombre}</strong><p className="text-xs text-gray-500">{espacio.codigo} · {espacio.tipo}</p></div>
                <Badge variant={espacio.estado === 'activo' ? 'success' : espacio.estado === 'inactivo' ? 'danger' : 'warning'}>{espacio.estado === 'activo' ? 'Activo' : espacio.estado === 'inactivo' ? 'Inactivo' : 'Configuración pendiente'}</Badge>
              </div>
              <div className="admin-config__lodging-fields">
                <NumberField decrementLabel="Reducir capacidad comercial" incrementLabel="Aumentar capacidad comercial"
                  isDisabled={!esSuperAdmin} label="Capacidad comercial" minValue={0} showStepper={false}
                  value={espacio.capacidadComercial} onChange={value => actualizarEspacioDraft(espacio.codigo, { capacidadComercial: value })} />
                <NumberField decrementLabel="Reducir máximo operativo" incrementLabel="Aumentar máximo operativo"
                  isDisabled={!esSuperAdmin} label="Máximo físico/operativo" minValue={0} showStepper={false}
                  value={espacio.capacidadOperativaMaxima} onChange={value => actualizarEspacioDraft(espacio.codigo, { capacidadOperativaMaxima: value })} />
                <Select label="Estado comercial" placeholder="Elegí un estado" value={espacio.estado} isDisabled={!esSuperAdmin}
                  options={[{ value: 'activo', label: 'Activo' }, { value: 'configuracion_pendiente', label: 'Configuración pendiente' }, { value: 'inactivo', label: 'Inactivo' }]}
                  onChange={value => value && actualizarEspacioDraft(espacio.codigo, { estado: value })} />
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                <Checkbox isSelected={espacio.reservableGeneral} isDisabled={!esSuperAdmin}
                  onChange={isSelected => actualizarEspacioDraft(espacio.codigo, { reservableGeneral: isSelected })}>Venta general</Checkbox>
                <Checkbox isSelected={espacio.reservableRetiro} isDisabled={!esSuperAdmin}
                  onChange={isSelected => actualizarEspacioDraft(espacio.codigo, { reservableRetiro: isSelected })}>Retiros</Checkbox>
              </div>
              {espacio.tipo === 'camping' && espacio.estado !== 'activo' && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Para activar Camping: definí una capacidad mayor a cero, habilitá al menos un contexto, guardá estas condiciones y luego habilitá su modalidad. También debe existir una regla de precio publicada para camping.</p>}
              {esSuperAdmin && <Button size="sm" variant="secondary" isDisabled={guardando !== null || !espacioModificado || espacio.capacidadOperativaMaxima < espacio.capacidadComercial}
                isLoading={guardando === `espacio-${espacio.codigo}`} onPress={() => original && confirmarEspacio(espacio, original)}>Guardar condiciones del alojamiento</Button>}
              {esSuperAdmin && opcionesModalidadParaEspacio(espacio).some(opcion => !espacio.modalidades.some(item => item.modalidad === opcion.value && item.contexto === 'general')) &&
                <Button size="sm" variant="secondary" isLoading={guardando === `modalidad-nueva-${espacio.codigo}`} onPress={() => pedirConfirmacion({
                  titulo: `Crear modalidad para ${espacio.nombre}`,
                  descripcion: 'Se agregará deshabilitada para que puedas revisar su nombre y unidad de venta.',
                  cambios: [{ campo: 'Modalidad', anterior: 'No existe', nuevo: 'Nueva modalidad deshabilitada' }],
                  etiquetaConfirmar: 'Crear modalidad',
                  ejecutar: motivo => crearModalidad(espacio, motivo),
                })}><Plus size={15} />Crear modalidad</Button>}
              <div className="admin-config__modalities">{espacio.modalidades.map(item => {
                const originalModalidad = original?.modalidades.find(actual => actual.id === item.id);
                const modalidadModificada = Boolean(originalModalidad) && JSON.stringify(item) !== JSON.stringify(originalModalidad);
                const contextoPermitido = item.contexto === 'general' ? original?.reservableGeneral : original?.reservableRetiro;
                const puedeHabilitar = original?.estado === 'activo' && (original?.capacidadComercial || 0) > 0 && Boolean(contextoPermitido);
                return <Card key={item.id} tone="muted" className="admin-config__modality">
                  <div className="admin-config__modality-fields">
                    <label className="text-xs font-semibold text-gray-600">Nombre comercial<input value={item.nombreComercial} disabled={!esSuperAdmin} onChange={event => actualizarModalidadDraft(espacio.codigo, item.id, { nombreComercial: event.target.value })} className="mt-1 w-full rounded border px-2 py-2 text-sm" /></label>
                    <Select label="Modalidad" placeholder="Elegí" value={item.modalidad} isDisabled={!esSuperAdmin}
                      options={opcionesModalidadParaEspacio(espacio)}
                      onChange={value => value && actualizarModalidadDraft(espacio.codigo, item.id, {
                        modalidad: value,
                        unidadVenta: value === 'privada' ? 'espacio' : value === 'camping' ? 'parcela' : item.unidadVenta === 'parcela' ? 'cama' : item.unidadVenta,
                      })} />
                    <Select label="Contexto" placeholder="Elegí" value={item.contexto} isDisabled={!esSuperAdmin}
                      options={[{ value: 'general', label: 'Venta general' }, { value: 'retiro', label: 'Retiro' }]}
                      onChange={value => value && actualizarModalidadDraft(espacio.codigo, item.id, { contexto: value })} />
                    <Select label="Unidad de venta" placeholder="Elegí" value={item.unidadVenta} isDisabled={!esSuperAdmin}
                      options={item.modalidad === 'privada' ? [{ value: 'espacio', label: 'Espacio completo' }] : item.modalidad === 'camping' ? [{ value: 'parcela', label: 'Parcela' }] : [{ value: 'cama', label: 'Cama' }, { value: 'espacio', label: 'Espacio completo' }]}
                      onChange={value => value && actualizarModalidadDraft(espacio.codigo, item.id, { unidadVenta: value })} />
                  </div>
                  <Textarea label="Información para huéspedes" rows={2}
                    description="Explicá qué debe traer la persona y qué incluye esta modalidad. Se mostrará durante la reserva."
                    placeholder="Ej.: Traé tu propia carpa · Ropa blanca incluida"
                    value={item.descripcionComercial} isDisabled={!esSuperAdmin}
                    onChange={value => actualizarModalidadDraft(espacio.codigo, item.id, { descripcionComercial: value })} />
                  <Checkbox className="admin-config__modality-toggle" isSelected={item.habilitada} isDisabled={!esSuperAdmin || (!item.habilitada && !puedeHabilitar)}
                    onChange={isSelected => actualizarModalidadDraft(espacio.codigo, item.id, { habilitada: isSelected })}>Habilitada para reservas nuevas</Checkbox>
                  {!puedeHabilitar && <p className="admin-config__modality-warning text-xs text-amber-700">Primero activá el alojamiento, asignale capacidad y habilitá el contexto seleccionado.</p>}
                  {esSuperAdmin && <Button size="sm" variant="secondary" isDisabled={guardando !== null || !modalidadModificada || (item.habilitada && !puedeHabilitar)}
                    className="admin-config__modality-action" isLoading={guardando === `modalidad-${item.id}`} onPress={() => originalModalidad && confirmarModalidad(espacio, item, originalModalidad)}>Guardar modalidad</Button>}
                </Card>;
              })}</div>
            </Card>;
          })}
          <p className="text-xs text-gray-500">Deshabilitar una modalidad evita nuevas cotizaciones; no modifica reservas existentes. La activación comercial no reemplaza la regla de precio publicada ni crea unidades físicas.</p>
        </div>
      </details>}

      {modo === 'base' && <details className="admin-config__section rounded-xl border border-gray-200 bg-white shadow-sm">
        <summary><span><strong>Servicios y limitaciones</strong><small>Qué tiene y qué no tiene cada alojamiento · {serviciosDraft.filter(item => item.visibleEnReserva).length} visibles</small></span></summary>
        <div className="admin-config__section-body space-y-4 border-t border-gray-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="max-w-3xl text-xs text-gray-500">Mostrá información concreta antes de cotizar. Usá “No disponible” para restricciones importantes, como baño privado o electricidad, y ocultá sólo los datos que no deban publicarse.</p>
            {esSuperAdmin && <Button size="sm" variant="secondary" onPress={agregarServicioDraft}><Plus size={15} />Agregar servicio</Button>}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {serviciosDraft.map(item => {
              const original = configuracion?.servicios.find(actual => actual.id === item.id);
              const modificado = item.id < 0 || (Boolean(original) && JSON.stringify(item) !== JSON.stringify(original));
              return <Card key={item.id} tone="muted" className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select label="Alojamiento" placeholder="Elegí" value={item.tipoAlojamiento} isDisabled={!esSuperAdmin}
                    options={OPCIONES_ALOJAMIENTO_TARIFA}
                    onChange={value => value && actualizarServicioDraft(item.id, { tipoAlojamiento: value as BorradorServicioUi['tipoAlojamiento'] })} />
                  <Select label="Disponibilidad" placeholder="Elegí" value={item.disponibilidad} isDisabled={!esSuperAdmin}
                    options={[{ value: 'incluido', label: 'Disponible / incluido' }, { value: 'no_disponible', label: 'No disponible' }]}
                    onChange={value => value && actualizarServicioDraft(item.id, { disponibilidad: value as BorradorServicioUi['disponibilidad'] })} />
                </div>
                <Input label="Nombre visible" value={item.nombre} isDisabled={!esSuperAdmin}
                  onChange={value => actualizarServicioDraft(item.id, { nombre: value })} />
                <Textarea label="Detalle opcional" rows={2} maxLength={240} isDisabled={!esSuperAdmin}
                  placeholder="Ej.: Disponible en las duchas exteriores compartidas."
                  value={item.detalle} onChange={value => actualizarServicioDraft(item.id, { detalle: value })} />
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <Checkbox isSelected={item.visibleEnReserva} isDisabled={!esSuperAdmin}
                      onChange={isSelected => actualizarServicioDraft(item.id, { visibleEnReserva: isSelected })}>Visible en la reserva</Checkbox>
                    <NumberField className="w-28" label="Orden" minValue={0} maxValue={999} showStepper={false}
                      decrementLabel="Bajar orden" incrementLabel="Subir orden" isDisabled={!esSuperAdmin}
                      value={item.orden} onChange={value => actualizarServicioDraft(item.id, { orden: value })} />
                  </div>
                  {esSuperAdmin && <div className="flex gap-2">
                    {item.id < 0 && <Button size="sm" variant="secondary" onPress={() => setServiciosDraft(actual => actual.filter(servicio => servicio.id !== item.id))}>Descartar</Button>}
                    <Button size="sm" variant="secondary" isDisabled={guardando !== null || !modificado || !item.nombre.trim()}
                      isLoading={guardando === `servicio-${item.id}`} onPress={() => confirmarServicio(item)}>{item.id < 0 ? 'Agregar' : 'Guardar'}</Button>
                  </div>}
                </div>
              </Card>;
            })}
          </div>
        </div>
      </details>}

      {modo === 'base' && <details className="admin-config__section rounded-xl border border-gray-200 bg-white shadow-sm">
        <summary><span><strong>Preparación de camas</strong><small>Preferencias obligatorias según alojamiento, modalidad y cantidad de personas · {opcionesPreparacionDraft.filter(item => item.habilitada).length} activas</small></span></summary>
        <div className="admin-config__section-body space-y-4 border-t border-gray-100">
          <p className="max-w-3xl text-xs text-gray-500">Estas opciones organizan la preparación previa y no cambian precio, capacidad ni inventario físico. Si hay opciones activas para una combinación, el huésped deberá elegir una antes de reservar.</p>
          <div className="grid gap-3 lg:grid-cols-2">
            {opcionesPreparacionDraft.map(item => {
              const original = configuracion?.opcionesPreparacion.find(actual => actual.id === item.id);
              const modificado = Boolean(original) && JSON.stringify(item) !== JSON.stringify(original);
              return <Card key={item.id} tone="muted" className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Select label="Alojamiento" placeholder="Elegí" value={item.tipoAlojamiento} isDisabled={!esSuperAdmin}
                    options={OPCIONES_ALOJAMIENTO_TARIFA}
                    onChange={value => value && actualizarOpcionPreparacionDraft(item.id, { tipoAlojamiento: value as BorradorOpcionPreparacionUi['tipoAlojamiento'] })} />
                  <Select label="Modalidad" placeholder="Elegí" value={item.modalidad} isDisabled={!esSuperAdmin}
                    options={[{ value: 'privada', label: 'Privada' }, { value: 'compartida', label: 'Compartida' }, { value: 'camping', label: 'Camping' }]}
                    onChange={value => value && actualizarOpcionPreparacionDraft(item.id, { modalidad: value as BorradorOpcionPreparacionUi['modalidad'] })} />
                  <NumberField label="Personas" minValue={1} maxValue={20} showStepper={false}
                    decrementLabel="Reducir personas" incrementLabel="Aumentar personas" isDisabled={!esSuperAdmin}
                    value={item.cantidadPersonas} onChange={value => actualizarOpcionPreparacionDraft(item.id, { cantidadPersonas: value })} />
                </div>
                <Input label="Nombre visible" value={item.nombre} isDisabled={!esSuperAdmin}
                  onChange={value => actualizarOpcionPreparacionDraft(item.id, { nombre: value })} />
                <Textarea label="Explicación para huéspedes" rows={2} maxLength={240} isDisabled={!esSuperAdmin}
                  value={item.descripcion} onChange={value => actualizarOpcionPreparacionDraft(item.id, { descripcion: value })} />
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <Checkbox isSelected={item.habilitada} isDisabled={!esSuperAdmin}
                      onChange={isSelected => actualizarOpcionPreparacionDraft(item.id, { habilitada: isSelected })}>Solicitar en reservas nuevas</Checkbox>
                    <NumberField className="w-28" label="Orden" minValue={0} maxValue={999} showStepper={false}
                      decrementLabel="Bajar orden" incrementLabel="Subir orden" isDisabled={!esSuperAdmin}
                      value={item.orden} onChange={value => actualizarOpcionPreparacionDraft(item.id, { orden: value })} />
                  </div>
                  {esSuperAdmin && <Button size="sm" variant="secondary" isDisabled={guardando !== null || !modificado || !item.nombre.trim()}
                    isLoading={guardando === `preparacion-${item.id}`} onPress={() => confirmarOpcionPreparacion(item)}>Guardar opción</Button>}
                </div>
              </Card>;
            })}
          </div>
        </div>
      </details>}

      {modo === 'precios' && <details className="admin-config__section rounded-xl border border-gray-200 bg-white shadow-sm">
        <summary><span><strong>Alimentación</strong><small>Horarios, regímenes y precio por comida</small></span></summary>
        <div className="admin-config__section-body grid gap-3 border-t border-gray-100 sm:grid-cols-2">
        {horariosComidasDraft && <Card tone="muted" className="p-4 sm:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">Horarios del servicio</p>
              <p className="text-xs text-gray-500">Versión {horariosComidasDraft.version} · se muestran en la reserva online y en la página de estadías.</p>
            </div>
            {esSuperAdmin && <Button size="sm" variant="secondary"
              isDisabled={guardando !== null || !horariosComidasModificados || !horariosComidasValidos}
              isLoading={guardando === 'horarios-comidas'} onPress={confirmarHorariosComidas}>Guardar horarios</Button>}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(['desayuno', 'almuerzo', 'cena'] as const).map(comida => <div key={comida} className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-white p-3">
              <p className="col-span-2 text-xs font-semibold capitalize text-gray-700">{comida}</p>
              <Input type="time" label="Desde" value={horariosComidasDraft[comida].desde} isDisabled={!esSuperAdmin}
                onChange={value => setHorariosComidasDraft(actual => actual ? { ...actual, [comida]: { ...actual[comida], desde: value } } : actual)} />
              <Input type="time" label="Hasta" value={horariosComidasDraft[comida].hasta} isDisabled={!esSuperAdmin}
                onChange={value => setHorariosComidasDraft(actual => actual ? { ...actual, [comida]: { ...actual[comida], hasta: value } } : actual)} />
            </div>)}
          </div>
          {!horariosComidasValidos && <p className="mt-2 text-xs font-semibold text-red-700" role="alert">Cada horario debe tener una hora de inicio anterior a la hora de cierre.</p>}
        </Card>}
        {(configuracion?.alimentacion || []).map(item => <div key={item.codigo} className="rounded-lg border border-gray-200 p-3">
          <p className="font-semibold">{item.codigo === 'pension_completa' ? 'Pensión completa' : 'Desayuno incluido'}</p>
          <p className="text-xs text-gray-500">v{item.version} · {item.comidasAdicionalesPorPersonaNoche} comidas adicionales por persona/noche</p>
          <div className={`mt-3 grid gap-2 ${item.codigo === 'pension_completa' ? 'sm:grid-cols-3' : ''}`}>
            {(item.codigo === 'pension_completa' ? ['desayuno', 'almuerzo', 'cena'] as const : ['desayuno'] as const).map(comida => <MoneyField key={comida} currency="ARS" decrementLabel={`Reducir ${comida}`} incrementLabel={`Aumentar ${comida}`}
              isDisabled={!esSuperAdmin} label={comida[0].toUpperCase() + comida.slice(1)} minValue={0} showStepper={false}
              value={Number(preciosComida[`${item.codigo}:${comida}`] || 0)} onChange={value => setPreciosComida(actual => ({ ...actual, [`${item.codigo}:${comida}`]: String(value) }))} />)}
          </div>
          {item.codigo === 'pension_completa' && <MoneyField className="mt-2" currency="ARS" decrementLabel="Reducir ajuste" incrementLabel="Aumentar ajuste"
            isDisabled={!esSuperAdmin} label="Ajuste del paquete por persona/noche (negativo = descuento)" showStepper={false}
            value={Number(preciosComida[`${item.codigo}:ajuste`] || 0)} onChange={value => setPreciosComida(actual => ({ ...actual, [`${item.codigo}:ajuste`]: String(value) }))} />}
          <p className="mt-2 text-xs text-gray-500">{item.codigo === 'pension_completa'
            ? 'La pensión completa suma almuerzo + cena y aplica el ajuste del paquete. El desayuno continúa incluido en el alojamiento.'
            : 'El desayuno está incluido en el alojamiento; este valor deja explícito su precio de referencia.'}</p>
          {esSuperAdmin && <button type="button" onClick={() => confirmarComida(item)} disabled={guardando !== null || (item.codigo === 'pension_completa' ? [
            ['desayuno', item.precioDesayunoCentavos], ['almuerzo', item.precioAlmuerzoCentavos],
            ['cena', item.precioCenaCentavos], ['ajuste', item.ajustePaqueteCentavos],
          ] : [['desayuno', item.precioDesayunoCentavos]]).every(([clave, centavos]) => Math.round(Number(preciosComida[`${item.codigo}:${clave}`] || 0) * 100) === centavos)} className={`mt-3 rounded-lg border border-brand px-3 py-2 text-xs font-semibold text-brand disabled:opacity-50 ${FOCUS_RING}`}>{guardando === `comida-${item.codigo}` ? 'Publicando…' : 'Publicar nueva versión'}</button>}
        </div>)}</div>
      </details>}

      {modo === 'base' && <details className="admin-config__section rounded-xl border border-gray-200 bg-white shadow-sm">
        <summary><span><strong>Política de cancelación</strong><small>Vigencia y porcentajes de devolución</small></span></summary>
        <div className="admin-config__section-body space-y-3 border-t border-gray-100">{!politicaDraft ? <p className="text-sm text-amber-700">Sin política configurada.</p> : <>
          <div className="grid gap-3 sm:grid-cols-3"><label className="text-xs font-semibold text-gray-600">Nombre<input value={politicaDraft.nombre} disabled={!esSuperAdmin} onChange={event => setPoliticaDraft({ ...politicaDraft, nombre: event.target.value })} className="mt-1 w-full rounded border px-3 py-2 text-sm" /></label><div className="text-xs text-gray-500"><strong className="block text-gray-700">Código y versión</strong>{politicaDraft.codigo} · v{politicaDraft.version}</div><label className="text-xs font-semibold text-gray-600">Vigente desde<input type="datetime-local" value={vigenciaPolitica} disabled={!esSuperAdmin} onChange={event => setVigenciaPolitica(event.target.value)} className="mt-1 w-full rounded border px-3 py-2 text-sm" /></label></div>
          <div className="space-y-2">{politicaDraft.reglas.map((regla, indice) => <div key={indice} className="grid gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-2"><label className="text-xs text-gray-600">Horas mínimas antes del check-in<input type="number" min={0} value={regla.horasMinimasAntes} disabled={!esSuperAdmin} onChange={event => setPoliticaDraft({ ...politicaDraft, reglas: politicaDraft.reglas.map((item, i) => i === indice ? { ...item, horasMinimasAntes: Number(event.target.value) } : item) })} className="mt-1 w-full rounded border px-2 py-1" /></label><label className="text-xs text-gray-600">Devolución (%)<input type="number" min={0} max={100} value={regla.porcentajeDevolucionBps / 100} disabled={!esSuperAdmin} onChange={event => setPoliticaDraft({ ...politicaDraft, reglas: politicaDraft.reglas.map((item, i) => i === indice ? { ...item, porcentajeDevolucionBps: Math.round(Number(event.target.value) * 100) } : item) })} className="mt-1 w-full rounded border px-2 py-1" /></label></div>)}</div>
          {esSuperAdmin && <button type="button" onClick={confirmarPolitica} disabled={guardando !== null || !vigenciaPolitica || !configuracion?.politicaCancelacion || resumirCambios({ ...configuracion.politicaCancelacion, vigenciaDesde: configuracion.politicaCancelacion.vigenciaDesde?.slice(0, 16) || '' }, { ...politicaDraft, vigenciaDesde: vigenciaPolitica }).length === 0} className={`rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${FOCUS_RING}`}>{guardando === 'politica' ? 'Publicando…' : 'Publicar nueva política'}</button>}
        </>}</div>
      </details>}

      {modo === 'base' && parametro && <details className="admin-config__section rounded-xl border border-gray-200 bg-white shadow-sm">
        <summary><span><strong>Retención de pago</strong><small>{parametro.valor} minutos para completar la seña</small></span></summary>
        <div className="admin-config__section-body grid gap-3 border-t border-gray-100 sm:grid-cols-3"><div className="text-xs text-gray-500">Versión {parametro.version}<br />Rango permitido: {parametro.minimo}–{parametro.maximo} minutos</div>{esSuperAdmin && <><NumberField decrementLabel="Reducir plazo" incrementLabel="Aumentar plazo" label="Nuevo plazo" minValue={parametro.minimo} maxValue={parametro.maximo} showStepper={false} value={Number(valor)} onChange={value => setValor(String(value))} /><div className="flex items-end"><Button size="sm" isLoading={guardando === 'plazo'} onPress={confirmarPlazo} isDisabled={guardando !== null || Number(valor) === parametro.valor || Number(valor) < parametro.minimo || Number(valor) > parametro.maximo}>Guardar plazo</Button></div></>}</div>
      </details>}

      <section className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-xs text-gray-600">
        <strong className="text-gray-800">Fuera de esta pantalla:</strong> credenciales y activación de proveedores de pago permanecen en variables seguras del entorno. Las capacidades físicas y excepciones de capacidad siguen el flujo operativo auditado.
      </section>

      {confirmacion && (
        <ModalBase onClose={() => guardando === null && setConfirmacion(null)} titulo={confirmacion.titulo} ancho="sm:max-w-3xl">
          <p className="text-sm text-gray-600">{confirmacion.descripcion}</p>
          <div className="admin-config-change-summary mt-4 overflow-hidden rounded-xl border border-gray-200">
            <div className="admin-config-change-summary__head" aria-hidden="true">
              <span>Cambio</span><span>Valor anterior</span><span>Valor nuevo</span>
            </div>
            <div className="max-h-[42vh] overflow-y-auto">
              {confirmacion.cambios.map((cambio, indice) => (
                <div className="admin-config-change-summary__row" key={`${cambio.campo}-${indice}`}>
                  <strong>{cambio.campo}</strong>
                  <span className="admin-config-change-summary__old">{cambio.anterior}</span>
                  <span className="admin-config-change-summary__new">{cambio.nuevo}</span>
                </div>
              ))}
            </div>
          </div>
          <Textarea
            autoFocus
            className="mt-4"
            description="Obligatorio · entre 5 y 500 caracteres. Quedará asociado al cambio en la auditoría."
            isRequired
            label="Motivo del cambio"
            maxLength={500}
            minLength={5}
            onChange={setMotivoConfirmacion}
            placeholder="Ej. Ajuste comercial aprobado por administración"
            rows={3}
            value={motivoConfirmacion}
          />
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" isDisabled={guardando !== null} onPress={() => setConfirmacion(null)}>Cancelar</Button>
            <Button isLoading={guardando !== null} isDisabled={guardando !== null || motivoConfirmacion.trim().length < 5} onPress={confirmarCambio}>{confirmacion.etiquetaConfirmar}</Button>
          </div>
        </ModalBase>
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
const SeccionMetricasOperativas: React.FC<{ mostrarGrafico?: boolean }> = ({ mostrarGrafico = false }) => {
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
      {mostrarGrafico && grupos !== null && (() => {
        const maxPersonas = Math.max(0, ...TIPOS_ESTADIA.map(t => grupos.find(g => g.tipo_estadia === t.value)?.total_personas || 0));
        return (
          <Card className="admin-report-chart admin-report-types">
            <div className="admin-report-chart__heading">
              <div>
                <p>Desde el 06/08</p>
                <h3>Personas por tipo de estadía</h3>
              </div>
            </div>
            <ul className="admin-report-bars" aria-label="Personas y noches por tipo de estadía">
              {TIPOS_ESTADIA.map(t => {
                const grupo = grupos.find(g => g.tipo_estadia === t.value);
                const personas = grupo?.total_personas || 0;
                const noches = Math.round(grupo?.total_noches || 0);
                const width = maxPersonas > 0 ? (personas / maxPersonas) * 100 : 0;
                return (
                  <li key={t.value}>
                    <div className="admin-report-bars__label"><span>{t.label}</span><strong>{personas} personas · {noches} noches</strong></div>
                    <div className="admin-report-bars__track" aria-hidden="true"><span style={{ width: `${width}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })()}
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
  actualizar_configuracion_reservas: 'Actualizó configuración de reservas',
  actualizar_modalidad_comercial: 'Actualizó una modalidad comercial',
  actualizar_espacio_comercial: 'Actualizó condiciones comerciales de un alojamiento',
  publicar_tarifa_alimentacion: 'Publicó una tarifa de alimentación',
  crear_borrador_tarifa: 'Creó un borrador de precios',
  publicar_plan_tarifa: 'Publicó precios y seña',
  crear_borrador_politica_cancelacion: 'Creó un borrador de cancelación',
  publicar_politica_cancelacion: 'Publicó una política de cancelación',
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
        <ToggleGroup
          disallowEmptySelection
          label="Clase de ocupación"
          labelVisibility="hidden"
          onChange={values => values[0] && cambiarClase(values[0] as 'bloqueo' | 'estadia_no_comercial')}
          options={[
            { value: 'bloqueo', label: 'Bloqueo' },
            { value: 'estadia_no_comercial', label: 'Estadía interna' },
          ]}
          selectionMode="single"
          value={[clase]}
        />
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
        <DateRangeField
          endLabel="Hasta (checkout)"
          isRequired
          label="Fechas de ocupación"
          onChange={range => {
            setFechaDesde(range?.start || '');
            setFechaHasta(range?.end || '');
          }}
          startLabel="Desde (inclusive)"
          value={fechaDesde && fechaHasta ? { start: fechaDesde, end: fechaHasta } : null}
        />
        <label className="block text-xs font-semibold text-gray-600">Tipo
          <select className={`${INPUT_CLS} mt-1`} value={tipo} onChange={e => setTipo(e.target.value)}>
            {(clase === 'bloqueo'
              ? ['mantenimiento', 'cierre', 'uso_interno', 'bloqueo_propietario']
              : ['staff', 'voluntario', 'residente']).map(value => <option key={value} value={value}>{TIPO_OCUPACION_LABEL[value]}</option>)}
          </select>
        </label>
        {clase === 'estadia_no_comercial' && (
          <NumberField decrementLabel="Quitar persona" incrementLabel="Agregar persona" isRequired label="Personas"
            minValue={1} onChange={setCantidadPersonas} value={cantidadPersonas} />
        )}
        <Textarea isRequired label={clase === 'bloqueo' ? 'Motivo' : 'Referencia operativa'} minLength={3} rows={3}
          value={detalle} onChange={setDetalle} placeholder={clase === 'bloqueo' ? 'Ej. reparación de techo' : 'Ej. voluntariado de huerta'} />
        <button disabled={guardando || cargando} className={`w-full text-sm font-semibold rounded-lg px-4 py-2.5 text-white bg-brand disabled:opacity-60 ${FOCUS_RING}`}>{guardando ? 'Guardando…' : 'Registrar ocupación'}</button>
      </form>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div><h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Bloqueos y estadías internas</h2><p className="text-xs text-gray-400 mt-1">El historial cancelado se conserva para auditoría.</p></div>
          <IconButton
            icon={cargando ? null : <RefreshCw size={15} />}
            isLoading={cargando}
            label="Actualizar ocupación"
            onPress={cargar}
            variant="secondary"
          />
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

const ESTADO_ARREPENTIMIENTO_LABEL: Record<SolicitudArrepentimientoAdmin['estado'], string> = {
  recibida: 'Recibida',
  en_revision: 'En revisión',
  resuelta: 'Resuelta',
  rechazada: 'Rechazada',
};

const SeccionArrepentimientos: React.FC<{ puedeGestionar: boolean }> = ({ puedeGestionar }) => {
  const [items, setItems] = useState<SolicitudArrepentimientoAdmin[] | null>(null);
  const [estado, setEstado] = useState('');
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState<number | null>(null);

  const cargar = async () => {
    setError('');
    try {
      const query = estado ? `?estado=${encodeURIComponent(estado)}` : '';
      const response = await adminFetch(`/api/v1/admin/arrepentimientos${query}`);
      const body: any = await response.json();
      if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
      setItems(body.data || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las solicitudes.');
    }
  };

  useEffect(() => { cargar(); }, [estado]);

  const cambiarEstado = async (
    item: SolicitudArrepentimientoAdmin,
    nuevoEstado: SolicitudArrepentimientoAdmin['estado']
  ) => {
    const notaInterna = window.prompt(
      nuevoEstado === 'en_revision'
        ? 'Nota de seguimiento (mínimo 5 caracteres)'
        : 'Motivo o resolución (mínimo 5 caracteres)'
    );
    if (!notaInterna || notaInterna.trim().length < 5) return;
    const mensajeCliente = window.prompt('Mensaje visible para el huésped (mínimo 5 caracteres)');
    if (!mensajeCliente || mensajeCliente.trim().length < 5) return;
    setProcesando(item.id);
    setError('');
    try {
      const response = await adminFetch(`/api/v1/admin/arrepentimientos/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado_actual: item.estado,
          estado: nuevoEstado,
          nota_interna: notaInterna,
          mensaje_cliente: mensajeCliente,
        }),
      });
      const body: any = await response.json();
      if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
      await cargar();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la solicitud.');
    } finally {
      setProcesando(null);
    }
  };

  const reprocesarNotificacion = async (item: SolicitudArrepentimientoAdmin) => {
    if (!item.notificacion_uid) return;
    const motivo = window.prompt('Motivo del reintento (mínimo 8 caracteres)');
    if (!motivo || motivo.trim().length < 8) return;
    setProcesando(item.id);
    setError('');
    try {
      const response = await adminFetch('/api/v1/admin/arrepentimientos/notificaciones/reprocesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificacion_uid: item.notificacion_uid, motivo }),
      });
      const body: any = await response.json();
      if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
      await cargar();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo reprocesar la notificación.');
    } finally {
      setProcesando(null);
    }
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Solicitudes de arrepentimiento</h2>
          <p className="text-xs text-gray-400 mt-1">La recepción no cancela reservas ni ejecuta devoluciones automáticas.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={estado} onChange={event => setEstado(event.target.value)} aria-label="Filtrar por estado" className={`text-sm border border-gray-300 rounded-lg px-3 py-2 ${FOCUS_RING}`}>
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_ARREPENTIMIENTO_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <IconButton icon={<RefreshCw size={15} />} label="Actualizar solicitudes" onPress={cargar} variant="secondary" />
        </div>
      </div>
      {error && <p role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <ul className="divide-y divide-gray-100">
        {(items || []).map(item => {
          const abierta = item.estado === 'recibida' || item.estado === 'en_revision';
          return (
            <li key={item.id} className="px-4 sm:px-5 py-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-gray-800">{item.codigo}</strong>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${abierta ? 'bg-amber-100 text-amber-800' : item.estado === 'resuelta' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{ESTADO_ARREPENTIMIENTO_LABEL[item.estado]}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">{item.email}{item.reserva_codigo ? ` · ${item.reserva_codigo}` : ' · sin código declarado'}{item.reserva_id ? ` · reserva vinculada #${item.reserva_id}` : ''}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{item.detalle}</p>
                  <p className="mt-2 text-[11px] text-gray-400 tabular-nums">Recibida: {fmtFechaHora(item.acknowledged_at)}</p>
                  {item.resolution_note && <p className="mt-1 text-xs text-gray-500">Última nota: {item.resolution_note}{item.resolved_by ? ` — ${item.resolved_by}` : ''}</p>}
                  {item.mensaje_cliente && <p className="mt-1 text-xs text-gray-600">Mensaje al huésped: {item.mensaje_cliente}</p>}
                  {item.notificacion_estado && <p className="mt-1 text-xs text-gray-500">Email: {item.notificacion_estado.replace('_', ' ')}{item.notificacion_error_codigo ? ` · ${item.notificacion_error_codigo}` : ''}</p>}
                </div>
                {puedeGestionar && abierta && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {item.estado === 'recibida' && <button disabled={procesando === item.id} onClick={() => cambiarEstado(item, 'en_revision')} className={`rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50 ${FOCUS_RING}`}>Tomar</button>}
                    <button disabled={procesando === item.id} onClick={() => cambiarEstado(item, 'resuelta')} className={`rounded-lg border border-green-300 px-3 py-2 text-xs font-semibold text-green-800 hover:bg-green-50 disabled:opacity-50 ${FOCUS_RING}`}>Resolver</button>
                    <button disabled={procesando === item.id} onClick={() => cambiarEstado(item, 'rechazada')} className={`rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 ${FOCUS_RING}`}>Rechazar</button>
                  </div>
                )}
                {puedeGestionar && item.notificacion_estado === 'dead_letter' && (
                  <button disabled={procesando === item.id} onClick={() => reprocesarNotificacion(item)} className={`shrink-0 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 ${FOCUS_RING}`}>Reintentar email</button>
                )}
              </div>
            </li>
          );
        })}
        {items !== null && items.length === 0 && <li className="px-5 py-10 text-center text-sm text-gray-400">No hay solicitudes para este filtro.</li>}
        {items === null && <li className="px-5 py-10 text-center text-sm text-gray-400">Cargando solicitudes…</li>}
      </ul>
    </section>
  );
};

type EstadoEventoIntegracion = 'pending' | 'processing' | 'delivered' | 'dead_letter';
type EventoIntegracionOperativo = {
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  estado: EstadoEventoIntegracion;
  attempts: number;
  nextAttemptAt: string;
  lastErrorCode: string | null;
  occurredAt: string;
  createdAt: string;
  deliveredAt: string | null;
  ageSeconds: number;
  deliveryLatencySeconds: number | null;
};
type EstadoIntegracionesApi = {
  resumen: Record<EstadoEventoIntegracion, number>;
  oldestPendingAgeSeconds: number | null;
  deliveryLast24h: { attempts: number; failures: number; failureRate: number };
  eventos: EventoIntegracionOperativo[];
};
type EstadoComunicacionOperativa = 'pendiente' | 'procesando' | 'entregada' | 'sin_canal' | 'dead_letter';
type CategoriaEventosIntegracion = 'eventos' | 'comunicaciones' | 'mercado_pago' | 'aplicaciones';
type AplicacionApiAdmin = {
  codigo: string; nombre: string; tipo: string; estado: string; configurada: boolean;
  registrado_at: string | null; first_used_at: string | null; last_used_at: string | null;
  request_count: number;
  endpoints: Array<{
    method: string; path: string; first_used_at: string | null;
    last_used_at: string | null; request_count: number;
  }>;
};
type EstadoOperacionesMvpApi = {
  reservas: {
    pendientesPago: number;
    retencionesVencidasSinProcesar: number;
    oldestPendingAgeSeconds: number | null;
  };
  pagos: {
    webhooksLast24h: number;
    aplicadosLast24h: number;
    inconsistentesLast24h: number;
    eventos: Array<{
      proveedor: string; reservaId: number | null; resultado: string;
      motivoCodigo: string | null; correlationId: string | null;
      createdAt: string; processedAt: string | null;
    }>;
  };
  comunicaciones: {
    resumen: Record<EstadoComunicacionOperativa, number>;
    oldestPendingAgeSeconds: number | null;
    deliveryLast24h: { attempts: number; failures: number; failureRate: number };
    intenciones: Array<{
      intencionUid: string; reservaId: number; tipo: string; idioma: string;
      audiencia: 'huesped' | 'equipo';
      estado: EstadoComunicacionOperativa; attempts: number; canal: string | null;
      lastErrorCode: string | null; createdAt: string;
    }>;
  };
  tendenciaColas: {
    outbox: { creadosPendientesUltimos15m: number; creadosPendientes15mAnteriores: number; crecimiento: number };
    comunicaciones: { creadosPendientesUltimos15m: number; creadosPendientes15mAnteriores: number; crecimiento: number };
  };
  alertas: Array<{ codigo: string; nivel: 'info' | 'warning' | 'critical'; mensaje: string; cantidad: number }>;
};

const ESTADO_EVENTO_LABEL: Record<EstadoEventoIntegracion, string> = {
  pending: 'Pendiente', processing: 'Procesando', delivered: 'Entregado', dead_letter: 'Requiere atención',
};

const fmtDuracion = (segundos: number | null) => {
  if (segundos == null) return '—';
  if (segundos < 60) return `${segundos} s`;
  if (segundos < 3600) return `${Math.floor(segundos / 60)} min`;
  if (segundos < 86400) return `${Math.floor(segundos / 3600)} h`;
  return `${Math.floor(segundos / 86400)} d`;
};

const SeccionIntegraciones: React.FC<{ esSuperAdmin: boolean }> = ({ esSuperAdmin }) => {
  const [estado, setEstado] = useState<EstadoIntegracionesApi | null>(null);
  const [operaciones, setOperaciones] = useState<EstadoOperacionesMvpApi | null>(null);
  const [meta, setMeta] = useState({ despachoHabilitado: false, destinoConfigurado: false });
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [eventoReproceso, setEventoReproceso] = useState<string | null>(null);
  const [intencionReproceso, setIntencionReproceso] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [categoriaEventosActiva, setCategoriaEventosActiva] = useState<CategoriaEventosIntegracion>('eventos');
  const [aplicaciones, setAplicaciones] = useState<AplicacionApiAdmin[] | null>(null);
  const [cargandoAplicaciones, setCargandoAplicaciones] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await adminFetch('/api/v1/admin/integraciones/estado?limite=100');
      const body: any = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setEstado(body.data.outbox);
      setOperaciones(body.data);
      setMeta({
        despachoHabilitado: body.meta?.despacho_habilitado === true,
        destinoConfigurado: body.meta?.destino_configurado === true,
      });
    } catch (e: any) {
      setError(e.message || 'No se pudo consultar la entrega de eventos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarAplicaciones = async () => {
    if (!esSuperAdmin) return;
    setCargandoAplicaciones(true);
    setError('');
    try {
      const response = await adminFetch('/api/v1/admin/integraciones/aplicaciones');
      const body: any = await response.json();
      if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
      setAplicaciones(body.data?.aplicaciones || []);
    } catch (cause: any) {
      setError(cause.message || 'No se pudo consultar el registro de aplicaciones API.');
    } finally {
      setCargandoAplicaciones(false);
    }
  };

  useEffect(() => {
    if (categoriaEventosActiva === 'aplicaciones' && aplicaciones === null) cargarAplicaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaEventosActiva, esSuperAdmin]);

  const despachar = async () => {
    setProcesando(true);
    setError('');
    setMensaje('');
    try {
      const res = await adminFetch('/api/v1/admin/integraciones/outbox/despachar', { method: 'POST' });
      const body: any = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      const resultado = body.data;
      setMensaje(`Lote procesado: ${resultado.entregados} entregados, ${resultado.reprogramados} reprogramados y ${resultado.deadLetter} con atención requerida.`);
      await cargar();
    } catch (e: any) {
      setError(e.message || 'No se pudo procesar la cola.');
    } finally {
      setProcesando(false);
    }
  };

  const expirarRetencionesVencidas = async () => {
    const cantidad = operaciones?.reservas.retencionesVencidasSinProcesar || 0;
    if (cantidad === 0) return;
    if (!window.confirm(
      `Se liberará el inventario de ${cantidad} reserva${cantidad === 1 ? '' : 's'} cuya retención ya venció. ¿Continuar?`
    )) return;
    setProcesando(true);
    setError('');
    setMensaje('');
    try {
      const res = await adminFetch('/api/v1/admin/integraciones/retenciones/expirar', { method: 'POST' });
      const body: any = await res.json();
      if (!res.ok) throw new Error(body.error?.mensaje || body.error || `HTTP ${res.status}`);
      const expiradas = Number(body.data?.expiradas || 0);
      setMensaje(expiradas === 1
        ? 'Se liberó 1 retención vencida y el cambio quedó auditado.'
        : `Se liberaron ${expiradas} retenciones vencidas y el cambio quedó auditado.`);
      await cargar();
    } catch (e: any) {
      setError(e.message || 'No se pudieron liberar las retenciones vencidas.');
    } finally {
      setProcesando(false);
    }
  };

  const reprocesar = async (eventId: string) => {
    setProcesando(true);
    setError('');
    setMensaje('');
    try {
      const res = await adminFetch('/api/v1/admin/integraciones/outbox/reprocesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, motivo: motivo.trim() }),
      });
      const body: any = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setEventoReproceso(null);
      setMotivo('');
      setMensaje('El evento volvió a Pendiente y el cambio quedó auditado.');
      await cargar();
    } catch (e: any) {
      setError(e.message || 'No se pudo reintentar el evento.');
    } finally {
      setProcesando(false);
    }
  };

  const reprocesarComunicacion = async (intencionUid: string) => {
    setProcesando(true);
    setError('');
    setMensaje('');
    try {
      const res = await adminFetch('/api/v1/admin/integraciones/comunicaciones/reprocesar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intencion_uid: intencionUid, motivo: motivo.trim() }),
      });
      const body: any = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setIntencionReproceso(null);
      setMotivo('');
      setMensaje('La comunicación volvió a Pendiente y el cambio quedó auditado.');
      await cargar();
    } catch (e: any) {
      setError(e.message || 'No se pudo reintentar la comunicación.');
    } finally {
      setProcesando(false);
    }
  };

  const configuracionLista = meta.despachoHabilitado && meta.destinoConfigurado;
  const tasa = estado ? Math.round(estado.deliveryLast24h.failureRate * 1000) / 10 : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Entrega de eventos</h2>
          <p className="mt-1 max-w-2xl text-xs text-gray-500">
            Cambios de reservas que se entregan a otros sistemas. La reserva nunca depende de que el sistema externo esté disponible.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={cargar} disabled={cargando || procesando}
            className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50 ${FOCUS_RING}`}>
            <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} aria-hidden="true" /> Actualizar
          </button>
          {esSuperAdmin && categoriaEventosActiva === 'comunicaciones' && <button type="button" onClick={despachar}
            disabled={procesando || !configuracionLista}
            title={!configuracionLista ? 'Primero hay que habilitar y configurar el destino en este ambiente.' : undefined}
            className={`rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 ${FOCUS_RING}`}>
            {procesando ? 'Enviando…' : 'Enviar comunicaciones pendientes'}
          </button>}
        </div>
      </div>

      <div className={`rounded-lg border px-4 py-3 text-sm ${configuracionLista ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
        <p className="font-semibold">{configuracionLista ? 'Entrega configurada en este ambiente' : 'Entrega todavía no habilitada'}</p>
        <p className="mt-0.5 text-xs">
          {configuracionLista
            ? 'Las comunicaciones de reservas se pueden enviar desde su pestaña. Las notificaciones de arrepentimiento se gestionan por separado.'
            : `Despacho: ${meta.despachoHabilitado ? 'habilitado' : 'desactivado'} · destino: ${meta.destinoConfigurado ? 'configurado' : 'sin configurar'}.`}
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{error}</p>}
      {mensaje && <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700" role="status">{mensaje}</p>}

      {(operaciones?.alertas || []).length > 0 && (
        <section className="space-y-2" aria-label="Alertas operativas">
          {operaciones!.alertas.map(alerta => (
            <div key={alerta.codigo} className={`rounded-lg border px-4 py-3 text-sm ${
              alerta.nivel === 'critical'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}>
              <p className="font-semibold">{alerta.mensaje}</p>
              <p className="mt-0.5 text-xs">{alerta.cantidad} elemento{alerta.cantidad === 1 ? '' : 's'} · código {alerta.codigo}</p>
            </div>
          ))}
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard compact label="Reservas pendientes" value={operaciones ? String(operaciones.reservas.pendientesPago) : '—'}
          hint={operaciones?.reservas.oldestPendingAgeSeconds != null ? `Más antigua: ${fmtDuracion(operaciones.reservas.oldestPendingAgeSeconds)}` : undefined} />
        <MetricCard compact label="Retenciones vencidas" value={operaciones ? String(operaciones.reservas.retencionesVencidasSinProcesar) : '—'} />
        <MetricCard compact label="Webhooks MP 24 h" value={operaciones ? String(operaciones.pagos.webhooksLast24h) : '—'}
          hint={operaciones ? `${operaciones.pagos.aplicadosLast24h} aplicados` : undefined} />
        <MetricCard compact label="Pagos a conciliar" value={operaciones ? String(operaciones.pagos.inconsistentesLast24h) : '—'} />
      </div>

      {esSuperAdmin && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-900">Liberar inventario vencido</p>
            <p className="mt-0.5 text-xs text-amber-800">
              Vence las retenciones fuera de término y vuelve a dejar disponibles sus plazas.
            </p>
          </div>
          <button type="button" onClick={expirarRetencionesVencidas}
            disabled={procesando || !operaciones || operaciones.reservas.retencionesVencidasSinProcesar === 0}
            className={`shrink-0 rounded-lg border border-amber-400 bg-white px-3 py-2 text-xs font-semibold text-amber-900 disabled:opacity-50 ${FOCUS_RING}`}>
            Liberar retenciones vencidas
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard compact label="Pendientes" value={estado ? String(estado.resumen.pending) : '—'} />
        <MetricCard compact label="Procesando" value={estado ? String(estado.resumen.processing) : '—'} />
        <MetricCard compact label="Entregados" value={estado ? String(estado.resumen.delivered) : '—'} />
        <MetricCard compact label="Con atención" value={estado ? String(estado.resumen.dead_letter) : '—'} />
        <MetricCard compact label="Fallas 24 h" value={estado ? `${tasa}%` : '—'}
          hint={estado ? `${estado.deliveryLast24h.failures} de ${estado.deliveryLast24h.attempts} intentos` : undefined} />
      </div>

      {estado?.oldestPendingAgeSeconds != null && (
        <p className="text-xs text-gray-500">Pendiente más antiguo: hace {fmtDuracion(estado.oldestPendingAgeSeconds)}.</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 shadow-sm" role="tablist" aria-label="Categorías de eventos de integración">
        <div className="flex min-w-max gap-1">
          {([
            { key: 'eventos', label: 'Eventos recientes', cantidad: estado?.eventos.length || 0 },
            { key: 'comunicaciones', label: 'Comunicaciones de reservas', cantidad: operaciones?.comunicaciones.intenciones.length || 0 },
            { key: 'mercado_pago', label: 'Mercado Pago reciente', cantidad: operaciones?.pagos.eventos.length || 0 },
            ...(esSuperAdmin ? [{ key: 'aplicaciones' as const, label: 'Aplicaciones API', cantidad: aplicaciones?.length || 0 }] : []),
          ] as Array<{ key: CategoriaEventosIntegracion; label: string; cantidad: number }>).map(categoria => (
            <button
              key={categoria.key}
              type="button"
              role="tab"
              aria-selected={categoriaEventosActiva === categoria.key}
              aria-controls={`integraciones-panel-${categoria.key}`}
              id={`integraciones-tab-${categoria.key}`}
              onClick={() => setCategoriaEventosActiva(categoria.key)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${FOCUS_RING} ${
                categoriaEventosActiva === categoria.key
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {categoria.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${categoriaEventosActiva === categoria.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {categoria.cantidad}
              </span>
            </button>
          ))}
        </div>
      </div>

      {categoriaEventosActiva === 'eventos' && <section
        id="integraciones-panel-eventos"
        role="tabpanel"
        aria-labelledby="integraciones-tab-eventos"
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Eventos recientes</h3>
        </div>
        {cargando && !estado ? (
          <LoadingState className="py-12" label="Cargando eventos" />
        ) : (
          <ul className="divide-y divide-gray-100">
            {(estado?.eventos || []).map(evento => {
              const necesitaAtencion = evento.estado === 'dead_letter';
              return <li key={evento.eventId} className="px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        evento.estado === 'delivered' ? 'bg-green-100 text-green-800' :
                        necesitaAtencion ? 'bg-red-100 text-red-800' :
                        evento.estado === 'processing' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>{ESTADO_EVENTO_LABEL[evento.estado]}</span>
                      <span className="text-sm font-semibold text-gray-800">{evento.eventType}</span>
                    </div>
                    <p className="mt-1 break-all text-xs text-gray-500">Evento: {evento.eventId}</p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Reserva {evento.aggregateId} · {evento.attempts} intento{evento.attempts === 1 ? '' : 's'} · creado {fmtFechaHora(evento.createdAt)}
                      {evento.deliveryLatencySeconds != null ? ` · entregado en ${fmtDuracion(evento.deliveryLatencySeconds)}` : ''}
                    </p>
                    {evento.lastErrorCode && <p className="mt-1 text-xs font-medium text-red-700">Código: {evento.lastErrorCode}</p>}
                  </div>
                  {esSuperAdmin && necesitaAtencion && eventoReproceso !== evento.eventId && (
                    <button type="button" onClick={() => { setEventoReproceso(evento.eventId); setIntencionReproceso(null); setMotivo(''); }}
                      className={`self-start rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 ${FOCUS_RING}`}>
                      Preparar reintento
                    </button>
                  )}
                </div>
                {esSuperAdmin && necesitaAtencion && eventoReproceso === evento.eventId && (
                  <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
                    <label htmlFor={`motivo_${evento.eventId}`} className="text-xs font-semibold text-red-800">Motivo del reintento</label>
                    <textarea id={`motivo_${evento.eventId}`} rows={2} maxLength={500} value={motivo}
                      onChange={e => setMotivo(e.target.value)} placeholder="Ej. Destino recuperado y validado"
                      className={`mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm ${FOCUS_RING}`} />
                    <div className="mt-2 flex justify-end gap-2">
                      <button type="button" onClick={() => { setEventoReproceso(null); setMotivo(''); }}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 ${FOCUS_RING}`}>Cancelar</button>
                      <button type="button" onClick={() => reprocesar(evento.eventId)}
                        disabled={procesando || motivo.trim().length < 8}
                        className={`rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 ${FOCUS_RING}`}>
                        Volver a Pendiente
                      </button>
                    </div>
                  </div>
                )}
              </li>;
            })}
            {!cargando && estado?.eventos.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-gray-400">Todavía no hay eventos de integración.</li>
            )}
          </ul>
        )}
      </section>}

      {categoriaEventosActiva === 'comunicaciones' && <section
        id="integraciones-panel-comunicaciones"
        role="tabpanel"
        aria-labelledby="integraciones-tab-comunicaciones"
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Comunicaciones de reservas</h3>
          <p className="mt-1 text-xs text-gray-500">Intenciones durables, sin datos personales. El canal de correo se habilita por separado.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 border-b border-gray-100 p-4 lg:grid-cols-5">
          <MetricCard compact label="Pendientes" value={operaciones ? String(operaciones.comunicaciones.resumen.pendiente) : '—'} />
          <MetricCard compact label="Procesando" value={operaciones ? String(operaciones.comunicaciones.resumen.procesando) : '—'} />
          <MetricCard compact label="Entregadas" value={operaciones ? String(operaciones.comunicaciones.resumen.entregada) : '—'} />
          <MetricCard compact label="Sin canal" value={operaciones ? String(operaciones.comunicaciones.resumen.sin_canal) : '—'} />
          <MetricCard compact label="Con atención" value={operaciones ? String(operaciones.comunicaciones.resumen.dead_letter) : '—'} />
        </div>
        <ul className="divide-y divide-gray-100">
          {(operaciones?.comunicaciones.intenciones || []).slice(0, 20).map(intencion => (
            <li key={intencion.intencionUid} className="px-4 py-3 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      intencion.estado === 'entregada' ? 'bg-green-100 text-green-800' :
                      intencion.estado === 'dead_letter' ? 'bg-red-100 text-red-800' :
                      intencion.estado === 'sin_canal' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>{intencion.estado.replace('_', ' ')}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      intencion.audiencia === 'equipo'
                        ? 'bg-violet-100 text-violet-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}>{intencion.audiencia === 'equipo' ? 'Equipo' : 'Huésped'}</span>
                    <span className="text-sm font-semibold text-gray-800">{intencion.tipo.replaceAll('_', ' ')}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Reserva {intencion.reservaId} · {intencion.idioma.toUpperCase()} · {intencion.attempts} intento{intencion.attempts === 1 ? '' : 's'}</p>
                  <p className="mt-1 break-all text-[11px] text-gray-400">{intencion.intencionUid}</p>
                  {intencion.lastErrorCode && <p className="mt-1 text-xs font-medium text-red-700">Código: {intencion.lastErrorCode}</p>}
                </div>
                {esSuperAdmin && ['sin_canal', 'dead_letter'].includes(intencion.estado) && intencionReproceso !== intencion.intencionUid && (
                  <button type="button" onClick={() => { setIntencionReproceso(intencion.intencionUid); setEventoReproceso(null); setMotivo(''); }}
                    className={`rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 ${FOCUS_RING}`}>Preparar reintento</button>
                )}
              </div>
              {esSuperAdmin && intencionReproceso === intencion.intencionUid && (
                <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
                  <label htmlFor={`motivo_com_${intencion.intencionUid}`} className="text-xs font-semibold text-amber-900">Motivo del reintento</label>
                  <textarea id={`motivo_com_${intencion.intencionUid}`} rows={2} maxLength={500} value={motivo}
                    onChange={e => setMotivo(e.target.value)} placeholder="Ej. Canal habilitado y configuración validada"
                    className={`mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm ${FOCUS_RING}`} />
                  <div className="mt-2 flex justify-end gap-2">
                    <button type="button" onClick={() => { setIntencionReproceso(null); setMotivo(''); }} className={`rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 ${FOCUS_RING}`}>Cancelar</button>
                    <button type="button" onClick={() => reprocesarComunicacion(intencion.intencionUid)} disabled={procesando || motivo.trim().length < 8}
                      className={`rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 ${FOCUS_RING}`}>Volver a Pendiente</button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {!cargando && operaciones?.comunicaciones.intenciones.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-gray-400">Todavía no hay comunicaciones registradas.</li>
          )}
        </ul>
      </section>}

      {categoriaEventosActiva === 'mercado_pago' && <section
        id="integraciones-panel-mercado_pago"
        role="tabpanel"
        aria-labelledby="integraciones-tab-mercado_pago"
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Mercado Pago reciente</h3>
        </div>
        <ul className="divide-y divide-gray-100">
          {(operaciones?.pagos.eventos || []).map((evento, index) => (
            <li key={`${evento.correlationId || 'sin-correlacion'}-${index}`} className="px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${evento.resultado === 'inconsistente' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{evento.resultado}</span>
                <span className="text-sm text-gray-700">Reserva {evento.reservaId ?? 'sin vincular'}</span>
              </div>
              <p className="mt-1 break-all text-xs text-gray-500">Solicitud: {evento.correlationId || 'sin correlación'}</p>
              {evento.motivoCodigo && <p className="mt-1 text-xs font-medium text-red-700">Código: {evento.motivoCodigo}</p>}
              <p className="mt-1 text-[11px] text-gray-400">{fmtFechaHora(evento.createdAt)}</p>
            </li>
          ))}
          {!cargando && operaciones?.pagos.eventos.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-gray-400">No hay webhooks de Mercado Pago registrados.</li>
          )}
        </ul>
      </section>}

      {categoriaEventosActiva === 'aplicaciones' && esSuperAdmin && <section
        id="integraciones-panel-aplicaciones"
        role="tabpanel"
        aria-labelledby="integraciones-tab-aplicaciones"
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Aplicaciones registradas y endpoints</h3>
            <p className="mt-1 text-xs text-gray-500">El seguimiento comienza desde la fecha de registro mostrada. Nunca se exponen credenciales ni valores secretos.</p>
          </div>
          <Button type="button" onPress={cargarAplicaciones} isDisabled={cargandoAplicaciones} isLoading={cargandoAplicaciones}
            size="sm" shape="rounded" variant="secondary" className="self-start">
            {!cargandoAplicaciones && <RefreshCw size={14} aria-hidden="true" />} Actualizar registro
          </Button>
        </div>
        {cargandoAplicaciones && aplicaciones === null ? <LoadingState className="py-12" label="Cargando aplicaciones" /> :
          <ul className="divide-y divide-gray-100">{(aplicaciones || []).map(aplicacion => <Card as="li" variant="default" key={aplicacion.codigo} className="rounded-none border-0 px-4 py-4 shadow-none sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm text-gray-800">{aplicacion.nombre}</strong>
                  <Badge variant={aplicacion.configurada ? 'success' : 'neutral'}>{aplicacion.configurada ? 'Configurada' : 'Sin credencial'}</Badge>
                  <Badge variant="outline">{aplicacion.tipo.replace('_', ' ')}</Badge>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">Código: <CodeBadge>{aplicacion.codigo}</CodeBadge><span>· registrada {aplicacion.registrado_at ? fmtFechaHora(aplicacion.registrado_at) : 'sin fecha disponible'}</span></p>
              </div>
              <DescriptionList columns={3} density="compact" className="min-w-full text-xs lg:min-w-[420px]">
                <DescriptionListItem label="Primer uso">{aplicacion.first_used_at ? fmtFechaHora(aplicacion.first_used_at) : 'Sin uso'}</DescriptionListItem>
                <DescriptionListItem label="Último uso">{aplicacion.last_used_at ? fmtFechaHora(aplicacion.last_used_at) : 'Sin uso'}</DescriptionListItem>
                <DescriptionListItem label="Solicitudes">{aplicacion.request_count}</DescriptionListItem>
              </DescriptionList>
            </div>
            {aplicacion.endpoints.length > 0 ? <TableContainer label={`Endpoints de ${aplicacion.nombre}`} className="mt-4 rounded-lg border border-gray-100">
              <Table density="compact" className="min-w-[720px] text-xs">
                <TableHeader><TableRow><TableHead>Método</TableHead><TableHead>Endpoint</TableHead><TableHead>Primer uso</TableHead><TableHead>Último uso</TableHead><TableHead className="text-right">Solicitudes</TableHead></TableRow></TableHeader>
                <TableBody>{aplicacion.endpoints.map(endpoint => <TableRow key={`${endpoint.method}-${endpoint.path}`}>
                  <TableCell><CodeBadge tone="info">{endpoint.method}</CodeBadge></TableCell>
                  <TableCell><code className="font-mono text-gray-700">{endpoint.path}</code></TableCell>
                  <TableCell className="text-gray-500">{endpoint.first_used_at ? fmtFechaHora(endpoint.first_used_at) : '—'}</TableCell>
                  <TableCell className="text-gray-500">{endpoint.last_used_at ? fmtFechaHora(endpoint.last_used_at) : '—'}</TableCell>
                  <TableCell className="text-right font-semibold text-gray-700">{endpoint.request_count}</TableCell>
                </TableRow>)}</TableBody>
              </Table>
            </TableContainer> : <EmptyState className="mt-3 rounded-lg bg-gray-50 px-3 py-2" alignment="start" size="compact" title="Identidad registrada, sin endpoint implementado actualmente." />}
          </Card>)}
          {!cargandoAplicaciones && aplicaciones?.length === 0 && <li><EmptyState size="compact" title="No hay aplicaciones registradas." /></li>}
          </ul>}
      </section>}
    </div>
  );
};

const PanelReservas: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const codigoReservaEnlace = codigoReservaDesdeConsulta(location.search);
  const enlaceReservaProcesado = useRef<string | null>(null);
  const [auth, setAuth] = useState<{ email: string; rol: Rol } | null | 'cargando'>('cargando');
  const [sesionExpirada, setSesionExpirada] = useState(false);
  const vistaEnRuta = vistaDesdeRuta(location.pathname);
  const vistaActiva = vistaEnRuta ?? 'operativa';
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [reservasHistorial, setReservasHistorial] = useState<Reserva[] | null>(null);
  const [historialPagina, setHistorialPagina] = useState(1);
  const [historialTotalPaginas, setHistorialTotalPaginas] = useState(1);
  const [historialTotal, setHistorialTotal] = useState(0);
  const [historialOrden, setHistorialOrden] = useState<OrdenHistorial>('checkin');
  const [historialDireccion, setHistorialDireccion] = useState<DireccionOrdenHistorial>('desc');
  const [consultas, setConsultas] = useState<Consulta[] | null>(null);
  const [alojamientos, setAlojamientos] = useState<Alojamiento[]>([]);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ventanaInicio, setVentanaInicio] = useState(() => fechaOperativaLocal(new Date()));
  const [busqueda, setBusqueda] = useState(() => codigoReservaEnlace || '');

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

  const cargarHistorial = (
    pagina = historialPagina,
    titular = busqueda,
    orden = historialOrden,
    direccion = historialDireccion
  ) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      pagina: String(pagina), limite: '25', orden, direccion,
    });
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

  const ordenarHistorial = (campo: OrdenHistorial) => {
    const nuevaDireccion: DireccionOrdenHistorial =
      campo === historialOrden ? (historialDireccion === 'asc' ? 'desc' : 'asc') : 'asc';
    setHistorialOrden(campo);
    setHistorialDireccion(nuevaDireccion);
    void cargarHistorial(1, busqueda, campo, nuevaDireccion);
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
    if (vistaEnRuta === null) navigate(ADMIN_RESERVAS_BASE, { replace: true });
  }, [navigate, vistaEnRuta]);

  const rolEnSesion = typeof auth === 'object' && auth ? auth.rol : null;
  useEffect(() => {
    if (!rolEnSesion) return;
    const puedeEditarRuta = rolEnSesion === 'super_admin' || rolEnSesion === 'editor';
    const requiereEdicion = vistaActiva === 'ocupacion';
    const requiereSuperAdmin = vistaActiva === 'usuarios' || vistaActiva === 'actividad';
    if ((requiereEdicion && !puedeEditarRuta) || (requiereSuperAdmin && rolEnSesion !== 'super_admin')) {
      navigate(ADMIN_RESERVAS_BASE, { replace: true });
    }
  }, [navigate, rolEnSesion, vistaActiva]);

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

  const abrirPorId = async (id: number, reservaFallback?: Reserva) => {
    let r = reservaFallback || reservas.find(x => x.id === id) || (reservasHistorial || []).find(x => x.id === id);
    try {
      const res = await adminFetch(`/api/v1/admin/reservas/${id}`);
      if (res.status === 401) { manejarNoAutenticado(); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body: any = await res.json();
      r = reservaDesdeV1(body.data.reserva, body.data.historial);
    } catch (e: any) {
      if (!r) setError(e.message || 'No se pudo cargar la reserva.');
    }
    if (r) setModalReserva({ modo: 'editar', reserva: r });
  };

  useEffect(() => {
    if (!codigoReservaEnlace) {
      enlaceReservaProcesado.current = null;
      return;
    }
    if (auth === 'cargando' || !auth || enlaceReservaProcesado.current === codigoReservaEnlace) return;

    enlaceReservaProcesado.current = codigoReservaEnlace;
    setBusqueda(codigoReservaEnlace);
    setError(null);
    if (vistaActiva !== 'historial') {
      navigate(`${RUTA_POR_VISTA.historial}?reserva=${encodeURIComponent(codigoReservaEnlace)}`, { replace: true });
    }

    let activo = true;
    const params = new URLSearchParams({
      pagina: '1', limite: '25', titular: codigoReservaEnlace,
      orden: 'creada', direccion: 'desc',
    });
    paginaReservasV1(params)
      .then(({ reservas: encontradas }) => {
        if (!activo) return;
        const encontrada = encontradas.find(
          reserva => reserva.codigo.toUpperCase() === codigoReservaEnlace
        );
        if (!encontrada) {
          setError(`No se encontró la reserva ${codigoReservaEnlace}.`);
          return;
        }
        void abrirPorId(encontrada.id, encontrada);
      })
      .catch(err => {
        if (!activo) return;
        if (err.message === '__unauthorized__') manejarNoAutenticado();
        else setError(err.message || `No se pudo abrir la reserva ${codigoReservaEnlace}.`);
      });

    return () => { activo = false; };
    // La URL es la fuente de verdad del enlace; las funciones usan el estado vigente al resolverlo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, codigoReservaEnlace]);

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
        <LoadingState label="Cargando panel de reservas" />
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

  const vistaMeta: Record<VistaActiva, { titulo: string; descripcion: string }> = {
    operativa: { titulo: 'Hoy en Pueblo Mágico', descripcion: 'Llegadas, salidas y ocupación que necesitan atención.' },
    ocupacion: { titulo: 'Bloqueos y ocupación', descripcion: 'Gestioná mantenimiento, eventos y estadías internas sin perder trazabilidad.' },
    metricas: { titulo: 'Reportes', descripcion: 'Indicadores operativos y financieros calculados con datos reales de reservas.' },
    historial: { titulo: 'Reservas', descripcion: 'Buscá, revisá y gestioná cada estadía desde un solo lugar.' },
    consultas: { titulo: 'Consultas', descripcion: 'Revisá las consultas que todavía no se convirtieron en reservas.' },
    arrepentimientos: { titulo: 'Arrepentimientos', descripcion: 'Gestioná solicitudes y su seguimiento con acceso según tu rol.' },
    configuracion: { titulo: 'Configuración', descripcion: 'Parámetros comerciales y operativos del sistema de reservas.' },
    precios: { titulo: 'Políticas de precios', descripcion: 'Ofertas, temporadas, alimentación, ajustes y reglas de seña.' },
    integraciones: { titulo: 'Integraciones', descripcion: 'Estado, eventos y reintentos de las conexiones externas.' },
    usuarios: { titulo: 'Usuarios', descripcion: 'Administrá accesos y permisos del equipo.' },
    actividad: { titulo: 'Actividad', descripcion: 'Consultá el registro de auditoría del sistema.' },
  };

  const navPrincipal: Array<{ key: VistaActiva; label: string; icon: React.ReactNode }> = [
    { key: 'operativa', label: 'Inicio', icon: <Home aria-hidden="true" /> },
    { key: 'historial', label: 'Reservas', icon: <CalendarDays aria-hidden="true" /> },
    ...(puedeEditar ? [{ key: 'ocupacion' as VistaActiva, label: 'Bloqueos', icon: <ClipboardList aria-hidden="true" /> }] : []),
    { key: 'metricas', label: 'Reportes', icon: <BarChart3 aria-hidden="true" /> },
  ];
  const navOperaciones: Array<{ key: VistaActiva; label: string; icon: React.ReactNode }> = [
    { key: 'consultas', label: 'Consultas', icon: <MessageCircle aria-hidden="true" /> },
    { key: 'arrepentimientos', label: 'Arrepentimientos', icon: <ShieldAlert aria-hidden="true" /> },
  ];
  const navSistema: Array<{ key: VistaActiva; label: string; icon: React.ReactNode }> = [
    { key: 'configuracion', label: 'Configuración', icon: <Settings aria-hidden="true" /> },
    { key: 'precios', label: 'Políticas de precios', icon: <BadgeDollarSign aria-hidden="true" /> },
    { key: 'integraciones', label: 'Integraciones', icon: <Link2 aria-hidden="true" /> },
    ...(esSuperAdmin ? [
      { key: 'usuarios' as VistaActiva, label: 'Usuarios', icon: <Users aria-hidden="true" /> },
      { key: 'actividad' as VistaActiva, label: 'Actividad', icon: <Activity aria-hidden="true" /> },
    ] : []),
  ];
  const navItems = [...navPrincipal, ...navOperaciones, ...navSistema];
  const navButton = ({ key, label, icon }: typeof navItems[number]) => (
    <button
      key={key}
      type="button"
      className={`admin-nav-button ${FOCUS_RING}`}
      aria-current={vistaActiva === key ? 'page' : undefined}
      onClick={() => navigate(RUTA_POR_VISTA[key])}
    >
      {icon}<span>{label}</span>
    </button>
  );

  return (
    <div className="admin-panel-scope min-h-screen">
      <style>{`
        .admin-panel-scope, .admin-panel-scope * {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif;
        }
        .admin-panel-scope h1, .admin-panel-scope h2, .admin-panel-scope h3, .admin-panel-scope h4 {
          font-family: inherit;
        }
      `}</style>

      <div className="admin-shell">
        <aside className="admin-sidebar" aria-label="Navegación del panel">
          <div className="admin-sidebar__brand"><img src="/uploads/pueblo_magico_logo_marron.svg" alt="Pueblo Mágico" /><small>Reservas</small></div>
          <div className="admin-sidebar__scroll">
            <nav className="admin-sidebar__nav" aria-label="Principal">{navPrincipal.map(navButton)}</nav>
            <p className="admin-sidebar__section">Operaciones</p>
            <nav className="admin-sidebar__nav" aria-label="Operaciones">{navOperaciones.map(navButton)}</nav>
            <p className="admin-sidebar__section">Sistema</p>
            <nav className="admin-sidebar__nav" aria-label="Sistema">{navSistema.map(navButton)}</nav>
          </div>
          <div className="admin-sidebar__user">
            <span className="admin-sidebar__avatar">{auth.email.slice(0, 1)}</span>
            <span><strong>{auth.email.split('@')[0]}</strong><small>{ROL_LABEL[auth.rol]}</small></span>
            <button type="button" className={`admin-sidebar__logout ${FOCUS_RING}`} onClick={cerrarSesion} aria-label="Cerrar sesión" title={auth.email}><LogOut size={17} aria-hidden="true" /></button>
          </div>
        </aside>

        <div className="admin-workspace">
          <header className="admin-topbar">
            <div className="admin-topbar__identity"><p>Administración de reservas</p><h1>Pueblo Mágico</h1></div>
            <span className="admin-mobile-brand"><img src="/uploads/pueblo_magico_logo_marron.svg" alt="Pueblo Mágico" /><span>Reservas</span></span>
            <div className="admin-topbar__actions">
              <span className="admin-date-chip"><CalendarDays size={16} aria-hidden="true" /> {fmtDateLong(fechaOperativaLocal(new Date()))}</span>
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
              <IconButton
                icon={loading ? null : <RefreshCw size={15} />}
                isLoading={loading}
                label="Actualizar"
                onPress={actualizar}
                variant="secondary"
              />
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
          </header>

          <nav className="admin-mobile-nav" aria-label="Secciones del panel">{navItems.map(navButton)}</nav>

          <InstalarBanner />

          <main className="admin-content">
            <div className="admin-view-heading"><h2>{vistaMeta[vistaActiva].titulo}</h2><p>{vistaMeta[vistaActiva].descripcion}</p></div>
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

            <div className="admin-surface bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
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
          <div className="admin-reports">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <MetricCard label="Reservas confirmadas" value={metricas ? String(metricas.total_confirmadas) : '—'} />
              <MetricCard label="Ingresos por señas" value={metricas ? fmtMoney(metricas.ingresos_senas) : '—'} accent="gold" />
              <MetricCard label="Saldo pendiente a cobrar" value={metricas ? fmtMoney(metricas.saldo_pendiente_total) : '—'} hint="Al check-in, confirmadas" />
              <MetricCard label="Total a facturar" value={metricas ? fmtMoney(metricas.total_a_facturar) : '—'} accent="gold" hint="Si se cobra todo" />
            </div>

            <div className="admin-report-charts" aria-label="Gráficos de reportes">
              <FinancialCompositionChart collected={metricas?.ingresos_senas || 0} pending={metricas?.saldo_pendiente_total || 0} />
              <RingMetric label="Ocupación · próximos 14 días" value={ocupacionPct} detail="Capacidad ocupada en la ventana visible" />
              <RingMetric
                label="Conversión ManyChat"
                value={metricas?.conversion_manychat.pct ?? null}
                detail={metricas ? `${metricas.conversion_manychat.confirmadas} de ${metricas.conversion_manychat.total} reservas pagaron` : 'Cargando datos'}
                accent="gold"
              />
            </div>

            <SeccionMetricasOperativas mostrarGrafico />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {esSuperAdmin && <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
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
          </div>
        )}

        {vistaActiva === 'historial' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Historial completo {loading && <span className="font-normal normal-case text-gray-400">(cargando…)</span>}
              </h2>
              <div className="flex gap-2">
                <SearchField
                  className="admin-history-search flex-1 sm:flex-none sm:w-64"
                  clearLabel="Limpiar búsqueda"
                  label="Buscar reservas"
                  onChange={setBusqueda}
                  placeholder="Buscar por nombre o ID…"
                  value={busqueda}
                />
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
            <div className="admin-surface bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <TablaHistorial
                reservas={reservasHistorialFiltradas}
                onSeleccionar={r => abrirPorId(r.id)}
                orden={historialOrden}
                direccion={historialDireccion}
                onOrdenar={ordenarHistorial}
              />
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
            <div className="admin-surface bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <TablaConsultas consultas={consultas || []} />
            </div>
          </>
        )}

        {vistaActiva === 'arrepentimientos' && <SeccionArrepentimientos puedeGestionar={puedeEditar} />}

        {vistaActiva === 'configuracion' && <SeccionConfiguracionBase esSuperAdmin={esSuperAdmin} modo="base" />}
        {vistaActiva === 'precios' && <SeccionConfiguracionBase esSuperAdmin={esSuperAdmin} modo="precios" />}
        {vistaActiva === 'integraciones' && <SeccionIntegraciones esSuperAdmin={esSuperAdmin} />}
        {vistaActiva === 'usuarios' && esSuperAdmin && <SeccionUsuarios emailActual={auth.email} />}
        {vistaActiva === 'actividad' && esSuperAdmin && <SeccionActividad />}
          </main>
        </div>
      </div>

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
