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
});

test('separa los eventos de integraciones en categorías accesibles sin ocultar sus acciones', () => {
  assert.match(source, /type CategoriaEventosIntegracion = 'eventos' \| 'comunicaciones' \| 'mercado_pago'/);
  assert.match(source, /role="tablist" aria-label="Categorías de eventos de integración"/);
  assert.match(source, /label: 'Eventos recientes'/);
  assert.match(source, /label: 'Comunicaciones de reservas'/);
  assert.match(source, /label: 'Mercado Pago reciente'/);
  assert.match(source, /categoriaEventosActiva === 'eventos'/);
  assert.match(source, /categoriaEventosActiva === 'comunicaciones'/);
  assert.match(source, /categoriaEventosActiva === 'mercado_pago'/);
  assert.match(source, /reprocesar\(evento\.eventId\)/);
  assert.match(source, /reprocesarComunicacion\(intencion\.intencionUid\)/);
});
