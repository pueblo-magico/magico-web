type ResumenAportes = {
  amountCents: number;
  donationsCount: number;
  currency: 'ARS';
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function enteroNoNegativo(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export async function consultarResumenAportes(db: any): Promise<ResumenAportes> {
  const row = await db.prepare(`
    SELECT
      COALESCE(SUM(amount_cents), 0) AS amount_cents,
      COUNT(*) AS donations_count
    FROM reforestacion_aportes
    WHERE estado = 'confirmado' AND currency = 'ARS'
  `).first();

  return {
    amountCents: enteroNoNegativo(row?.amount_cents),
    donationsCount: enteroNoNegativo(row?.donations_count),
    currency: 'ARS',
  };
}

export async function onRequestGet({ env }: any): Promise<Response> {
  if (!env.DB) {
    return json({ error: 'Resumen de aportes no disponible.' }, 503);
  }

  try {
    return json(await consultarResumenAportes(env.DB));
  } catch (error) {
    console.error('reforestacion-aportes: no se pudo calcular el resumen', error);
    return json({ error: 'Resumen de aportes temporalmente no disponible.' }, 503);
  }
}
