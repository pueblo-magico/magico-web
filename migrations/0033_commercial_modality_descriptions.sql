-- Commercial descriptions belong to the sellable modality so operations can
-- explain what the guest must bring and what Pueblo Magico includes without
-- hardcoding those conditions in the public booking UI.
ALTER TABLE modalidades_espacio ADD COLUMN descripcion_comercial TEXT;

UPDATE modalidades_espacio
SET descripcion_comercial = CASE
  WHEN modalidad = 'camping'
    THEN 'Traé tu propia carpa. Incluye acceso a duchas calientes y baños.'
  WHEN modalidad = 'privada'
    THEN 'Uso exclusivo del espacio con ropa blanca incluida.'
  WHEN modalidad = 'compartida'
    THEN 'Cama en espacio compartido con ropa blanca incluida.'
END
WHERE descripcion_comercial IS NULL;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0033', 'descripciones comerciales editables por modalidad',
        'migrations/0033_commercial_modality_descriptions.sql');
