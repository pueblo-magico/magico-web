-- WRESERV-2 / WRESERV-33: parámetros operativos escalares, versionados y auditables.

CREATE TABLE parametros_operativos_reservas (
  codigo                TEXT PRIMARY KEY,
  tipo                  TEXT NOT NULL CHECK (tipo = 'entero'),
  valor_entero          INTEGER NOT NULL,
  unidad                TEXT NOT NULL,
  version               INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  updated_by            TEXT NOT NULL,
  ultima_operacion_uid  TEXT NOT NULL UNIQUE,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (codigo <> ''),
  CHECK (codigo <> 'payment_hold_minutes' OR (valor_entero BETWEEN 5 AND 120))
);

INSERT INTO parametros_operativos_reservas (
  codigo, tipo, valor_entero, unidad, updated_by, ultima_operacion_uid
) VALUES (
  'payment_hold_minutes', 'entero', 15, 'minutos', 'sistema', 'seed-wreserv-33-payment-hold'
);

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0015', 'configuracion base versionada de reservas',
        'migrations/0015_base_reservation_configuration.sql');
