import type { ProveedorCuentasCobro } from '../../_application/reservas/ports.ts';

/**
 * Límite deliberado: Cucuru publica que dispone de APIs, pero su especificación
 * técnica requiere acceso entregado por soporte. Hasta incorporar y probar ese
 * contrato, activar la feature falla cerrado y nunca inventa rutas o payloads.
 */
export class CucuruContratoNoDisponible implements ProveedorCuentasCobro {
  async buscarPorCustomerId(): Promise<null> {
    throw new Error('CUCURU_CONTRATO_NO_CONFIGURADO');
  }

  async crear(): Promise<never> {
    throw new Error('CUCURU_CONTRATO_NO_CONFIGURADO');
  }
}

