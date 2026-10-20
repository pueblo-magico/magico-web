// Genera el INSERT SQL para crear un usuario del Panel de Reservas.
// Existe porque hay un problema del huevo y la gallina: sin ningún usuario
// no hay forma de loguearse, y sin loguearse no se puede usar la pestaña
// "Usuarios" del panel para crear al resto. Para altas normales del día a
// día, usar esa pestaña en vez de este script.
//
// Uso:
//   node scripts/crear-usuario-admin.mjs correo@ejemplo.com "contraseña larga" [rol]
//   rol: super_admin | editor | viewer (default: editor)
//
// Copiá el INSERT que imprime y corré (sacá --remote para probar en local primero):
//   npx wrangler d1 execute magico-ensueno-db --remote --command "<pegar acá>"
//
// Mismos parámetros PBKDF2 que functions/_lib/passwords.ts — el hash que
// genera este script es válido para verifyPassword() en el Worker.

import { randomBytes, pbkdf2Sync } from 'node:crypto';

const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_LENGTH_BYTES = 32;
const ROLES_VALIDOS = ['super_admin', 'editor', 'viewer'];

const [, , emailArg, passwordArg, rolArg] = process.argv;
const rol = rolArg || 'editor';

if (!emailArg || !passwordArg) {
  console.error('Uso: node scripts/crear-usuario-admin.mjs correo@ejemplo.com "contraseña" [super_admin|editor|viewer]');
  process.exit(1);
}
if (passwordArg.length < 12) {
  console.error('La contraseña debe tener al menos 12 caracteres.');
  process.exit(1);
}
if (!ROLES_VALIDOS.includes(rol)) {
  console.error(`rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}.`);
  process.exit(1);
}

const email = emailArg.trim().toLowerCase().replace(/'/g, "''");
const salt = randomBytes(SALT_BYTES);
const hash = pbkdf2Sync(passwordArg, salt, ITERATIONS, KEY_LENGTH_BYTES, 'sha256');
const passwordHash = `pbkdf2$${ITERATIONS}$${salt.toString('hex')}$${hash.toString('hex')}`;

const sql = `INSERT INTO usuarios_admin (email, password_hash, rol) VALUES ('${email}', '${passwordHash}', '${rol}');`;

console.log('\nPegá esto en wrangler d1 execute:\n');
console.log(sql);
console.log('\nEj:\n');
console.log(`npx wrangler d1 execute magico-ensueno-db --remote --command "${sql}"\n`);
