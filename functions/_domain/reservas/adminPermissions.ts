export type RolAdmin = 'super_admin' | 'editor' | 'viewer';
export type PermisoAdmin =
  | 'reservas.leer'
  | 'reservas.crear'
  | 'reservas.editar'
  | 'reservas.cancelar'
  | 'reservas.asignar'
  | 'reservas.pagos.gestionar'
  | 'reservas.tarifas.gestionar'
  | 'reservas.politicas.gestionar'
  | 'reservas.configuracion.leer'
  | 'reservas.configuracion.gestionar'
  | 'reservas.bloqueos.gestionar'
  | 'reservas.capacidad.solicitar'
  | 'reservas.capacidad.autorizar'
  | 'reservas.retenciones.expirar'
  | 'integraciones.airbnb.sincronizar'
  | 'integraciones.outbox.leer'
  | 'integraciones.outbox.despachar'
  | 'integraciones.outbox.reprocesar'
  | 'consultas.leer'
  | 'metricas.leer'
  | 'usuarios.gestionar'
  | 'auditoria.leer'
  | 'datos_personales.exportar'
  | 'datos_personales.anonimizar'
  | 'arrepentimientos.leer'
  | 'arrepentimientos.gestionar';

const TODOS_LOS_PERMISOS: readonly PermisoAdmin[] = [
  'reservas.leer', 'reservas.crear', 'reservas.editar', 'reservas.cancelar',
  'reservas.asignar', 'reservas.pagos.gestionar', 'reservas.tarifas.gestionar',
  'reservas.politicas.gestionar', 'reservas.bloqueos.gestionar',
  'reservas.configuracion.leer', 'reservas.configuracion.gestionar',
  'reservas.capacidad.solicitar', 'reservas.capacidad.autorizar',
  'reservas.retenciones.expirar',
  'integraciones.airbnb.sincronizar', 'integraciones.outbox.leer',
  'integraciones.outbox.despachar', 'integraciones.outbox.reprocesar',
  'consultas.leer', 'metricas.leer',
  'usuarios.gestionar', 'auditoria.leer',
  'datos_personales.exportar', 'datos_personales.anonimizar',
  'arrepentimientos.leer', 'arrepentimientos.gestionar',
];

const PERMISOS_POR_ROL: Record<RolAdmin, readonly PermisoAdmin[]> = {
  super_admin: TODOS_LOS_PERMISOS,
  editor: [
    'reservas.leer', 'reservas.crear', 'reservas.editar', 'reservas.cancelar',
    'reservas.asignar', 'reservas.capacidad.solicitar', 'reservas.bloqueos.gestionar',
    'reservas.configuracion.leer', 'integraciones.airbnb.sincronizar',
    'integraciones.outbox.leer', 'consultas.leer', 'metricas.leer',
    'arrepentimientos.leer', 'arrepentimientos.gestionar',
  ],
  viewer: [
    'reservas.leer', 'reservas.configuracion.leer', 'integraciones.outbox.leer',
    'consultas.leer', 'metricas.leer', 'arrepentimientos.leer',
  ],
};

export function rolTienePermiso(rol: RolAdmin, permiso: PermisoAdmin): boolean {
  return PERMISOS_POR_ROL[rol].includes(permiso);
}
