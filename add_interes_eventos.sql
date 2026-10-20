-- Cloudflare D1 · Tabla "interes_eventos" — Pueblo Mágico
-- Aplicar con: npx wrangler d1 execute magico-ensueno-db --file=./add_interes_eventos.sql [--remote]
-- Aditivo (CREATE TABLE IF NOT EXISTS) — no toca reservas, consultas ni alojamientos.
--
-- Paneo de landings de validación (primero: /sunset-y-rio). Antes de abrir
-- señas se mide qué fecha elige la gente. Dos tipos de fila:
--   tipo = 'click' → evento fecha_elegida: clic en un botón de fecha o en
--                    "Vamos en grupo" (valor: 24 / 31 / ambas / grupo).
--                    Cuenta aunque después no completen el formulario.
--   tipo = 'form'  → formulario enviado: nombre, fecha y si viene solo/a o en grupo.
-- Separada de `consultas` (leads de ManyChat con monto cotizado) y de `reservas`.

CREATE TABLE IF NOT EXISTS interes_eventos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  evento      TEXT NOT NULL,                                    -- slug de la landing: 'sunset-y-rio'
  tipo        TEXT NOT NULL CHECK (tipo IN ('click', 'form')),
  valor       TEXT NOT NULL CHECK (valor IN ('24', '31', 'ambas', 'grupo')),  -- click: botón · form: fecha elegida
  nombre      TEXT,                                             -- solo form
  modalidad   TEXT CHECK (modalidad IN ('solo', 'grupo')),      -- solo form
  cantidad    INTEGER,                                          -- solo form + grupo
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_interes_eventos_evento ON interes_eventos (evento, tipo);

-- Conteo para elegir fecha (personas, no contactos — ver Parte 5 del paneo):
--   SELECT valor, COUNT(*) AS formularios, SUM(COALESCE(cantidad, 1)) AS personas
--   FROM interes_eventos WHERE evento = 'sunset-y-rio' AND tipo = 'form' GROUP BY valor;
--   SELECT valor, COUNT(*) AS clics
--   FROM interes_eventos WHERE evento = 'sunset-y-rio' AND tipo = 'click' GROUP BY valor;
