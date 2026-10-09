-- WRESERV-17 · reporte de sólo lectura para una base ya migrada.
-- Todos los controles terminados en `_hallazgos` deben devolver 0.

SELECT 'foreign_keys_hallazgos' AS control, COUNT(*) AS valor
FROM pragma_foreign_key_check;

SELECT 'estado_flujo_fuera_catalogo_hallazgos' AS control, COUNT(*) AS valor
FROM reservas
WHERE estado_flujo NOT IN (
  'pendiente_pago', 'confirmada', 'cancelada', 'vencida', 'rechazada'
);

SELECT 'tipo_estadia_fuera_catalogo_hallazgos' AS control, COUNT(*) AS valor
FROM reservas
WHERE tipo_estadia NOT IN ('huesped', 'staff', 'voluntario', 'residente');

SELECT 'proyeccion_estado_legacy_hallazgos' AS control, COUNT(*) AS valor
FROM reservas
WHERE NOT (
  (estado = 'pendiente' AND estado_flujo = 'pendiente_pago')
  OR (estado = 'confirmada' AND estado_flujo = 'confirmada')
  OR (estado = 'cancelada' AND estado_flujo IN ('cancelada', 'vencida', 'rechazada'))
);

SELECT 'mp_preference_duplicados_hallazgos' AS control, COUNT(*) AS valor
FROM (
  SELECT mp_preference_id FROM reservas
  WHERE mp_preference_id IS NOT NULL AND trim(mp_preference_id) <> ''
  GROUP BY mp_preference_id HAVING COUNT(*) > 1
);

SELECT 'mp_payment_duplicados_hallazgos' AS control, COUNT(*) AS valor
FROM (
  SELECT mp_payment_id FROM reservas
  WHERE mp_payment_id IS NOT NULL AND trim(mp_payment_id) <> ''
  GROUP BY mp_payment_id HAVING COUNT(*) > 1
);

SELECT 'ical_uid_duplicados_hallazgos' AS control, COUNT(*) AS valor
FROM (
  SELECT ical_uid FROM reservas
  WHERE ical_uid IS NOT NULL AND trim(ical_uid) <> ''
  GROUP BY ical_uid HAVING COUNT(*) > 1
);

SELECT 'indices_unicos_faltantes_hallazgos' AS control, 3 - COUNT(*) AS valor
FROM sqlite_schema
WHERE type = 'index' AND name IN (
  'idx_reservas_mp_preference_unique',
  'idx_reservas_mp_payment_unique',
  'idx_reservas_ical_uid_unique'
);

SELECT 'alojamientos_base_drift_hallazgos' AS control, COUNT(*) AS valor
FROM (
  SELECT 1
  WHERE NOT EXISTS (
    SELECT 1 FROM alojamientos WHERE id = 1 AND nombre = 'Domo 1'
      AND tipo = 'domo' AND capacidad_total = 7
  )
  UNION ALL SELECT 1
  WHERE NOT EXISTS (
    SELECT 1 FROM alojamientos WHERE id = 2 AND nombre = 'Domo 2'
      AND tipo = 'domo' AND capacidad_total = 7
  )
  UNION ALL SELECT 1
  WHERE NOT EXISTS (
    SELECT 1 FROM alojamientos WHERE id = 3 AND nombre = 'Refugio'
      AND tipo = 'refugio' AND capacidad_total = 15
  )
);

SELECT 'espacios_base_faltantes_hallazgos' AS control, 8 - COUNT(*) AS valor
FROM espacios
WHERE codigo IN (
  'refugio', 'refugio-habitacion-3', 'refugio-habitacion-4',
  'refugio-habitacion-8', 'domo-1', 'domo-2', 'camping-exterior', 'salon'
);

SELECT 'migraciones_aplicadas' AS control, group_concat(name, ', ') AS valor
FROM d1_migrations;
