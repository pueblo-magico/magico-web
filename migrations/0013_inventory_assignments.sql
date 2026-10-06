-- WRESERV-2 / WRESERV-15: asignación física versionada por unidad y noche.

ALTER TABLE asignaciones_inventario ADD COLUMN operacion_uid TEXT;
ALTER TABLE asignaciones_inventario ADD COLUMN actor_ref TEXT;
ALTER TABLE asignaciones_inventario ADD COLUMN correlation_id TEXT;

CREATE TABLE operaciones_asignacion_inventario (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  operacion_uid         TEXT NOT NULL UNIQUE,
  reserva_id            INTEGER NOT NULL REFERENCES reservas(id) ON DELETE RESTRICT,
  reserva_estadia_id    INTEGER NOT NULL REFERENCES reserva_estadias(id) ON DELETE RESTRICT,
  accion                TEXT NOT NULL CHECK (accion IN ('asignar', 'cambiar', 'liberar')),
  version_esperada      INTEGER NOT NULL CHECK (version_esperada > 0),
  version_resultante    INTEGER NOT NULL CHECK (version_resultante > version_esperada),
  actor_ref             TEXT NOT NULL,
  correlation_id        TEXT NOT NULL,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (reserva_id, version_resultante)
);

CREATE INDEX idx_operaciones_asignacion_estadia
  ON operaciones_asignacion_inventario (reserva_estadia_id, created_at);

DROP INDEX idx_ocupacion_noches_estadia_fecha;
ALTER TABLE ocupacion_noches RENAME TO ocupacion_noches_legacy_0013;

CREATE TABLE ocupacion_noches (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  reserva_estadia_id       INTEGER NOT NULL REFERENCES reserva_estadias(id) ON DELETE RESTRICT,
  asignacion_inventario_id INTEGER REFERENCES asignaciones_inventario(id) ON DELETE RESTRICT,
  unidad_inventario_id     INTEGER NOT NULL REFERENCES unidades_inventario(id) ON DELETE RESTRICT,
  fecha                    TEXT NOT NULL,
  cantidad_huespedes       INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_huespedes >= 0),
  modalidad                TEXT NOT NULL DEFAULT 'compartida'
                             CHECK (modalidad IN ('privada', 'compartida', 'camping')),
  estado                   TEXT NOT NULL DEFAULT 'activa'
                             CHECK (estado IN ('activa', 'liberada')),
  operacion_uid            TEXT,
  created_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO ocupacion_noches (
  id, reserva_estadia_id, unidad_inventario_id, fecha,
  cantidad_huespedes, modalidad, estado, created_at, updated_at
)
SELECT id, reserva_estadia_id, unidad_inventario_id, fecha,
       cantidad_huespedes, 'compartida', 'activa', created_at, created_at
FROM ocupacion_noches_legacy_0013;

DROP TABLE ocupacion_noches_legacy_0013;

CREATE INDEX idx_ocupacion_noches_estadia_fecha
  ON ocupacion_noches (reserva_estadia_id, fecha, estado);
CREATE INDEX idx_ocupacion_noches_operacion
  ON ocupacion_noches (operacion_uid, fecha);
CREATE UNIQUE INDEX idx_ocupacion_noches_unidad_activa
  ON ocupacion_noches (unidad_inventario_id, fecha)
  WHERE estado = 'activa';
CREATE UNIQUE INDEX idx_asignaciones_estadia_unidad_activa
  ON asignaciones_inventario (reserva_estadia_id, unidad_inventario_id)
  WHERE estado = 'activa' AND unidad_inventario_id IS NOT NULL;

CREATE TRIGGER ocupacion_noches_unidad_activa_insert
BEFORE INSERT ON ocupacion_noches
WHEN NEW.estado = 'activa' AND NOT EXISTS (
  SELECT 1 FROM unidades_inventario u
  WHERE u.id = NEW.unidad_inventario_id AND u.estado = 'activa' AND u.asignable = 1
)
BEGIN SELECT RAISE(ABORT, 'unidad no asignable'); END;

CREATE TRIGGER ocupacion_noches_bloqueo_operativo_insert
BEFORE INSERT ON ocupacion_noches
WHEN NEW.estado = 'activa' AND EXISTS (
  SELECT 1
  FROM ocupacion_operativa oo
  JOIN unidades_inventario nueva ON nueva.id = NEW.unidad_inventario_id
  LEFT JOIN unidades_inventario bloqueada ON bloqueada.id = oo.unidad_inventario_id
  JOIN espacios objetivo ON objetivo.id = COALESCE(oo.espacio_id, bloqueada.espacio_id)
  JOIN espacios asignado ON asignado.id = nueva.espacio_id
  WHERE oo.fecha_desde <= NEW.fecha AND oo.fecha_hasta > NEW.fecha
    AND (objetivo.id = asignado.id OR objetivo.parent_id = asignado.id OR asignado.parent_id = objetivo.id)
)
BEGIN SELECT RAISE(ABORT, 'inventario bloqueado operativamente'); END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0013', 'asignaciones físicas versionadas por unidad y noche',
        'migrations/0013_inventory_assignments.sql');
