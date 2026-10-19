-- Cloudflare D1 · Tabla "registros_eventos" — Pueblo Mágico
-- Aplicar con: npx wrangler d1 execute magico-ensueno-db --file=./add_registros_eventos.sql [--remote]
-- Aditivo (CREATE TABLE IF NOT EXISTS) — no toca reservas, consultas ni interes_eventos.
--
-- Reemplaza a `interes_eventos` para las landings de eventos. Esa tabla tiene un
-- CHECK que solo acepta las fechas viejas de Sunset y Río (24 / 31 / ambas) y
-- SQLite no deja modificar un CHECK, así que la fecha final (30-1) va acá.
-- `interes_eventos` queda como histórico del paneo de fechas.
--
--   tipo = 'click' → clic en "Quiero ir" o "Vamos en grupo" (valor: 30-1 / grupo).
--                    Cuenta aunque después no completen el formulario.
--   tipo = 'form'  → formulario enviado con los datos de contacto.
-- Se descarga como CSV desde el Dashboard (pestaña "Interesados").

CREATE TABLE IF NOT EXISTS registros_eventos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  evento      TEXT NOT NULL,                                    -- slug de la landing: 'sunset-y-rio'
  tipo        TEXT NOT NULL CHECK (tipo IN ('click', 'form')),
  valor       TEXT NOT NULL,                                    -- fecha ('30-1') o 'grupo' en los clics
  nombre      TEXT,                                             -- nombre y apellido · solo form
  telefono    TEXT,
  email       TEXT,
  edad        INTEGER,
  genero      TEXT,
  fuente      TEXT,                                             -- cómo se enteró del evento
  modalidad   TEXT CHECK (modalidad IN ('solo', 'grupo')),
  cantidad    INTEGER,                                          -- solo form + grupo
  pagina      TEXT,                                             -- landing desde la que se anotó, con sus ?utm_
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_registros_eventos_evento ON registros_eventos (evento, tipo);
