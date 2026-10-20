-- Mantiene la bitácora administrativa libre de texto legacy potencialmente sensible.
-- Los datos estructurados de auditoría viven en metadata_json y motivo.

UPDATE auditoria_admin
SET detalle = NULL
WHERE detalle IS NOT NULL;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0042', 'redacción de detalles legacy en auditoría administrativa',
        'migrations/0042_redact_legacy_audit_details.sql');
