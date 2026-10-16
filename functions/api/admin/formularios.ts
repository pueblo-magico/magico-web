// Cloudflare Pages Function — pestaña "Formularios" del Dashboard interno.
//
// Trae los envíos de los formularios generales del sitio (tabla
// `formularios_web`, ver add_formularios_web.sql): Contacto, Guía de Foco,
// Dossier Aula Verde y Recetario Familion. ?formulario=contacto filtra;
// ?formato=csv descarga todo como CSV (con BOM para Excel).

import { requireAuth } from '../../_lib/authGuard';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const COLUMNAS = ['id', 'created_at', 'formulario', 'nombre', 'email', 'telefono', 'mensaje', 'extra', 'pagina'];
const ENCABEZADOS = ['#', 'Fecha (hora Argentina)', 'Formulario', 'Nombre', 'Email', 'WhatsApp', 'Mensaje', 'Otros datos', 'Página'];

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

  const params = new URL(request.url).searchParams;
  const formulario = params.get('formulario');
  const filtro = formulario ? 'WHERE formulario = ?' : '';
  const stmt = env.DB.prepare(`SELECT ${COLUMNAS.join(', ')} FROM formularios_web ${filtro} ORDER BY created_at DESC`);
  const { results } = await (formulario ? stmt.bind(formulario) : stmt).all();

  if (params.get('formato') === 'csv') {
    const lineas = [ENCABEZADOS.map(csvEscape).join(','), ...(results || []).map((r: any) => COLUMNAS.map(c => celda(r, c)).join(','))];
    return new Response('﻿' + lineas.join('\r\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="formularios-${formulario || 'todos'}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return json({ formularios: results || [] });
}
