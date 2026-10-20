-- Cloudflare D1 · Tabla "formularios_web" — Pueblo Mágico
-- Aplicar con: npx wrangler d1 execute magico-ensueno-db --file=./add_formularios_web.sql [--remote]
-- Aditivo (CREATE TABLE IF NOT EXISTS) — no toca ninguna otra tabla.
--
-- Mensajes y descargas de los formularios generales del sitio (antes iban solo
-- por Web3Forms y no quedaban guardados): Contacto (inicio), Guía de Foco
-- (Coliving), Dossier Aula Verde y Recetario Familion. Los guarda
-- functions/api/formulario.ts, que además avisa por mail (Resend).
-- Se ven y descargan en CSV desde el Dashboard → pestaña "Formularios".
-- Los interesados de eventos (Sunset y Río) van aparte, en registros_eventos.

CREATE TABLE IF NOT EXISTS formularios_web (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  formulario  TEXT NOT NULL,     -- 'contacto' | 'guia-coliving' | 'dossier-aula-verde' | 'recetario-familion'
  nombre      TEXT,
  email       TEXT NOT NULL,
  telefono    TEXT,
  mensaje     TEXT,              -- solo Contacto
  extra       TEXT,              -- JSON con el resto de los campos (colegio, consentimiento…)
  pagina      TEXT,              -- página desde la que se envió, con sus ?utm_
  ip_hash     TEXT,              -- hash de la IP (nunca la IP) para limitar envíos por conexión
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_formularios_web_formulario ON formularios_web (formulario, created_at);
CREATE INDEX IF NOT EXISTS idx_formularios_web_ip ON formularios_web (ip_hash, created_at);
