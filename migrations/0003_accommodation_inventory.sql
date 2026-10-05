-- WRESERV-1 / WRESERV-7
-- Catálogo jerárquico de espacios, modalidades, unidades físicas e instalaciones.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS espacios (
  id                           INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo                       TEXT NOT NULL UNIQUE,
  nombre                       TEXT NOT NULL,
  tipo                         TEXT NOT NULL
                                 CHECK (tipo IN (
                                   'refugio', 'habitacion', 'domo', 'camping',
                                   'salon', 'bell_tent'
                                 )),
  parent_id                    INTEGER REFERENCES espacios(id) ON DELETE RESTRICT,
  capacidad_comercial         INTEGER NOT NULL DEFAULT 0 CHECK (capacidad_comercial >= 0),
  capacidad_operativa_maxima  INTEGER NOT NULL DEFAULT 0 CHECK (capacidad_operativa_maxima >= 0),
  reservable_general          INTEGER NOT NULL DEFAULT 0 CHECK (reservable_general IN (0, 1)),
  reservable_retiro           INTEGER NOT NULL DEFAULT 0 CHECK (reservable_retiro IN (0, 1)),
  estado                       TEXT NOT NULL DEFAULT 'activo'
                                 CHECK (estado IN ('activo', 'configuracion_pendiente', 'inactivo')),
  created_at                   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at                   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (capacidad_operativa_maxima >= capacidad_comercial),
  CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE INDEX IF NOT EXISTS idx_espacios_parent ON espacios (parent_id);
CREATE INDEX IF NOT EXISTS idx_espacios_tipo_estado ON espacios (tipo, estado);

CREATE TABLE IF NOT EXISTS modalidades_espacio (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  espacio_id     INTEGER NOT NULL REFERENCES espacios(id) ON DELETE CASCADE,
  modalidad      TEXT NOT NULL CHECK (modalidad IN ('privada', 'compartida', 'camping')),
  contexto       TEXT NOT NULL CHECK (contexto IN ('general', 'retiro')),
  unidad_venta   TEXT NOT NULL CHECK (unidad_venta IN ('espacio', 'cama', 'parcela')),
  habilitada     INTEGER NOT NULL DEFAULT 1 CHECK (habilitada IN (0, 1)),
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (
    (modalidad = 'privada' AND unidad_venta = 'espacio')
    OR (modalidad = 'compartida' AND unidad_venta IN ('cama', 'espacio'))
    OR (modalidad = 'camping' AND unidad_venta = 'parcela')
  ),
  UNIQUE (espacio_id, modalidad, contexto, unidad_venta)
);

CREATE INDEX IF NOT EXISTS idx_modalidades_contexto
  ON modalidades_espacio (contexto, modalidad, habilitada);

CREATE TABLE IF NOT EXISTS unidades_inventario (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  espacio_id  INTEGER NOT NULL REFERENCES espacios(id) ON DELETE RESTRICT,
  codigo      TEXT NOT NULL UNIQUE,
  nombre      TEXT NOT NULL,
  tipo        TEXT NOT NULL
                CHECK (tipo IN (
                  'cama_simple', 'cama_doble', 'plaza_flexible',
                  'parcela', 'bell_tent'
                )),
  capacidad   INTEGER NOT NULL CHECK (capacidad > 0),
  estado      TEXT NOT NULL DEFAULT 'activa'
                CHECK (estado IN ('activa', 'mantenimiento', 'inactiva', 'configuracion_pendiente')),
  asignable   INTEGER NOT NULL DEFAULT 1 CHECK (asignable IN (0, 1)),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_unidades_espacio_estado
  ON unidades_inventario (espacio_id, estado, asignable);

CREATE TABLE IF NOT EXISTS instalaciones (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo      TEXT NOT NULL UNIQUE,
  nombre      TEXT NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('bano', 'bano_seco', 'ducha')),
  espacio_id  INTEGER REFERENCES espacios(id) ON DELETE RESTRICT,
  estado      TEXT NOT NULL DEFAULT 'activa'
                CHECK (estado IN ('activa', 'mantenimiento', 'inactiva')),
  reservable  INTEGER NOT NULL DEFAULT 0 CHECK (reservable = 0),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_instalaciones_tipo_estado
  ON instalaciones (tipo, estado);

CREATE TABLE IF NOT EXISTS reserva_estadia_espacios (
  reserva_estadia_id  INTEGER PRIMARY KEY
                       REFERENCES reserva_estadias(id) ON DELETE CASCADE,
  espacio_id          INTEGER NOT NULL REFERENCES espacios(id) ON DELETE RESTRICT,
  origen              TEXT NOT NULL DEFAULT 'mapeo_legacy'
                       CHECK (origen IN ('mapeo_legacy', 'solicitud', 'asignacion_admin')),
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_reserva_estadia_espacios_espacio
  ON reserva_estadia_espacios (espacio_id);

-- Sólo pueden habilitarse modalidades coherentes con el contexto reservable
-- del espacio. El salón queda preparado para retiros pero deshabilitado hasta
-- que WRESERV-30 autorice uno concreto.
CREATE TRIGGER IF NOT EXISTS modalidades_validar_insert
BEFORE INSERT ON modalidades_espacio
FOR EACH ROW
WHEN NEW.habilitada = 1 AND NOT EXISTS (
  SELECT 1
  FROM espacios e
  WHERE e.id = NEW.espacio_id
    AND e.estado = 'activo'
    AND e.tipo <> 'salon'
    AND (
      (NEW.contexto = 'general' AND e.reservable_general = 1)
      OR (NEW.contexto = 'retiro' AND e.reservable_retiro = 1)
    )
    AND (
      (NEW.modalidad = 'privada' AND (e.tipo IN ('domo', 'bell_tent') OR e.codigo = 'refugio-habitacion-4'))
      OR (NEW.modalidad = 'compartida' AND e.tipo IN ('refugio', 'habitacion', 'domo'))
      OR (NEW.modalidad = 'camping' AND e.tipo IN ('camping', 'bell_tent'))
    )
)
BEGIN
  SELECT RAISE(ABORT, 'modalidad no habilitada para el espacio y contexto');
END;

CREATE TRIGGER IF NOT EXISTS modalidades_validar_update
BEFORE UPDATE OF espacio_id, modalidad, contexto, unidad_venta, habilitada ON modalidades_espacio
FOR EACH ROW
WHEN NEW.habilitada = 1 AND NOT EXISTS (
  SELECT 1
  FROM espacios e
  WHERE e.id = NEW.espacio_id
    AND e.estado = 'activo'
    AND e.tipo <> 'salon'
    AND (
      (NEW.contexto = 'general' AND e.reservable_general = 1)
      OR (NEW.contexto = 'retiro' AND e.reservable_retiro = 1)
    )
    AND (
      (NEW.modalidad = 'privada' AND (e.tipo IN ('domo', 'bell_tent') OR e.codigo = 'refugio-habitacion-4'))
      OR (NEW.modalidad = 'compartida' AND e.tipo IN ('refugio', 'habitacion', 'domo'))
      OR (NEW.modalidad = 'camping' AND e.tipo IN ('camping', 'bell_tent'))
    )
)
BEGIN
  SELECT RAISE(ABORT, 'modalidad no habilitada para el espacio y contexto');
END;

CREATE TRIGGER IF NOT EXISTS unidades_validar_insert
BEFORE INSERT ON unidades_inventario
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1
  FROM espacios e
  WHERE e.id = NEW.espacio_id
    AND (
      (NEW.tipo IN ('cama_simple', 'cama_doble') AND e.tipo IN ('habitacion', 'domo', 'bell_tent'))
      OR (NEW.tipo = 'plaza_flexible' AND e.tipo = 'domo')
      OR (NEW.tipo = 'parcela' AND e.tipo = 'camping')
      OR (NEW.tipo = 'bell_tent' AND e.tipo = 'bell_tent')
    )
)
BEGIN
  SELECT RAISE(ABORT, 'tipo de unidad incompatible con el espacio');
END;

CREATE TRIGGER IF NOT EXISTS unidades_validar_update
BEFORE UPDATE OF espacio_id, tipo ON unidades_inventario
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1
  FROM espacios e
  WHERE e.id = NEW.espacio_id
    AND (
      (NEW.tipo IN ('cama_simple', 'cama_doble') AND e.tipo IN ('habitacion', 'domo', 'bell_tent'))
      OR (NEW.tipo = 'plaza_flexible' AND e.tipo = 'domo')
      OR (NEW.tipo = 'parcela' AND e.tipo = 'camping')
      OR (NEW.tipo = 'bell_tent' AND e.tipo = 'bell_tent')
    )
)
BEGIN
  SELECT RAISE(ABORT, 'tipo de unidad incompatible con el espacio');
END;

-- Integridad referencial transitoria para la columna creada en WRESERV-6.
-- SQLite no permite agregar una FK con ALTER TABLE; estos triggers aplican la
-- misma restricción hasta el rebuild controlado de asignaciones.
CREATE TRIGGER IF NOT EXISTS asignaciones_validar_unidad_insert
BEFORE INSERT ON asignaciones_inventario
FOR EACH ROW
WHEN NEW.unidad_inventario_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM unidades_inventario WHERE id = NEW.unidad_inventario_id)
BEGIN
  SELECT RAISE(ABORT, 'unidad de inventario inexistente');
END;

CREATE TRIGGER IF NOT EXISTS asignaciones_validar_unidad_update
BEFORE UPDATE OF unidad_inventario_id ON asignaciones_inventario
FOR EACH ROW
WHEN NEW.unidad_inventario_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM unidades_inventario WHERE id = NEW.unidad_inventario_id)
BEGIN
  SELECT RAISE(ABORT, 'unidad de inventario inexistente');
END;

-- Espacios conocidos. Los INSERT OR IGNORE permiten reutilizar este bloque en
-- bases de prueba sin duplicar el catálogo.
INSERT OR IGNORE INTO espacios (
  codigo, nombre, tipo, capacidad_comercial, capacidad_operativa_maxima,
  reservable_general, reservable_retiro, estado
) VALUES
  ('refugio', 'Refugio', 'refugio', 15, 15, 1, 1, 'activo'),
  ('domo-1', 'Domo 1', 'domo', 7, 10, 1, 1, 'activo'),
  ('domo-2', 'Domo 2', 'domo', 7, 10, 1, 1, 'activo'),
  ('camping-exterior', 'Camping exterior', 'camping', 0, 0, 0, 1, 'configuracion_pendiente'),
  ('salon', 'Salón', 'salon', 0, 0, 0, 1, 'activo');

INSERT OR IGNORE INTO espacios (
  codigo, nombre, tipo, parent_id, capacidad_comercial, capacidad_operativa_maxima,
  reservable_general, reservable_retiro, estado
)
SELECT 'refugio-habitacion-3', 'Habitación 3 plazas', 'habitacion', id, 3, 3, 1, 1, 'activo'
FROM espacios WHERE codigo = 'refugio';

-- Mapeo verificable entre los tres alojamientos legacy y el catálogo nuevo.
INSERT OR REPLACE INTO reserva_estadia_espacios (
  reserva_estadia_id, espacio_id, origen, created_at, updated_at
)
SELECT
  re.id,
  e.id,
  'mapeo_legacy',
  re.created_at,
  re.updated_at
FROM reserva_estadias re
JOIN espacios e ON e.codigo = CASE re.alojamiento_legacy_id
  WHEN 1 THEN 'domo-1'
  WHEN 2 THEN 'domo-2'
  WHEN 3 THEN 'refugio'
END
WHERE re.alojamiento_legacy_id IN (1, 2, 3);

CREATE TRIGGER IF NOT EXISTS reserva_estadias_mapear_espacio_insert
AFTER INSERT ON reserva_estadias
FOR EACH ROW
WHEN NEW.alojamiento_legacy_id IN (1, 2, 3)
BEGIN
  INSERT OR REPLACE INTO reserva_estadia_espacios (
    reserva_estadia_id, espacio_id, origen, created_at, updated_at
  )
  SELECT
    NEW.id,
    e.id,
    'mapeo_legacy',
    NEW.created_at,
    NEW.updated_at
  FROM espacios e
  WHERE e.codigo = CASE NEW.alojamiento_legacy_id
    WHEN 1 THEN 'domo-1'
    WHEN 2 THEN 'domo-2'
    WHEN 3 THEN 'refugio'
  END;
END;

CREATE TRIGGER IF NOT EXISTS reserva_estadias_mapear_espacio_update
AFTER UPDATE OF alojamiento_legacy_id ON reserva_estadias
FOR EACH ROW
WHEN NEW.alojamiento_legacy_id IN (1, 2, 3)
BEGIN
  INSERT OR REPLACE INTO reserva_estadia_espacios (
    reserva_estadia_id, espacio_id, origen, created_at, updated_at
  )
  SELECT
    NEW.id,
    e.id,
    'mapeo_legacy',
    OLD.created_at,
    NEW.updated_at
  FROM espacios e
  WHERE e.codigo = CASE NEW.alojamiento_legacy_id
    WHEN 1 THEN 'domo-1'
    WHEN 2 THEN 'domo-2'
    WHEN 3 THEN 'refugio'
  END;
END;

INSERT OR IGNORE INTO espacios (
  codigo, nombre, tipo, parent_id, capacidad_comercial, capacidad_operativa_maxima,
  reservable_general, reservable_retiro, estado
)
SELECT 'refugio-habitacion-4', 'Habitación 4 plazas', 'habitacion', id, 4, 4, 1, 1, 'activo'
FROM espacios WHERE codigo = 'refugio';

INSERT OR IGNORE INTO espacios (
  codigo, nombre, tipo, parent_id, capacidad_comercial, capacidad_operativa_maxima,
  reservable_general, reservable_retiro, estado
)
SELECT 'refugio-habitacion-8', 'Habitación 8 plazas', 'habitacion', id, 8, 8, 1, 1, 'activo'
FROM espacios WHERE codigo = 'refugio';

-- Modalidades de venta válidas.
INSERT OR IGNORE INTO modalidades_espacio (espacio_id, modalidad, contexto, unidad_venta, habilitada)
SELECT id, 'compartida', 'general', 'cama', 1
FROM espacios WHERE codigo IN (
  'refugio', 'refugio-habitacion-3', 'refugio-habitacion-4', 'refugio-habitacion-8'
);

INSERT OR IGNORE INTO modalidades_espacio (espacio_id, modalidad, contexto, unidad_venta, habilitada)
SELECT id, 'privada', 'general', 'espacio', 1
FROM espacios WHERE codigo = 'refugio-habitacion-4';

INSERT OR IGNORE INTO modalidades_espacio (espacio_id, modalidad, contexto, unidad_venta, habilitada)
SELECT id, 'privada', 'general', 'espacio', 1
FROM espacios WHERE codigo IN ('domo-1', 'domo-2');

INSERT OR IGNORE INTO modalidades_espacio (espacio_id, modalidad, contexto, unidad_venta, habilitada)
SELECT id, 'compartida', 'general', 'cama', 1
FROM espacios WHERE codigo IN ('domo-1', 'domo-2');

INSERT OR IGNORE INTO modalidades_espacio (espacio_id, modalidad, contexto, unidad_venta, habilitada)
SELECT id, 'camping', 'general', 'parcela', 0
FROM espacios WHERE codigo = 'camping-exterior';

INSERT OR IGNORE INTO modalidades_espacio (espacio_id, modalidad, contexto, unidad_venta, habilitada)
SELECT id, 'compartida', 'retiro', 'espacio', 0
FROM espacios WHERE codigo = 'salon';

-- Camas simples confirmadas del refugio: 3 + 4 + 8.
WITH RECURSIVE numeros(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM numeros WHERE n < 8
)
INSERT OR IGNORE INTO unidades_inventario (
  espacio_id, codigo, nombre, tipo, capacidad, estado, asignable
)
SELECT
  e.id,
  printf('%s-cama-%02d', e.codigo, numeros.n),
  printf('Cama %d', numeros.n),
  'cama_simple',
  1,
  'activa',
  1
FROM espacios e
JOIN numeros ON numeros.n <= e.capacidad_comercial
WHERE e.codigo IN ('refugio-habitacion-3', 'refugio-habitacion-4', 'refugio-habitacion-8');

-- En los domos sólo está confirmada la venta normal de siete plazas. Se
-- representan como plazas flexibles hasta relevar la composición simple/doble.
WITH RECURSIVE numeros(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM numeros WHERE n < 7
)
INSERT OR IGNORE INTO unidades_inventario (
  espacio_id, codigo, nombre, tipo, capacidad, estado, asignable
)
SELECT
  e.id,
  printf('%s-plaza-%02d', e.codigo, numeros.n),
  printf('Plaza flexible %d', numeros.n),
  'plaza_flexible',
  1,
  'activa',
  1
FROM espacios e
CROSS JOIN numeros
WHERE e.codigo IN ('domo-1', 'domo-2');

-- Instalaciones compartidas, siempre fuera del inventario asignable.
INSERT OR IGNORE INTO instalaciones (codigo, nombre, tipo, espacio_id)
SELECT 'refugio-bano-01', 'Baño del refugio', 'bano', id
FROM espacios WHERE codigo = 'refugio';

WITH RECURSIVE numeros(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM numeros WHERE n < 8
)
INSERT OR IGNORE INTO instalaciones (codigo, nombre, tipo)
SELECT printf('exterior-bano-seco-%02d', n), printf('Baño seco exterior %d', n), 'bano_seco'
FROM numeros;

WITH RECURSIVE numeros(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM numeros WHERE n < 6
)
INSERT OR IGNORE INTO instalaciones (codigo, nombre, tipo)
SELECT printf('exterior-ducha-%02d', n), printf('Ducha exterior %d', n), 'ducha'
FROM numeros;

INSERT OR IGNORE INTO schema_migrations (version, descripcion, checksum_ref)
VALUES (
  '0003',
  'espacios, modalidades, inventario físico e instalaciones compartidas',
  'migrations/0003_accommodation_inventory.sql'
);
