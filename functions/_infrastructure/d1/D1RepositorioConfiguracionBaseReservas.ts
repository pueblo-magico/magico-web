import type { RepositorioConfiguracionBaseReservas } from '../../_application/reservas/ports.ts';
import {
  PAYMENT_HOLD_MINUTES,
  normalizarPaymentHoldMinutes,
  type ConfiguracionBaseReservas,
  type ParametroOperativoReserva,
} from '../../_domain/reservas/baseConfiguration.ts';

type Result = { results?: Record<string, unknown>[] };
type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<Result>;
};
type Database = {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<Result[]>;
};

function mapearParametro(row: Record<string, unknown> | null): ParametroOperativoReserva {
  const valido = row && normalizarPaymentHoldMinutes(row.valor_entero) === Number(row.valor_entero);
  return {
    codigo: PAYMENT_HOLD_MINUTES.codigo,
    valor: valido ? Number(row.valor_entero) : PAYMENT_HOLD_MINUTES.fallback,
    unidad: PAYMENT_HOLD_MINUTES.unidad,
    version: valido ? Number(row.version) : 0,
    minimo: PAYMENT_HOLD_MINUTES.minimo,
    maximo: PAYMENT_HOLD_MINUTES.maximo,
    editable: Boolean(valido),
    fuente: valido ? 'parametros_operativos_reservas' : 'fallback_seguro',
    actualizadoAt: valido ? String(row.updated_at) : '',
  };
}

export class D1RepositorioConfiguracionBaseReservas implements RepositorioConfiguracionBaseReservas {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async obtenerPaymentHoldMinutes(): Promise<number> {
    const row = await this.db.prepare(`
      SELECT valor_entero FROM parametros_operativos_reservas
      WHERE codigo = 'payment_hold_minutes' AND tipo = 'entero'
    `).first();
    return normalizarPaymentHoldMinutes(row?.valor_entero);
  }

  async obtenerEfectiva(): Promise<ConfiguracionBaseReservas> {
    const [parametro, inventario, tarifa, politica, alimentacion] = await Promise.all([
      this.db.prepare(`
        SELECT codigo, valor_entero, unidad, version, updated_at
        FROM parametros_operativos_reservas WHERE codigo = 'payment_hold_minutes'
      `).first(),
      this.db.prepare(`
        SELECT e.codigo, e.nombre, e.tipo, e.capacidad_comercial,
          e.capacidad_operativa_maxima, e.estado, me.modalidad, me.contexto, me.unidad_venta
        FROM espacios e
        LEFT JOIN modalidades_espacio me ON me.espacio_id = e.id AND me.habilitada = 1
        ORDER BY e.codigo, me.contexto, me.modalidad
      `).all(),
      this.db.prepare(`
        SELECT p.codigo, p.nombre, p.moneda, p.version, p.publicado_at,
          (SELECT COUNT(*) FROM reglas_precio rp JOIN temporadas t ON t.id = rp.temporada_id
           WHERE t.plan_tarifa_id = p.id) reglas_precio,
          (SELECT COUNT(*) FROM reglas_sena rs WHERE rs.plan_tarifa_id = p.id) reglas_sena
        FROM planes_tarifa p WHERE p.estado = 'publicado'
        ORDER BY p.publicado_at DESC, p.id DESC LIMIT 1
      `).first(),
      this.db.prepare(`
        SELECT codigo, nombre, version, estado, vigencia_desde
        FROM politicas_cancelacion
        ORDER BY CASE WHEN estado = 'publicada' THEN 0 ELSE 1 END, version DESC LIMIT 1
      `).first(),
      this.db.prepare(`
        SELECT codigo, moneda, version, precio_comida_centavos,
          comidas_adicionales_por_persona_noche
        FROM tarifas_alimentacion WHERE estado = 'publicado' ORDER BY codigo
      `).all(),
    ]);

    const espacios = new Map<string, ConfiguracionBaseReservas['inventario'][number]>();
    for (const row of inventario.results || []) {
      const codigo = String(row.codigo);
      let espacio = espacios.get(codigo);
      if (!espacio) {
        espacio = {
          codigo, nombre: String(row.nombre), tipo: String(row.tipo),
          capacidadComercial: Number(row.capacidad_comercial),
          capacidadOperativaMaxima: Number(row.capacidad_operativa_maxima),
          estado: String(row.estado), modalidades: [],
        };
        espacios.set(codigo, espacio);
      }
      if (row.modalidad != null) espacio.modalidades.push({
        modalidad: String(row.modalidad), contexto: String(row.contexto), unidadVenta: String(row.unidad_venta),
      });
    }

    return {
      parametros: [mapearParametro(parametro)],
      inventario: [...espacios.values()],
      tarifa: tarifa ? {
        codigo: String(tarifa.codigo), nombre: String(tarifa.nombre), moneda: String(tarifa.moneda),
        version: Number(tarifa.version), reglasPrecio: Number(tarifa.reglas_precio),
        reglasSena: Number(tarifa.reglas_sena), publicadoAt: String(tarifa.publicado_at),
      } : null,
      politicaCancelacion: politica ? {
        codigo: String(politica.codigo), nombre: String(politica.nombre), version: Number(politica.version),
        estado: String(politica.estado),
        vigenciaDesde: politica.vigencia_desde == null ? null : String(politica.vigencia_desde),
      } : null,
      alimentacion: (alimentacion.results || []).map(row => ({
        codigo: String(row.codigo), moneda: String(row.moneda), version: Number(row.version),
        precioComidaCentavos: Number(row.precio_comida_centavos),
        comidasAdicionalesPorPersonaNoche: Number(row.comidas_adicionales_por_persona_noche),
      })),
    };
  }

  async actualizarParametro(
    entrada: Parameters<RepositorioConfiguracionBaseReservas['actualizarParametro']>[0]
  ): Promise<ParametroOperativoReserva | null> {
    const anterior = await this.db.prepare(`
      SELECT valor_entero, version FROM parametros_operativos_reservas WHERE codigo = ?
    `).bind(entrada.codigo).first();
    if (!anterior || Number(anterior.version) !== entrada.expectedVersion) return null;

    const resultados = await this.db.batch([
      this.db.prepare(`
        UPDATE parametros_operativos_reservas
        SET valor_entero = ?, version = version + 1, updated_by = ?, ultima_operacion_uid = ?,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE codigo = ? AND version = ?
        RETURNING codigo, valor_entero, unidad, version, updated_at
      `).bind(
        entrada.valor, entrada.actorEmail, entrada.operacionUid, entrada.codigo, entrada.expectedVersion
      ),
      this.db.prepare(`
        INSERT INTO auditoria_admin (
          email, accion, actor_tipo, entidad_tipo, entidad_id, motivo, correlation_id, metadata_json
        )
        SELECT ?, 'actualizar_configuracion_reservas', 'usuario', 'parametro_operativo', codigo, ?, ?,
          json_object(
            'codigo', codigo, 'valor_anterior', ?, 'valor_nuevo', valor_entero,
            'version_anterior', ?, 'version_nueva', version, 'unidad', unidad
          )
        FROM parametros_operativos_reservas WHERE codigo = ? AND ultima_operacion_uid = ?
      `).bind(
        entrada.actorEmail, entrada.motivo, entrada.correlationId, Number(anterior.valor_entero),
        entrada.expectedVersion, entrada.codigo, entrada.operacionUid
      ),
    ]);
    const row = resultados[0]?.results?.[0];
    return row ? mapearParametro(row) : null;
  }
}
