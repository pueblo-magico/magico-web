-- WRESERV-7 · invariantes del catálogo físico de alojamiento.

PRAGMA foreign_keys = ON;

SELECT 'espacios' AS control, COUNT(*) AS valor FROM espacios;
SELECT 'unidades_asignables' AS control, COUNT(*) AS valor
FROM unidades_inventario WHERE asignable = 1;
SELECT 'instalaciones_compartidas' AS control, COUNT(*) AS valor FROM instalaciones;
SELECT 'foreign_key_violations' AS control, COUNT(*) AS valor FROM pragma_foreign_key_check;

CREATE TABLE __wreserv_inventory_guard (
  ok INTEGER NOT NULL CHECK (ok = 1)
);

INSERT INTO __wreserv_inventory_guard (ok)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM espacios WHERE codigo IN (
    'refugio', 'refugio-habitacion-3', 'refugio-habitacion-4',
    'refugio-habitacion-8', 'domo-1', 'domo-2', 'camping-exterior', 'salon'
  )) = 8
  AND (SELECT COUNT(*) FROM unidades_inventario u
       JOIN espacios e ON e.id = u.espacio_id
       WHERE e.codigo LIKE 'refugio-habitacion-%' AND u.tipo = 'cama_simple') = 15
  AND (SELECT COUNT(*) FROM unidades_inventario u
       JOIN espacios e ON e.id = u.espacio_id
       WHERE e.codigo IN ('domo-1', 'domo-2') AND u.tipo = 'plaza_flexible') = 14
  AND (SELECT COUNT(*) FROM instalaciones WHERE tipo = 'bano') = 1
  AND (SELECT COUNT(*) FROM instalaciones WHERE tipo = 'bano_seco') = 8
  AND (SELECT COUNT(*) FROM instalaciones WHERE tipo = 'ducha') = 6
  AND NOT EXISTS (SELECT 1 FROM instalaciones WHERE reservable <> 0)
  AND NOT EXISTS (
    SELECT 1 FROM modalidades_espacio m
    JOIN espacios e ON e.id = m.espacio_id
    WHERE e.codigo = 'salon' AND m.habilitada = 1
  )
  AND NOT EXISTS (
    SELECT 1
    FROM reserva_estadias re
    WHERE re.alojamiento_legacy_id IN (1, 2, 3)
      AND NOT EXISTS (
        SELECT 1 FROM reserva_estadia_espacios ree
        WHERE ree.reserva_estadia_id = re.id
      )
  )
  AND NOT EXISTS (SELECT 1 FROM pragma_foreign_key_check)
THEN 1 ELSE 0 END;

DROP TABLE __wreserv_inventory_guard;
