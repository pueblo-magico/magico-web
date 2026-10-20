-- Meal service windows are operational configuration, independent from food
-- prices. A single versioned row keeps breakfast, lunch and dinner changes
-- atomic and avoids publishing contradictory schedules.
CREATE TABLE configuracion_horarios_comidas (
  id                     INTEGER PRIMARY KEY CHECK (id = 1),
  version                INTEGER NOT NULL CHECK (version >= 1),
  desayuno_desde         TEXT NOT NULL,
  desayuno_hasta         TEXT NOT NULL,
  almuerzo_desde         TEXT NOT NULL,
  almuerzo_hasta         TEXT NOT NULL,
  cena_desde             TEXT NOT NULL,
  cena_hasta             TEXT NOT NULL,
  updated_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (length(desayuno_desde) = 5 AND length(desayuno_hasta) = 5),
  CHECK (length(almuerzo_desde) = 5 AND length(almuerzo_hasta) = 5),
  CHECK (length(cena_desde) = 5 AND length(cena_hasta) = 5),
  CHECK (desayuno_desde GLOB '[0-2][0-9]:[0-5][0-9]' AND substr(desayuno_desde, 1, 2) <= '23'),
  CHECK (desayuno_hasta GLOB '[0-2][0-9]:[0-5][0-9]' AND substr(desayuno_hasta, 1, 2) <= '23'),
  CHECK (almuerzo_desde GLOB '[0-2][0-9]:[0-5][0-9]' AND substr(almuerzo_desde, 1, 2) <= '23'),
  CHECK (almuerzo_hasta GLOB '[0-2][0-9]:[0-5][0-9]' AND substr(almuerzo_hasta, 1, 2) <= '23'),
  CHECK (cena_desde GLOB '[0-2][0-9]:[0-5][0-9]' AND substr(cena_desde, 1, 2) <= '23'),
  CHECK (cena_hasta GLOB '[0-2][0-9]:[0-5][0-9]' AND substr(cena_hasta, 1, 2) <= '23'),
  CHECK (desayuno_desde < desayuno_hasta),
  CHECK (almuerzo_desde < almuerzo_hasta),
  CHECK (cena_desde < cena_hasta)
);

INSERT INTO configuracion_horarios_comidas (
  id, version, desayuno_desde, desayuno_hasta,
  almuerzo_desde, almuerzo_hasta, cena_desde, cena_hasta
) VALUES (1, 1, '09:00', '10:00', '14:00', '15:00', '20:00', '21:00');

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0036', 'horarios configurables y auditables del servicio de comidas',
        'migrations/0036_configurable_meal_schedules.sql');
