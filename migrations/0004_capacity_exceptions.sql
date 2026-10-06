-- WRESERV-1 / WRESERV-8
-- Excepciones auditables de capacidad sin alterar la capacidad base del espacio.

PRAGMA foreign_keys = ON;

CREATE TABLE __wreserv_0004_guard (
  ok INTEGER NOT NULL CHECK (ok = 1)
);

INSERT INTO __wreserv_0004_guard (ok)
SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM reservas
  WHERE cantidad_personas > 10
    AND EXISTS (
      SELECT 1 FROM alojamientos a
      WHERE a.id = reservas.alojamiento_id AND a.tipo = 'domo'
    )
) THEN 1 ELSE 0 END;

DROP TABLE __wreserv_0004_guard;

CREATE TABLE IF NOT EXISTS excepciones_capacidad (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  reserva_estadia_id       INTEGER NOT NULL
                             REFERENCES reserva_estadias(id) ON DELETE RESTRICT,
  capacidad_autorizada     INTEGER NOT NULL CHECK (capacidad_autorizada > 0),
  motivo                   TEXT NOT NULL CHECK (length(trim(motivo)) > 0),
  plan_camas               TEXT NOT NULL CHECK (length(trim(plan_camas)) > 0),
  fecha_desde              TEXT,
  fecha_hasta              TEXT,
  estado                   TEXT NOT NULL DEFAULT 'solicitada'
                             CHECK (estado IN ('solicitada', 'aprobada', 'rechazada', 'revocada')),
  solicitada_por           TEXT NOT NULL CHECK (length(trim(solicitada_por)) > 0),
  decidida_por             TEXT,
  solicitada_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  decidida_at              TEXT,
  updated_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (
    (fecha_desde IS NULL AND fecha_hasta IS NULL)
    OR (fecha_desde IS NOT NULL AND fecha_hasta IS NOT NULL AND fecha_hasta > fecha_desde)
  ),
  CHECK (
    (estado = 'solicitada' AND decidida_por IS NULL AND decidida_at IS NULL)
    OR (estado <> 'solicitada' AND decidida_por IS NOT NULL AND decidida_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_excepciones_capacidad_estadia
  ON excepciones_capacidad (reserva_estadia_id, estado, solicitada_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_excepciones_capacidad_activa
  ON excepciones_capacidad (reserva_estadia_id)
  WHERE estado IN ('solicitada', 'aprobada');

-- La excepción sólo corresponde a domos, debe superar la venta habitual sin
-- exceder el máximo operativo y no puede contradecir asignaciones existentes.
CREATE TRIGGER IF NOT EXISTS excepciones_capacidad_validar_insert
BEFORE INSERT ON excepciones_capacidad
FOR EACH ROW
WHEN NEW.estado <> 'solicitada' OR NOT EXISTS (
  SELECT 1
  FROM reserva_estadias re
  JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
  JOIN espacios e ON e.id = ree.espacio_id
  WHERE re.id = NEW.reserva_estadia_id
    AND e.tipo = 'domo'
    AND NEW.capacidad_autorizada > e.capacidad_comercial
    AND NEW.capacidad_autorizada <= e.capacidad_operativa_maxima
    AND (
      NEW.fecha_desde IS NULL
      OR (
        NEW.fecha_desde >= re.fecha_checkin
        AND NEW.fecha_hasta <= re.fecha_checkout
      )
    )
    AND NEW.capacidad_autorizada >= COALESCE((
      SELECT SUM(ai.cantidad_huespedes)
      FROM asignaciones_inventario ai
      WHERE ai.reserva_estadia_id = re.id AND ai.estado = 'activa'
    ), 0)
)
BEGIN
  SELECT RAISE(ABORT, 'excepcion de capacidad incompatible con la estadia');
END;

CREATE TRIGGER IF NOT EXISTS excepciones_capacidad_decision_inmutable
BEFORE UPDATE OF decidida_por, decidida_at ON excepciones_capacidad
FOR EACH ROW
WHEN NEW.estado = OLD.estado
BEGIN
  SELECT RAISE(ABORT, 'la decision solo puede cambiar junto con el estado');
END;

CREATE TRIGGER IF NOT EXISTS excepciones_capacidad_campos_inmutables
BEFORE UPDATE OF
  reserva_estadia_id, capacidad_autorizada, motivo, plan_camas,
  fecha_desde, fecha_hasta, solicitada_por, solicitada_at
ON excepciones_capacidad
FOR EACH ROW
BEGIN
  SELECT RAISE(ABORT, 'los datos de la solicitud de capacidad son inmutables');
END;

CREATE TRIGGER IF NOT EXISTS excepciones_capacidad_validar_transicion
BEFORE UPDATE OF estado ON excepciones_capacidad
FOR EACH ROW
WHEN NOT (
  (OLD.estado = 'solicitada' AND NEW.estado IN ('aprobada', 'rechazada'))
  OR (OLD.estado = 'aprobada' AND NEW.estado = 'revocada')
)
BEGIN
  SELECT RAISE(ABORT, 'transicion de excepcion de capacidad invalida');
END;

CREATE TRIGGER IF NOT EXISTS excepciones_capacidad_validar_revocacion
BEFORE UPDATE OF estado ON excepciones_capacidad
FOR EACH ROW
WHEN NEW.estado = 'revocada'
  AND EXISTS (
    SELECT 1
    FROM reserva_estadias re
    JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
    JOIN espacios e ON e.id = ree.espacio_id
    WHERE re.id = NEW.reserva_estadia_id
      AND re.cantidad_huespedes > e.capacidad_comercial
  )
BEGIN
  SELECT RAISE(ABORT, 'reduzca la ocupacion antes de revocar la excepcion');
END;

CREATE TRIGGER IF NOT EXISTS excepciones_capacidad_no_eliminar
BEFORE DELETE ON excepciones_capacidad
FOR EACH ROW
BEGIN
  SELECT RAISE(ABORT, 'las excepciones de capacidad se revocan, no se eliminan');
END;

-- Todo cambio de estado genera un evento de dominio inmutable.
CREATE TRIGGER IF NOT EXISTS excepciones_capacidad_evento_solicitada
AFTER INSERT ON excepciones_capacidad
FOR EACH ROW
BEGIN
  INSERT INTO reserva_eventos (
    reserva_id, tipo, actor_tipo, actor_ref, payload_json
  )
  SELECT
    re.reserva_id,
    'capacidad.excepcion_solicitada',
    'usuario',
    NEW.solicitada_por,
    json_object(
      'excepcion_id', NEW.id,
      'capacidad_autorizada', NEW.capacidad_autorizada,
      'motivo', NEW.motivo,
      'plan_camas', NEW.plan_camas,
      'fecha_desde', NEW.fecha_desde,
      'fecha_hasta', NEW.fecha_hasta
    )
  FROM reserva_estadias re
  WHERE re.id = NEW.reserva_estadia_id;
END;

CREATE TRIGGER IF NOT EXISTS excepciones_capacidad_evento_aprobada
AFTER UPDATE OF estado ON excepciones_capacidad
FOR EACH ROW
WHEN NEW.estado = 'aprobada' AND OLD.estado <> NEW.estado
BEGIN
  INSERT INTO reserva_eventos (reserva_id, tipo, actor_tipo, actor_ref, payload_json)
  SELECT re.reserva_id, 'capacidad.excepcion_aprobada', 'usuario', NEW.decidida_por,
         json_object('excepcion_id', NEW.id, 'capacidad_autorizada', NEW.capacidad_autorizada)
  FROM reserva_estadias re WHERE re.id = NEW.reserva_estadia_id;
END;

CREATE TRIGGER IF NOT EXISTS excepciones_capacidad_evento_rechazada
AFTER UPDATE OF estado ON excepciones_capacidad
FOR EACH ROW
WHEN NEW.estado = 'rechazada' AND OLD.estado <> NEW.estado
BEGIN
  INSERT INTO reserva_eventos (reserva_id, tipo, actor_tipo, actor_ref, payload_json)
  SELECT re.reserva_id, 'capacidad.excepcion_rechazada', 'usuario', NEW.decidida_por,
         json_object('excepcion_id', NEW.id, 'capacidad_autorizada', NEW.capacidad_autorizada)
  FROM reserva_estadias re WHERE re.id = NEW.reserva_estadia_id;
END;

CREATE TRIGGER IF NOT EXISTS excepciones_capacidad_evento_revocada
AFTER UPDATE OF estado ON excepciones_capacidad
FOR EACH ROW
WHEN NEW.estado = 'revocada' AND OLD.estado <> NEW.estado
BEGIN
  INSERT INTO reserva_eventos (reserva_id, tipo, actor_tipo, actor_ref, payload_json)
  SELECT re.reserva_id, 'capacidad.excepcion_revocada', 'usuario', NEW.decidida_por,
         json_object('excepcion_id', NEW.id, 'capacidad_autorizada', NEW.capacidad_autorizada)
  FROM reserva_estadias re WHERE re.id = NEW.reserva_estadia_id;
END;

-- Conserva excepciones históricas de 8–10 personas sin cambiar sus reservas.
-- Quedan explícitamente marcadas para revisión administrativa posterior.
INSERT OR IGNORE INTO excepciones_capacidad (
  reserva_estadia_id, capacidad_autorizada, motivo, plan_camas, solicitada_por
)
SELECT
  re.id,
  re.cantidad_huespedes,
  'Excepción preexistente incorporada durante la migración WRESERV-8',
  'Revisar y documentar la disposición física utilizada',
  'migracion:0004_capacity_exceptions.sql'
FROM reserva_estadias re
JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
JOIN espacios e ON e.id = ree.espacio_id
WHERE e.tipo = 'domo'
  AND re.cantidad_huespedes BETWEEN 8 AND 10;

UPDATE excepciones_capacidad
SET estado = 'aprobada',
    decidida_por = 'migracion:0004_capacity_exceptions.sql',
    decidida_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE estado = 'solicitada'
  AND solicitada_por = 'migracion:0004_capacity_exceptions.sql';

-- Las altas públicas/legacy no pueden crear directamente una reserva de domo
-- por encima de siete. El flujo administrativo solicita primero la excepción.
CREATE TRIGGER IF NOT EXISTS reservas_capacidad_domo_insert
BEFORE INSERT ON reservas
FOR EACH ROW
WHEN NEW.cantidad_personas > 7
  AND EXISTS (
    SELECT 1 FROM alojamientos a
    WHERE a.id = NEW.alojamiento_id AND a.tipo = 'domo'
  )
BEGIN
  SELECT RAISE(ABORT, 'el domo supera su capacidad comercial; requiere excepcion aprobada');
END;

CREATE TRIGGER IF NOT EXISTS reservas_capacidad_domo_update
BEFORE UPDATE OF alojamiento_id, cantidad_personas, fecha_checkin, fecha_checkout ON reservas
FOR EACH ROW
WHEN NEW.cantidad_personas > 7
  AND EXISTS (
    SELECT 1 FROM alojamientos a
    WHERE a.id = NEW.alojamiento_id AND a.tipo = 'domo'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM reserva_estadias re
    JOIN excepciones_capacidad ec ON ec.reserva_estadia_id = re.id
    WHERE re.reserva_id = NEW.id
      AND re.tramo = 1
      AND ec.estado = 'aprobada'
      AND ec.capacidad_autorizada >= NEW.cantidad_personas
      AND (
        ec.fecha_desde IS NULL
        OR (ec.fecha_desde <= NEW.fecha_checkin AND ec.fecha_hasta >= NEW.fecha_checkout)
      )
  )
BEGIN
  SELECT RAISE(ABORT, 'el domo supera su capacidad comercial; requiere excepcion aprobada');
END;

CREATE TRIGGER IF NOT EXISTS reserva_estadias_capacidad_domo_update
BEFORE UPDATE OF cantidad_huespedes, fecha_checkin, fecha_checkout ON reserva_estadias
FOR EACH ROW
WHEN NEW.cantidad_huespedes > 7
  AND EXISTS (
    SELECT 1
    FROM reserva_estadia_espacios ree
    JOIN espacios e ON e.id = ree.espacio_id
    WHERE ree.reserva_estadia_id = NEW.id AND e.tipo = 'domo'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM excepciones_capacidad ec
    WHERE ec.reserva_estadia_id = NEW.id
      AND ec.estado = 'aprobada'
      AND ec.capacidad_autorizada >= NEW.cantidad_huespedes
      AND (
        ec.fecha_desde IS NULL
        OR (ec.fecha_desde <= NEW.fecha_checkin AND ec.fecha_hasta >= NEW.fecha_checkout)
      )
  )
BEGIN
  SELECT RAISE(ABORT, 'la estadia de domo requiere una excepcion de capacidad aprobada');
END;

INSERT OR IGNORE INTO schema_migrations (version, descripcion, checksum_ref)
VALUES (
  '0004',
  'excepciones auditables de capacidad para domos',
  'migrations/0004_capacity_exceptions.sql'
);
