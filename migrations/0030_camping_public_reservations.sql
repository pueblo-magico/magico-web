-- Proyección legacy mínima para que el inventario normalizado de camping pueda
-- atravesar el flujo público mientras reservas.alojamiento_id siga siendo obligatorio.
INSERT INTO alojamientos (id, nombre, tipo, capacidad_total)
SELECT 4, e.nombre, 'camping', MAX(1, e.capacidad_comercial)
FROM espacios e
WHERE e.codigo = 'camping-exterior'
  AND NOT EXISTS (SELECT 1 FROM alojamientos WHERE id = 4);

UPDATE alojamientos
SET nombre = COALESCE((SELECT nombre FROM espacios WHERE codigo = 'camping-exterior'), nombre),
    capacidad_total = MAX(1, COALESCE((SELECT capacidad_comercial FROM espacios WHERE codigo = 'camping-exterior'), capacidad_total))
WHERE id = 4;

CREATE TRIGGER camping_sincronizar_alojamiento_legacy
AFTER UPDATE OF nombre, capacidad_comercial ON espacios
FOR EACH ROW
WHEN NEW.codigo = 'camping-exterior'
BEGIN
  UPDATE alojamientos
  SET nombre = NEW.nombre, capacidad_total = MAX(1, NEW.capacidad_comercial)
  WHERE id = 4;
END;

CREATE TRIGGER reserva_estadias_mapear_camping_insert
AFTER INSERT ON reserva_estadias
FOR EACH ROW
WHEN NEW.alojamiento_legacy_id = 4
BEGIN
  INSERT OR REPLACE INTO reserva_estadia_espacios (
    reserva_estadia_id, espacio_id, origen, created_at, updated_at
  )
  SELECT NEW.id, e.id, 'mapeo_legacy', NEW.created_at, NEW.updated_at
  FROM espacios e
  WHERE e.codigo = 'camping-exterior';
END;

CREATE TRIGGER reserva_estadias_mapear_camping_update
AFTER UPDATE OF alojamiento_legacy_id ON reserva_estadias
FOR EACH ROW
WHEN NEW.alojamiento_legacy_id = 4
BEGIN
  INSERT OR REPLACE INTO reserva_estadia_espacios (
    reserva_estadia_id, espacio_id, origen, created_at, updated_at
  )
  SELECT NEW.id, e.id, 'mapeo_legacy', OLD.created_at, NEW.updated_at
  FROM espacios e
  WHERE e.codigo = 'camping-exterior';
END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0030', 'reservas públicas de camping', 'migrations/0030_camping_public_reservations.sql');
