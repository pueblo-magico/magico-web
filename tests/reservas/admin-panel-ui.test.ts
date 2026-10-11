import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../../src/PanelReservas.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../../src/PanelReservas.css', import.meta.url), 'utf8');

test('organiza el panel en sidebar y workspace responsivo', () => {
  assert.match(source, /className="admin-sidebar"/);
  assert.match(source, /className="admin-workspace"/);
  assert.match(source, /className="admin-topbar"/);
  assert.match(source, /className="admin-mobile-nav"/);
  assert.doesNotMatch(source, /admin-nav-button__alert/);
  assert.match(styles, /\.admin-sidebar\s*\{[^}]*position:\s*fixed/s);
  assert.match(styles, /@media \(max-width: 1023px\)[\s\S]*\.admin-sidebar\s*\{\s*display:\s*none/s);
  assert.match(styles, /\.admin-mobile-nav\s*\{[^}]*display:\s*none/s);
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
  assert.match(source, /onClick=\{actualizar\}/);
  assert.match(source, /onClick=\{cerrarSesion\}/);
  assert.match(source, /<SeccionOcupacionOperativa \/>/);
  assert.match(source, /<SeccionArrepentimientos puedeGestionar=\{puedeEditar\} \/>/);
  assert.match(source, /<SeccionIntegraciones esSuperAdmin=\{esSuperAdmin\} \/>/);
  assert.match(source, /<SeccionConfiguracionBase esSuperAdmin=\{esSuperAdmin\} \/>/);
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
  assert.match(source, /requestJson\('\/api\/admin\/politicas-reserva'/);
  assert.match(source, /Sólo un superadministrador puede publicar cambios/);
  assert.match(source, /credenciales y activación de proveedores de pago permanecen en variables seguras/);
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
  for (const component of ['Badge', 'Button', 'Card', 'EmptyState', 'StatCard', 'TableContainer']) {
    assert.match(source, new RegExp(`<${component}`));
  }
  assert.doesNotMatch(source, /<table className="min-w-\[720px\]/);
});
