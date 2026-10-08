-- WRESERV-2 / WRESERV-27: políticas versionadas, snapshots y trazabilidad de devoluciones.

CREATE TABLE politicas_cancelacion (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo          TEXT NOT NULL,
  nombre          TEXT NOT NULL,
  version         INTEGER NOT NULL CHECK (version >= 1),
  estado          TEXT NOT NULL
                    CHECK (estado IN ('pendiente_configuracion', 'borrador', 'publicada', 'retirada')),
  reglas_json     TEXT NOT NULL CHECK (json_valid(reglas_json)),
  vigencia_desde  TEXT,
  publicado_at    TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (codigo, version),
  CHECK (
    (estado = 'publicada' AND vigencia_desde IS NOT NULL AND publicado_at IS NOT NULL)
    OR estado <> 'publicada'
  )
);

CREATE UNIQUE INDEX idx_politicas_cancelacion_publicada
  ON politicas_cancelacion (codigo)
  WHERE estado = 'publicada';

INSERT INTO politicas_cancelacion (
  codigo, nombre, version, estado, reglas_json
) VALUES (
  'reservas-general',
  'Configuración comercial pendiente',
  1,
  'pendiente_configuracion',
  '{"estado":"pendiente_configuracion","reglas":[]}'
);

ALTER TABLE cotizaciones ADD COLUMN politica_cancelacion_codigo TEXT;
ALTER TABLE cotizaciones ADD COLUMN politica_cancelacion_version INTEGER;
ALTER TABLE cotizaciones ADD COLUMN politica_cancelacion_estado TEXT;
ALTER TABLE cotizaciones ADD COLUMN politica_cancelacion_json TEXT;

UPDATE cotizaciones
SET politica_cancelacion_codigo = 'reservas-general',
    politica_cancelacion_version = 1,
    politica_cancelacion_estado = 'pendiente_configuracion',
    politica_cancelacion_json = '{"estado":"pendiente_configuracion","reglas":[]}'
WHERE politica_cancelacion_codigo IS NULL;

CREATE TABLE reserva_politica_snapshots (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  reserva_id            INTEGER NOT NULL UNIQUE REFERENCES reservas(id) ON DELETE RESTRICT,
  politica_id           INTEGER REFERENCES politicas_cancelacion(id) ON DELETE RESTRICT,
  codigo                TEXT NOT NULL,
  version               INTEGER NOT NULL CHECK (version >= 1),
  estado_configuracion  TEXT NOT NULL
                          CHECK (estado_configuracion IN ('pendiente_configuracion', 'configurada')),
  reglas_json           TEXT NOT NULL CHECK (json_valid(reglas_json)),
  terminos_version      TEXT,
  aceptada_at           TEXT,
  captured_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO reserva_politica_snapshots (
  reserva_id, politica_id, codigo, version, estado_configuracion, reglas_json
)
SELECT r.id, p.id, p.codigo, p.version, 'pendiente_configuracion', p.reglas_json
FROM reservas r
JOIN politicas_cancelacion p
  ON p.codigo = 'reservas-general' AND p.version = 1;

-- Los canales sin cotización conservan de forma explícita que todavía no
-- había una política comercial aprobada. El flujo público copia la política
-- de la cotización aceptada dentro de su batch transaccional.
CREATE TRIGGER reservas_snapshot_politica_sin_cotizacion
AFTER INSERT ON reservas
WHEN NEW.cotizacion_id IS NULL
BEGIN
  INSERT INTO reserva_politica_snapshots (
    reserva_id, politica_id, codigo, version, estado_configuracion, reglas_json
  )
  SELECT NEW.id, id, codigo, version,
         CASE WHEN estado = 'publicada' THEN 'configurada' ELSE 'pendiente_configuracion' END,
         reglas_json
  FROM politicas_cancelacion
  WHERE codigo = 'reservas-general'
    AND (estado = 'publicada' OR estado = 'pendiente_configuracion')
  ORDER BY CASE estado WHEN 'publicada' THEN 0 ELSE 1 END, version DESC
  LIMIT 1;
END;

CREATE TRIGGER politicas_cancelacion_publicadas_inmutables_update
BEFORE UPDATE ON politicas_cancelacion
WHEN OLD.estado = 'publicada' AND (
  NEW.estado <> 'retirada'
  OR NEW.codigo IS NOT OLD.codigo
  OR NEW.nombre IS NOT OLD.nombre
  OR NEW.version IS NOT OLD.version
  OR NEW.reglas_json IS NOT OLD.reglas_json
  OR NEW.vigencia_desde IS NOT OLD.vigencia_desde
  OR NEW.publicado_at IS NOT OLD.publicado_at
  OR NEW.created_at IS NOT OLD.created_at
)
BEGIN SELECT RAISE(ABORT, 'published cancellation policies are immutable'); END;

CREATE TRIGGER politicas_cancelacion_publicadas_inmutables_delete
BEFORE DELETE ON politicas_cancelacion
WHEN OLD.estado = 'publicada'
BEGIN SELECT RAISE(ABORT, 'published cancellation policies are immutable'); END;

CREATE TRIGGER reserva_politica_snapshots_inmutables_update
BEFORE UPDATE ON reserva_politica_snapshots
BEGIN SELECT RAISE(ABORT, 'reservation policy snapshots are immutable'); END;

CREATE TRIGGER reserva_politica_snapshots_inmutables_delete
BEFORE DELETE ON reserva_politica_snapshots
BEGIN SELECT RAISE(ABORT, 'reservation policy snapshots are immutable'); END;

CREATE TABLE devoluciones_reserva (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  reserva_id            INTEGER NOT NULL REFERENCES reservas(id) ON DELETE RESTRICT,
  pago_original_id      INTEGER NOT NULL REFERENCES pagos(id) ON DELETE RESTRICT,
  politica_snapshot_id  INTEGER NOT NULL REFERENCES reserva_politica_snapshots(id) ON DELETE RESTRICT,
  monto_centavos        INTEGER NOT NULL CHECK (monto_centavos >= 0),
  moneda                TEXT NOT NULL CHECK (length(moneda) = 3 AND moneda = upper(moneda)),
  estado                TEXT NOT NULL DEFAULT 'calculada'
                          CHECK (estado IN ('calculada', 'pendiente', 'procesando', 'aprobada', 'rechazada', 'revision_manual')),
  idempotency_key       TEXT NOT NULL UNIQUE,
  external_ref          TEXT,
  motivo                TEXT,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX idx_devoluciones_external_ref
  ON devoluciones_reserva (external_ref)
  WHERE external_ref IS NOT NULL AND trim(external_ref) <> '';

CREATE TABLE excepciones_politica_reserva (
  id                         INTEGER PRIMARY KEY AUTOINCREMENT,
  reserva_id                 INTEGER NOT NULL REFERENCES reservas(id) ON DELETE RESTRICT,
  tipo                       TEXT NOT NULL CHECK (tipo IN ('cancelacion', 'devolucion', 'vencimiento')),
  estado                     TEXT NOT NULL DEFAULT 'solicitada'
                               CHECK (estado IN ('solicitada', 'aprobada', 'rechazada')),
  monto_devolucion_centavos  INTEGER CHECK (monto_devolucion_centavos IS NULL OR monto_devolucion_centavos >= 0),
  motivo                     TEXT NOT NULL CHECK (length(trim(motivo)) >= 3),
  solicitada_por             TEXT NOT NULL,
  resuelta_por               TEXT,
  resuelta_at                TEXT,
  created_at                 TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (
    (estado = 'solicitada' AND resuelta_por IS NULL AND resuelta_at IS NULL)
    OR (estado IN ('aprobada', 'rechazada') AND resuelta_por IS NOT NULL AND resuelta_at IS NOT NULL)
  )
);

CREATE INDEX idx_excepciones_politica_reserva
  ON excepciones_politica_reserva (reserva_id, estado, created_at);

CREATE TRIGGER excepciones_politica_transicion_valida
BEFORE UPDATE OF estado ON excepciones_politica_reserva
WHEN OLD.estado <> 'solicitada' OR NEW.estado NOT IN ('aprobada', 'rechazada')
BEGIN SELECT RAISE(ABORT, 'invalid reservation policy exception transition'); END;

CREATE TRIGGER excepciones_politica_evento_solicitada
AFTER INSERT ON excepciones_politica_reserva
BEGIN
  INSERT INTO reserva_eventos (reserva_id, tipo, actor_tipo, actor_ref, payload_json)
  VALUES (
    NEW.reserva_id, 'reserva.politica_excepcion_solicitada', 'usuario', NEW.solicitada_por,
    json_object('excepcion_id', NEW.id, 'tipo', NEW.tipo,
                'monto_devolucion_centavos', NEW.monto_devolucion_centavos)
  );
END;

CREATE TRIGGER excepciones_politica_evento_resuelta
AFTER UPDATE OF estado ON excepciones_politica_reserva
WHEN OLD.estado = 'solicitada' AND NEW.estado IN ('aprobada', 'rechazada')
BEGIN
  INSERT INTO reserva_eventos (reserva_id, tipo, actor_tipo, actor_ref, payload_json)
  VALUES (
    NEW.reserva_id, 'reserva.politica_excepcion_resuelta', 'usuario', NEW.resuelta_por,
    json_object('excepcion_id', NEW.id, 'tipo', NEW.tipo, 'estado', NEW.estado,
                'monto_devolucion_centavos', NEW.monto_devolucion_centavos)
  );
END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0010', 'políticas de cancelación, vencimiento y devolución',
        'migrations/0010_cancellation_refund_policies.sql');
