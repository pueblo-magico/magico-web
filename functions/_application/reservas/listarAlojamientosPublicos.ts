import type { ContextoAlojamiento } from '../../_domain/reservas/accommodationInventory.ts';
import type { RepositorioInventarioAlojamiento } from './ports.ts';

export async function listarAlojamientosPublicos(
  contexto: ContextoAlojamiento,
  repositorio: RepositorioInventarioAlojamiento
) {
  const espacios = await repositorio.listarEspaciosReservables(contexto);
  const resultados = await Promise.all(espacios.map(async espacio => ({
    codigo: espacio.codigo,
    nombre: espacio.nombre,
    tipo: espacio.tipo === 'habitacion' ? 'refugio' : espacio.tipo,
    capacidad_comercial: espacio.capacidadComercial,
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
