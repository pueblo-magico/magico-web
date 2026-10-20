-- WRESERV-29 · snapshot de reconciliación sin PII y de sólo lectura.
-- Se ejecuta inmediatamente antes y después de aplicar migraciones.

SELECT 'reservas_total' AS control, COUNT(*) AS valor FROM reservas;
SELECT 'consultas_total' AS control, COUNT(*) AS valor FROM consultas;
SELECT 'usuarios_admin_total' AS control, COUNT(*) AS valor FROM usuarios_admin;
SELECT 'super_admin_activo_total' AS control, COUNT(*) AS valor
FROM usuarios_admin WHERE rol = 'super_admin' AND activo = 1;
SELECT 'auditoria_admin_total' AS control, COUNT(*) AS valor FROM auditoria_admin;

SELECT 'reservas_monto_total' AS control,
  printf('%.2f', COALESCE(SUM(monto_total), 0)) AS valor FROM reservas;
SELECT 'reservas_sena_total' AS control,
  printf('%.2f', COALESCE(SUM(monto_sena), 0)) AS valor FROM reservas;
SELECT 'reservas_estado:' || COALESCE(estado, 'NULL') AS control,
  COUNT(*) AS valor FROM reservas GROUP BY estado ORDER BY estado;

SELECT 'reservas_invalidas' AS control, COUNT(*) AS valor
FROM reservas r
LEFT JOIN alojamientos a ON a.id = r.alojamiento_id
WHERE a.id IS NULL
   OR r.fecha_checkout <= r.fecha_checkin
   OR r.cantidad_personas < 1
   OR r.monto_total < 0
   OR COALESCE(r.monto_sena, 0) < 0;

SELECT 'mp_preference_duplicados' AS control, COUNT(*) AS valor FROM (
  SELECT mp_preference_id FROM reservas
  WHERE mp_preference_id IS NOT NULL AND trim(mp_preference_id) <> ''
  GROUP BY mp_preference_id HAVING COUNT(*) > 1
);
SELECT 'mp_payment_duplicados' AS control, COUNT(*) AS valor FROM (
  SELECT mp_payment_id FROM reservas
  WHERE mp_payment_id IS NOT NULL AND trim(mp_payment_id) <> ''
  GROUP BY mp_payment_id HAVING COUNT(*) > 1
);
