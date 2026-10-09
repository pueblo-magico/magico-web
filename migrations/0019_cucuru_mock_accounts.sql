-- WRESERV-2 / WRESERV-32: distinguir destinos simulados de cuentas Cucuru reales.

ALTER TABLE cuentas_cobro_reserva
  ADD COLUMN simulada INTEGER NOT NULL DEFAULT 0 CHECK (simulada IN (0, 1));

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0019', 'identificacion de cuentas Cucuru simuladas',
        'migrations/0019_cucuru_mock_accounts.sql');
