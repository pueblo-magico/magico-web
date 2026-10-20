import type { ContextoAlojamiento } from '../../_domain/reservas/accommodationInventory.ts';
import type { RepositorioInventarioAlojamiento } from './ports.ts';

export async function listarAlojamientosPublicos(
  contexto: ContextoAlojamiento,
  repositorio: RepositorioInventarioAlojamiento
) {
  const espacios = await repositorio.listarEspaciosReservables(contexto);
  const tipos = [...new Set(espacios.map(espacio =>
    (espacio.tipo === 'habitacion' ? 'refugio' : espacio.tipo) as 'domo' | 'refugio' | 'camping' | 'bell_tent'
  ))];
  const serviciosPorTipo = new Map(await Promise.all(tipos.map(async tipo => [
    tipo,
    await repositorio.listarServicios(tipo),
  ] as const)));
  const opcionesPreparacionPorTipo = new Map(await Promise.all(tipos.map(async tipo => [
    tipo,
    await repositorio.listarOpcionesPreparacion(tipo),
  ] as const)));
  const resultados = await Promise.all(espacios.map(async espacio => ({
    codigo: espacio.codigo,
    nombre: espacio.nombre,
    tipo: espacio.tipo === 'habitacion' ? 'refugio' : espacio.tipo,
    capacidad_comercial: espacio.capacidadComercial,
    servicios: (serviciosPorTipo.get(
      (espacio.tipo === 'habitacion' ? 'refugio' : espacio.tipo) as 'domo' | 'refugio' | 'camping' | 'bell_tent'
    ) || []).map(item => ({
      codigo: item.codigo,
      nombre: item.nombre,
      disponibilidad: item.disponibilidad,
      detalle: item.detalle,
    })),
    opciones_preparacion: (opcionesPreparacionPorTipo.get(
      (espacio.tipo === 'habitacion' ? 'refugio' : espacio.tipo) as 'domo' | 'refugio' | 'camping' | 'bell_tent'
    ) || []).map(item => ({
      modalidad: item.modalidad,
      cantidad_personas: item.cantidadPersonas,
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion,
    })),
    modalidades: (await repositorio.listarModalidades(espacio.id))
      .filter(item => item.habilitada && item.contexto === contexto)
      .map(item => ({
        codigo: item.modalidad,
        nombre: item.nombreComercial || item.modalidad,
        descripcion: item.descripcionComercial || '',
        unidad_venta: item.unidadVenta,
      })),
  })));

  return resultados.filter(item => item.modalidades.length > 0);
}
