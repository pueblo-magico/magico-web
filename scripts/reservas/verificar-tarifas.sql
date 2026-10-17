CREATE TABLE __wreserv_pricing_guard (ok INTEGER NOT NULL CHECK (ok = 1));

INSERT INTO __wreserv_pricing_guard (ok)
SELECT CASE WHEN
  EXISTS (SELECT 1 FROM schema_migrations WHERE version = '0006')
  AND EXISTS (SELECT 1 FROM schema_migrations WHERE version = '0031')
  AND EXISTS (SELECT 1 FROM schema_migrations WHERE version = '0033')
  AND EXISTS (SELECT 1 FROM schema_migrations WHERE version = '0037')
  AND EXISTS (
    SELECT 1 FROM pragma_table_info('cotizaciones')
    WHERE name = 'subtotal_antes_ajustes_centavos'
  )
  AND EXISTS (
    SELECT 1 FROM pragma_table_info('cotizaciones')
    WHERE name = 'ajuste_total_centavos'
  )
  AND (SELECT COUNT(*) FROM planes_tarifa WHERE estado = 'publicado') = 1
  AND NOT EXISTS (
    SELECT 1 FROM planes_tarifa p
    WHERE p.estado = 'publicado'
      AND NOT EXISTS (SELECT 1 FROM temporadas t WHERE t.plan_tarifa_id = p.id)
  )
  AND NOT EXISTS (
    SELECT 1 FROM temporadas t
    JOIN planes_tarifa p ON p.id = t.plan_tarifa_id
    WHERE p.estado = 'publicado'
      AND NOT EXISTS (SELECT 1 FROM reglas_precio rp WHERE rp.temporada_id = t.id)
  )
  AND NOT EXISTS (
    SELECT 1 FROM planes_tarifa p
    WHERE p.estado = 'publicado'
      AND NOT EXISTS (SELECT 1 FROM reglas_sena rs WHERE rs.plan_tarifa_id = p.id)
  )
  AND NOT EXISTS (SELECT 1 FROM temporadas WHERE dias_semana_mask NOT BETWEEN 1 AND 127)
  AND NOT EXISTS (SELECT 1 FROM pragma_foreign_key_check)
THEN 1 ELSE 0 END;

DROP TABLE __wreserv_pricing_guard;
