import { construirAlertasOperativas, type EstadoOperativoMvp } from '../../_domain/reservas/mvpOperations.ts';

export interface RepositorioOperacionesMvp {
  consultar(entrada: { ahora: string; limite: number }): Promise<Omit<EstadoOperativoMvp, 'alertas'>>;
}

export async function consultarOperacionesMvp(
  repositorio: RepositorioOperacionesMvp,
  limite = 50,
  ahora: () => Date = () => new Date()
): Promise<EstadoOperativoMvp> {
  const estado = await repositorio.consultar({
    ahora: ahora().toISOString(),
    limite: Math.max(1, Math.min(100, Math.trunc(limite) || 50)),
  });
  return { ...estado, alertas: construirAlertasOperativas(estado) };
}
