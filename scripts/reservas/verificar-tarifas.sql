CREATE TABLE __wreserv_pricing_guard (ok INTEGER NOT NULL CHECK (ok = 1));

INSERT INTO __wreserv_pricing_guard (ok)
SELECT CASE WHEN
  EXISTS (SELECT 1 FROM schema_migrations WHERE version = '0006')
  AND (SELECT COUNT(*) FROM planes_tarifa WHERE codigo = 'alojamiento-base' AND estado = 'publicado') = 1
  AND (SELECT COUNT(*) FROM reglas_precio rp JOIN temporadas t ON t.id = rp.temporada_id
       JOIN planes_tarifa p ON p.id = t.plan_tarifa_id WHERE p.codigo = 'alojamiento-base') = 5
  AND (SELECT COUNT(*) FROM reglas_sena rs JOIN planes_tarifa p ON p.id = rs.plan_tarifa_id
       WHERE p.codigo = 'alojamiento-base') = 2
  AND NOT EXISTS (SELECT 1 FROM pragma_foreign_key_check)
THEN 1 ELSE 0 END;

DROP TABLE __wreserv_pricing_guard;
