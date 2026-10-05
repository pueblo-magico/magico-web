import { agregarDiasIso } from './dateRange.ts';
import type {
  AlojamientoCalendario,
  CalendarioDisponibilidad,
  ReservaCalendario,
} from './models.ts';

export function construirCalendarioDisponibilidad(
  desde: string,
  hasta: string,
  alojamientos: AlojamientoCalendario[],
  reservas: ReservaCalendario[]
): CalendarioDisponibilidad {
  const totalDomos = alojamientos.filter((alojamiento) => alojamiento.tipo === 'domo').length;
  const refugio = alojamientos.find((alojamiento) => alojamiento.tipo === 'refugio');
  const capacidadRefugio = refugio ? Number(refugio.capacidad_total) : 15;

  const unidadesBlocked: Record<number, string[]> = {};
  for (const alojamiento of alojamientos) unidadesBlocked[alojamiento.id] = [];

  const blockedDomo: string[] = [];
  const blockedRefugio: string[] = [];

  for (let dia = desde; dia < hasta; dia = agregarDiasIso(dia, 1)) {
    const diaFin = agregarDiasIso(dia, 1);
    const domosOcupados = new Set<number>();
    let personasRefugio = 0;

    for (const reserva of reservas) {
      const solapa = reserva.fecha_checkin < diaFin && reserva.fecha_checkout > dia;
      if (!solapa) continue;

      const alojamiento = alojamientos.find((item) => item.id === reserva.alojamiento_id);
      if (!alojamiento) continue;

      if (alojamiento.tipo === 'domo') {
        domosOcupados.add(reserva.alojamiento_id);
        unidadesBlocked[reserva.alojamiento_id].push(dia);
      } else {
        personasRefugio += Number(reserva.cantidad_personas) || 0;
      }
    }

    if (totalDomos > 0 && domosOcupados.size >= totalDomos) blockedDomo.push(dia);
    if (personasRefugio >= capacidadRefugio) blockedRefugio.push(dia);
  }

  return {
    desde,
    hasta,
    domo: { blocked: blockedDomo },
    refugio: { blocked: blockedRefugio },
    unidades: alojamientos.map((alojamiento) => ({
      id: alojamiento.id,
      nombre: alojamiento.nombre,
      tipo: alojamiento.tipo,
      blocked: unidadesBlocked[alojamiento.id] || [],
    })),
  };
}
