import type {
  ConsumidorCollectionCucuru,
  ProveedorCollectionsCucuru,
  RepositorioBackfillCucuru,
} from './ports.ts';

export type ResultadoBackfillCucuru =
  | { estado: 'locked' }
  | { estado: 'completado'; paginas: number; observaciones: number; desde: string; hasta: string };

export async function ejecutarBackfillCucuru(
  repositorio: RepositorioBackfillCucuru,
  proveedor: ProveedorCollectionsCucuru,
  consumidor: ConsumidorCollectionCucuru,
  ahora: () => Date = () => new Date(),
  crearUuid: () => string = () => crypto.randomUUID(),
  opciones: { solapamientoMinutos?: number; lookbackHoras?: number; limite?: number; maxPaginas?: number } = {}
): Promise<ResultadoBackfillCucuru> {
  const instante = ahora();
  const lockUid = crearUuid();
  const alcance = 'collections';
  const checkpoint = await repositorio.adquirirLock({
    alcance,
    lockUid,
    lockExpiresAt: new Date(instante.getTime() + 10 * 60_000).toISOString(),
  });
  if (!checkpoint) return { estado: 'locked' };

  const solapamientoMs = (opciones.solapamientoMinutos ?? 15) * 60_000;
  const lookbackMs = (opciones.lookbackHoras ?? 24) * 60 * 60_000;
  const reanudando = Boolean(checkpoint.cursor && checkpoint.windowStartAt && checkpoint.windowEndAt);
  const hasta = reanudando ? String(checkpoint.windowEndAt) : instante.toISOString();
  const desde = reanudando
    ? String(checkpoint.windowStartAt)
    : new Date(
      checkpoint.windowEndAt
        ? new Date(checkpoint.windowEndAt).getTime() - solapamientoMs
        : instante.getTime() - lookbackMs
    ).toISOString();
  let cursor = reanudando ? checkpoint.cursor : null;
  let paginas = 0;
  let observaciones = 0;

  try {
    do {
      if (paginas >= (opciones.maxPaginas ?? 100)) {
        throw new Error('CUCURU_BACKFILL_MAX_PAGINAS');
      }
      const pagina = await proveedor.listar({
        desde,
        hasta,
        cursor,
        limite: opciones.limite ?? 100,
      });
      for (const item of pagina.items) {
        await consumidor.procesar(item);
        observaciones++;
      }
      paginas++;
      cursor = pagina.nextCursor;
      const guardado = await repositorio.guardarCheckpoint({
        alcance,
        lockUid,
        cursor,
        windowStartAt: desde,
        windowEndAt: hasta,
      });
      if (!guardado) throw new Error('CUCURU_BACKFILL_LOCK_PERDIDO');
    } while (cursor);

    return { estado: 'completado', paginas, observaciones, desde, hasta };
  } finally {
    await repositorio.liberarLock(alcance, lockUid);
  }
}

