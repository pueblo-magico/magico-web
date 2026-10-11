-- Inventario no sensible de aplicaciones técnicas y uso autenticado por endpoint.
-- Los secretos continúan exclusivamente en variables del entorno.
CREATE TABLE api_applications (
  codigo          TEXT PRIMARY KEY CHECK (length(trim(codigo)) BETWEEN 2 AND 40),
  nombre          TEXT NOT NULL CHECK (length(trim(nombre)) BETWEEN 2 AND 100),
  tipo            TEXT NOT NULL CHECK (tipo IN ('automatizacion', 'proveedor', 'servicio_interno')),
  estado          TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva')),
  registrado_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE api_application_endpoint_usage (
  application_codigo TEXT NOT NULL REFERENCES api_applications(codigo) ON DELETE RESTRICT,
  method              TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PATCH', 'PUT', 'DELETE')),
  endpoint            TEXT NOT NULL CHECK (endpoint LIKE '/api/%' AND length(endpoint) <= 200),
  first_used_at       TEXT NOT NULL,
  last_used_at        TEXT NOT NULL,
  request_count       INTEGER NOT NULL DEFAULT 1 CHECK (request_count >= 1),
  PRIMARY KEY (application_codigo, method, endpoint)
);

CREATE INDEX idx_api_application_usage_last
  ON api_application_endpoint_usage (last_used_at DESC, application_codigo);

INSERT INTO api_applications (codigo, nombre, tipo) VALUES
  ('n8n', 'n8n', 'automatizacion'),
  ('manychat', 'ManyChat', 'automatizacion'),
  ('outbox', 'Dispatcher de eventos', 'servicio_interno'),
  ('cucuru', 'Cucuru', 'proveedor'),
  ('mercado_pago', 'Mercado Pago', 'proveedor'),
  ('accounting', 'Contabilidad', 'servicio_interno'),
  ('stock', 'Stock', 'servicio_interno');

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0028', 'registro y uso de aplicaciones API',
        'migrations/0028_api_application_registry.sql');
