-- WRESERV-2 / WRESERV-12: creación idempotente y retenciones de inventario.

ALTER TABLE reservas ADD COLUMN estado_flujo TEXT NOT NULL DEFAULT 'pendiente_pago'
  CHECK (estado_flujo IN ('pendiente_pago', 'confirmada', 'cancelada', 'vencida', 'rechazada'));
ALTER TABLE reservas ADD COLUMN hold_expires_at TEXT;

UPDATE reservas
SET estado_flujo = CASE estado
  WHEN 'confirmada' THEN 'confirmada'
  WHEN 'cancelada' THEN 'cancelada'
  ELSE 'pendiente_pago'
END;

CREATE INDEX idx_reservas_estado_flujo_expiracion
  ON reservas (estado_flujo, hold_expires_at);

CREATE TABLE retenciones_reserva (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  reserva_id      INTEGER NOT NULL UNIQUE REFERENCES reservas(id) ON DELETE RESTRICT,
  estado          TEXT NOT NULL DEFAULT 'activa'
                    CHECK (estado IN ('activa', 'convertida', 'vencida', 'liberada')),
  expires_at      TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_retenciones_estado_expiracion
  ON retenciones_reserva (estado, expires_at);

CREATE TABLE ocupacion_reserva_noches (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  reserva_estadia_id    INTEGER NOT NULL REFERENCES reserva_estadias(id) ON DELETE RESTRICT,
  espacio_id            INTEGER NOT NULL REFERENCES espacios(id) ON DELETE RESTRICT,
  fecha                 TEXT NOT NULL,
  cantidad_huespedes    INTEGER NOT NULL CHECK (cantidad_huespedes > 0),
  modalidad             TEXT NOT NULL CHECK (modalidad IN ('privada', 'compartida', 'camping')),
  estado                TEXT NOT NULL DEFAULT 'retenida'
                          CHECK (estado IN ('retenida', 'confirmada', 'liberada')),
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (reserva_estadia_id, espacio_id, fecha)
);

CREATE INDEX idx_ocupacion_reserva_espacio_fecha
  ON ocupacion_reserva_noches (espacio_id, fecha, estado);

CREATE TABLE solicitudes_idempotentes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  alcance         TEXT NOT NULL,
  clave           TEXT NOT NULL,
  request_hash    TEXT NOT NULL,
  reserva_id      INTEGER REFERENCES reservas(id) ON DELETE RESTRICT,
  status_code     INTEGER,
  response_json   TEXT CHECK (response_json IS NULL OR json_valid(response_json)),
  estado          TEXT NOT NULL DEFAULT 'procesando'
                    CHECK (estado IN ('procesando', 'completada')),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at    TEXT,
  UNIQUE (alcance, clave)
);

-- La ocupación nueva se contrasta también con reservas legacy, porque durante
-- la migración conviven escrituras antiguas y el flujo transaccional nuevo.
CREATE TRIGGER ocupacion_reserva_conflicto_reservas
BEFORE INSERT ON ocupacion_reserva_noches
WHEN NEW.estado IN ('retenida', 'confirmada') AND EXISTS (
  SELECT 1
  FROM reservas r
  JOIN reserva_estadias re ON re.reserva_id = r.id
  JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
  JOIN espacios existente ON existente.id = ree.espacio_id
  JOIN espacios nuevo ON nuevo.id = NEW.espacio_id
  WHERE re.id <> NEW.reserva_estadia_id
    AND re.fecha_checkin <= NEW.fecha AND re.fecha_checkout > NEW.fecha
    AND (
      r.estado = 'confirmada'
      OR (r.estado = 'pendiente' AND (r.hold_expires_at IS NULL OR r.hold_expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')))
    )
    AND (existente.id = nuevo.id OR existente.parent_id = nuevo.id OR nuevo.parent_id = existente.id)
    AND (
      NEW.modalidad = 'privada'
      OR re.modalidad = 'privada'
      OR (
        SELECT COALESCE(SUM(re2.cantidad_huespedes), 0)
        FROM reservas r2
        JOIN reserva_estadias re2 ON re2.reserva_id = r2.id
        JOIN reserva_estadia_espacios ree2 ON ree2.reserva_estadia_id = re2.id
        JOIN espacios e2 ON e2.id = ree2.espacio_id
        WHERE re2.id <> NEW.reserva_estadia_id
          AND re2.fecha_checkin <= NEW.fecha AND re2.fecha_checkout > NEW.fecha
          AND (
            r2.estado = 'confirmada'
            OR (r2.estado = 'pendiente' AND (r2.hold_expires_at IS NULL OR r2.hold_expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')))
          )
          AND (e2.id = nuevo.id OR e2.parent_id = nuevo.id OR nuevo.parent_id = e2.id)
      ) + NEW.cantidad_huespedes > nuevo.capacidad_comercial
    )
)
BEGIN SELECT RAISE(ABORT, 'inventario no disponible'); END;

CREATE TRIGGER ocupacion_reserva_conflicto_operativo
BEFORE INSERT ON ocupacion_reserva_noches
WHEN NEW.estado IN ('retenida', 'confirmada') AND EXISTS (
  SELECT 1
  FROM ocupacion_operativa oo
  LEFT JOIN unidades_inventario ui ON ui.id = oo.unidad_inventario_id
  JOIN espacios existente ON existente.id = COALESCE(oo.espacio_id, ui.espacio_id)
  JOIN espacios nuevo ON nuevo.id = NEW.espacio_id
  WHERE oo.fecha_desde <= NEW.fecha AND oo.fecha_hasta > NEW.fecha
    AND (existente.id = nuevo.id OR existente.parent_id = nuevo.id OR nuevo.parent_id = existente.id)
)
BEGIN SELECT RAISE(ABORT, 'inventario bloqueado operativamente'); END;

CREATE TRIGGER retenciones_transicion_valida
BEFORE UPDATE OF estado ON retenciones_reserva
WHEN NOT (
  OLD.estado = 'activa' AND NEW.estado IN ('convertida', 'vencida', 'liberada')
)
BEGIN SELECT RAISE(ABORT, 'transicion de retencion invalida'); END;

CREATE TRIGGER reservas_estado_flujo_transicion_valida
BEFORE UPDATE OF estado_flujo ON reservas
WHEN NEW.estado_flujo <> OLD.estado_flujo AND NOT (
  OLD.estado_flujo = 'pendiente_pago'
  AND NEW.estado_flujo IN ('confirmada', 'cancelada', 'vencida', 'rechazada')
)
BEGIN SELECT RAISE(ABORT, 'transicion de reserva invalida'); END;

CREATE TRIGGER reservas_estado_flujo_insert_legacy
AFTER INSERT ON reservas
WHEN NEW.estado IN ('confirmada', 'cancelada')
BEGIN
  UPDATE reservas SET estado_flujo = CASE NEW.estado
    WHEN 'confirmada' THEN 'confirmada' ELSE 'cancelada' END
  WHERE id = NEW.id;
END;

-- Compatibilidad temporal: los adaptadores de pago legacy todavía actualizan
-- `estado`. La proyección mantiene coherentes retención, ocupación y eventos.
CREATE TRIGGER reservas_confirmacion_proyectar
AFTER UPDATE OF estado ON reservas
WHEN OLD.estado <> 'confirmada' AND NEW.estado = 'confirmada'
BEGIN
  UPDATE reservas SET estado_flujo = 'confirmada' WHERE id = NEW.id;
  UPDATE retenciones_reserva SET estado = 'convertida',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE reserva_id = NEW.id AND estado = 'activa';
  UPDATE ocupacion_reserva_noches SET estado = 'confirmada'
  WHERE reserva_estadia_id IN (SELECT id FROM reserva_estadias WHERE reserva_id = NEW.id)
    AND estado = 'retenida';
  INSERT INTO reserva_eventos (reserva_id, tipo, actor_tipo, actor_ref, payload_json)
  VALUES (NEW.id, 'reserva.confirmada', 'sistema', 'proyeccion_pago_legacy', '{}');
END;

CREATE TRIGGER reservas_cancelacion_proyectar
AFTER UPDATE OF estado ON reservas
WHEN OLD.estado <> 'cancelada' AND NEW.estado = 'cancelada'
BEGIN
  UPDATE reservas SET estado_flujo = CASE
    WHEN NEW.estado_flujo = 'vencida' THEN 'vencida' ELSE 'cancelada' END
  WHERE id = NEW.id;
  UPDATE retenciones_reserva SET estado = 'liberada',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE reserva_id = NEW.id AND estado = 'activa';
  UPDATE ocupacion_reserva_noches SET estado = 'liberada'
  WHERE reserva_estadia_id IN (SELECT id FROM reserva_estadias WHERE reserva_id = NEW.id)
    AND estado = 'retenida';
  INSERT INTO reserva_eventos (reserva_id, tipo, actor_tipo, actor_ref, payload_json)
  SELECT NEW.id,
    CASE WHEN NEW.estado_flujo = 'vencida' THEN 'reserva.vencida' ELSE 'reserva.cancelada' END,
    'sistema', 'proyeccion_pago_legacy', '{}';
END;

CREATE TRIGGER solicitudes_idempotentes_inmutables
BEFORE UPDATE ON solicitudes_idempotentes
WHEN OLD.estado = 'completada'
BEGIN SELECT RAISE(ABORT, 'solicitud idempotente completada es inmutable'); END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0009', 'reservas idempotentes y retenciones de inventario',
        'migrations/0009_reservation_holds_idempotency.sql');
