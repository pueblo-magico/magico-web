-- Configurable guest choices that affect preparation but not price or physical
-- inventory. The selected label is snapshotted on the reservation so later
-- configuration changes do not rewrite an existing guest request.
CREATE TABLE opciones_preparacion_estadia (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo_alojamiento   TEXT NOT NULL CHECK (tipo_alojamiento IN ('domo', 'refugio', 'camping', 'bell_tent')),
  modalidad          TEXT NOT NULL CHECK (modalidad IN ('privada', 'compartida', 'camping')),
  cantidad_personas  INTEGER NOT NULL CHECK (cantidad_personas BETWEEN 1 AND 20),
  codigo             TEXT NOT NULL,
  nombre             TEXT NOT NULL,
  descripcion        TEXT NOT NULL DEFAULT '',
  habilitada         INTEGER NOT NULL DEFAULT 1 CHECK (habilitada IN (0, 1)),
  orden              INTEGER NOT NULL DEFAULT 0 CHECK (orden BETWEEN 0 AND 999),
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tipo_alojamiento, modalidad, cantidad_personas, codigo)
);

CREATE INDEX idx_opciones_preparacion_publicas
  ON opciones_preparacion_estadia (
    tipo_alojamiento, modalidad, cantidad_personas, habilitada, orden, id
  );

CREATE TABLE reserva_preferencias (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  reserva_id         INTEGER NOT NULL REFERENCES reservas(id) ON DELETE RESTRICT,
  categoria          TEXT NOT NULL CHECK (categoria IN ('preparacion_cama')),
  opcion_codigo      TEXT NOT NULL,
  opcion_nombre      TEXT NOT NULL,
  opcion_descripcion TEXT NOT NULL DEFAULT '',
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (reserva_id, categoria)
);

CREATE INDEX idx_reserva_preferencias_reserva
  ON reserva_preferencias (reserva_id, categoria);

INSERT INTO opciones_preparacion_estadia (
  tipo_alojamiento, modalidad, cantidad_personas, codigo, nombre, descripcion, orden
) VALUES
  ('domo', 'privada', 2, 'cama_doble', '1 cama doble',
   'Prepararemos el domo con una cama doble.', 10),
  ('domo', 'privada', 2, 'dos_camas_simples', '2 camas simples',
   'Prepararemos el domo con dos camas individuales.', 20);

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0035', 'preferencias configurables de preparación de estadía',
        'migrations/0035_stay_preparation_preferences.sql');
