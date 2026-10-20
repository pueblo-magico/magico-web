# Pagos y eventos del ciclo de vida

Este documento describe la implementación inicial de WRESERV-2 / WRESERV-16. El objetivo es conservar cada intento de pago, impedir regresiones de estado y ofrecer a administración una línea de tiempo auditable sin exponer secretos ni datos personales innecesarios.

## Modelo de pagos

- Cada intento de pago se identifica por `proveedor` y `external_payment_id`.
- `pagos` conserva el estado normalizado, el estado original del proveedor y el `correlation_id` de la solicitud que lo procesó.
- Los importes se guardan en centavos y la moneda usa un código ISO de tres letras.
- Un intento puede avanzar de `pendiente` a `aprobado` o `rechazado`, y de `aprobado` a `devuelto`. No puede regresar a un estado anterior.
- Los registros importados del esquema legacy pueden adoptar un estado normalizado en su primera actualización.

El ledger de entregas externas continúa en `pago_eventos_externos`. Su clave idempotente evita reprocesar una misma entrega del proveedor, mientras `pagos` representa el intento financiero estable.

## Eventos de reserva

`reserva_eventos` es append-only: una vez creado, un evento no puede modificarse ni eliminarse. Cada evento nuevo puede incluir:

- `evento_uid`, para deduplicación técnica;
- `version`, para versionar su contrato;
- `agregado_tipo` y `agregado_id`, para identificar el origen del cambio;
- `correlation_id`, para seguir una operación entre HTTP, pagos y reserva;
- un `payload_json` mínimo, sin credenciales y sin copiar datos personales de la reserva.

El adaptador de pagos persiste el intento y su evento `pago.<estado>` en un mismo batch D1. Si el evento falla, el intento tampoco queda guardado.

Los eventos de confirmación, cancelación y vencimiento continúan proyectándose desde las transiciones controladas de la reserva. La asignación física y su evento `reserva.asignada` se completan en WRESERV-15, junto con el inventario normalizado, para evitar dos fuentes de verdad.

## Consulta administrativa

`GET /api/v1/admin/reservas/:id/historial` requiere el permiso `reservas.leer` y devuelve:

- estado actual de la reserva;
- resumen financiero en centavos;
- todos los intentos de pago;
- línea de tiempo de eventos ordenada cronológicamente.

El resumen informa monto aprobado, monto devuelto y neto. No reemplaza la conciliación contable ni expone tokens, firmas o metadatos completos del proveedor.

## Verificación

Las pruebas críticas aplican todas las migraciones sobre SQLite efímero y verifican múltiples intentos, correlación, transiciones inválidas, deduplicación, inmutabilidad de eventos y rollback atómico del pago si falla su evento.
