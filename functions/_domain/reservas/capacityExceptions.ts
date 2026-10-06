import { ErrorReserva } from './errors.ts';

export type EstadoExcepcionCapacidad = 'solicitada' | 'aprobada' | 'rechazada' | 'revocada';

export type ContextoCapacidadReserva = {
  reservaId: number;
  reservaEstadiaId: number;
  fechaCheckin: string;
  fechaCheckout: string;
  espacioCodigo: string;
  espacioTipo: string;
  capacidadComercial: number;
  capacidadOperativaMaxima: number;
  cantidadHuespedes: number;
  capacidadAsignada: number;
};

export type ExcepcionCapacidad = {
  id: number;
  reservaId: number;
  reservaEstadiaId: number;
  capacidadAutorizada: number;
  motivo: string;
  planCamas: string;
  fechaDesde: string | null;
  fechaHasta: string | null;
  estado: EstadoExcepcionCapacidad;
  solicitadaPor: string;
  decididaPor: string | null;
  solicitadaAt: string;
  decididaAt: string | null;
};

export type NuevaSolicitudExcepcionCapacidad = {
  capacidadAutorizada: number;
  motivo: string;
  planCamas: string;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
};

export type SolicitudExcepcionCapacidadValidada = NuevaSolicitudExcepcionCapacidad & {
  reservaId: number;
  reservaEstadiaId: number;
  motivo: string;
  planCamas: string;
  fechaDesde: string | null;
  fechaHasta: string | null;
};

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export function validarSolicitudExcepcionCapacidad(
  contexto: ContextoCapacidadReserva,
  solicitud: NuevaSolicitudExcepcionCapacidad
): SolicitudExcepcionCapacidadValidada {
  if (contexto.espacioTipo !== 'domo') {
    throw new ErrorReserva('DATOS_INVALIDOS', 'Las excepciones de capacidad sólo están permitidas para domos.');
  }

  const capacidad = Number(solicitud.capacidadAutorizada);
  if (!Number.isInteger(capacidad) || capacidad <= contexto.capacidadComercial) {
    throw new ErrorReserva(
      'DATOS_INVALIDOS',
      `La capacidad excepcional debe superar la capacidad comercial de ${contexto.capacidadComercial}.`
    );
  }
  if (capacidad > contexto.capacidadOperativaMaxima) {
    throw new ErrorReserva(
      'DATOS_INVALIDOS',
      `La capacidad no puede superar el máximo operativo de ${contexto.capacidadOperativaMaxima}.`
    );
  }
  if (capacidad < contexto.capacidadAsignada) {
    throw new ErrorReserva(
      'CONFLICTO_RESERVA',
      'La capacidad solicitada es menor que la ocupación ya asignada a la estadía.'
    );
  }

  const motivo = String(solicitud.motivo || '').trim();
  const planCamas = String(solicitud.planCamas || '').trim();
  if (!motivo || !planCamas) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El motivo y el plan de camas son obligatorios.');
  }

  const fechaDesde = solicitud.fechaDesde || null;
  const fechaHasta = solicitud.fechaHasta || null;
  if ((fechaDesde === null) !== (fechaHasta === null)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El alcance nocturno requiere fecha desde y fecha hasta.');
  }
  if (fechaDesde && fechaHasta) {
    if (!FECHA_ISO.test(fechaDesde) || !FECHA_ISO.test(fechaHasta) || fechaHasta <= fechaDesde) {
      throw new ErrorReserva('DATOS_INVALIDOS', 'El alcance nocturno de la excepción no es válido.');
    }
    if (fechaDesde < contexto.fechaCheckin || fechaHasta > contexto.fechaCheckout) {
      throw new ErrorReserva('DATOS_INVALIDOS', 'El alcance de la excepción debe estar dentro de la estadía.');
    }
  }

  return {
    reservaId: contexto.reservaId,
    reservaEstadiaId: contexto.reservaEstadiaId,
    capacidadAutorizada: capacidad,
    motivo,
    planCamas,
    fechaDesde,
    fechaHasta,
  };
}

export function estadoEsperadoParaAccion(
  accion: 'aprobar' | 'rechazar' | 'revocar'
): { actual: EstadoExcepcionCapacidad; siguiente: EstadoExcepcionCapacidad } {
  if (accion === 'revocar') return { actual: 'aprobada', siguiente: 'revocada' };
  return { actual: 'solicitada', siguiente: accion === 'aprobar' ? 'aprobada' : 'rechazada' };
}
