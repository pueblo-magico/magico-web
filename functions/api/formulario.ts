// Cloudflare Pages Function — formularios generales del sitio: Contacto (inicio),
// Guía de Foco (Coliving), Dossier Aula Verde y Recetario Familion. Los manda
// src/lib/submitForm.ts. Antes iban solo a Web3Forms y no quedaban guardados;
// ahora se guardan en `formularios_web` (ver add_formularios_web.sql), avisan
// por mail a NOTIFY_EMAIL (Resend) y se ven en el Dashboard → "Formularios".
//
// Mismos filtros que /api/interes (invisibles para la persona):
//   - solo desde el sitio (Origin) y bodies chicos
//   - campo trampa `sitio_web`: "ok" falso sin guardar nada
//   - mail válido (sin typos ni temporales) y con dominio que recibe correo
//   - teléfono opcional pero creíble; nombre sin basura
//   - límite por IP (hash): 5 envíos por hora

import { validarNombre, validarEmail } from '../../src/lib/validarContacto';
import { corsHeaders, json, texto, hashIp, dominioRecibeMail, enviarMail, destinatariosAviso, origenPermitido, tablaHtml } from '../_lib/formularios';

const FORMULARIOS: Record<string, { nombre: string; tipo: 'mensaje' | 'descarga' }> = {
  contacto: { nombre: 'Contacto', tipo: 'mensaje' },
  'guia-coliving': { nombre: 'Guía de Foco — Coliving', tipo: 'descarga' },
  'dossier-aula-verde': { nombre: 'Dossier Aula Verde', tipo: 'descarga' },
  'recetario-familion': { nombre: 'Recetario Familion', tipo: 'descarga' },
};
const MAX_POR_HORA = 5;
// Campos conocidos: el resto (colegio, consentimiento…) va a `extra` como JSON.
const CAMPOS_BASE = ['formulario', 'nombre', 'name', 'nombre_apellido', 'email', 'whatsapp', 'telefono', 'message', 'mensaje', 'pagina', 'sitio_web'];

export async function onRequestOptions({ request }: any) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestPost({ request, env, waitUntil }: any) {
  const headers = corsHeaders(request);

  const origin = request.headers.get('Origin');
  if (origin && !origenPermitido(origin)) return json({ error: 'Origen no permitido.' }, 403, headers);

  let body: any;
  try {
    const raw = await request.text();
    if (raw.length > 8000) return json({ error: 'Envío demasiado grande.' }, 413, headers);
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Body inválido — se espera JSON.' }, 400, headers);
  }

  const form = FORMULARIOS[body?.formulario];
  if (!form) return json({ error: 'formulario desconocido.' }, 400, headers);

  // Bot: campo trampa lleno. "ok" falso para que no aprenda a esquivarlo.
  if (texto(body.sitio_web, 200)) return json({ ok: true }, 200, headers);

  const nombre = texto(body.nombre ?? body.name ?? body.nombre_apellido, 100).replace(/\s+/g, ' ');
  const email = texto(body.email, 120).toLowerCase();
  const telefono = texto(body.whatsapp ?? body.telefono, 30);
  const mensaje = texto(body.message ?? body.mensaje, 3000);
  const pagina = texto(body.pagina, 300) || null;

  const digitos = telefono.replace(/[^0-9]/g, '');
  const error =
    validarNombre(nombre, { requiereApellido: false }) || validarEmail(email) ||
    (digitos && (digitos.length < 8 || digitos.length > 15 || new Set(digitos).size === 1) ? 'Revisá el WhatsApp: incluí el código de área.' : null) ||
    (form.tipo === 'mensaje' && mensaje.length < 2 ? 'Escribinos tu mensaje.' : null);
  if (error) return json({ error }, 400, headers);

  const ipHash = await hashIp(request, env);
  if (ipHash) {
    const row: any = await env.DB
      .prepare(`SELECT COUNT(*) AS n FROM formularios_web WHERE ip_hash = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour')`)
      .bind(ipHash)
      .first();
    if ((row?.n || 0) >= MAX_POR_HORA) {
      return json({ error: 'Recibimos muchos envíos desde tu conexión. Probá de nuevo en un rato o escribinos por WhatsApp.' }, 429, headers);
    }
  }
  if (!(await dominioRecibeMail(email))) {
    return json({ error: 'Ese mail no existe: revisá que esté bien escrito.' }, 400, headers);
  }

  const extra: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!CAMPOS_BASE.includes(k) && typeof v === 'string' && v.trim()) extra[k] = v.trim().slice(0, 300);
  }
  const extraJson = Object.keys(extra).length ? JSON.stringify(extra) : null;

  const row: any = await env.DB
    .prepare(
      `INSERT INTO formularios_web (formulario, nombre, email, telefono, mensaje, extra, pagina, ip_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
    )
    .bind(body.formulario, nombre, email, telefono || null, mensaje || null, extraJson, pagina, ipHash)
    .first();

  const asunto = form.tipo === 'mensaje'
    ? `Nuevo mensaje · ${form.nombre} · ${nombre}`
    : `Nueva descarga · ${form.nombre} · ${nombre}`;
  waitUntil(enviarMail(
    env,
    destinatariosAviso(env),
    asunto,
    `<p>Llegó un formulario de <strong>${form.nombre}</strong> (#${row.id}).</p>` +
      tablaHtml({
        Nombre: nombre,
        Email: email,
        WhatsApp: telefono || '—',
        ...(mensaje ? { Mensaje: mensaje } : {}),
        ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '), v])),
        Página: pagina ? `experienciamagico.com${pagina}` : '—',
      }) +
      `<p style="color:#888;font-size:12px">Respondé este mail para contestarle directo. Todos los formularios están en el Dashboard → Formularios.</p>`,
    email,
  ));

  return json({ ok: true }, 200, headers);
}
