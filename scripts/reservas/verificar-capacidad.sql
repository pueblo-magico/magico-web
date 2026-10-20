-- WRESERV-8 · invariantes de capacidad comercial y excepciones administrativas.

PRAGMA foreign_keys = ON;

SELECT 'domos_7_10' AS control, COUNT(*) AS valor
FROM espacios
WHERE tipo = 'domo' AND capacidad_comercial = 7 AND capacidad_operativa_maxima = 10;

SELECT estado, COUNT(*) AS cantidad
FROM excepciones_capacidad
GROUP BY estado
ORDER BY estado;

SELECT 'reservas_domo_sin_excepcion' AS control, COUNT(*) AS valor
FROM reservas r
JOIN alojamientos a ON a.id = r.alojamiento_id
WHERE a.tipo = 'domo' AND r.cantidad_personas > 7
  AND NOT EXISTS (
    SELECT 1
    FROM reserva_estadias re
    JOIN excepciones_capacidad ec ON ec.reserva_estadia_id = re.id
    WHERE re.reserva_id = r.id
      AND ec.estado = 'aprobada'
      AND ec.capacidad_autorizada >= r.cantidad_personas
  );

CREATE TABLE __wreserv_capacity_guard (
  ok INTEGER NOT NULL CHECK (ok = 1)
);

INSERT INTO __wreserv_capacity_guard (ok)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM espacios
   WHERE tipo = 'domo' AND capacidad_comercial = 7 AND capacidad_operativa_maxima = 10) = 2
  AND NOT EXISTS (
    SELECT 1
    FROM excepciones_capacidad ec
    JOIN reserva_estadias re ON re.id = ec.reserva_estadia_id
    JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
    JOIN espacios e ON e.id = ree.espacio_id
    WHERE e.tipo <> 'domo'
       OR ec.capacidad_autorizada <= e.capacidad_comercial
       OR ec.capacidad_autorizada > e.capacidad_operativa_maxima
  )
  AND NOT EXISTS (
    SELECT 1
    FROM reservas r
    JOIN alojamientos a ON a.id = r.alojamiento_id
    WHERE a.tipo = 'domo' AND r.cantidad_personas > 10
  )
  AND NOT EXISTS (
    SELECT 1
    FROM reservas r
    JOIN alojamientos a ON a.id = r.alojamiento_id
    WHERE a.tipo = 'domo' AND r.cantidad_personas > 7
      AND NOT EXISTS (
        SELECT 1
        FROM reserva_estadias re
        JOIN excepciones_capacidad ec ON ec.reserva_estadia_id = re.id
        WHERE re.reserva_id = r.id
          AND ec.estado = 'aprobada'
          AND ec.capacidad_autorizada >= r.cantidad_personas
      )
  )
  AND NOT EXISTS (SELECT 1 FROM pragma_foreign_key_check)
THEN 1 ELSE 0 END;

DROP TABLE __wreserv_capacity_guard;
