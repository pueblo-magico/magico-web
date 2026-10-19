// Cloudflare Pages Function — pestaña "Interesados" del Dashboard interno.
//
// Trae los formularios de las landings de eventos (tabla `registros_eventos`,
// ver add_registros_eventos.sql) y el conteo de clics por botón.
// ?formato=csv devuelve todos los formularios como CSV para analizar en
// Excel / Google Sheets (con BOM para que Excel lea bien los acentos).

import { requireAuth } from '../../_lib/authGuard';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const COLUMNAS = ['codigo', 'created_at', 'evento', 'valor', 'nombre', 'telefono', 'email', 'edad', 'genero', 'fuente', 'modalidad', 'cantidad', 'pagina', 'email_confirmado_at'];
const ENCABEZADOS = ['Código', 'Fecha de registro (hora Argentina)', 'Evento', 'Fecha del evento', 'Nombre y apellido', 'Teléfono', 'Email', 'Edad', 'Género', 'Cómo se enteró', 'Viene', 'Cantidad', 'Landing', 'Mail confirmado (hora Argentina)'];

// Las fechas se guardan en UTC; en el CSV van en hora argentina (UTC-3, sin horario de verano).
const FECHAS = ['created_at', 'email_confirmado_at'];
const horaAR = (iso: string) => new Date(iso.replace(' ', 'T') + (iso.endsWith('Z') ? '' : 'Z'))
  .toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false }).slice(0, 16);
const celda = (r: any, c: string) => csvEscape(FECHAS.includes(c) && r[c] ? horaAR(r[c]) : r[c]);

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function onRequestGet({ request, env }: any) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const evento = new URL(request.url).searchParams.get('evento') || 'sunset-y-rio';
  const formato = new URL(request.url).searchParams.get('formato');

  const { results } = await env.DB
    .prepare(`SELECT 'SR-' || id AS codigo, ${COLUMNAS.slice(1).join(', ')}, id FROM registros_eventos WHERE evento = ? AND tipo = 'form' ORDER BY created_at DESC`)
    .bind(evento)
    .all();

  if (formato === 'csv') {
    const lineas = [ENCABEZADOS.map(csvEscape).join(','), ...(results || []).map((r: any) => COLUMNAS.map(c => celda(r, c)).join(','))];
    return new Response('﻿' + lineas.join('\r\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="interesados-${evento}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const clics = await env.DB
    .prepare(`SELECT valor, COUNT(*) AS total FROM registros_eventos WHERE evento = ? AND tipo = 'click' GROUP BY valor`)
    .bind(evento)
    .all();

  return json({ interesados: results || [], clics: clics.results || [] });
}
