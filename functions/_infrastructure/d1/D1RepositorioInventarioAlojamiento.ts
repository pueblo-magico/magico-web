import type { RepositorioInventarioAlojamiento } from '../../_application/reservas/ports.ts';
import type {
  ContextoAlojamiento,
  EspacioInventario,
  ModalidadAlojamiento,
  ModalidadEspacio,
  UnidadAsignable,
} from '../../_domain/reservas/accommodationInventory.ts';

type D1Result = { results?: Record<string, unknown>[] };
type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  all(): Promise<D1Result>;
};
type D1Database = { prepare(query: string): D1Statement };

function booleano(valor: unknown): boolean {
  return Number(valor) === 1;
}

export class D1RepositorioInventarioAlojamiento implements RepositorioInventarioAlojamiento {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async listarEspaciosReservables(
    contexto: ContextoAlojamiento,
    modalidad?: ModalidadAlojamiento
  ): Promise<EspacioInventario[]> {
    const resultado = await this.db.prepare(
      `SELECT DISTINCT
         e.id, e.codigo, e.nombre, e.tipo, e.parent_id,
         e.capacidad_comercial, e.capacidad_operativa_maxima,
         e.reservable_general, e.reservable_retiro, e.estado
       FROM espacios e
       JOIN modalidades_espacio m ON m.espacio_id = e.id
       WHERE e.estado = 'activo'
         AND m.habilitada = 1
         AND m.contexto = ?1
         AND (?2 IS NULL OR m.modalidad = ?2)
         AND ((?1 = 'general' AND e.reservable_general = 1)
           OR (?1 = 'retiro' AND e.reservable_retiro = 1))
       ORDER BY e.codigo ASC`
    ).bind(contexto, modalidad ?? null).all();

    return (resultado.results || []).map(fila => ({
      id: Number(fila.id),
      codigo: String(fila.codigo),
      nombre: String(fila.nombre),
      tipo: fila.tipo as EspacioInventario['tipo'],
      parentId: fila.parent_id == null ? null : Number(fila.parent_id),
      capacidadComercial: Number(fila.capacidad_comercial),
      capacidadOperativaMaxima: Number(fila.capacidad_operativa_maxima),
      reservableGeneral: booleano(fila.reservable_general),
      reservableRetiro: booleano(fila.reservable_retiro),
      estado: fila.estado as EspacioInventario['estado'],
    }));
  }

  async listarModalidades(espacioId: number): Promise<ModalidadEspacio[]> {
    const resultado = await this.db.prepare(
      `SELECT espacio_id, modalidad, contexto, unidad_venta, habilitada
       FROM modalidades_espacio
       WHERE espacio_id = ?1
       ORDER BY contexto, modalidad, unidad_venta`
    ).bind(espacioId).all();

    return (resultado.results || []).map(fila => ({
      espacioId: Number(fila.espacio_id),
      modalidad: fila.modalidad as ModalidadEspacio['modalidad'],
      contexto: fila.contexto as ModalidadEspacio['contexto'],
      unidadVenta: fila.unidad_venta as ModalidadEspacio['unidadVenta'],
      habilitada: booleano(fila.habilitada),
    }));
  }

  async listarUnidadesAsignables(espacioId: number): Promise<UnidadAsignable[]> {
    const resultado = await this.db.prepare(
      `WITH RECURSIVE descendientes(id) AS (
         SELECT id FROM espacios WHERE id = ?1
         UNION ALL
         SELECT e.id FROM espacios e
         JOIN descendientes d ON e.parent_id = d.id
       )
       SELECT u.id, u.espacio_id, u.codigo, u.nombre, u.tipo,
              u.capacidad, u.estado, u.asignable
       FROM unidades_inventario u
       JOIN descendientes d ON d.id = u.espacio_id
       WHERE u.estado = 'activa' AND u.asignable = 1
       ORDER BY u.codigo ASC`
    ).bind(espacioId).all();

    return (resultado.results || []).map(fila => ({
      id: Number(fila.id),
      espacioId: Number(fila.espacio_id),
      codigo: String(fila.codigo),
      nombre: String(fila.nombre),
      tipo: fila.tipo as UnidadAsignable['tipo'],
      capacidad: Number(fila.capacidad),
      estado: fila.estado as UnidadAsignable['estado'],
      asignable: booleano(fila.asignable),
    }));
  }
}
