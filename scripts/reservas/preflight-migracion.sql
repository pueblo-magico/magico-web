-- WRESERV-6 · reporte de preflight para una copia de una base legacy.
-- Es sólo lectura. Ejecutar antes del cutover; 0002 repite los controles
-- críticos como guards bloqueantes dentro de la migración atómica.

SELECT 'tablas_presentes' AS control, group_concat(name, ', ') AS valor
FROM sqlite_schema
WHERE type = 'table'
  AND name NOT LIKE 'sqlite_%'
ORDER BY name;

SELECT 'columnas_reservas' AS control, group_concat(name, ', ') AS valor
FROM pragma_table_info('reservas');

SELECT 'reservas_total' AS control, COUNT(*) AS valor FROM reservas;
SELECT 'consultas_total' AS control, COUNT(*) AS valor FROM consultas;
SELECT 'usuarios_admin_total' AS control, COUNT(*) AS valor FROM usuarios_admin;
SELECT 'auditoria_admin_total' AS control, COUNT(*) AS valor FROM auditoria_admin;

SELECT 'reservas_invalidas' AS control, COUNT(*) AS valor
FROM reservas r
LEFT JOIN alojamientos a ON a.id = r.alojamiento_id
WHERE a.id IS NULL
   OR r.fecha_checkout <= r.fecha_checkin
   OR r.cantidad_personas < 1
   OR r.monto_total < 0
   OR COALESCE(r.monto_sena, 0) < 0;

SELECT 'mp_preference_duplicados' AS control, COUNT(*) AS valor
FROM (
  SELECT mp_preference_id
  FROM reservas
  WHERE mp_preference_id IS NOT NULL AND trim(mp_preference_id) <> ''
  GROUP BY mp_preference_id
  HAVING COUNT(*) > 1
);

SELECT 'mp_payment_duplicados' AS control, COUNT(*) AS valor
FROM (
  SELECT mp_payment_id
  FROM reservas
  WHERE mp_payment_id IS NOT NULL AND trim(mp_payment_id) <> ''
  GROUP BY mp_payment_id
  HAVING COUNT(*) > 1
);

SELECT 'ical_uid_duplicados' AS control, COUNT(*) AS valor
FROM (
  SELECT ical_uid
  FROM reservas
  WHERE ical_uid IS NOT NULL AND trim(ical_uid) <> ''
  GROUP BY ical_uid
  HAVING COUNT(*) > 1
);

SELECT 'asignaciones_texto_pendientes_mapeo' AS control, COUNT(*) AS valor
FROM reservas
WHERE unidad_asignada IS NOT NULL AND trim(unidad_asignada) <> '';

SELECT 'd1_migrations' AS control, group_concat(name, ', ') AS valor
FROM d1_migrations;
