-- WRESERV-1 / WRESERV-6
-- Normaliza el núcleo de reservas sin retirar columnas ni contratos legacy.
-- Wrangler registra y aplica este archivo una sola vez dentro de una migración
-- D1 atómica. Cualquier fallo en los guards iniciales revierte el archivo.

PRAGMA foreign_keys = ON;

-- Preflight bloqueante. Los SELECT de diagnóstico detallado viven en
-- scripts/reservas/preflight-migracion.sql; estos guards evitan un backfill
-- parcial si la base tiene drift o datos ambiguos.
CREATE TABLE __wreserv_0002_guard (
  ok INTEGER NOT NULL CHECK (ok = 1)
);

INSERT INTO __wreserv_0002_guard (ok)
SELECT CASE WHEN COUNT(*) = 5 THEN 1 ELSE 0 END
FROM sqlite_schema
WHERE type = 'table'
  AND name IN ('alojamientos', 'reservas', 'consultas', 'usuarios_admin', 'auditoria_admin');

INSERT INTO __wreserv_0002_guard (ok)
SELECT CASE WHEN COUNT(*) = 19 THEN 1 ELSE 0 END
FROM pragma_table_info('reservas')
WHERE name IN (
  'id', 'cliente_nombre', 'cliente_telefono', 'cliente_email',
  'alojamiento_id', 'fecha_checkin', 'fecha_checkout', 'cantidad_personas',
  'monto_total', 'monto_sena', 'estado', 'mp_preference_id', 'mp_payment_id',
  'created_at', 'manychat_user_id', 'unidad_asignada', 'canal_origen',
  'ical_uid', 'tipo_estadia'
);

INSERT INTO __wreserv_0002_guard (ok)
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM reservas r
  LEFT JOIN alojamientos a ON a.id = r.alojamiento_id
  WHERE a.id IS NULL
     OR r.fecha_checkout <= r.fecha_checkin
     OR r.cantidad_personas < 1
     OR r.monto_total < 0
     OR COALESCE(r.monto_sena, 0) < 0
) THEN 1 ELSE 0 END;

INSERT INTO __wreserv_0002_guard (ok)
SELECT CASE WHEN NOT EXISTS (
  SELECT mp_preference_id
  FROM reservas
  WHERE mp_preference_id IS NOT NULL AND trim(mp_preference_id) <> ''
  GROUP BY mp_preference_id
  HAVING COUNT(*) > 1
) THEN 1 ELSE 0 END;

INSERT INTO __wreserv_0002_guard (ok)
SELECT CASE WHEN NOT EXISTS (
  SELECT mp_payment_id
  FROM reservas
  WHERE mp_payment_id IS NOT NULL AND trim(mp_payment_id) <> ''
  GROUP BY mp_payment_id
  HAVING COUNT(*) > 1
) THEN 1 ELSE 0 END;

INSERT INTO __wreserv_0002_guard (ok)
SELECT CASE WHEN NOT EXISTS (
  SELECT ical_uid
  FROM reservas
  WHERE ical_uid IS NOT NULL AND trim(ical_uid) <> ''
  GROUP BY ical_uid
  HAVING COUNT(*) > 1
) THEN 1 ELSE 0 END;

DROP TABLE __wreserv_0002_guard;

-- Evolución aditiva de reservas. Los identificadores derivados de filas
-- legacy son deterministas; los casos de uso nuevos podrán generar IDs opacos.
ALTER TABLE reservas ADD COLUMN reserva_uid TEXT;
ALTER TABLE reservas ADD COLUMN codigo TEXT;
ALTER TABLE reservas ADD COLUMN moneda TEXT NOT NULL DEFAULT 'ARS'
  CHECK (length(moneda) = 3 AND moneda = upper(moneda));
ALTER TABLE reservas ADD COLUMN monto_total_centavos INTEGER
  CHECK (monto_total_centavos IS NULL OR monto_total_centavos >= 0);
ALTER TABLE reservas ADD COLUMN monto_sena_centavos INTEGER
  CHECK (monto_sena_centavos IS NULL OR monto_sena_centavos >= 0);
ALTER TABLE reservas ADD COLUMN updated_at TEXT;
ALTER TABLE reservas ADD COLUMN version INTEGER NOT NULL DEFAULT 1
  CHECK (version >= 1);

UPDATE reservas
SET reserva_uid = printf('legacy-%012d', id),
    codigo = printf('RES-%08d', id),
    monto_total_centavos = CAST(round(monto_total * 100) AS INTEGER),
    monto_sena_centavos = CASE
      WHEN monto_sena IS NULL THEN NULL
      ELSE CAST(round(monto_sena * 100) AS INTEGER)
    END,
    updated_at = COALESCE(created_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

CREATE UNIQUE INDEX idx_reservas_reserva_uid ON reservas (reserva_uid);
CREATE UNIQUE INDEX idx_reservas_codigo ON reservas (codigo);
CREATE UNIQUE INDEX idx_reservas_mp_preference_unique
  ON reservas (mp_preference_id)
  WHERE mp_preference_id IS NOT NULL AND trim(mp_preference_id) <> '';
CREATE UNIQUE INDEX idx_reservas_mp_payment_unique
  ON reservas (mp_payment_id)
  WHERE mp_payment_id IS NOT NULL AND trim(mp_payment_id) <> '';
CREATE UNIQUE INDEX idx_reservas_ical_uid_unique
  ON reservas (ical_uid)
  WHERE ical_uid IS NOT NULL AND trim(ical_uid) <> '';
CREATE INDEX idx_reservas_estado_created_at ON reservas (estado, created_at);
CREATE INDEX idx_reservas_canal_created_at ON reservas (canal_origen, created_at);

-- Mantiene completas las filas creadas temporalmente por consumidores legacy.
CREATE TRIGGER reservas_normalizar_insert_legacy
AFTER INSERT ON reservas
FOR EACH ROW
WHEN NEW.reserva_uid IS NULL
  OR NEW.codigo IS NULL
  OR NEW.monto_total_centavos IS NULL
  OR NEW.updated_at IS NULL
BEGIN
  UPDATE reservas
  SET reserva_uid = COALESCE(reserva_uid, printf('legacy-%012d', id)),
      codigo = COALESCE(codigo, printf('RES-%08d', id)),
      monto_total_centavos = COALESCE(
        monto_total_centavos,
        CAST(round(monto_total * 100) AS INTEGER)
      ),
      monto_sena_centavos = CASE
        WHEN monto_sena_centavos IS NOT NULL THEN monto_sena_centavos
        WHEN monto_sena IS NULL THEN NULL
        ELSE CAST(round(monto_sena * 100) AS INTEGER)
      END,
      updated_at = COALESCE(updated_at, created_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  WHERE id = NEW.id;
END;

CREATE TRIGGER reservas_actualizar_timestamp
AFTER UPDATE ON reservas
FOR EACH ROW
WHEN NEW.updated_at IS OLD.updated_at
BEGIN
  UPDATE reservas
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
      version = OLD.version + 1
  WHERE id = NEW.id;
END;

-- Una reserva puede tener varios tramos de estadía. Durante la convivencia,
-- alojamiento_legacy_id conserva el vínculo verificable al modelo anterior.
CREATE TABLE reserva_estadias (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  reserva_id              INTEGER NOT NULL REFERENCES reservas(id) ON DELETE RESTRICT,
  tramo                   INTEGER NOT NULL DEFAULT 1 CHECK (tramo >= 1),
  fecha_checkin           TEXT NOT NULL,
  fecha_checkout          TEXT NOT NULL,
  cantidad_huespedes      INTEGER NOT NULL CHECK (cantidad_huespedes > 0),
  modalidad               TEXT NOT NULL DEFAULT 'sin_definir'
                            CHECK (modalidad IN ('sin_definir', 'privada', 'compartida', 'camping')),
  alojamiento_legacy_id   INTEGER REFERENCES alojamientos(id) ON DELETE RESTRICT,
  espacio_solicitado_ref  TEXT,
  created_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (fecha_checkout > fecha_checkin),
  UNIQUE (reserva_id, tramo)
);

CREATE INDEX idx_reserva_estadias_fechas
  ON reserva_estadias (fecha_checkin, fecha_checkout);
CREATE INDEX idx_reserva_estadias_alojamiento_legacy
  ON reserva_estadias (alojamiento_legacy_id, fecha_checkin, fecha_checkout);

INSERT INTO reserva_estadias (
  reserva_id, tramo, fecha_checkin, fecha_checkout, cantidad_huespedes,
  modalidad, alojamiento_legacy_id, espacio_solicitado_ref, created_at, updated_at
)
SELECT
  r.id, 1, r.fecha_checkin, r.fecha_checkout, r.cantidad_personas,
  'sin_definir', r.alojamiento_id, printf('legacy:alojamiento:%d', r.alojamiento_id),
  r.created_at, r.updated_at
FROM reservas r;

-- WRESERV-7 incorporará el catálogo físico y completará unidad_inventario_id.
-- El texto legacy se conserva explícitamente y nunca se interpreta como cama.
CREATE TABLE asignaciones_inventario (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  reserva_estadia_id    INTEGER NOT NULL REFERENCES reserva_estadias(id) ON DELETE RESTRICT,
  unidad_inventario_id  INTEGER,
  unidad_legacy_texto   TEXT,
  cantidad_huespedes    INTEGER NOT NULL DEFAULT 1 CHECK (cantidad_huespedes > 0),
  estado                TEXT NOT NULL DEFAULT 'activa'
                          CHECK (estado IN ('activa', 'liberada', 'cancelada')),
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (unidad_inventario_id IS NOT NULL OR unidad_legacy_texto IS NOT NULL)
);

CREATE INDEX idx_asignaciones_estadia
  ON asignaciones_inventario (reserva_estadia_id, estado);
CREATE INDEX idx_asignaciones_unidad
  ON asignaciones_inventario (unidad_inventario_id, estado);

INSERT INTO asignaciones_inventario (
  reserva_estadia_id, unidad_legacy_texto, cantidad_huespedes
)
SELECT re.id, r.unidad_asignada, r.cantidad_personas
FROM reservas r
JOIN reserva_estadias re ON re.reserva_id = r.id AND re.tramo = 1
WHERE r.unidad_asignada IS NOT NULL AND trim(r.unidad_asignada) <> '';

CREATE TABLE ocupacion_noches (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  reserva_estadia_id    INTEGER NOT NULL REFERENCES reserva_estadias(id) ON DELETE RESTRICT,
  unidad_inventario_id  INTEGER NOT NULL,
  fecha                 TEXT NOT NULL,
  cantidad_huespedes    INTEGER NOT NULL DEFAULT 1 CHECK (cantidad_huespedes > 0),
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (fecha, unidad_inventario_id)
);

CREATE INDEX idx_ocupacion_noches_estadia_fecha
  ON ocupacion_noches (reserva_estadia_id, fecha);

CREATE TABLE pagos (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  reserva_id               INTEGER NOT NULL REFERENCES reservas(id) ON DELETE RESTRICT,
  proveedor                TEXT NOT NULL,
  tipo                     TEXT NOT NULL DEFAULT 'sena'
                             CHECK (tipo IN ('sena', 'saldo', 'total', 'devolucion', 'ajuste')),
  estado                   TEXT NOT NULL
                             CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'devuelto', 'importado_legacy')),
  monto_centavos           INTEGER NOT NULL CHECK (monto_centavos >= 0),
  moneda                   TEXT NOT NULL CHECK (length(moneda) = 3 AND moneda = upper(moneda)),
  external_preference_id   TEXT,
  external_payment_id      TEXT,
  idempotency_key          TEXT,
  metadata_json            TEXT CHECK (metadata_json IS NULL OR json_valid(metadata_json)),
  created_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX idx_pagos_proveedor_payment_unique
  ON pagos (proveedor, external_payment_id)
  WHERE external_payment_id IS NOT NULL AND trim(external_payment_id) <> '';
CREATE UNIQUE INDEX idx_pagos_idempotency_unique
  ON pagos (proveedor, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND trim(idempotency_key) <> '';
CREATE INDEX idx_pagos_reserva_created_at ON pagos (reserva_id, created_at);
CREATE INDEX idx_pagos_estado_created_at ON pagos (estado, created_at);

INSERT INTO pagos (
  reserva_id, proveedor, tipo, estado, monto_centavos, moneda,
  external_preference_id, external_payment_id, metadata_json, created_at, updated_at
)
SELECT
  r.id,
  'mercado_pago',
  CASE WHEN r.monto_sena_centavos IS NULL THEN 'total' ELSE 'sena' END,
  CASE
    WHEN r.mp_payment_id IS NOT NULL AND r.estado = 'confirmada' THEN 'aprobado'
    WHEN r.mp_payment_id IS NULL THEN 'pendiente'
    ELSE 'importado_legacy'
  END,
  COALESCE(r.monto_sena_centavos, r.monto_total_centavos),
  r.moneda,
  r.mp_preference_id,
  r.mp_payment_id,
  json_object('origen', 'backfill_wreserv_0002', 'estado_reserva', r.estado),
  r.created_at,
  r.updated_at
FROM reservas r
WHERE r.mp_preference_id IS NOT NULL OR r.mp_payment_id IS NOT NULL;

CREATE TABLE reserva_eventos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  reserva_id      INTEGER NOT NULL REFERENCES reservas(id) ON DELETE RESTRICT,
  tipo            TEXT NOT NULL,
  actor_tipo      TEXT NOT NULL CHECK (actor_tipo IN ('usuario', 'servicio', 'sistema', 'migracion')),
  actor_ref       TEXT,
  correlation_id  TEXT,
  payload_json    TEXT CHECK (payload_json IS NULL OR json_valid(payload_json)),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_reserva_eventos_reserva_created_at
  ON reserva_eventos (reserva_id, created_at);
CREATE INDEX idx_reserva_eventos_tipo_created_at
  ON reserva_eventos (tipo, created_at);

INSERT INTO reserva_eventos (
  reserva_id, tipo, actor_tipo, actor_ref, payload_json, created_at
)
SELECT
  id,
  'reserva.importada_legacy',
  'migracion',
  '0002_normalize_reservation_core.sql',
  json_object('estado', estado, 'alojamiento_id', alojamiento_id),
  updated_at
FROM reservas;

CREATE TABLE mapeo_ids_legacy (
  tipo_entidad   TEXT NOT NULL,
  id_legacy     TEXT NOT NULL,
  id_nuevo      TEXT NOT NULL,
  metadata_json TEXT CHECK (metadata_json IS NULL OR json_valid(metadata_json)),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (tipo_entidad, id_legacy),
  UNIQUE (tipo_entidad, id_nuevo)
);

INSERT INTO mapeo_ids_legacy (tipo_entidad, id_legacy, id_nuevo, metadata_json)
SELECT 'reserva', CAST(id AS TEXT), reserva_uid, json_object('codigo', codigo)
FROM reservas;

INSERT INTO mapeo_ids_legacy (tipo_entidad, id_legacy, id_nuevo, metadata_json)
SELECT
  'reserva_estadia',
  CAST(r.id AS TEXT),
  CAST(re.id AS TEXT),
  json_object('reserva_uid', r.reserva_uid, 'tramo', re.tramo)
FROM reservas r
JOIN reserva_estadias re ON re.reserva_id = r.id AND re.tramo = 1;

-- consultas permanece como entidad de lead separada. Se agrega una proyección
-- monetaria exacta sin convertir consultas incompletas en reservas.
ALTER TABLE consultas ADD COLUMN monto_estimado_centavos INTEGER
  CHECK (monto_estimado_centavos IS NULL OR monto_estimado_centavos >= 0);

UPDATE consultas
SET monto_estimado_centavos = CASE
  WHEN monto_estimado IS NULL THEN NULL
  ELSE CAST(round(monto_estimado * 100) AS INTEGER)
END;

-- Registro legible por la aplicación. D1 mantiene además d1_migrations como
-- autoridad operativa de qué archivos fueron aplicados.
CREATE TABLE schema_migrations (
  version       TEXT PRIMARY KEY,
  descripcion   TEXT NOT NULL,
  checksum_ref  TEXT NOT NULL,
  applied_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES
  ('0001', 'baseline de reservas adoptado por D1', 'migrations/0001_initial_reservas.sql'),
  ('0002', 'normalización aditiva del núcleo de reservas', 'migrations/0002_normalize_reservation_core.sql');

-- Proyección transitoria para los adaptadores legacy. Evita drift entre las
-- columnas antiguas y el núcleo normalizado mientras WRESERV-11/12/13 migran
-- cada escritura a sus repositorios definitivos.
CREATE TRIGGER reservas_proyectar_insert_legacy
AFTER INSERT ON reservas
FOR EACH ROW
BEGIN
  INSERT INTO reserva_estadias (
    reserva_id, tramo, fecha_checkin, fecha_checkout, cantidad_huespedes,
    modalidad, alojamiento_legacy_id, espacio_solicitado_ref, created_at, updated_at
  ) VALUES (
    NEW.id, 1, NEW.fecha_checkin, NEW.fecha_checkout, NEW.cantidad_personas,
    'sin_definir', NEW.alojamiento_id, printf('legacy:alojamiento:%d', NEW.alojamiento_id),
    NEW.created_at, COALESCE(NEW.updated_at, NEW.created_at)
  );

  INSERT INTO mapeo_ids_legacy (tipo_entidad, id_legacy, id_nuevo, metadata_json)
  VALUES (
    'reserva', CAST(NEW.id AS TEXT),
    COALESCE(NEW.reserva_uid, printf('legacy-%012d', NEW.id)),
    json_object('codigo', COALESCE(NEW.codigo, printf('RES-%08d', NEW.id)))
  );

  INSERT INTO mapeo_ids_legacy (tipo_entidad, id_legacy, id_nuevo, metadata_json)
  SELECT
    'reserva_estadia', CAST(NEW.id AS TEXT), CAST(re.id AS TEXT),
    json_object(
      'reserva_uid', COALESCE(NEW.reserva_uid, printf('legacy-%012d', NEW.id)),
      'tramo', 1
    )
  FROM reserva_estadias re
  WHERE re.reserva_id = NEW.id AND re.tramo = 1;

  INSERT INTO reserva_eventos (
    reserva_id, tipo, actor_tipo, actor_ref, payload_json, created_at
  ) VALUES (
    NEW.id, 'reserva.creada_legacy', 'sistema', 'compatibilidad_wreserv_0002',
    json_object('estado', NEW.estado, 'alojamiento_id', NEW.alojamiento_id),
    COALESCE(NEW.updated_at, NEW.created_at)
  );

  INSERT INTO asignaciones_inventario (
    reserva_estadia_id, unidad_legacy_texto, cantidad_huespedes
  )
  SELECT re.id, NEW.unidad_asignada, NEW.cantidad_personas
  FROM reserva_estadias re
  WHERE re.reserva_id = NEW.id
    AND re.tramo = 1
    AND NEW.unidad_asignada IS NOT NULL
    AND trim(NEW.unidad_asignada) <> '';

  INSERT INTO pagos (
    reserva_id, proveedor, tipo, estado, monto_centavos, moneda,
    external_preference_id, external_payment_id, metadata_json, created_at, updated_at
  )
  SELECT
    NEW.id,
    'mercado_pago',
    CASE WHEN NEW.monto_sena IS NULL THEN 'total' ELSE 'sena' END,
    CASE
      WHEN NEW.mp_payment_id IS NOT NULL AND NEW.estado = 'confirmada' THEN 'aprobado'
      WHEN NEW.mp_payment_id IS NULL THEN 'pendiente'
      ELSE 'importado_legacy'
    END,
    COALESCE(
      NEW.monto_sena_centavos,
      CASE WHEN NEW.monto_sena IS NULL THEN NULL ELSE CAST(round(NEW.monto_sena * 100) AS INTEGER) END,
      NEW.monto_total_centavos,
      CAST(round(NEW.monto_total * 100) AS INTEGER)
    ),
    NEW.moneda,
    NEW.mp_preference_id,
    NEW.mp_payment_id,
    json_object('origen', 'compatibilidad_wreserv_0002'),
    NEW.created_at,
    COALESCE(NEW.updated_at, NEW.created_at)
  WHERE NEW.mp_preference_id IS NOT NULL OR NEW.mp_payment_id IS NOT NULL;
END;

CREATE TRIGGER reservas_proyectar_update_legacy
AFTER UPDATE ON reservas
FOR EACH ROW
WHEN NEW.fecha_checkin IS NOT OLD.fecha_checkin
  OR NEW.fecha_checkout IS NOT OLD.fecha_checkout
  OR NEW.cantidad_personas IS NOT OLD.cantidad_personas
  OR NEW.alojamiento_id IS NOT OLD.alojamiento_id
  OR NEW.unidad_asignada IS NOT OLD.unidad_asignada
  OR NEW.estado IS NOT OLD.estado
  OR NEW.monto_total IS NOT OLD.monto_total
  OR NEW.monto_sena IS NOT OLD.monto_sena
  OR NEW.mp_preference_id IS NOT OLD.mp_preference_id
  OR NEW.mp_payment_id IS NOT OLD.mp_payment_id
BEGIN
  UPDATE reserva_estadias
  SET fecha_checkin = NEW.fecha_checkin,
      fecha_checkout = NEW.fecha_checkout,
      cantidad_huespedes = NEW.cantidad_personas,
      alojamiento_legacy_id = NEW.alojamiento_id,
      espacio_solicitado_ref = printf('legacy:alojamiento:%d', NEW.alojamiento_id),
      updated_at = COALESCE(NEW.updated_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  WHERE reserva_id = NEW.id AND tramo = 1;

  UPDATE asignaciones_inventario
  SET unidad_legacy_texto = NEW.unidad_asignada,
      cantidad_huespedes = NEW.cantidad_personas,
      estado = CASE
        WHEN NEW.unidad_asignada IS NULL OR trim(NEW.unidad_asignada) = '' THEN 'liberada'
        ELSE 'activa'
      END,
      updated_at = COALESCE(NEW.updated_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  WHERE reserva_estadia_id IN (
      SELECT id FROM reserva_estadias WHERE reserva_id = NEW.id AND tramo = 1
    )
    AND unidad_inventario_id IS NULL;

  INSERT INTO asignaciones_inventario (
    reserva_estadia_id, unidad_legacy_texto, cantidad_huespedes
  )
  SELECT re.id, NEW.unidad_asignada, NEW.cantidad_personas
  FROM reserva_estadias re
  WHERE NEW.unidad_asignada IS NOT NULL
    AND trim(NEW.unidad_asignada) <> ''
    AND re.reserva_id = NEW.id
    AND re.tramo = 1
    AND NOT EXISTS (
      SELECT 1 FROM asignaciones_inventario
      WHERE reserva_estadia_id = re.id AND unidad_inventario_id IS NULL
    );

  UPDATE pagos
  SET tipo = CASE WHEN NEW.monto_sena IS NULL THEN 'total' ELSE 'sena' END,
      estado = CASE
        WHEN NEW.mp_payment_id IS NOT NULL AND NEW.estado = 'confirmada' THEN 'aprobado'
        WHEN NEW.mp_payment_id IS NULL THEN 'pendiente'
        ELSE 'importado_legacy'
      END,
      monto_centavos = COALESCE(
        NEW.monto_sena_centavos,
        CASE WHEN NEW.monto_sena IS NULL THEN NULL ELSE CAST(round(NEW.monto_sena * 100) AS INTEGER) END,
        NEW.monto_total_centavos,
        CAST(round(NEW.monto_total * 100) AS INTEGER)
      ),
      moneda = NEW.moneda,
      external_preference_id = NEW.mp_preference_id,
      external_payment_id = NEW.mp_payment_id,
      updated_at = COALESCE(NEW.updated_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  WHERE reserva_id = NEW.id AND proveedor = 'mercado_pago';

  INSERT INTO pagos (
    reserva_id, proveedor, tipo, estado, monto_centavos, moneda,
    external_preference_id, external_payment_id, metadata_json, created_at, updated_at
  )
  SELECT
    NEW.id,
    'mercado_pago',
    CASE WHEN NEW.monto_sena IS NULL THEN 'total' ELSE 'sena' END,
    CASE
      WHEN NEW.mp_payment_id IS NOT NULL AND NEW.estado = 'confirmada' THEN 'aprobado'
      WHEN NEW.mp_payment_id IS NULL THEN 'pendiente'
      ELSE 'importado_legacy'
    END,
    COALESCE(
      NEW.monto_sena_centavos,
      CASE WHEN NEW.monto_sena IS NULL THEN NULL ELSE CAST(round(NEW.monto_sena * 100) AS INTEGER) END,
      NEW.monto_total_centavos,
      CAST(round(NEW.monto_total * 100) AS INTEGER)
    ),
    NEW.moneda,
    NEW.mp_preference_id,
    NEW.mp_payment_id,
    json_object('origen', 'compatibilidad_wreserv_0002'),
    NEW.created_at,
    COALESCE(NEW.updated_at, NEW.created_at)
  WHERE (NEW.mp_preference_id IS NOT NULL OR NEW.mp_payment_id IS NOT NULL)
    AND NOT EXISTS (
      SELECT 1 FROM pagos
      WHERE reserva_id = NEW.id AND proveedor = 'mercado_pago'
    );

  INSERT INTO reserva_eventos (
    reserva_id, tipo, actor_tipo, actor_ref, payload_json, created_at
  ) VALUES (
    NEW.id, 'reserva.actualizada_legacy', 'sistema', 'compatibilidad_wreserv_0002',
    json_object('estado_anterior', OLD.estado, 'estado', NEW.estado),
    COALESCE(NEW.updated_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
END;
