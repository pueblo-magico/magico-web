import type { RepositorioOcupacionOperativa } from '../../_application/reservas/ports.ts';
import { ErrorReserva } from '../../_domain/reservas/errors.ts';
import type {
  NuevaEstadiaNoComercial,
  NuevoBloqueoInventario,
  ObjetivosOcupacionOperativa,
  RegistroOcupacionOperativa,
} from '../../_domain/reservas/operationalOccupancy.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<{ results?: Record<string, unknown>[] }>;
};
type Database = { prepare(query: string): Statement };

function mapear(row: Record<string, unknown>): RegistroOcupacionOperativa {
  return {
    id: Number(row.id), codigo: String(row.codigo), clase: row.clase as RegistroOcupacionOperativa['clase'],
    tipo: row.tipo as RegistroOcupacionOperativa['tipo'], estado: row.estado as RegistroOcupacionOperativa['estado'],
    espacioId: row.espacio_id == null ? null : Number(row.espacio_id),
    unidadInventarioId: row.unidad_inventario_id == null ? null : Number(row.unidad_inventario_id),
    fechaDesde: String(row.fecha_desde), fechaHasta: String(row.fecha_hasta), detalle: String(row.detalle),
    cantidadPersonas: Number(row.cantidad_personas), creadoPor: String(row.creado_por), createdAt: String(row.created_at),
  };
}

function conflicto(error: unknown): never {
  const mensaje = error instanceof Error ? error.message : String(error);
  if (/conflicto|superpuest/i.test(mensaje)) {
    throw new ErrorReserva('CONFLICTO_RESERVA', 'El inventario ya está ocupado en alguna noche del rango.');
  }
  if (/FOREIGN KEY constraint failed/i.test(mensaje)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El espacio o la unidad de inventario no existe.');
  }
  if (/capacidad incompatible/i.test(mensaje)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La cantidad de personas supera la capacidad del objetivo.');
  }
  throw error;
}

const CAMPOS_BLOQUEO = `
  id, codigo, 'bloqueo' clase, tipo, estado, espacio_id, unidad_inventario_id,
  fecha_desde, fecha_hasta, motivo detalle, 0 cantidad_personas, creado_por, created_at
`;
const CAMPOS_ESTADIA = `
  id, codigo, 'estadia_no_comercial' clase, tipo, estado, espacio_id, unidad_inventario_id,
  fecha_checkin fecha_desde, fecha_checkout fecha_hasta, referencia_operativa detalle,
  cantidad_personas, creado_por, created_at
`;

export class D1RepositorioOcupacionOperativa implements RepositorioOcupacionOperativa {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async listar(): Promise<RegistroOcupacionOperativa[]> {
    const result = await this.db.prepare(`
      SELECT ${CAMPOS_BLOQUEO} FROM bloqueos_inventario
      UNION ALL
      SELECT ${CAMPOS_ESTADIA} FROM estadias_no_comerciales
      ORDER BY fecha_desde DESC, created_at DESC
    `).all();
    return (result.results || []).map(mapear);
  }

  async listarObjetivos(): Promise<ObjetivosOcupacionOperativa> {
    const [espaciosResult, unidadesResult] = await Promise.all([
      this.db.prepare(`
        SELECT id, codigo, nombre, tipo, parent_id, capacidad_operativa_maxima, estado
        FROM espacios
        WHERE estado <> 'inactivo'
        ORDER BY CASE WHEN parent_id IS NULL THEN id ELSE parent_id END, parent_id IS NOT NULL, nombre
      `).all(),
      this.db.prepare(`
        SELECT id, espacio_id, codigo, nombre, tipo, capacidad, estado
        FROM unidades_inventario
        WHERE estado <> 'inactiva'
        ORDER BY espacio_id, nombre
      `).all(),
    ]);
    return {
      espacios: (espaciosResult.results || []).map(row => ({
        id: Number(row.id), codigo: String(row.codigo), nombre: String(row.nombre), tipo: String(row.tipo),
        parentId: row.parent_id == null ? null : Number(row.parent_id),
        capacidadOperativaMaxima: Number(row.capacidad_operativa_maxima), estado: String(row.estado),
      })),
      unidades: (unidadesResult.results || []).map(row => ({
        id: Number(row.id), espacioId: Number(row.espacio_id), codigo: String(row.codigo),
        nombre: String(row.nombre), tipo: String(row.tipo), capacidad: Number(row.capacidad), estado: String(row.estado),
      })),
    };
  }

  async crearBloqueo(entrada: NuevoBloqueoInventario, actorEmail: string): Promise<RegistroOcupacionOperativa> {
    try {
      const row = await this.db.prepare(`
        INSERT INTO bloqueos_inventario (
          codigo, espacio_id, unidad_inventario_id, fecha_desde, fecha_hasta, tipo, motivo, creado_por
        ) VALUES (
          'BLQ-' || lower(hex(randomblob(8))), ?, ?, ?, ?, ?, ?, ?
        ) RETURNING ${CAMPOS_BLOQUEO}
      `).bind(
        entrada.espacioId, entrada.unidadInventarioId, entrada.fechaDesde, entrada.fechaHasta,
        entrada.tipo, entrada.motivo, actorEmail
      ).first();
      if (!row) throw new Error('D1 no devolvió el bloqueo creado.');
      return mapear(row);
    } catch (error) {
      return conflicto(error);
    }
  }

  async cancelarBloqueo(id: number, actorEmail: string): Promise<RegistroOcupacionOperativa | null> {
    const row = await this.db.prepare(`
      UPDATE bloqueos_inventario
      SET estado = 'cancelado', cancelado_por = ?, cancelado_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ? AND estado = 'activo'
      RETURNING ${CAMPOS_BLOQUEO}
    `).bind(actorEmail, id).first();
    return row ? mapear(row) : null;
  }

  async crearEstadiaNoComercial(
    entrada: NuevaEstadiaNoComercial,
    actorEmail: string
  ): Promise<RegistroOcupacionOperativa> {
    try {
      const row = await this.db.prepare(`
        INSERT INTO estadias_no_comerciales (
          codigo, tipo, referencia_operativa, espacio_id, unidad_inventario_id,
          fecha_checkin, fecha_checkout, cantidad_personas, creado_por
        ) VALUES (
          'ENC-' || lower(hex(randomblob(8))), ?, ?, ?, ?, ?, ?, ?, ?
        ) RETURNING ${CAMPOS_ESTADIA}
      `).bind(
        entrada.tipo, entrada.referenciaOperativa, entrada.espacioId, entrada.unidadInventarioId,
        entrada.fechaCheckin, entrada.fechaCheckout, entrada.cantidadPersonas, actorEmail
      ).first();
      if (!row) throw new Error('D1 no devolvió la estadía no comercial creada.');
      return mapear(row);
    } catch (error) {
      return conflicto(error);
    }
  }

  async cancelarEstadiaNoComercial(id: number, actorEmail: string): Promise<RegistroOcupacionOperativa | null> {
    const row = await this.db.prepare(`
      UPDATE estadias_no_comerciales
      SET estado = 'cancelada', cancelado_por = ?, cancelado_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ? AND estado = 'activa'
      RETURNING ${CAMPOS_ESTADIA}
    `).bind(actorEmail, id).first();
    return row ? mapear(row) : null;
  }
}
