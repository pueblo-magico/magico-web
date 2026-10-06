export type RolAdmin = 'super_admin' | 'editor' | 'viewer';
export type PermisoAdmin =
  | 'reservas.leer'
  | 'reservas.crear'
  | 'reservas.editar'
  | 'reservas.cancelar'
  | 'reservas.asignar'
  | 'reservas.pagos.gestionar'
  | 'reservas.capacidad.solicitar'
  | 'reservas.capacidad.autorizar'
  | 'integraciones.airbnb.sincronizar'
  | 'consultas.leer'
  | 'metricas.leer'
  | 'usuarios.gestionar'
  | 'auditoria.leer'
  | 'datos_personales.exportar'
  | 'datos_personales.anonimizar';

const TODOS_LOS_PERMISOS: readonly PermisoAdmin[] = [
  'reservas.leer', 'reservas.crear', 'reservas.editar', 'reservas.cancelar',
  'reservas.asignar', 'reservas.pagos.gestionar',
  'reservas.capacidad.solicitar', 'reservas.capacidad.autorizar',
  'integraciones.airbnb.sincronizar', 'consultas.leer', 'metricas.leer',
  'usuarios.gestionar', 'auditoria.leer',
  'datos_personales.exportar', 'datos_personales.anonimizar',
];

const PERMISOS_POR_ROL: Record<RolAdmin, readonly PermisoAdmin[]> = {
  super_admin: TODOS_LOS_PERMISOS,
  editor: [
    'reservas.leer', 'reservas.crear', 'reservas.editar', 'reservas.cancelar',
    'reservas.asignar', 'reservas.capacidad.solicitar',
    'integraciones.airbnb.sincronizar', 'consultas.leer', 'metricas.leer',
  ],
  viewer: ['reservas.leer', 'consultas.leer', 'metricas.leer'],
};

export function rolTienePermiso(rol: RolAdmin, permiso: PermisoAdmin): boolean {
  return PERMISOS_POR_ROL[rol].includes(permiso);
}
