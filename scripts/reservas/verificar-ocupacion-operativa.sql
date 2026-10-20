-- WRESERV-26 · estructuras e invariantes de ocupación operativa.
CREATE TABLE __wreserv_operational_occupancy_guard (
  ok INTEGER NOT NULL CHECK (ok = 1)
);

INSERT INTO __wreserv_operational_occupancy_guard (ok)
SELECT CASE WHEN
  EXISTS (SELECT 1 FROM schema_migrations WHERE version = '0007')
  AND (SELECT COUNT(*) FROM sqlite_schema
       WHERE type = 'table' AND name IN ('bloqueos_inventario', 'estadias_no_comerciales')) = 2
  AND EXISTS (SELECT 1 FROM sqlite_schema WHERE type = 'view' AND name = 'ocupacion_operativa')
  AND NOT EXISTS (
    SELECT 1 FROM bloqueos_inventario
    WHERE (espacio_id IS NULL) = (unidad_inventario_id IS NULL)
       OR fecha_hasta <= fecha_desde
       OR (estado = 'activo' AND (cancelado_por IS NOT NULL OR cancelado_at IS NOT NULL))
  )
  AND NOT EXISTS (
    SELECT 1 FROM estadias_no_comerciales
    WHERE (espacio_id IS NULL) = (unidad_inventario_id IS NULL)
       OR fecha_checkout <= fecha_checkin
       OR (estado = 'activa' AND (cancelado_por IS NOT NULL OR cancelado_at IS NOT NULL))
  )
  AND NOT EXISTS (SELECT 1 FROM pragma_foreign_key_check)
THEN 1 ELSE 0 END;

DROP TABLE __wreserv_operational_occupancy_guard;
