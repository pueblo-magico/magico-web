-- WRESERV-6 · reconciliación posterior. El guard final falla para que CI no
-- despliegue código sobre un backfill incompleto.

PRAGMA foreign_keys = ON;

SELECT 'reservas_legacy' AS control, COUNT(*) AS valor FROM reservas;
SELECT 'estadias_normalizadas' AS control, COUNT(*) AS valor FROM reserva_estadias;
SELECT 'mapeos_reserva' AS control, COUNT(*) AS valor
FROM mapeo_ids_legacy WHERE tipo_entidad = 'reserva';
SELECT 'eventos_importacion' AS control, COUNT(*) AS valor
FROM reserva_eventos WHERE tipo = 'reserva.importada_legacy';
SELECT 'pagos_importados' AS control, COUNT(*) AS valor FROM pagos;
SELECT 'asignaciones_legacy_preservadas' AS control, COUNT(*) AS valor
FROM asignaciones_inventario WHERE unidad_legacy_texto IS NOT NULL;
SELECT 'foreign_key_violations' AS control, COUNT(*) AS valor
FROM pragma_foreign_key_check;

CREATE TABLE __wreserv_verify_guard (
  ok INTEGER NOT NULL CHECK (ok = 1)
);

INSERT INTO __wreserv_verify_guard (ok)
SELECT CASE WHEN
  NOT EXISTS (
    SELECT 1
    FROM reservas r
    WHERE NOT EXISTS (
      SELECT 1 FROM reserva_estadias re
      WHERE re.reserva_id = r.id AND re.tramo = 1
    )
       OR NOT EXISTS (
         SELECT 1 FROM mapeo_ids_legacy m
         WHERE m.tipo_entidad = 'reserva'
           AND m.id_legacy = CAST(r.id AS TEXT)
           AND m.id_nuevo = r.reserva_uid
       )
       OR NOT EXISTS (
         SELECT 1 FROM reserva_eventos e
         WHERE e.reserva_id = r.id
           AND e.tipo IN ('reserva.importada_legacy', 'reserva.creada_legacy')
       )
  )
  AND NOT EXISTS (
    SELECT 1 FROM reservas
    WHERE reserva_uid IS NULL
       OR codigo IS NULL
       OR monto_total_centavos <> CAST(round(monto_total * 100) AS INTEGER)
       OR COALESCE(monto_sena_centavos, -1) <>
          COALESCE(CAST(round(monto_sena * 100) AS INTEGER), -1)
       OR updated_at IS NULL
  )
  AND NOT EXISTS (SELECT 1 FROM pragma_foreign_key_check)
THEN 1 ELSE 0 END;

DROP TABLE __wreserv_verify_guard;
