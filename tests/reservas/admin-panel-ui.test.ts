import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../../src/PanelReservas.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../../src/PanelReservas.css', import.meta.url), 'utf8');
const appRoutes = readFileSync(new URL('../../index.tsx', import.meta.url), 'utf8');
const prerender = readFileSync(new URL('../../scripts/prerender.mjs', import.meta.url), 'utf8');

test('organiza el panel en sidebar y workspace responsivo', () => {
  assert.match(source, /className="admin-sidebar"/);
  assert.match(source, /className="admin-workspace"/);
  assert.match(source, /className="admin-topbar"/);
  assert.match(source, /className="admin-mobile-nav"/);
  assert.match(source, /className="admin-sidebar__scroll"/);
  assert.doesNotMatch(source, /admin-nav-button__alert/);
  assert.match(styles, /\.admin-sidebar\s*\{[^}]*position:\s*fixed/s);
  assert.match(styles, /\.admin-sidebar__scroll\s*\{[^}]*min-height:\s*0[^}]*overflow-y:\s*auto/s);
  assert.match(styles, /@media \(max-width: 1023px\)[\s\S]*\.admin-sidebar\s*\{\s*display:\s*none/s);
  assert.match(styles, /\.admin-mobile-nav\s*\{[^}]*display:\s*none/s);
});

test('mantiene cada sección en una URL recargable y compatible con navegación del browser', () => {
  assert.match(appRoutes, /path="\/admin\/reservas\/\*"/);
  assert.match(source, /useLocation, useNavigate/);
  assert.match(source, /configuracion: `\$\{ADMIN_RESERVAS_BASE\}\/configuracion`/);
  assert.match(source, /onClick=\{\(\) => navigate\(RUTA_POR_VISTA\[key\]\)\}/);
  assert.match(source, /vistaDesdeRuta\(location\.pathname\)/);
  assert.match(prerender, /ADMIN_RESERVAS_SECTIONS/);
  for (const section of ['listado', 'bloqueos', 'reportes', 'consultas', 'arrepentimientos', 'configuracion', 'integraciones', 'usuarios', 'actividad']) {
    assert.match(prerender, new RegExp(`['"]${section}['"]`));
  }
});

test('mantiene accesibles todas las vistas existentes y sus permisos', () => {
  for (const view of ['operativa', 'ocupacion', 'metricas', 'historial', 'consultas', 'arrepentimientos', 'configuracion', 'integraciones', 'usuarios', 'actividad']) {
    assert.match(source, new RegExp(`key: '${view}'`));
  }
  assert.match(source, /puedeEditar \? \[\{ key: 'ocupacion'/);
  assert.match(source, /esSuperAdmin \? \[/);
  assert.match(source, /vistaActiva === 'ocupacion' && puedeEditar/);
  assert.match(source, /vistaActiva === 'usuarios' && esSuperAdmin/);
  assert.match(source, /vistaActiva === 'actividad' && esSuperAdmin/);
});

test('conserva las acciones existentes de reservas y exportación', () => {
  assert.match(source, /descargarReporteServidor\(\)/);
  assert.match(source, /setModalReserva\(\{ modo: 'crear', reserva: null \}\)/);
  assert.match(source, /onPress=\{actualizar\}/);
  assert.match(source, /onClick=\{cerrarSesion\}/);
  assert.match(source, /<SeccionOcupacionOperativa \/>/);
  assert.match(source, /<SeccionArrepentimientos puedeGestionar=\{puedeEditar\} \/>/);
  assert.match(source, /<SeccionIntegraciones esSuperAdmin=\{esSuperAdmin\} \/>/);
  assert.match(source, /<SeccionConfiguracionBase esSuperAdmin=\{esSuperAdmin\} \/>/);
});

test('muestra el identificador y la fecha de creación y permite buscarlos por código', () => {
  assert.match(source, /placeholder="Buscar por nombre o ID…"/);
  assert.match(source, /\{r\.codigo\}/);
  assert.match(source, /Creada \{fmtFechaHora\(r\.created_at\)\}/);
  assert.match(source, /codigo: item\.codigo/);
});

test('ordena el historial completo desde las cabeceras y conserva el orden entre páginas', () => {
  assert.match(source, /const CabeceraHistorialOrdenable/);
  assert.match(source, /aria-sort=\{activa/);
  assert.match(source, /campo="creada" label="Reserva"/);
  assert.match(source, /campo="titular" label="Huésped"/);
  assert.match(source, /campo="checkin" label="Fechas"/);
  assert.match(source, /campo="total" label="Total"/);
  assert.match(source, /pagina: String\(pagina\), limite: '25', orden, direccion/);
  assert.match(source, /onOrdenar=\{ordenarHistorial\}/);
  assert.match(source, /\{ value: 'checkin', label: 'Fecha de llegada' \}/);
});

test('reemplaza el icono de actualizar por el spinner durante la carga', () => {
  assert.match(source, /icon=\{loading \? null : <RefreshCw size=\{15\} \/>\}/);
  assert.match(source, /icon=\{cargando \? null : <RefreshCw size=\{15\} \/>\}/);
});

test('acompaña los reportes con gráficos basados en métricas existentes', () => {
  assert.match(source, /aria-label="Gráficos de reportes"/);
  assert.match(source, /Composición de ingresos/);
  assert.match(source, /Ocupación · próximos 14 días/);
  assert.match(source, /Conversión ManyChat/);
  assert.match(source, /Personas por tipo de estadía/);
  assert.match(source, /role="img"/);
  assert.match(source, /aria-label="Personas y noches por tipo de estadía"/);
  assert.match(styles, /\.admin-report-charts\s*\{/);
  assert.match(styles, /\.admin-report-ring\s*\{[^}]*conic-gradient/s);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*\.admin-report-charts\s*\{[^}]*grid-template-columns:\s*1fr/s);
});

test('permite al superadmin versionar la configuración comercial sin exponer secretos', () => {
  assert.match(source, /Configuración comercial/);
  assert.match(source, /Precios y seña/);
  assert.match(source, /Modalidades de reserva/);
  assert.match(source, /Política de cancelación/);
  assert.match(source, /accion: 'actualizar_modalidad'/);
  assert.match(source, /accion: 'actualizar_espacio'/);
  assert.match(source, /Capacidad comercial/);
  assert.match(source, /Venta general/);
  assert.match(source, /Estado comercial/);
  assert.match(source, /opcionesModalidadParaEspacio/);
  assert.match(source, /pueblo_magico_logo_marron\.svg/);
  assert.match(source, /accion: 'publicar_tarifa_alimentacion'/);
  assert.match(source, /requestJson\('\/api\/admin\/tarifas'/);
  assert.match(source, /Agregar tarifa/);
  assert.match(source, /agregarReglaPrecio/);
  assert.match(source, /eliminarReglaPrecio/);
  assert.match(source, /Carpa equipada/);
  assert.match(source, /requestJson\('\/api\/admin\/politicas-reserva'/);
  assert.match(source, /Sólo un superadministrador puede publicar cambios/);
  assert.match(source, /credenciales y activación de proveedores de pago permanecen en variables seguras/);
});

test('presenta la configuración en secciones compactas sin quebrar valores de modalidad', () => {
  assert.match(source, /admin-config__section/);
  assert.match(source, /admin-config__modality-fields/);
  assert.match(styles, /\.admin-config__modalities\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
  assert.match(styles, /\.admin-config \.pm-select-field__value\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*\.admin-config__modality-fields\s*\{[^}]*grid-template-columns:\s*1fr/s);
});

test('pide el motivo al confirmar y compara el valor anterior con el nuevo', () => {
  assert.match(source, /type ConfirmacionConfiguracion/);
  assert.match(source, /resumirCambios/);
  assert.match(source, /Valor anterior/);
  assert.match(source, /Valor nuevo/);
  assert.match(source, /Motivo del cambio/);
  assert.match(source, /motivoConfirmacion\.trim\(\)\.length < 5/);
  assert.match(source, /Quedará asociado al cambio en la auditoría/);
  assert.doesNotMatch(source, /config_commercial_reason/);
  assert.doesNotMatch(source, /window\.confirm\('Se publicará una nueva/);
  assert.match(styles, /\.admin-config-change-summary__row/);
});

test('permite administrar varias reglas de seña sin huecos ni superposiciones', () => {
  assert.match(source, /normalizarRangosSena/);
  assert.match(source, /errorReglasSena/);
  assert.match(source, /Agregar regla/);
  assert.match(source, /eliminarSena/);
  assert.match(source, /Hasta \(ARS, inclusive\)/);
  assert.match(source, /subtotalHastaCentavos: indice === ordenadas\.length - 1/);
});

test('separa los eventos de integraciones en categorías accesibles sin ocultar sus acciones', () => {
  assert.match(source, /type CategoriaEventosIntegracion = 'eventos' \| 'comunicaciones' \| 'mercado_pago' \| 'aplicaciones'/);
  assert.match(source, /role="tablist" aria-label="Categorías de eventos de integración"/);
  assert.match(source, /label: 'Eventos recientes'/);
  assert.match(source, /label: 'Comunicaciones de reservas'/);
  assert.match(source, /label: 'Mercado Pago reciente'/);
  assert.match(source, /label: 'Aplicaciones API'/);
  assert.match(source, /categoriaEventosActiva === 'eventos'/);
  assert.match(source, /categoriaEventosActiva === 'comunicaciones'/);
  assert.match(source, /categoriaEventosActiva === 'mercado_pago'/);
  assert.match(source, /categoriaEventosActiva === 'aplicaciones'/);
  assert.match(source, /\/api\/v1\/admin\/integraciones\/aplicaciones/);
  assert.match(source, /Aplicaciones registradas y endpoints/);
  assert.match(source, /reprocesar\(evento\.eventId\)/);
  assert.match(source, /reprocesarComunicacion\(intencion\.intencionUid\)/);
});

test('reutiliza primitivas del paquete interno en el registro de aplicaciones', () => {
  assert.match(source, /from '@pueblo-magico\/react-ui'/);
  for (const component of [
    'Badge', 'Button', 'Card', 'Checkbox', 'CodeBadge', 'CopyButton', 'DateRangeField',
    'DescriptionList', 'DescriptionListItem', 'EmptyState', 'IconButton', 'LoadingState',
    'Modal', 'MoneyField', 'NumberField', 'SearchField', 'StatCard', 'TableContainer',
    'Textarea', 'ToggleGroup',
  ]) {
    assert.match(source, new RegExp(`<${component}`));
  }
  assert.match(source, /<LoadingState className="py-16" label="Cargando configuración"/);
  assert.match(source, /<DescriptionList columns=\{3\} density="compact"/);
  assert.match(source, /<CodeBadge tone="info">\{endpoint\.method\}<\/CodeBadge>/);
  assert.doesNotMatch(source, /<table className="min-w-\[720px\]/);
});
