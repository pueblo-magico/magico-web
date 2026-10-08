-- WRESERV-2 / WRESERV-25: tarifas versionadas y snapshots de cotización.

CREATE TABLE planes_tarifa (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo      TEXT NOT NULL,
  nombre      TEXT NOT NULL,
  moneda      TEXT NOT NULL CHECK (length(moneda) = 3 AND moneda = upper(moneda)),
  version     INTEGER NOT NULL CHECK (version >= 1),
  estado      TEXT NOT NULL CHECK (estado IN ('borrador', 'publicado', 'retirado')),
  publicado_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (estado <> 'publicado' OR publicado_at IS NOT NULL),
  UNIQUE (codigo, version)
);

CREATE UNIQUE INDEX idx_plan_tarifa_publicado
  ON planes_tarifa (codigo)
  WHERE estado = 'publicado';

CREATE TABLE temporadas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_tarifa_id INTEGER NOT NULL REFERENCES planes_tarifa(id) ON DELETE RESTRICT,
  codigo        TEXT NOT NULL,
  nombre        TEXT NOT NULL,
  fecha_desde   TEXT NOT NULL,
  fecha_hasta   TEXT NOT NULL,
  prioridad     INTEGER NOT NULL DEFAULT 0,
  CHECK (fecha_hasta >= fecha_desde),
  UNIQUE (plan_tarifa_id, codigo)
);

CREATE INDEX idx_temporadas_vigencia
  ON temporadas (plan_tarifa_id, fecha_desde, fecha_hasta, prioridad);

CREATE TABLE reglas_precio (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  temporada_id          INTEGER NOT NULL REFERENCES temporadas(id) ON DELETE RESTRICT,
  tipo_alojamiento      TEXT NOT NULL CHECK (tipo_alojamiento IN ('domo', 'refugio', 'camping', 'bell_tent')),
  modalidad             TEXT NOT NULL DEFAULT 'cualquiera'
                            CHECK (modalidad IN ('cualquiera', 'privada', 'compartida', 'camping')),
  ocupacion_min         INTEGER NOT NULL CHECK (ocupacion_min > 0),
  ocupacion_max         INTEGER NOT NULL CHECK (ocupacion_max >= ocupacion_min),
  base_calculo          TEXT NOT NULL CHECK (base_calculo IN ('unidad_noche', 'persona_noche')),
  importe_centavos      INTEGER NOT NULL CHECK (importe_centavos >= 0),
  exclusividad_desde    INTEGER CHECK (exclusividad_desde IS NULL OR exclusividad_desde > 0),
  exclusividad_hasta    INTEGER CHECK (exclusividad_hasta IS NULL OR exclusividad_hasta >= exclusividad_desde),
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (temporada_id, tipo_alojamiento, modalidad, ocupacion_min, ocupacion_max)
);

CREATE TABLE reglas_sena (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_tarifa_id        INTEGER NOT NULL REFERENCES planes_tarifa(id) ON DELETE RESTRICT,
  subtotal_desde_centavos INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_desde_centavos >= 0),
  subtotal_hasta_centavos INTEGER CHECK (
                            subtotal_hasta_centavos IS NULL OR
                            subtotal_hasta_centavos >= subtotal_desde_centavos
                          ),
  tipo                  TEXT NOT NULL CHECK (tipo IN ('porcentaje_bps', 'importe_fijo')),
  valor                 INTEGER NOT NULL CHECK (valor >= 0),
  CHECK (tipo <> 'porcentaje_bps' OR valor <= 10000),
  UNIQUE (plan_tarifa_id, subtotal_desde_centavos, subtotal_hasta_centavos)
);

CREATE TABLE cotizaciones (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo                TEXT NOT NULL UNIQUE,
  plan_tarifa_id        INTEGER NOT NULL REFERENCES planes_tarifa(id) ON DELETE RESTRICT,
  plan_codigo           TEXT NOT NULL,
  plan_version          INTEGER NOT NULL CHECK (plan_version >= 1),
  moneda                TEXT NOT NULL CHECK (length(moneda) = 3 AND moneda = upper(moneda)),
  fecha_checkin         TEXT NOT NULL,
  fecha_checkout        TEXT NOT NULL,
  cantidad_personas     INTEGER NOT NULL CHECK (cantidad_personas > 0),
  subtotal_centavos     INTEGER NOT NULL CHECK (subtotal_centavos >= 0),
  sena_centavos         INTEGER NOT NULL CHECK (sena_centavos >= 0 AND sena_centavos <= subtotal_centavos),
  total_centavos        INTEGER NOT NULL CHECK (total_centavos = subtotal_centavos),
  desglose_json         TEXT NOT NULL CHECK (json_valid(desglose_json)),
  request_hash          TEXT NOT NULL,
  expires_at            TEXT NOT NULL,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (fecha_checkout > fecha_checkin)
);

CREATE INDEX idx_cotizaciones_expiracion ON cotizaciones (expires_at);
CREATE INDEX idx_cotizaciones_request_hash ON cotizaciones (request_hash, created_at);

ALTER TABLE reservas ADD COLUMN cotizacion_id INTEGER REFERENCES cotizaciones(id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX idx_reservas_cotizacion ON reservas (cotizacion_id) WHERE cotizacion_id IS NOT NULL;

-- Una versión publicada es evidencia comercial inmutable. Los cambios se
-- realizan creando una versión nueva en borrador y publicándola.
CREATE TRIGGER planes_tarifa_publicados_inmutables_update
BEFORE UPDATE ON planes_tarifa
WHEN OLD.estado = 'publicado' AND (
  NEW.estado <> 'retirado'
  OR NEW.codigo IS NOT OLD.codigo
  OR NEW.nombre IS NOT OLD.nombre
  OR NEW.moneda IS NOT OLD.moneda
  OR NEW.version IS NOT OLD.version
  OR NEW.publicado_at IS NOT OLD.publicado_at
  OR NEW.created_at IS NOT OLD.created_at
)
BEGIN
  SELECT RAISE(ABORT, 'published rate plans are immutable');
END;

CREATE TRIGGER planes_tarifa_publicados_inmutables_delete
BEFORE DELETE ON planes_tarifa
WHEN OLD.estado = 'publicado'
BEGIN
  SELECT RAISE(ABORT, 'published rate plans are immutable');
END;

INSERT INTO planes_tarifa (codigo, nombre, moneda, version, estado, publicado_at)
VALUES ('alojamiento-base', 'Tarifa vigente migrada', 'ARS', 1, 'publicado', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

INSERT INTO temporadas (plan_tarifa_id, codigo, nombre, fecha_desde, fecha_hasta, prioridad)
SELECT id, 'base', 'Vigencia base migrada', '2000-01-01', '2099-12-31', 0
FROM planes_tarifa WHERE codigo = 'alojamiento-base' AND version = 1;

INSERT INTO reglas_precio (
  temporada_id, tipo_alojamiento, modalidad, ocupacion_min, ocupacion_max,
  base_calculo, importe_centavos, exclusividad_desde, exclusividad_hasta
)
SELECT t.id, v.tipo, 'cualquiera', v.ocupacion_min, v.ocupacion_max,
       v.base_calculo, v.importe_centavos, v.exclusividad_desde, v.exclusividad_hasta
FROM temporadas t
JOIN (
  SELECT 'domo' tipo, 1 ocupacion_min, 1 ocupacion_max, 'unidad_noche' base_calculo, 15000000 importe_centavos, NULL exclusividad_desde, NULL exclusividad_hasta
  UNION ALL SELECT 'domo', 2, 2, 'unidad_noche', 7500000, NULL, NULL
  UNION ALL SELECT 'domo', 3, 5, 'persona_noche', 6500000, NULL, NULL
  UNION ALL SELECT 'domo', 6, 7, 'persona_noche', 5000000, 6, 7
  UNION ALL SELECT 'refugio', 1, 15, 'persona_noche', 3500000, 3, 7
) v
WHERE t.codigo = 'base';

INSERT INTO reglas_sena (
  plan_tarifa_id, subtotal_desde_centavos, subtotal_hasta_centavos, tipo, valor
)
SELECT id, 0, 10000000, 'porcentaje_bps', 5000
FROM planes_tarifa WHERE codigo = 'alojamiento-base' AND version = 1
UNION ALL
SELECT id, 10000001, NULL, 'porcentaje_bps', 3000
FROM planes_tarifa WHERE codigo = 'alojamiento-base' AND version = 1;

CREATE TRIGGER temporadas_plan_publicado_insert
BEFORE INSERT ON temporadas
WHEN EXISTS (SELECT 1 FROM planes_tarifa p WHERE p.id = NEW.plan_tarifa_id AND p.estado = 'publicado')
BEGIN SELECT RAISE(ABORT, 'published rate plan children are immutable'); END;
CREATE TRIGGER temporadas_plan_publicado_update
BEFORE UPDATE ON temporadas
WHEN EXISTS (SELECT 1 FROM planes_tarifa p WHERE p.id = OLD.plan_tarifa_id AND p.estado = 'publicado')
BEGIN SELECT RAISE(ABORT, 'published rate plan children are immutable'); END;
CREATE TRIGGER temporadas_plan_publicado_delete
BEFORE DELETE ON temporadas
WHEN EXISTS (SELECT 1 FROM planes_tarifa p WHERE p.id = OLD.plan_tarifa_id AND p.estado = 'publicado')
BEGIN SELECT RAISE(ABORT, 'published rate plan children are immutable'); END;

CREATE TRIGGER reglas_precio_plan_publicado_insert
BEFORE INSERT ON reglas_precio
WHEN EXISTS (
  SELECT 1 FROM temporadas t JOIN planes_tarifa p ON p.id = t.plan_tarifa_id
  WHERE t.id = NEW.temporada_id AND p.estado = 'publicado'
)
BEGIN SELECT RAISE(ABORT, 'published rate plan children are immutable'); END;
CREATE TRIGGER reglas_precio_plan_publicado_update
BEFORE UPDATE ON reglas_precio
WHEN EXISTS (
  SELECT 1 FROM temporadas t JOIN planes_tarifa p ON p.id = t.plan_tarifa_id
  WHERE t.id = OLD.temporada_id AND p.estado = 'publicado'
)
BEGIN SELECT RAISE(ABORT, 'published rate plan children are immutable'); END;
CREATE TRIGGER reglas_precio_plan_publicado_delete
BEFORE DELETE ON reglas_precio
WHEN EXISTS (
  SELECT 1 FROM temporadas t JOIN planes_tarifa p ON p.id = t.plan_tarifa_id
  WHERE t.id = OLD.temporada_id AND p.estado = 'publicado'
)
BEGIN SELECT RAISE(ABORT, 'published rate plan children are immutable'); END;

CREATE TRIGGER reglas_sena_plan_publicado_insert
BEFORE INSERT ON reglas_sena
WHEN EXISTS (SELECT 1 FROM planes_tarifa p WHERE p.id = NEW.plan_tarifa_id AND p.estado = 'publicado')
BEGIN SELECT RAISE(ABORT, 'published rate plan children are immutable'); END;
CREATE TRIGGER reglas_sena_plan_publicado_update
BEFORE UPDATE ON reglas_sena
WHEN EXISTS (SELECT 1 FROM planes_tarifa p WHERE p.id = OLD.plan_tarifa_id AND p.estado = 'publicado')
BEGIN SELECT RAISE(ABORT, 'published rate plan children are immutable'); END;
CREATE TRIGGER reglas_sena_plan_publicado_delete
BEFORE DELETE ON reglas_sena
WHEN EXISTS (SELECT 1 FROM planes_tarifa p WHERE p.id = OLD.plan_tarifa_id AND p.estado = 'publicado')
BEGIN SELECT RAISE(ABORT, 'published rate plan children are immutable'); END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0006', 'tarifas versionadas y snapshots de cotización', 'migrations/0006_pricing_plans_quotes.sql');
