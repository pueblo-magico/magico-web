-- WRESERV-2 / WRESERV-32 / WRESERV-35: trazabilidad de cobros simulados.

ALTER TABLE cucuru_observaciones_transferencia
  ADD COLUMN simulada INTEGER NOT NULL DEFAULT 0 CHECK (simulada IN (0, 1));

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0020', 'identificacion de observaciones Cucuru simuladas',
        'migrations/0020_cucuru_mock_payment_markers.sql');
