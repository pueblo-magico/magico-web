# Cuentas de cobro Cucuru

## Límite de integración

El sistema de reservas sigue siendo la fuente de verdad de la reserva, el
importe esperado, la vigencia y el inventario. Cucuru se trata como proveedor
de destinos de transferencia y observaciones de cobro, nunca como fuente de
verdad comercial.

La [web pública de Cucuru](https://www.cucuru.com/) confirma que su plataforma
permite imputar transferencias y operar mediante APIs. El
[centro de ayuda](https://www.cucuru.com/centro-de-ayuda) enlaza la
especificación técnica, pero el acceso se entrega mediante soporte. Por eso el
adaptador HTTP permanece deliberadamente cerrado: no se inventan rutas,
firmas, campos ni reglas de reintento antes de recibir y validar ese contrato.

## Modelo durable

`cuentas_cobro_reserva` conserva una sola asignación de Cucuru por reserva y
usa estados explícitos: `pending`, `provisioning`, `ready`, `failed`,
`disabled` y `unknown_outcome`. La referencia enviada al proveedor deriva de
`reserva_uid`; no contiene nombre, email, teléfono ni documento del huésped.

Cada operación queda en `cuenta_cobro_intentos`. Un reintento siempre consulta
primero por `customer_id`; después de un timeout nunca crea otra cuenta a
ciegas. `external_account_id` y CVU son únicos por proveedor. La reserva y su
retención ya existen antes de comenzar el provisionamiento, por lo que ninguna
llamada externa participa de la transacción D1 que protege el inventario.

`cucuru_observaciones_transferencia` reserva el ledger idempotente para
Collections, usando `collection_id` como clave natural y sólo campos
normalizados más el hash del payload. No se guardará `transfer_data` completo.
`cucuru_backfill_checkpoints` conserva cursor, ventana UTC y lock para la
recuperación paginada. El caso de uso de backfill procesa páginas en orden,
guarda el checkpoint después de cada página, reanuda una ventana interrumpida
y solapa 15 minutos entre ventanas completas. Si pierde el lock, se detiene;
el consumidor de cada Collection debe ser idempotente por `collection_id`.

## Activación segura

`CUCURU_TRANSFER_ENABLED` es una feature flag server-side y sólo el valor
literal `true` habilita intentos. Ausente o falsa, la creación de reservas
funciona normalmente y registra el destino como `disabled` sin llamar al
proveedor. La respuesta pública nunca incluye credenciales ni errores internos.

La activación real requiere, como mínimo:

- contrato oficial de alta/búsqueda de cuentas y Collections;
- ambiente de prueba, API key, Collector ID y secreto de webhook;
- confirmación de idempotencia y unicidad de `customer_id`;
- formato documentado de firma y política de replay;
- límites, costos, liquidación a la cuenta operativa y SLA validados;
- prueba de importe cero y varias cuentas liquidando al mismo destino.

Hasta completar esos puntos, `CucuruContratoNoDisponible` falla cerrado cuando
alguien activa la flag por error. La reserva permanece `pendiente_pago` y el
intento queda recuperable; nunca se confirma automáticamente.

## Variables

Sólo se documentan nombres, nunca valores:

- `CUCURU_API_KEY`
- `CUCURU_COLLECTOR_ID`
- `CUCURU_WEBHOOK_SECRET`
- `CUCURU_API_BASE_URL`
- `CUCURU_TRANSFER_ENABLED`
