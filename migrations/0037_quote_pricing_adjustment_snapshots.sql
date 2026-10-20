-- Quote components keep their pre-adjustment commercial meaning while the
-- signed adjustment explains the final amount charged to the guest.
ALTER TABLE cotizaciones ADD COLUMN subtotal_antes_ajustes_centavos INTEGER NOT NULL DEFAULT 0
  CHECK (subtotal_antes_ajustes_centavos >= 0);
ALTER TABLE cotizaciones ADD COLUMN ajuste_total_centavos INTEGER NOT NULL DEFAULT 0;

UPDATE cotizaciones
SET subtotal_antes_ajustes_centavos = subtotal_centavos,
    ajuste_total_centavos = 0
WHERE subtotal_antes_ajustes_centavos = 0;

DROP TRIGGER cotizaciones_importes_componentes_insert;
DROP TRIGGER cotizaciones_importes_componentes_update;

CREATE TRIGGER cotizaciones_importes_componentes_insert
BEFORE INSERT ON cotizaciones
WHEN NOT (
  -- Compatibility during the migration-before-deploy window: the previous
  -- worker does not send the two new snapshot columns for unadjusted quotes.
  (
    NEW.subtotal_antes_ajustes_centavos = 0
    AND NEW.ajuste_total_centavos = 0
    AND NEW.subtotal_centavos = NEW.alojamiento_centavos + NEW.alimentacion_centavos
  )
  OR (
    NEW.subtotal_antes_ajustes_centavos = NEW.alojamiento_centavos + NEW.alimentacion_centavos
    AND NEW.subtotal_centavos = MAX(0, NEW.subtotal_antes_ajustes_centavos + NEW.ajuste_total_centavos)
  )
)
BEGIN
  SELECT RAISE(ABORT, 'quote components and adjustments must equal subtotal');
END;

CREATE TRIGGER cotizaciones_importes_componentes_update
BEFORE UPDATE ON cotizaciones
WHEN NOT (
  (
    NEW.subtotal_antes_ajustes_centavos = 0
    AND NEW.ajuste_total_centavos = 0
    AND NEW.subtotal_centavos = NEW.alojamiento_centavos + NEW.alimentacion_centavos
  )
  OR (
    NEW.subtotal_antes_ajustes_centavos = NEW.alojamiento_centavos + NEW.alimentacion_centavos
    AND NEW.subtotal_centavos = MAX(0, NEW.subtotal_antes_ajustes_centavos + NEW.ajuste_total_centavos)
  )
)
BEGIN
  SELECT RAISE(ABORT, 'quote components and adjustments must equal subtotal');
END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0037', 'snapshots de ajustes aplicados a cotizaciones',
        'migrations/0037_quote_pricing_adjustment_snapshots.sql');
