-- Registro administrativo de pagos verificados fuera del webhook.
-- Conserva el metodo, referencia, fecha efectiva y responsable sin mezclar
-- una confirmacion operativa de la reserva con evidencia financiera.

ALTER TABLE pagos ADD COLUMN metodo_registro TEXT;
ALTER TABLE pagos ADD COLUMN referencia_manual TEXT;
ALTER TABLE pagos ADD COLUMN pagado_at TEXT;
ALTER TABLE pagos ADD COLUMN registrado_por TEXT;

CREATE INDEX idx_pagos_reserva_estado_tipo
  ON pagos (reserva_id, estado, tipo, created_at);

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0041', 'registro manual auditable de pagos de reserva',
        'migrations/0041_manual_reservation_payments.sql');
