// Validación de datos de contacto de los formularios de eventos. La usan el
// formulario (src/SunsetRio.tsx) y el servidor (functions/api/interes.ts), así
// las dos puntas rechazan lo mismo. Devuelve el mensaje de error o null.
// El servidor además chequea que el dominio del mail reciba correo (MX).

const NOMBRES_FALSOS = /^(test|prueba|asd|asdf|qwe|qwerty|aaa|xxx|nn|no|nombre|apellido|fake|null|undefined)$/i;
const TECLADO = /(asdf|qwer|zxcv|hjkl|sdfg|jkl)/i;

export function validarNombre(raw: string, { requiereApellido = true } = {}): string | null {
  const nombre = raw.trim().replace(/\s+/g, ' ');
  const partes = nombre.split(' ');
  if (!nombre) return 'Contanos tu nombre.';
  if (requiereApellido && partes.length < 2) return 'Poné tu nombre y apellido.';
  if (!/^[\p{L}' .-]+$/u.test(nombre)) return 'El nombre solo puede tener letras.';
  if (partes.some(p => p.replace(/[.'-]/g, '').length < 2)) return 'Poné tu nombre y apellido completos.';
  if (partes.some(p => NOMBRES_FALSOS.test(p)) || TECLADO.test(nombre)) return 'Ese nombre no parece real.';
  if (/(.)\1{2,}/i.test(nombre.replace(/\s/g, ''))) return 'Ese nombre no parece real.';
  return null;
}

// Teléfono argentino: se acepta con o sin +54, 9, 0 o 15. Normalizado debe
// quedar en 10 dígitos (código de área + número). También acepta extranjeros
// si vienen con + y el código de país.
export function normalizarTelefono(raw: string): string | null {
  const t = raw.trim();
  let d = t.replace(/\D/g, '');
  if (t.startsWith('+') && !t.startsWith('+54')) return d.length >= 8 && d.length <= 15 ? `+${d}` : null;
  if (d.startsWith('54')) d = d.slice(2);
  if (d.startsWith('9') && d.length === 11) d = d.slice(1);
  if (d.startsWith('0')) d = d.slice(1);
  // 15 local después del código de área (ej. 351 15 1234567)
  const m = /^(\d{2,4})15(\d{6,8})$/.exec(d);
  if (d.length === 12 && m && (m[1] + m[2]).length === 10) d = m[1] + m[2];
  if (d.length !== 10) return null;
  return `+549${d}`;
}

export function validarTelefono(raw: string): string | null {
  const tel = normalizarTelefono(raw);
  if (!tel) return 'Revisá el teléfono: código de área + número (ej. 351 123 4567).';
  const num = tel.replace(/\D/g, '').slice(-8);
  if (/^(\d)\1+$/.test(num) || '0123456789012'.includes(num) || '9876543210987'.includes(num)) {
    return 'Ese teléfono no parece real.';
  }
  return null;
}

const DESCARTABLES = [
  'mailinator.com', 'yopmail.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org',
  'trashmail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com', 'maildrop.cc', 'fakeinbox.com',
  'throwawaymail.com', 'mintemail.com', 'emailondeck.com', 'mohmal.com', 'tempail.com', 'example.com', 'test.com',
];
const TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com',
  'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmail.om': 'gmail.com', 'gmaill.com': 'gmail.com',
  'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'hotmai.com': 'hotmail.com',
  'yahoo.con': 'yahoo.com', 'yaho.com': 'yahoo.com', 'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com',
};

export function validarEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) return 'Revisá el mail.';
  const [usuario, dominio] = email.split('@');
  if (TYPOS[dominio]) return `¿Quisiste decir ${usuario}@${TYPOS[dominio]}?`;
  if (DESCARTABLES.includes(dominio)) return 'Usá un mail real (no temporal).';
  if (/^(test|prueba|asdf|qwerty|aaa+|xxx+|fake|noreply|no-reply)\d*$/.test(usuario)) return 'Ese mail no parece real.';
  return null;
}

export function validarEdad(raw: string | number): string | null {
  const edad = Number(raw);
  if (!Number.isInteger(edad) || edad < 16 || edad > 90) return 'Revisá la edad (entre 16 y 90).';
  return null;
}
