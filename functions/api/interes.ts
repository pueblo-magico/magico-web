// Cloudflare Pages Function — registro de interesados de las landings de
// eventos (primero: /sunset-y-rio). Guarda en la tabla `registros_eventos`
// (ver add_registros_eventos.sql) dos cosas:
//   { tipo: 'click', evento, valor }                               → clic en un botón
//   { tipo: 'form',  evento, valor, nombre, telefono, email, edad,
//     genero, fuente, modalidad, cantidad?, pagina }               → formulario
// Los datos se validan con src/lib/validarContacto.ts (lo mismo que el
// formulario) y además se chequea que el dominio del mail reciba correo (MX).
// Cada formulario dispara, vía Resend:
//   - un aviso a NOTIFY_EMAIL (requiere RESEND_API_KEY)
//   - un mail de confirmación a la persona, con botón "Confirmar mi mail"
//     (/api/confirmar). Solo si RESEND_FROM está configurado: sin dominio
//     verificado, Resend solo deja mandar al dueño de la cuenta.
// Si un mail falla, el registro igual queda guardado. CSV en /api/admin/interesados.
//
// Anti-bots / ataques (invisibles para la persona):
//   - solo acepta envíos desde el sitio (Origin) y bodies chicos
//   - campo trampa `sitio_web` y tiempo de llenado `ms` (< 3 s = bot): se
//     responde "ok" sin guardar nada, para que el bot no aprenda a esquivarlo
//   - límite por IP (guardada como hash, no la IP): 5 formularios y 60 clics por hora
//   - el mismo mail en el mismo evento no se duplica ni dispara mails de nuevo

import { validarNombre, validarTelefono, normalizarTelefono, validarEmail, validarEdad } from '../../src/lib/validarContacto';
import { corsHeaders, json, texto, escapeHtml, hashIp, dominioRecibeMail, enviarMail, origenPermitido, tablaHtml } from '../_lib/formularios';

// Mismo número que WA_MAGICO en src/data/config.ts (ese archivo usa
// import.meta.env y no se puede importar desde una Function).
const WA_MAGICO = '5493516765820';

type Evento = { nombre: string; fecha: string; lugar: string; path: string };
const EVENTOS: Record<string, Evento> = {
  'sunset-y-rio': {
    nombre: 'Sunset y Río',
    fecha: 'viernes 30 de octubre al domingo 1 de noviembre',
    lugar: 'Pueblo Mágico · Los Gigantes, Córdoba (a 90 km de Córdoba)',
    path: '/sunset-y-rio',
  },
};
const VALORES = ['30-1', 'grupo'];
// Etiquetas = las mismas que ve la persona en el formulario (src/SunsetRio.tsx).
const GENERO_LABEL: Record<string, string> = { mujer: 'Mujer', hombre: 'Hombre', no_binario: 'No binario', prefiero_no_decir: 'Prefiere no decir' };
const FUENTE_LABEL: Record<string, string> = {
  instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', whatsapp: 'Por WhatsApp', amigos: 'Se lo contó alguien',
  google: 'Google', runclub_cordoba: 'RunclubCordoba', ya_vine: 'Ya vino a Pueblo Mágico', otro: 'Otro',
};
const GENEROS = Object.keys(GENERO_LABEL);
const MAX_FORMS_POR_HORA = 5;
const MAX_CLICS_POR_HORA = 60;
const MS_MINIMO = 3000;
const FUENTES = Object.keys(FUENTE_LABEL);

async function enviosRecientes(env: any, ipHash: string, tipo: 'click' | 'form'): Promise<number> {
  const row: any = await env.DB
    .prepare(`SELECT COUNT(*) AS n FROM registros_eventos WHERE ip_hash = ? AND tipo = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour')`)
    .bind(ipHash, tipo)
    .first();
  return row?.n || 0;
}

function mailAviso(ev: Evento, datos: Record<string, string | number | null>) {
  return `<p>Alguien completó el formulario de <strong>${ev.nombre}</strong> (${ev.fecha}).</p>${tablaHtml(datos)}<p style="color:#888;font-size:12px">Todos los registros se descargan en CSV desde el Dashboard → Interesados.</p>`;
}

function mailConfirmacion(ev: Evento, nombre: string, codigo: string, linkConfirmar: string, linkWa: string, linkLanding: string) {
  const btn = (href: string, label: string, bg: string, color: string) =>
    `<a href="${href}" style="display:inline-block;background:${bg};color:${color};text-decoration:none;font-weight:bold;padding:14px 26px;border-radius:999px;font-size:15px">${label}</a>`;
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#2A1708;line-height:1.5">
  <p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#D9622B;font-weight:bold;margin:0 0 8px">${ev.nombre}</p>
  <h1 style="font-size:24px;margin:0 0 16px">¡Hola ${escapeHtml(nombre.split(' ')[0])}, ya estás en la lista!</h1>
  <p>Recibimos tus datos para <strong>${ev.nombre}</strong>:</p>
  <p style="background:#F7F1E8;border-radius:12px;padding:14px 16px;margin:0 0 20px">
    📅 <strong>${ev.fecha}</strong><br>📍 ${ev.lugar}<br>🎟️ Tu código: <strong>${codigo}</strong>
  </p>
  <p>Un último paso: confirmá tu mail para que te avisemos apenas abramos las reservas, con precios y todos los detalles.</p>
  <p style="text-align:center;margin:24px 0">${btn(linkConfirmar, 'Confirmar mi mail', '#D9622B', '#ffffff')}</p>
  <p>Río de día, atardecer con música y fogón a la noche. Mientras tanto, si tenés preguntas, escribinos por WhatsApp con tu código:</p>
  <p style="text-align:center;margin:20px 0">${btn(linkWa, 'Escribir por WhatsApp', '#25D366', '#ffffff')}</p>
  <p style="font-size:13px;color:#8B6347">Todavía no tomamos reservas ni pagos. Más info en <a href="${linkLanding}" style="color:#B5401F">${linkLanding.replace(/^https?:\/\//, '')}</a>.<br>Si no fuiste vos, ignorá este mail.</p>
  <p style="font-size:13px;color:#8B6347">— Pueblo Mágico · Ecolodge de montaña</p>
</div>`;
}

export async function onRequestOptions({ request }: any) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestPost({ request, env, waitUntil }: any) {
  const headers = corsHeaders(request);

  const origin = request.headers.get('Origin');
  if (origin && !origenPermitido(origin)) {
    return json({ error: 'Origen no permitido.' }, 403, headers);
  }

  let body: any;
  try {
    // sendBeacon manda text/plain — se parsea igual como JSON.
    const raw = await request.text();
    if (raw.length > 4000) return json({ error: 'Envío demasiado grande.' }, 413, headers);
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Body inválido — se espera JSON.' }, 400, headers);
  }

  const { tipo, evento, valor } = body || {};
  if (!(evento in EVENTOS)) return json({ error: 'evento desconocido.' }, 400, headers);
  if (!VALORES.includes(valor)) return json({ error: "valor debe ser '30-1' o 'grupo'." }, 400, headers);

  const ipHash = await hashIp(request, env);

  if (tipo === 'click') {
    if (ipHash && (await enviosRecientes(env, ipHash, 'click')) >= MAX_CLICS_POR_HORA) return json({ ok: true }, 200, headers);
    await env.DB
      .prepare('INSERT INTO registros_eventos (evento, tipo, valor, ip_hash) VALUES (?, ?, ?, ?)')
      .bind(evento, 'click', valor, ipHash)
      .run();
    return json({ ok: true }, 200, headers);
  }

  if (tipo !== 'form') return json({ error: "tipo debe ser 'click' o 'form'." }, 400, headers);
  if (valor === 'grupo') return json({ error: "En el formulario la fecha es '30-1'." }, 400, headers);

  // Bot: campo trampa lleno o formulario enviado en menos de 3 s. "ok" falso.
  if (texto(body.sitio_web, 200) || Number(body.ms) < MS_MINIMO) return json({ ok: true, codigo: '' }, 200, headers);
  if (ipHash && (await enviosRecientes(env, ipHash, 'form')) >= MAX_FORMS_POR_HORA) {
    return json({ error: 'Recibimos muchos envíos desde tu conexión. Probá de nuevo en un rato o escribinos por WhatsApp.' }, 429, headers);
  }



  const nombre = texto(body.nombre, 100).replace(/\s+/g, ' ');
  const telefonoRaw = texto(body.telefono, 30);
  const email = texto(body.email, 120).toLowerCase();
  const edad = Number(body.edad);
  const genero = texto(body.genero, 30);
  const fuente = texto(body.fuente, 30);
  const fuenteOtro = texto(body.fuenteOtro, 80);
  const modalidad = body.modalidad;
  const pagina = texto(body.pagina, 300) || null;

  const error =
    validarNombre(nombre) || validarTelefono(telefonoRaw) || validarEmail(email) || validarEdad(edad) ||
    (!GENEROS.includes(genero) ? 'Elegí una opción de género.' : null) ||
    (!FUENTES.includes(fuente) ? 'Contanos cómo te enteraste del evento.' : null) ||
    (modalidad !== 'solo' && modalidad !== 'grupo' ? 'Contanos si venís solo/a o en grupo.' : null);
  if (error) return json({ error }, 400, headers);

  let cantidad: number | null = null;
  if (modalidad === 'grupo') {
    cantidad = Number(body.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 2 || cantidad > 30) {
      return json({ error: '¿Cuántos son? (entre 2 y 30)' }, 400, headers);
    }
  }
  if (!(await dominioRecibeMail(email))) {
    return json({ error: 'Ese mail no existe: revisá que esté bien escrito.' }, 400, headers);
  }

  // Misma persona anotándose de nuevo: devolvemos su código, sin duplicar ni re-mandar mails.
  const previo: any = await env.DB
    .prepare(`SELECT id FROM registros_eventos WHERE evento = ? AND tipo = 'form' AND email = ?`)
    .bind(evento, email)
    .first();
  if (previo) return json({ ok: true, codigo: `SR-${previo.id}` }, 200, headers);

  const telefono = normalizarTelefono(telefonoRaw)!;
  const fuenteFinal = fuente === 'otro' && fuenteOtro ? `otro: ${fuenteOtro}` : fuente;
  const token = crypto.randomUUID();

  const row: any = await env.DB
    .prepare(
      `INSERT INTO registros_eventos (evento, tipo, valor, nombre, telefono, email, edad, genero, fuente, modalidad, cantidad, pagina, token, ip_hash)
       VALUES (?, 'form', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
    )
    .bind(evento, valor, nombre, telefono, email, edad, genero, fuenteFinal, modalidad, cantidad, pagina, token, ipHash)
    .first();

  const ev = EVENTOS[evento];
  const codigo = `SR-${row.id}`;
  const origen = new URL(request.url).origin;
  const fuenteLabel = fuente === 'otro' && fuenteOtro ? `Otro: ${fuenteOtro}` : FUENTE_LABEL[fuente];

  if (env.RESEND_API_KEY && env.NOTIFY_EMAIL) {
    waitUntil(enviarMail(
      env,
      String(env.NOTIFY_EMAIL).split(',').map((s: string) => s.trim()).filter(Boolean),
      `Nuevo interesado · ${ev.nombre} · ${nombre}`,
      mailAviso(ev, {
        Código: codigo,
        Nombre: nombre,
        Teléfono: telefono,
        Email: email,
        Edad: edad,
        Género: GENERO_LABEL[genero],
        'Cómo se enteró': fuenteLabel,
        Viene: modalidad === 'grupo' ? `En grupo (${cantidad})` : 'Solo/a',
        Landing: pagina ? `experienciamagico.com${pagina}` : '—',
      }),
    ));
  }

  if (env.RESEND_API_KEY && env.RESEND_FROM) {
    const linkWa = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(`¡Hola! Soy ${nombre}, me anoté a ${ev.nombre} (código ${codigo}). Tengo una consulta:`)}`;
    waitUntil(enviarMail(
      env,
      [email],
      `Ya estás en la lista · ${ev.nombre} · ${codigo}`,
      mailConfirmacion(ev, nombre, codigo, `${origen}/api/confirmar?t=${token}`, linkWa, `${origen}${ev.path}`),
    ));
  }

  return json({ ok: true, codigo, mailConfirmacion: Boolean(env.RESEND_API_KEY && env.RESEND_FROM) }, 200, headers);
}
