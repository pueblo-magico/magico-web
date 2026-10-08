-- WRESERV-2 / WRESERV-31: dos regímenes de alimentación y snapshot comercial.

CREATE TABLE tarifas_alimentacion (
  id                                      INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo                                  TEXT NOT NULL
                                            CHECK (codigo IN ('desayuno_incluido', 'pension_completa')),
  moneda                                  TEXT NOT NULL
                                            CHECK (length(moneda) = 3 AND moneda = upper(moneda)),
  version                                 INTEGER NOT NULL CHECK (version >= 1),
  precio_comida_centavos                  INTEGER NOT NULL CHECK (precio_comida_centavos >= 0),
  comidas_adicionales_por_persona_noche   INTEGER NOT NULL
                                            CHECK (comidas_adicionales_por_persona_noche IN (0, 2)),
  estado                                  TEXT NOT NULL
                                            CHECK (estado IN ('borrador', 'publicado', 'retirado')),
  publicado_at                            TEXT,
  created_at                              TEXT NOT NULL
                                            DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (estado <> 'publicado' OR publicado_at IS NOT NULL),
  CHECK (
    (codigo = 'desayuno_incluido' AND comidas_adicionales_por_persona_noche = 0) OR
    (codigo = 'pension_completa' AND comidas_adicionales_por_persona_noche = 2)
  ),
  UNIQUE (codigo, version)
);

CREATE UNIQUE INDEX idx_tarifa_alimentacion_publicada
  ON tarifas_alimentacion (codigo)
  WHERE estado = 'publicado';

INSERT INTO tarifas_alimentacion (
  codigo, moneda, version, precio_comida_centavos,
  comidas_adicionales_por_persona_noche, estado, publicado_at
) VALUES
  ('desayuno_incluido', 'ARS', 1, 2000000, 0, 'publicado', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('pension_completa', 'ARS', 1, 2000000, 2, 'publicado', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

ALTER TABLE cotizaciones ADD COLUMN alojamiento_centavos INTEGER NOT NULL DEFAULT 0
  CHECK (alojamiento_centavos >= 0);
ALTER TABLE cotizaciones ADD COLUMN alimentacion_centavos INTEGER NOT NULL DEFAULT 0
  CHECK (alimentacion_centavos >= 0);
ALTER TABLE cotizaciones ADD COLUMN regimen_alimentacion TEXT NOT NULL DEFAULT 'desayuno_incluido'
  CHECK (regimen_alimentacion IN ('desayuno_incluido', 'pension_completa'));
ALTER TABLE cotizaciones ADD COLUMN tarifa_alimentacion_version INTEGER NOT NULL DEFAULT 1
  CHECK (tarifa_alimentacion_version >= 1);

UPDATE cotizaciones SET alojamiento_centavos = subtotal_centavos
WHERE alojamiento_centavos = 0 AND subtotal_centavos > 0;

CREATE TRIGGER cotizaciones_importes_componentes_insert
BEFORE INSERT ON cotizaciones
WHEN NEW.subtotal_centavos <> NEW.alojamiento_centavos + NEW.alimentacion_centavos
BEGIN
  SELECT RAISE(ABORT, 'quote components must equal subtotal');
END;

CREATE TRIGGER cotizaciones_importes_componentes_update
BEFORE UPDATE ON cotizaciones
WHEN NEW.subtotal_centavos <> NEW.alojamiento_centavos + NEW.alimentacion_centavos
BEGIN
  SELECT RAISE(ABORT, 'quote components must equal subtotal');
END;

CREATE TRIGGER tarifas_alimentacion_publicadas_inmutables_update
BEFORE UPDATE ON tarifas_alimentacion
WHEN OLD.estado = 'publicado' AND (
  NEW.estado <> 'retirado'
  OR NEW.codigo IS NOT OLD.codigo
  OR NEW.moneda IS NOT OLD.moneda
  OR NEW.version IS NOT OLD.version
  OR NEW.precio_comida_centavos IS NOT OLD.precio_comida_centavos
  OR NEW.comidas_adicionales_por_persona_noche IS NOT OLD.comidas_adicionales_por_persona_noche
  OR NEW.publicado_at IS NOT OLD.publicado_at
  OR NEW.created_at IS NOT OLD.created_at
)
BEGIN
  SELECT RAISE(ABORT, 'published food rates are immutable');
END;

CREATE TRIGGER tarifas_alimentacion_publicadas_inmutables_delete
BEFORE DELETE ON tarifas_alimentacion
WHEN OLD.estado = 'publicado'
BEGIN
  SELECT RAISE(ABORT, 'published food rates are immutable');
END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0008', 'regímenes de alimentación y snapshots de cotización',
        'migrations/0008_food_rates_and_quote_snapshots.sql');
