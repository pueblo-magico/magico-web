-- Permite que dos temporadas compartan vigencia si aplican a dias distintos.
-- Bit 0 = lunes ... bit 6 = domingo. 127 conserva el comportamiento previo:
-- todos los dias de la semana.
ALTER TABLE temporadas
ADD COLUMN dias_semana_mask INTEGER NOT NULL DEFAULT 127
  CHECK (dias_semana_mask BETWEEN 1 AND 127);

CREATE INDEX idx_temporadas_vigencia_dias
  ON temporadas (plan_tarifa_id, fecha_desde, fecha_hasta, dias_semana_mask, prioridad);

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0031', 'tarifas por dia de semana', 'migrations/0031_weekday_rate_seasons.sql');
