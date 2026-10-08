-- WRESERV-2 / WRESERV-14: operaciones administrativas con control optimista.

CREATE TABLE operaciones_reserva_admin (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  operacion_uid       TEXT NOT NULL UNIQUE,
  reserva_id          INTEGER NOT NULL REFERENCES reservas(id) ON DELETE RESTRICT,
  accion              TEXT NOT NULL CHECK (accion IN ('editar', 'confirmar', 'cancelar', 'vencer')),
  version_esperada    INTEGER NOT NULL CHECK (version_esperada > 0),
  version_resultante  INTEGER NOT NULL CHECK (version_resultante > version_esperada),
  actor_ref           TEXT NOT NULL,
  motivo              TEXT,
  correlation_id      TEXT NOT NULL,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (reserva_id, version_resultante)
);

DROP TRIGGER reservas_estado_flujo_transicion_valida;
CREATE TRIGGER reservas_estado_flujo_transicion_valida
BEFORE UPDATE OF estado_flujo ON reservas
WHEN NEW.estado_flujo <> OLD.estado_flujo AND NOT (
  (OLD.estado_flujo = 'pendiente_pago' AND NEW.estado_flujo IN ('confirmada', 'cancelada', 'vencida', 'rechazada'))
  OR (OLD.estado_flujo = 'confirmada' AND NEW.estado_flujo = 'cancelada')
)
BEGIN SELECT RAISE(ABORT, 'transicion de reserva invalida'); END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0014', 'operaciones administrativas versionadas de reserva',
        'migrations/0014_admin_reservation_workflow.sql');
