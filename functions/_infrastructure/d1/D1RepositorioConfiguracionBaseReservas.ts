import type { RepositorioConfiguracionBaseReservas } from '../../_application/reservas/ports.ts';
import {
  PAYMENT_HOLD_MINUTES,
  normalizarPaymentHoldMinutes,
  type ConfiguracionBaseReservas,
  type EspacioComercialActualizado,
  type ModalidadComercialActualizada,
  type ParametroOperativoReserva,
  type TarifaAlimentacionActualizada,
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

function mapearTarifaAlimentacion(row: Record<string, unknown>): TarifaAlimentacionActualizada {
  return {
    id: Number(row.id),
    codigo: row.codigo as TarifaAlimentacionActualizada['codigo'],
    moneda: String(row.moneda),
    version: Number(row.version),
    precioComidaCentavos: Number(row.precio_comida_centavos),
    comidasAdicionalesPorPersonaNoche: Number(row.comidas_adicionales_por_persona_noche),
    publicadoAt: String(row.publicado_at),
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
    const [parametro, inventario, tarifa, reglasTarifa, senasTarifa, politica, alimentacion] = await Promise.all([
      this.db.prepare(`
        SELECT codigo, valor_entero, unidad, version, updated_at
        FROM parametros_operativos_reservas WHERE codigo = 'payment_hold_minutes'
      `).first(),
      this.db.prepare(`
        SELECT e.codigo, e.nombre, e.tipo, e.capacidad_comercial,
          e.capacidad_operativa_maxima, e.reservable_general, e.reservable_retiro,
          e.estado, e.updated_at espacio_updated_at, me.id, me.modalidad, me.contexto,
          me.unidad_venta, me.habilitada, me.updated_at
        FROM espacios e
        LEFT JOIN modalidades_espacio me ON me.espacio_id = e.id
        ORDER BY e.codigo, me.contexto, me.modalidad
      `).all(),
      this.db.prepare(`
        SELECT p.id, p.codigo, p.nombre, p.moneda, p.version, p.publicado_at,
          (SELECT COUNT(*) FROM reglas_precio rp JOIN temporadas t ON t.id = rp.temporada_id
           WHERE t.plan_tarifa_id = p.id) reglas_precio,
          (SELECT COUNT(*) FROM reglas_sena rs WHERE rs.plan_tarifa_id = p.id) reglas_sena
        FROM planes_tarifa p WHERE p.estado = 'publicado'
        ORDER BY p.publicado_at DESC, p.id DESC LIMIT 1
      `).first(),
      this.db.prepare(`
        SELECT t.codigo temporada_codigo, t.nombre temporada_nombre, t.fecha_desde,
          t.fecha_hasta, t.prioridad, t.dias_semana_mask, rp.tipo_alojamiento, rp.modalidad,
          rp.ocupacion_min, rp.ocupacion_max, rp.base_calculo, rp.importe_centavos,
          rp.exclusividad_desde, rp.exclusividad_hasta
        FROM planes_tarifa p
        JOIN temporadas t ON t.plan_tarifa_id = p.id
        JOIN reglas_precio rp ON rp.temporada_id = t.id
        WHERE p.id = (
          SELECT id FROM planes_tarifa WHERE estado = 'publicado'
          ORDER BY publicado_at DESC, id DESC LIMIT 1
        )
        ORDER BY t.prioridad DESC, t.id, rp.id
      `).all(),
      this.db.prepare(`
        SELECT rs.subtotal_desde_centavos, rs.subtotal_hasta_centavos, rs.tipo, rs.valor
        FROM planes_tarifa p JOIN reglas_sena rs ON rs.plan_tarifa_id = p.id
        WHERE p.id = (
          SELECT id FROM planes_tarifa WHERE estado = 'publicado'
          ORDER BY publicado_at DESC, id DESC LIMIT 1
        )
        ORDER BY rs.subtotal_desde_centavos
      `).all(),
      this.db.prepare(`
        SELECT codigo, nombre, version, estado, vigencia_desde, reglas_json
        FROM politicas_cancelacion
        ORDER BY CASE WHEN estado = 'publicada' THEN 0 ELSE 1 END, version DESC LIMIT 1
      `).first(),
      this.db.prepare(`
        SELECT id, codigo, moneda, version, precio_comida_centavos,
          comidas_adicionales_por_persona_noche, publicado_at
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
          reservableGeneral: Number(row.reservable_general) === 1,
          reservableRetiro: Number(row.reservable_retiro) === 1,
          estado: String(row.estado), actualizadoAt: String(row.espacio_updated_at), modalidades: [],
        };
        espacios.set(codigo, espacio);
      }
      if (row.modalidad != null) espacio.modalidades.push({
        id: Number(row.id), modalidad: String(row.modalidad), contexto: String(row.contexto),
        unidadVenta: String(row.unidad_venta), habilitada: Number(row.habilitada) === 1,
        actualizadoAt: String(row.updated_at),
      });
    }

    const temporadas = new Map<string, NonNullable<ConfiguracionBaseReservas['tarifa']>['temporadas'][number]>();
    for (const row of reglasTarifa.results || []) {
      const codigo = String(row.temporada_codigo);
      let temporada = temporadas.get(codigo);
      if (!temporada) {
        temporada = {
          codigo, nombre: String(row.temporada_nombre), fechaDesde: String(row.fecha_desde),
          fechaHasta: String(row.fecha_hasta), prioridad: Number(row.prioridad),
          diasSemana: [1, 2, 3, 4, 5, 6, 7].filter(dia =>
            (Number(row.dias_semana_mask ?? 127) & (1 << (dia - 1))) !== 0
          ),
          reglas: [],
        };
        temporadas.set(codigo, temporada);
      }
      temporada.reglas.push({
        tipoAlojamiento: row.tipo_alojamiento as any, modalidad: row.modalidad as any,
        ocupacionMin: Number(row.ocupacion_min), ocupacionMax: Number(row.ocupacion_max),
        baseCalculo: row.base_calculo as any, importeCentavos: Number(row.importe_centavos),
        exclusividadDesde: row.exclusividad_desde == null ? null : Number(row.exclusividad_desde),
        exclusividadHasta: row.exclusividad_hasta == null ? null : Number(row.exclusividad_hasta),
      });
    }

    let reglasPolitica: Array<{ horasMinimasAntes: number; porcentajeDevolucionBps: number }> = [];
    if (politica?.reglas_json) {
      try {
        const documento = JSON.parse(String(politica.reglas_json));
        reglasPolitica = Array.isArray(documento?.reglas) ? documento.reglas.map((regla: any) => ({
          horasMinimasAntes: Number(regla.horas_minimas_antes),
          porcentajeDevolucionBps: Number(regla.porcentaje_devolucion_bps),
        })) : [];
      } catch { reglasPolitica = []; }
    }

    return {
      parametros: [mapearParametro(parametro)],
      inventario: [...espacios.values()],
      tarifa: tarifa ? {
        id: Number(tarifa.id), codigo: String(tarifa.codigo), nombre: String(tarifa.nombre), moneda: String(tarifa.moneda),
        version: Number(tarifa.version), reglasPrecio: Number(tarifa.reglas_precio),
        reglasSena: Number(tarifa.reglas_sena), publicadoAt: String(tarifa.publicado_at),
        temporadas: [...temporadas.values()],
        senas: (senasTarifa.results || []).map(row => ({
          subtotalDesdeCentavos: Number(row.subtotal_desde_centavos),
          subtotalHastaCentavos: row.subtotal_hasta_centavos == null ? null : Number(row.subtotal_hasta_centavos),
          tipo: row.tipo as 'porcentaje_bps' | 'importe_fijo', valor: Number(row.valor),
        })),
      } : null,
      politicaCancelacion: politica ? {
        codigo: String(politica.codigo), nombre: String(politica.nombre), version: Number(politica.version),
        estado: String(politica.estado),
        vigenciaDesde: politica.vigencia_desde == null ? null : String(politica.vigencia_desde),
        reglas: reglasPolitica,
      } : null,
      alimentacion: (alimentacion.results || []).map(mapearTarifaAlimentacion),
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

  async actualizarModalidad(
    entrada: Parameters<RepositorioConfiguracionBaseReservas['actualizarModalidad']>[0]
  ): Promise<ModalidadComercialActualizada | null> {
    const anterior = await this.db.prepare(`
      SELECT me.id, me.habilitada, me.modalidad, me.contexto, me.unidad_venta, me.updated_at,
        e.codigo espacio_codigo
      FROM modalidades_espacio me JOIN espacios e ON e.id = me.espacio_id WHERE me.id = ?
    `).bind(entrada.id).first();
    if (!anterior || String(anterior.updated_at) !== entrada.expectedUpdatedAt) return null;

    const resultados = await this.db.batch([
      this.db.prepare(`
        UPDATE modalidades_espacio
        SET modalidad = ?, contexto = ?, unidad_venta = ?, habilitada = ?,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND updated_at = ?
        RETURNING id, modalidad, contexto, unidad_venta, habilitada, updated_at
      `).bind(
        entrada.modalidad, entrada.contexto, entrada.unidadVenta, entrada.habilitada ? 1 : 0,
        entrada.id, entrada.expectedUpdatedAt
      ),
      this.db.prepare(`
        INSERT INTO auditoria_admin (
          email, accion, actor_tipo, entidad_tipo, entidad_id, motivo, correlation_id, metadata_json
        ) SELECT ?, 'actualizar_modalidad_comercial', 'usuario', 'modalidad_espacio', ?, ?, ?,
          json_object('espacio_codigo', ?, 'modalidad_anterior', ?, 'modalidad_nueva', ?,
            'contexto_anterior', ?, 'contexto_nuevo', ?, 'unidad_venta_anterior', ?, 'unidad_venta_nueva', ?,
            'habilitada_anterior', ?, 'habilitada_nueva', ?)
        WHERE changes() = 1
      `).bind(
        entrada.actorEmail, String(entrada.id), entrada.motivo, entrada.correlationId,
        String(anterior.espacio_codigo), String(anterior.modalidad), entrada.modalidad,
        String(anterior.contexto), entrada.contexto, String(anterior.unidad_venta), entrada.unidadVenta,
        Number(anterior.habilitada), entrada.habilitada ? 1 : 0
      ),
    ]);
    const row = resultados[0]?.results?.[0];
    return row ? {
      id: Number(row.id), espacioCodigo: String(anterior.espacio_codigo),
      modalidad: String(row.modalidad), contexto: String(row.contexto), unidadVenta: String(row.unidad_venta),
      habilitada: Number(row.habilitada) === 1, actualizadoAt: String(row.updated_at),
    } : null;
  }

  async actualizarEspacio(
    entrada: Parameters<RepositorioConfiguracionBaseReservas['actualizarEspacio']>[0]
  ): Promise<EspacioComercialActualizado | null> {
    const anterior = await this.db.prepare(`
      SELECT codigo, nombre, tipo, capacidad_comercial, capacidad_operativa_maxima,
        reservable_general, reservable_retiro, estado, updated_at
      FROM espacios WHERE codigo = ?
    `).bind(entrada.codigo).first();
    if (!anterior || String(anterior.updated_at) !== entrada.expectedUpdatedAt) return null;

    const resultados = await this.db.batch([
      this.db.prepare(`
        UPDATE espacios SET capacidad_comercial = ?, capacidad_operativa_maxima = ?,
          reservable_general = ?, reservable_retiro = ?, estado = ?,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE codigo = ? AND updated_at = ?
        RETURNING codigo, nombre, tipo, capacidad_comercial, capacidad_operativa_maxima,
          reservable_general, reservable_retiro, estado, updated_at
      `).bind(
        entrada.capacidadComercial, entrada.capacidadOperativaMaxima,
        entrada.reservableGeneral ? 1 : 0, entrada.reservableRetiro ? 1 : 0,
        entrada.estado, entrada.codigo, entrada.expectedUpdatedAt
      ),
      this.db.prepare(`
        INSERT INTO auditoria_admin (
          email, accion, actor_tipo, entidad_tipo, entidad_id, motivo, correlation_id, metadata_json
        ) SELECT ?, 'actualizar_espacio_comercial', 'usuario', 'espacio', ?, ?, ?,
          json_object(
            'capacidad_comercial_anterior', ?, 'capacidad_comercial_nueva', ?,
            'capacidad_operativa_anterior', ?, 'capacidad_operativa_nueva', ?,
            'reservable_general_anterior', ?, 'reservable_general_nuevo', ?,
            'reservable_retiro_anterior', ?, 'reservable_retiro_nuevo', ?,
            'estado_anterior', ?, 'estado_nuevo', ?
          ) WHERE changes() = 1
      `).bind(
        entrada.actorEmail, entrada.codigo, entrada.motivo, entrada.correlationId,
        Number(anterior.capacidad_comercial), entrada.capacidadComercial,
        Number(anterior.capacidad_operativa_maxima), entrada.capacidadOperativaMaxima,
        Number(anterior.reservable_general), entrada.reservableGeneral ? 1 : 0,
        Number(anterior.reservable_retiro), entrada.reservableRetiro ? 1 : 0,
        String(anterior.estado), entrada.estado
      ),
    ]);
    const row = resultados[0]?.results?.[0];
    return row ? {
      codigo: String(row.codigo), nombre: String(row.nombre), tipo: String(row.tipo),
      capacidadComercial: Number(row.capacidad_comercial),
      capacidadOperativaMaxima: Number(row.capacidad_operativa_maxima),
      reservableGeneral: Number(row.reservable_general) === 1,
      reservableRetiro: Number(row.reservable_retiro) === 1,
      estado: String(row.estado), actualizadoAt: String(row.updated_at),
    } : null;
  }

  async publicarTarifaAlimentacion(
    entrada: Parameters<RepositorioConfiguracionBaseReservas['publicarTarifaAlimentacion']>[0]
  ): Promise<TarifaAlimentacionActualizada | null> {
    const anterior = await this.db.prepare(`
      SELECT id, codigo, moneda, version, precio_comida_centavos,
        comidas_adicionales_por_persona_noche
      FROM tarifas_alimentacion WHERE codigo = ? AND estado = 'publicado'
    `).bind(entrada.codigo).first();
    if (!anterior || Number(anterior.version) !== entrada.expectedVersion) return null;

    const resultados = await this.db.batch([
      this.db.prepare(`
        UPDATE tarifas_alimentacion SET estado = 'retirado'
        WHERE id = ? AND estado = 'publicado' AND version = ?
      `).bind(Number(anterior.id), entrada.expectedVersion),
      this.db.prepare(`
        INSERT INTO tarifas_alimentacion (
          codigo, moneda, version, precio_comida_centavos,
          comidas_adicionales_por_persona_noche, estado, publicado_at
        ) SELECT ?, ?, ?, ?, ?, 'publicado', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE changes() = 1
        RETURNING id, codigo, moneda, version, precio_comida_centavos,
          comidas_adicionales_por_persona_noche, publicado_at
      `).bind(
        entrada.codigo, String(anterior.moneda), entrada.expectedVersion + 1,
        entrada.precioComidaCentavos, Number(anterior.comidas_adicionales_por_persona_noche)
      ),
      this.db.prepare(`
        INSERT INTO auditoria_admin (
          email, accion, actor_tipo, entidad_tipo, entidad_id, motivo, correlation_id, metadata_json
        ) SELECT ?, 'publicar_tarifa_alimentacion', 'usuario', 'tarifa_alimentacion', ?, ?, ?,
          json_object('codigo', ?, 'version_anterior', ?, 'version_nueva', ?,
            'precio_anterior_centavos', ?, 'precio_nuevo_centavos', ?)
        WHERE changes() = 1
      `).bind(
        entrada.actorEmail, entrada.codigo, entrada.motivo, entrada.correlationId, entrada.codigo,
        entrada.expectedVersion, entrada.expectedVersion + 1, Number(anterior.precio_comida_centavos),
        entrada.precioComidaCentavos
      ),
    ]);
    const row = resultados[1]?.results?.[0];
    return row ? mapearTarifaAlimentacion(row) : null;
  }
}
