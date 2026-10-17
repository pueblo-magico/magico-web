-- Guest-facing utilities and limitations are commercial facts by accommodation
-- type. They are separate from physical facilities and availability so an
-- administrator can communicate inclusions without changing inventory.
CREATE TABLE servicios_alojamiento (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo_alojamiento   TEXT NOT NULL CHECK (tipo_alojamiento IN ('domo', 'refugio', 'camping', 'bell_tent')),
  codigo             TEXT NOT NULL,
  nombre             TEXT NOT NULL,
  disponibilidad     TEXT NOT NULL CHECK (disponibilidad IN ('incluido', 'no_disponible')),
  detalle            TEXT NOT NULL DEFAULT '',
  visible_en_reserva INTEGER NOT NULL DEFAULT 1 CHECK (visible_en_reserva IN (0, 1)),
  orden              INTEGER NOT NULL DEFAULT 0 CHECK (orden BETWEEN 0 AND 999),
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tipo_alojamiento, codigo)
);

CREATE INDEX idx_servicios_alojamiento_publicos
  ON servicios_alojamiento (tipo_alojamiento, visible_en_reserva, orden, id);

INSERT INTO servicios_alojamiento (
  tipo_alojamiento, codigo, nombre, disponibilidad, detalle, orden
) VALUES
  ('refugio', 'wifi-satelital', 'Wi-Fi satelital', 'incluido', 'Disponible en el Refugio.', 10),
  ('refugio', 'agua-caliente', 'Agua caliente', 'incluido', '', 20),
  ('refugio', 'electricidad-solar', 'Electricidad solar', 'incluido', '', 30),
  ('refugio', 'sanitarios-compartidos', 'Baños secos y duchas compartidos', 'incluido', 'Las instalaciones compartidas están en el exterior.', 40),
  ('refugio', 'bano-privado', 'Baño privado', 'no_disponible', 'No hay baños privados.', 50),
  ('domo', 'agua-caliente', 'Agua caliente', 'incluido', 'Disponible en las duchas exteriores compartidas.', 10),
  ('domo', 'sanitarios-compartidos', 'Baños secos y duchas compartidos', 'incluido', 'Las instalaciones están fuera de los domos.', 20),
  ('domo', 'bano-privado', 'Baño privado', 'no_disponible', 'No hay baños privados.', 30),
  ('domo', 'electricidad-alojamiento', 'Electricidad en el domo', 'no_disponible', 'Los domos no tienen electricidad.', 40),
  ('camping', 'agua-caliente', 'Agua caliente', 'incluido', 'Disponible en las duchas exteriores compartidas.', 10),
  ('camping', 'sanitarios-compartidos', 'Baños secos y duchas compartidos', 'incluido', 'Las instalaciones están fuera del área de camping.', 20),
  ('camping', 'bano-privado', 'Baño privado', 'no_disponible', 'No hay baños privados.', 30),
  ('camping', 'electricidad-alojamiento', 'Electricidad en el área de camping', 'no_disponible', 'El área de camping no tiene electricidad.', 40);

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0034', 'servicios y limitaciones visibles por alojamiento',
        'migrations/0034_accommodation_guest_utilities.sql');
