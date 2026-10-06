-- WRESERV-9: la consulta aborta si falta alguna estructura de seguridad.
CREATE TABLE __wreserv_security_guard (
  ok INTEGER NOT NULL CHECK (ok = 1)
);

INSERT INTO __wreserv_security_guard
SELECT CASE WHEN COUNT(*) = 3 THEN 1 ELSE 0 END
FROM sqlite_schema
WHERE type = 'table'
  AND name IN ('rate_limit_counters', 'solicitudes_datos_personales', 'politicas_retencion_datos');

INSERT INTO __wreserv_security_guard
SELECT CASE WHEN COUNT(*) = 6 THEN 1 ELSE 0 END
FROM pragma_table_info('auditoria_admin')
WHERE name IN ('actor_tipo', 'entidad_tipo', 'entidad_id', 'motivo', 'correlation_id', 'metadata_json');

INSERT INTO __wreserv_security_guard
SELECT CASE WHEN COUNT(*) = 4 THEN 1 ELSE 0 END
FROM politicas_retencion_datos
WHERE estado = 'pendiente_configuracion' AND plazo_dias IS NULL;

INSERT INTO __wreserv_security_guard
SELECT CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END
FROM auditoria_admin
WHERE detalle IS NOT NULL;

DROP TABLE __wreserv_security_guard;
