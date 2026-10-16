-- Cloudflare D1 · Confirmación de mail en "registros_eventos" — Pueblo Mágico
-- Aplicar con: npx wrangler d1 execute magico-ensueno-db --file=./add_confirmacion_registros.sql [--remote]
-- Aditivo: agrega dos columnas vacías, no toca filas existentes.
--
-- Cada formulario genera un token para el botón "Confirmar mi mail" del mail
-- de confirmación (functions/api/confirmar.ts). Si la persona lo toca, se
-- guarda la fecha: prueba que el mail es real.

--
-- ip_hash: hash de la IP (nunca la IP en sí) para limitar envíos por conexión
-- y frenar bots — ver functions/api/interes.ts.

ALTER TABLE registros_eventos ADD COLUMN token TEXT;
ALTER TABLE registros_eventos ADD COLUMN email_confirmado_at TEXT;
ALTER TABLE registros_eventos ADD COLUMN ip_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_registros_eventos_token ON registros_eventos (token);
CREATE INDEX IF NOT EXISTS idx_registros_eventos_ip ON registros_eventos (ip_hash, tipo, created_at);
