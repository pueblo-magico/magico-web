-- WRESERV-2 / WRESERV-26
-- Bloqueos operativos y estadías no comerciales separados de las reservas.

PRAGMA foreign_keys = ON;

CREATE TABLE bloqueos_inventario (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo                TEXT NOT NULL UNIQUE,
  espacio_id            INTEGER REFERENCES espacios(id) ON DELETE RESTRICT,
  unidad_inventario_id  INTEGER REFERENCES unidades_inventario(id) ON DELETE RESTRICT,
  fecha_desde           TEXT NOT NULL,
  fecha_hasta           TEXT NOT NULL,
  tipo                  TEXT NOT NULL
                          CHECK (tipo IN ('mantenimiento', 'cierre', 'uso_interno', 'bloqueo_propietario')),
  motivo                TEXT NOT NULL CHECK (length(trim(motivo)) >= 3),
  estado                TEXT NOT NULL DEFAULT 'activo'
                          CHECK (estado IN ('activo', 'cancelado')),
  creado_por            TEXT NOT NULL CHECK (length(trim(creado_por)) > 0),
  cancelado_por         TEXT,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  cancelado_at          TEXT,
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK ((espacio_id IS NULL) <> (unidad_inventario_id IS NULL)),
  CHECK (fecha_hasta > fecha_desde),
  CHECK (
    (estado = 'activo' AND cancelado_por IS NULL AND cancelado_at IS NULL)
    OR (estado = 'cancelado' AND cancelado_por IS NOT NULL AND cancelado_at IS NOT NULL)
  )
);

CREATE INDEX idx_bloqueos_inventario_rango
  ON bloqueos_inventario (estado, fecha_desde, fecha_hasta);
CREATE INDEX idx_bloqueos_inventario_espacio
  ON bloqueos_inventario (espacio_id, estado, fecha_desde, fecha_hasta);
CREATE INDEX idx_bloqueos_inventario_unidad
  ON bloqueos_inventario (unidad_inventario_id, estado, fecha_desde, fecha_hasta);

CREATE TABLE estadias_no_comerciales (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo                TEXT NOT NULL UNIQUE,
  tipo                  TEXT NOT NULL CHECK (tipo IN ('staff', 'voluntario', 'residente')),
  referencia_operativa  TEXT NOT NULL CHECK (length(trim(referencia_operativa)) >= 3),
  espacio_id            INTEGER REFERENCES espacios(id) ON DELETE RESTRICT,
  unidad_inventario_id  INTEGER REFERENCES unidades_inventario(id) ON DELETE RESTRICT,
  fecha_checkin         TEXT NOT NULL,
  fecha_checkout        TEXT NOT NULL,
  cantidad_personas     INTEGER NOT NULL CHECK (cantidad_personas > 0),
  estado                TEXT NOT NULL DEFAULT 'activa'
                          CHECK (estado IN ('activa', 'cancelada')),
  creado_por            TEXT NOT NULL CHECK (length(trim(creado_por)) > 0),
  cancelado_por         TEXT,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  cancelado_at          TEXT,
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK ((espacio_id IS NULL) <> (unidad_inventario_id IS NULL)),
  CHECK (fecha_checkout > fecha_checkin),
  CHECK (
    (estado = 'activa' AND cancelado_por IS NULL AND cancelado_at IS NULL)
    OR (estado = 'cancelada' AND cancelado_por IS NOT NULL AND cancelado_at IS NOT NULL)
  )
);

CREATE INDEX idx_estadias_no_comerciales_rango
  ON estadias_no_comerciales (estado, fecha_checkin, fecha_checkout);
CREATE INDEX idx_estadias_no_comerciales_espacio
  ON estadias_no_comerciales (espacio_id, estado, fecha_checkin, fecha_checkout);
CREATE INDEX idx_estadias_no_comerciales_unidad
  ON estadias_no_comerciales (unidad_inventario_id, estado, fecha_checkin, fecha_checkout);

CREATE TRIGGER estadias_no_comerciales_validar_capacidad_insert
BEFORE INSERT ON estadias_no_comerciales
WHEN NOT EXISTS (
  SELECT 1 FROM espacios e
  WHERE e.id = NEW.espacio_id AND NEW.cantidad_personas <= e.capacidad_operativa_maxima
  UNION ALL
  SELECT 1 FROM unidades_inventario u
  WHERE u.id = NEW.unidad_inventario_id AND u.asignable = 1 AND u.estado = 'activa'
    AND NEW.cantidad_personas <= u.capacidad
)
BEGIN SELECT RAISE(ABORT, 'capacidad incompatible con ocupacion no comercial'); END;

-- No se pueden superponer dos usos operativos sobre el mismo objetivo físico.
CREATE TRIGGER bloqueos_inventario_no_superponer_insert
BEFORE INSERT ON bloqueos_inventario
WHEN NEW.estado = 'activo' AND EXISTS (
  SELECT 1 FROM bloqueos_inventario b
  WHERE b.estado = 'activo'
    AND b.fecha_desde < NEW.fecha_hasta AND b.fecha_hasta > NEW.fecha_desde
    AND b.espacio_id IS NEW.espacio_id
    AND b.unidad_inventario_id IS NEW.unidad_inventario_id
)
BEGIN SELECT RAISE(ABORT, 'bloqueo operativo superpuesto'); END;

CREATE TRIGGER estadias_no_comerciales_no_superponer_insert
BEFORE INSERT ON estadias_no_comerciales
WHEN NEW.estado = 'activa' AND EXISTS (
  SELECT 1 FROM estadias_no_comerciales e
  WHERE e.estado = 'activa'
    AND e.fecha_checkin < NEW.fecha_checkout AND e.fecha_checkout > NEW.fecha_checkin
    AND e.espacio_id IS NEW.espacio_id
    AND e.unidad_inventario_id IS NEW.unidad_inventario_id
)
BEGIN SELECT RAISE(ABORT, 'estadia no comercial superpuesta'); END;

CREATE TRIGGER bloqueos_inventario_conflicto_estadia_interna_insert
BEFORE INSERT ON bloqueos_inventario
WHEN NEW.estado = 'activo' AND EXISTS (
  SELECT 1
  FROM estadias_no_comerciales enc
  LEFT JOIN unidades_inventario unidad_existente ON unidad_existente.id = enc.unidad_inventario_id
  LEFT JOIN unidades_inventario unidad_nueva ON unidad_nueva.id = NEW.unidad_inventario_id
  LEFT JOIN espacios espacio_existente
    ON espacio_existente.id = COALESCE(enc.espacio_id, unidad_existente.espacio_id)
  LEFT JOIN espacios espacio_nuevo
    ON espacio_nuevo.id = COALESCE(NEW.espacio_id, unidad_nueva.espacio_id)
  WHERE enc.estado = 'activa'
    AND enc.fecha_checkin < NEW.fecha_hasta AND enc.fecha_checkout > NEW.fecha_desde
    AND (
      (NEW.unidad_inventario_id IS NOT NULL AND enc.unidad_inventario_id = NEW.unidad_inventario_id)
      OR (
        (NEW.espacio_id IS NOT NULL OR enc.espacio_id IS NOT NULL)
        AND (
          espacio_nuevo.id = espacio_existente.id
          OR espacio_nuevo.parent_id = espacio_existente.id
          OR espacio_existente.parent_id = espacio_nuevo.id
        )
      )
    )
)
BEGIN SELECT RAISE(ABORT, 'bloqueo en conflicto con estadia no comercial'); END;

CREATE TRIGGER estadias_no_comerciales_conflicto_bloqueo_insert
BEFORE INSERT ON estadias_no_comerciales
WHEN NEW.estado = 'activa' AND EXISTS (
  SELECT 1
  FROM bloqueos_inventario b
  LEFT JOIN unidades_inventario unidad_existente ON unidad_existente.id = b.unidad_inventario_id
  LEFT JOIN unidades_inventario unidad_nueva ON unidad_nueva.id = NEW.unidad_inventario_id
  LEFT JOIN espacios espacio_existente
    ON espacio_existente.id = COALESCE(b.espacio_id, unidad_existente.espacio_id)
  LEFT JOIN espacios espacio_nuevo
    ON espacio_nuevo.id = COALESCE(NEW.espacio_id, unidad_nueva.espacio_id)
  WHERE b.estado = 'activo'
    AND b.fecha_desde < NEW.fecha_checkout AND b.fecha_hasta > NEW.fecha_checkin
    AND (
      (NEW.unidad_inventario_id IS NOT NULL AND b.unidad_inventario_id = NEW.unidad_inventario_id)
      OR (
        (NEW.espacio_id IS NOT NULL OR b.espacio_id IS NOT NULL)
        AND (
          espacio_nuevo.id = espacio_existente.id
          OR espacio_nuevo.parent_id = espacio_existente.id
          OR espacio_existente.parent_id = espacio_nuevo.id
        )
      )
    )
)
BEGIN SELECT RAISE(ABORT, 'estadia no comercial en conflicto con bloqueo'); END;

-- Un bloqueo nunca desplaza silenciosamente una reserva activa. Para espacios
-- padre/hijo se adopta una política conservadora hasta WRESERV-11/15.
CREATE TRIGGER bloqueos_inventario_conflicto_reserva_insert
BEFORE INSERT ON bloqueos_inventario
WHEN NEW.estado = 'activo' AND EXISTS (
  SELECT 1
  FROM reservas r
  JOIN reserva_estadias re ON re.reserva_id = r.id
  LEFT JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
  LEFT JOIN espacios reservado ON reservado.id = ree.espacio_id
  LEFT JOIN asignaciones_inventario ai
    ON ai.reserva_estadia_id = re.id AND ai.estado = 'activa'
  LEFT JOIN unidades_inventario ui ON ui.id = ai.unidad_inventario_id
  WHERE r.estado IN ('pendiente', 'confirmada')
    AND re.fecha_checkin < NEW.fecha_hasta AND re.fecha_checkout > NEW.fecha_desde
    AND (
      (NEW.unidad_inventario_id IS NOT NULL AND ai.unidad_inventario_id = NEW.unidad_inventario_id)
      OR (
        NEW.espacio_id IS NOT NULL AND (
          ree.espacio_id = NEW.espacio_id
          OR reservado.parent_id = NEW.espacio_id
          OR EXISTS (SELECT 1 FROM espacios objetivo WHERE objetivo.id = NEW.espacio_id AND objetivo.parent_id = ree.espacio_id)
          OR ui.espacio_id = NEW.espacio_id
        )
      )
    )
)
BEGIN SELECT RAISE(ABORT, 'bloqueo en conflicto con reserva activa'); END;

CREATE TRIGGER estadias_no_comerciales_conflicto_reserva_insert
BEFORE INSERT ON estadias_no_comerciales
WHEN NEW.estado = 'activa' AND EXISTS (
  SELECT 1
  FROM reservas r
  JOIN reserva_estadias re ON re.reserva_id = r.id
  LEFT JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
  LEFT JOIN espacios reservado ON reservado.id = ree.espacio_id
  LEFT JOIN asignaciones_inventario ai
    ON ai.reserva_estadia_id = re.id AND ai.estado = 'activa'
  LEFT JOIN unidades_inventario ui ON ui.id = ai.unidad_inventario_id
  WHERE r.estado IN ('pendiente', 'confirmada')
    AND re.fecha_checkin < NEW.fecha_checkout AND re.fecha_checkout > NEW.fecha_checkin
    AND (
      (NEW.unidad_inventario_id IS NOT NULL AND ai.unidad_inventario_id = NEW.unidad_inventario_id)
      OR (
        NEW.espacio_id IS NOT NULL AND (
          ree.espacio_id = NEW.espacio_id
          OR reservado.parent_id = NEW.espacio_id
          OR EXISTS (SELECT 1 FROM espacios objetivo WHERE objetivo.id = NEW.espacio_id AND objetivo.parent_id = ree.espacio_id)
          OR ui.espacio_id = NEW.espacio_id
        )
      )
    )
)
BEGIN SELECT RAISE(ABORT, 'estadia no comercial en conflicto con reserva activa'); END;

CREATE TRIGGER bloqueos_inventario_campos_inmutables
BEFORE UPDATE OF codigo, espacio_id, unidad_inventario_id, fecha_desde, fecha_hasta, tipo, motivo, creado_por, created_at
ON bloqueos_inventario
BEGIN SELECT RAISE(ABORT, 'los datos del bloqueo son inmutables'); END;

CREATE TRIGGER estadias_no_comerciales_campos_inmutables
BEFORE UPDATE OF codigo, tipo, referencia_operativa, espacio_id, unidad_inventario_id,
  fecha_checkin, fecha_checkout, cantidad_personas, creado_por, created_at
ON estadias_no_comerciales
BEGIN SELECT RAISE(ABORT, 'los datos de la estadia no comercial son inmutables'); END;

CREATE TRIGGER bloqueos_inventario_transicion_valida
BEFORE UPDATE OF estado ON bloqueos_inventario
WHEN NOT (OLD.estado = 'activo' AND NEW.estado = 'cancelado')
BEGIN SELECT RAISE(ABORT, 'transicion de bloqueo invalida'); END;

CREATE TRIGGER estadias_no_comerciales_transicion_valida
BEFORE UPDATE OF estado ON estadias_no_comerciales
WHEN NOT (OLD.estado = 'activa' AND NEW.estado = 'cancelada')
BEGIN SELECT RAISE(ABORT, 'transicion de estadia no comercial invalida'); END;

CREATE TRIGGER bloqueos_inventario_no_eliminar
BEFORE DELETE ON bloqueos_inventario
BEGIN SELECT RAISE(ABORT, 'los bloqueos se cancelan, no se eliminan'); END;

CREATE TRIGGER estadias_no_comerciales_no_eliminar
BEFORE DELETE ON estadias_no_comerciales
BEGIN SELECT RAISE(ABORT, 'las estadias no comerciales se cancelan, no se eliminan'); END;

CREATE VIEW ocupacion_operativa AS
SELECT
  'bloqueo' AS origen_tipo, id AS origen_id, codigo, espacio_id, unidad_inventario_id,
  fecha_desde, fecha_hasta, tipo, 0 AS cantidad_personas
FROM bloqueos_inventario WHERE estado = 'activo'
UNION ALL
SELECT
  'estadia_no_comercial', id, codigo, espacio_id, unidad_inventario_id,
  fecha_checkin, fecha_checkout, tipo, cantidad_personas
FROM estadias_no_comerciales WHERE estado = 'activa';

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0007', 'bloqueos operativos y estadias no comerciales', 'migrations/0007_operational_blocks_noncommercial_stays.sql');
