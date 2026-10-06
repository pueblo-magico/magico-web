import { validarPlanTarifaBorrador, type PlanTarifaBorrador } from '../../_domain/reservas/ratePlanAdministration.ts';
import { ErrorReserva } from '../../_domain/reservas/errors.ts';
import type { RegistroAuditoriaReservas, RepositorioAdministracionTarifas, ResumenPlanTarifa } from './ports.ts';

export async function crearBorradorTarifa(
  plan: PlanTarifaBorrador,
  actorEmail: string,
  repositorio: RepositorioAdministracionTarifas,
  auditoria: RegistroAuditoriaReservas
): Promise<ResumenPlanTarifa> {
  validarPlanTarifaBorrador(plan);
  const creado = await repositorio.crearBorrador(plan);
  await auditoria.registrar({
    email: actorEmail, accion: 'crear_borrador_tarifa', entidadTipo: 'plan_tarifa', entidadId: creado.id,
    metadata: { codigo: creado.codigo, version: creado.version },
  });
  return creado;
}

export async function publicarPlanTarifa(
  planId: number,
  actorEmail: string,
  repositorio: RepositorioAdministracionTarifas,
  auditoria: RegistroAuditoriaReservas
): Promise<ResumenPlanTarifa> {
  const publicado = await repositorio.publicar(planId);
  if (!publicado) throw new ErrorReserva('CONFLICTO_RESERVA', 'El plan no existe o ya no está en borrador.');
  await auditoria.registrar({
    email: actorEmail, accion: 'publicar_plan_tarifa', entidadTipo: 'plan_tarifa', entidadId: publicado.id,
    metadata: { codigo: publicado.codigo, version: publicado.version },
  });
  return publicado;
}
