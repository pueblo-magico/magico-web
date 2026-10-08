-- Baseline schema for automated Cloudflare D1 deployments.
-- Keep this migration idempotent so it can safely adopt an existing database.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS alojamientos (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre           TEXT NOT NULL,
  tipo             TEXT NOT NULL,
  capacidad_total  INTEGER NOT NULL CHECK (capacidad_total > 0)
);

INSERT INTO alojamientos (id, nombre, tipo, capacidad_total)
SELECT 1, 'Domo 1', 'domo', 7
WHERE NOT EXISTS (SELECT 1 FROM alojamientos WHERE id = 1);

INSERT INTO alojamientos (id, nombre, tipo, capacidad_total)
SELECT 2, 'Domo 2', 'domo', 7
WHERE NOT EXISTS (SELECT 1 FROM alojamientos WHERE id = 2);

INSERT INTO alojamientos (id, nombre, tipo, capacidad_total)
SELECT 3, 'Refugio', 'refugio', 15
WHERE NOT EXISTS (SELECT 1 FROM alojamientos WHERE id = 3);

CREATE TABLE IF NOT EXISTS reservas (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_nombre     TEXT NOT NULL,
  cliente_telefono   TEXT,
  cliente_email      TEXT,
  alojamiento_id     INTEGER NOT NULL REFERENCES alojamientos(id),
  fecha_checkin      TEXT NOT NULL,
  fecha_checkout     TEXT NOT NULL,
  cantidad_personas  INTEGER NOT NULL CHECK (cantidad_personas > 0),
  monto_total        REAL NOT NULL,
  monto_sena         REAL,
  estado             TEXT NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente', 'confirmada', 'cancelada')),
  mp_preference_id   TEXT,
  mp_payment_id      TEXT,
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  manychat_user_id   TEXT,
  unidad_asignada    TEXT,
  canal_origen       TEXT,
  ical_uid           TEXT,
  tipo_estadia       TEXT NOT NULL DEFAULT 'huesped'
                        CHECK (tipo_estadia IN ('huesped', 'staff', 'voluntario', 'residente')),
  CHECK (fecha_checkout > fecha_checkin)
);

CREATE INDEX IF NOT EXISTS idx_reservas_alojamiento_fechas
  ON reservas (alojamiento_id, fecha_checkin, fecha_checkout);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas (estado);
CREATE INDEX IF NOT EXISTS idx_reservas_mp_preference_id ON reservas (mp_preference_id);
CREATE INDEX IF NOT EXISTS idx_reservas_mp_payment_id ON reservas (mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_reservas_manychat_user_id ON reservas (manychat_user_id);
CREATE INDEX IF NOT EXISTS idx_reservas_ical_uid ON reservas (ical_uid);

CREATE TABLE IF NOT EXISTS usuarios_admin (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  email              TEXT NOT NULL UNIQUE,
  password_hash      TEXT NOT NULL,
  rol                TEXT NOT NULL DEFAULT 'editor'
                        CHECK (rol IN ('super_admin', 'editor', 'viewer')),
  activo             INTEGER NOT NULL DEFAULT 1,
  intentos_fallidos  INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta    TEXT,
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_usuarios_admin_email ON usuarios_admin (email);

CREATE TABLE IF NOT EXISTS auditoria_admin (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL,
  accion      TEXT NOT NULL,
  detalle     TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_auditoria_admin_created_at
  ON auditoria_admin (created_at);

CREATE TABLE IF NOT EXISTS consultas (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_nombre       TEXT NOT NULL,
  cliente_telefono     TEXT,
  alojamiento_interes  TEXT,
  fecha_desde          TEXT,
  fecha_hasta          TEXT,
  cantidad_personas    INTEGER,
  monto_estimado       REAL,
  subscriber_id        TEXT,
  fecha_consulta       TEXT NOT NULL,
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_consultas_fecha_consulta
  ON consultas (fecha_consulta);
CREATE INDEX IF NOT EXISTS idx_consultas_subscriber_id ON consultas (subscriber_id);
