import { WEB3FORMS_ACCESS_KEY } from '../data/config';

/**
 * Envía los formularios generales del sitio (Contacto, Guía de Foco, Dossier
 * Aula Verde, Recetario Familion) a /api/formulario: se guardan en D1, avisan
 * por mail y se ven en el Dashboard → "Formularios" (functions/api/formulario.ts).
 *
 * Si nuestra API no responde (caída o error 5xx), cae a Web3Forms como
 * respaldo para no perder el mensaje. Los errores de validación (4xx: mail
 * inválido, demasiados envíos…) sí se devuelven al formulario.
 */
export type Formulario = 'contacto' | 'guia-coliving' | 'dossier-aula-verde' | 'recetario-familion';

const NOMBRES: Record<Formulario, string> = {
  contacto: 'Formulario de Contacto',
  'guia-coliving': 'Guía de Foco — Coliving',
  'dossier-aula-verde': 'Dossier PDF — Aula Verde',
  'recetario-familion': 'Recetario — Familion',
};

export async function submitForm(formulario: Formulario, data: FormData | Record<string, unknown>) {
  const campos: Record<string, string> = {};
  if (data instanceof FormData) data.forEach((v, k) => { if (typeof v === 'string') campos[k] = v; });
  else Object.entries(data).forEach(([k, v]) => { campos[k] = String(v); });

  try {
    const res = await fetch('/api/formulario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...campos, formulario, pagina: window.location.pathname + window.location.search }),
    });
    const result = await res.json().catch(() => null);
    if (res.ok) return result;
    if (res.status < 500) throw new ErrorValidacion(result?.error || 'Revisá los datos del formulario.');
  } catch (e) {
    if (e instanceof ErrorValidacion) throw e;
  }
  return enviarPorWeb3Forms(NOMBRES[formulario], campos);
}

class ErrorValidacion extends Error {}

// Respaldo. El body va como FormData (no JSON) y sin fijar Content-Type a
// mano — así el request queda dentro de los headers "simples" de CORS y el
// navegador no dispara un preflight, que la API de Web3Forms no responde bien.
async function enviarPorWeb3Forms(formName: string, campos: Record<string, string>) {
  const formData = new FormData();
  Object.entries(campos).forEach(([k, v]) => { if (k !== 'sitio_web') formData.append(k, v); });
  formData.append('access_key', WEB3FORMS_ACCESS_KEY);
  formData.append('subject', `Pueblo Mágico — ${formName}`);
  formData.append('from_name', 'Pueblo Mágico Web');

  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData,
  });

  const result = await res.json().catch(() => null);
  if (!res.ok || !result?.success) {
    throw new Error(result?.message || 'No se pudo enviar el formulario');
  }
  return result;
}
