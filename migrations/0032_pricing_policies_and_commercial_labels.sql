-- Pricing policies remain versioned with the rate plan. Operational modality
-- codes stay stable; the public label can evolve without invalidating history.
ALTER TABLE modalidades_espacio ADD COLUMN nombre_comercial TEXT;

UPDATE modalidades_espacio
SET nombre_comercial = CASE modalidad
  WHEN 'privada' THEN 'Privada'
  WHEN 'compartida' THEN 'Compartida'
  WHEN 'camping' THEN 'Camping'
END
WHERE nombre_comercial IS NULL;

CREATE TABLE reglas_ajuste_precio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_tarifa_id INTEGER NOT NULL REFERENCES planes_tarifa(id),
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  anticipacion_desde_dias INTEGER NOT NULL DEFAULT 0 CHECK (anticipacion_desde_dias >= 0),
  anticipacion_hasta_dias INTEGER CHECK (
    anticipacion_hasta_dias IS NULL OR anticipacion_hasta_dias >= anticipacion_desde_dias
  ),
  direccion TEXT NOT NULL CHECK (direccion IN ('descuento', 'recargo')),
  tipo TEXT NOT NULL CHECK (tipo IN ('porcentaje_bps', 'importe_fijo')),
  valor INTEGER NOT NULL CHECK (valor >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (plan_tarifa_id, codigo)
);

CREATE INDEX idx_reglas_ajuste_precio_plan
  ON reglas_ajuste_precio(plan_tarifa_id, anticipacion_desde_dias, anticipacion_hasta_dias);

CREATE TRIGGER reglas_ajuste_precio_publicado_inmutable_update
BEFORE UPDATE ON reglas_ajuste_precio
WHEN EXISTS (
  SELECT 1 FROM planes_tarifa p
  WHERE p.id = OLD.plan_tarifa_id AND p.estado = 'publicado'
)
BEGIN
  SELECT RAISE(ABORT, 'published pricing adjustment rules are immutable');
END;

CREATE TRIGGER reglas_ajuste_precio_publicado_inmutable_delete
BEFORE DELETE ON reglas_ajuste_precio
WHEN EXISTS (
  SELECT 1 FROM planes_tarifa p
  WHERE p.id = OLD.plan_tarifa_id AND p.estado = 'publicado'
)
BEGIN
  SELECT RAISE(ABORT, 'published pricing adjustment rules are immutable');
END;

-- The legacy columns remain as a compatibility snapshot. New versions store
-- the actual components and the signed package adjustment explicitly.
ALTER TABLE tarifas_alimentacion ADD COLUMN precio_desayuno_centavos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tarifas_alimentacion ADD COLUMN precio_almuerzo_centavos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tarifas_alimentacion ADD COLUMN precio_cena_centavos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tarifas_alimentacion ADD COLUMN ajuste_paquete_centavos INTEGER NOT NULL DEFAULT 0;

DROP TRIGGER tarifas_alimentacion_publicadas_inmutables_update;

UPDATE tarifas_alimentacion
SET precio_desayuno_centavos = CASE
      WHEN codigo = 'desayuno_incluido' THEN precio_comida_centavos ELSE 0 END,
    precio_almuerzo_centavos = CASE
      WHEN codigo = 'pension_completa' THEN precio_comida_centavos ELSE 0 END,
    precio_cena_centavos = CASE
      WHEN codigo = 'pension_completa' THEN precio_comida_centavos ELSE 0 END;

CREATE TRIGGER tarifas_alimentacion_publicadas_inmutables_update
BEFORE UPDATE ON tarifas_alimentacion
WHEN OLD.estado = 'publicado' AND (
  NEW.estado <> 'retirado'
  OR NEW.codigo IS NOT OLD.codigo
  OR NEW.moneda IS NOT OLD.moneda
  OR NEW.version IS NOT OLD.version
  OR NEW.precio_comida_centavos IS NOT OLD.precio_comida_centavos
  OR NEW.comidas_adicionales_por_persona_noche IS NOT OLD.comidas_adicionales_por_persona_noche
  OR NEW.precio_desayuno_centavos IS NOT OLD.precio_desayuno_centavos
  OR NEW.precio_almuerzo_centavos IS NOT OLD.precio_almuerzo_centavos
  OR NEW.precio_cena_centavos IS NOT OLD.precio_cena_centavos
  OR NEW.ajuste_paquete_centavos IS NOT OLD.ajuste_paquete_centavos
  OR NEW.publicado_at IS NOT OLD.publicado_at
  OR NEW.created_at IS NOT OLD.created_at
)
BEGIN
  SELECT RAISE(ABORT, 'published food rates are immutable');
END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0032', 'políticas de precios, alimentación detallada y nombres comerciales',
        'migrations/0032_pricing_policies_and_commercial_labels.sql');
