import type { CollectionCucuruNormalizada } from '../../_domain/reservas/collectionAccounts.ts';
import { ErrorReserva } from '../../_domain/reservas/errors.ts';
import type {
  RepositorioConciliacionCucuru,
} from './ports.ts';

export type ResultadoProcesarCollectionCucuru = {
  estado: 'aplicado' | 'prueba_cero' | 'revision_manual' | 'duplicado';
  motivoCodigo: string | null;
};

function validarCollection(
  collection: CollectionCucuruNormalizada,
  collectorIdEsperado: string
): CollectionCucuruNormalizada {
  const fecha = new Date(collection.occurredAt);
  const algunDestino = collection.externalAccountId || collection.customerId || collection.cvu;
  if (!collectorIdEsperado || collection.collectorId !== collectorIdEsperado ||
      !collection.collectionId?.trim() || (!algunDestino && collection.montoCentavos !== 0) ||
      !Number.isSafeInteger(collection.montoCentavos) || collection.montoCentavos < 0 ||
      !/^[A-Z]{3}$/.test(collection.moneda) ||
      Number.isNaN(fecha.getTime()) || fecha.toISOString() !== collection.occurredAt ||
      !/^[a-f0-9]{64}$/i.test(collection.payloadHash)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La observación de Cucuru es inválida.');
  }
  if (collection.cvu != null && !/^\d{22}$/.test(collection.cvu)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El CVU informado por Cucuru es inválido.');
  }
  return { ...collection, collectionId: collection.collectionId.trim() };
}

export async function procesarCollectionCucuru(
  collection: CollectionCucuruNormalizada,
  collectorIdEsperado: string,
  repositorio: RepositorioConciliacionCucuru,
  correlationId: string
): Promise<ResultadoProcesarCollectionCucuru> {
  const validada = validarCollection(collection, collectorIdEsperado);
  const resultado = await repositorio.procesar(validada, correlationId);
  return { estado: resultado.estado, motivoCodigo: resultado.motivoCodigo };
}
