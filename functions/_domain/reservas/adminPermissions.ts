export type RolAdmin = 'super_admin' | 'editor' | 'viewer';
export type PermisoAdmin =
  | 'reservas.capacidad.solicitar'
  | 'reservas.capacidad.autorizar';

const PERMISOS_POR_ROL: Record<RolAdmin, readonly PermisoAdmin[]> = {
  super_admin: ['reservas.capacidad.solicitar', 'reservas.capacidad.autorizar'],
  editor: ['reservas.capacidad.solicitar'],
  viewer: [],
};

export function rolTienePermiso(rol: RolAdmin, permiso: PermisoAdmin): boolean {
  return PERMISOS_POR_ROL[rol].includes(permiso);
}
