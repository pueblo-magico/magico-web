# Cuentas de cobro Cucuru

## Límite de integración

El sistema de reservas sigue siendo la fuente de verdad de la reserva, el
importe esperado, la vigencia y el inventario. Cucuru se trata como proveedor
de destinos de transferencia y observaciones de cobro, nunca como fuente de
verdad comercial.

La integración implementa Collections API v1.6.8. Autentica las llamadas con
`X-Cucuru-Api-Key` y `X-Cucuru-Collector-id`, crea CVU mediante `PUT
/app/v1/Collection/accounts/account`, consulta cuentas y recupera Collections
con la paginación opaca `next_page`. La API no documenta idempotency key para
el alta ni búsqueda directa de cuenta por `customer_id`: la recuperación
pagina el catálogo de cuentas antes de crear y después de un resultado incierto.

## Modelo durable

`cuentas_cobro_reserva` conserva una sola asignación de Cucuru por reserva y
usa estados explícitos: `pending`, `provisioning`, `ready`, `failed`,
`disabled` y `unknown_outcome`. La referencia enviada al proveedor deriva de
`reserva_uid`; no contiene nombre, email, teléfono ni documento del huésped.

Cada operación (`lookup`, `create` o `alias`) queda en `cuenta_cobro_intentos`. Un reintento siempre consulta
primero por `customer_id`; después de un timeout nunca crea otra cuenta a
ciegas. `external_account_id` y CVU son únicos por proveedor. La reserva y su
retención ya existen antes de comenzar el provisionamiento, por lo que ninguna
llamada externa participa de la transacción D1 que protege el inventario.

Una cuenta sólo queda `ready` cuando posee alias. Si una cuenta recuperada por
`customer_id` todavía no lo tiene, se asigna mediante el endpoint específico de
Cucuru antes de publicarla como destino. El alias se genera de forma determinista
como `<CUCURU_ALIAS_PREFIX>.reserva<ID>`; Preview usa `magico.qa` para distinguir
sus cuentas de las productivas.

`cucuru_observaciones_transferencia` reserva el ledger idempotente para
Collections, usando `collection_id` como clave natural y sólo campos
normalizados más el hash del payload. No se guardará `transfer_data` completo.
`cucuru_backfill_checkpoints` conserva cursor, ventana UTC y lock para la
recuperación paginada. El caso de uso de backfill procesa páginas en orden,
guarda el checkpoint después de cada página, reanuda una ventana interrumpida
y solapa 15 minutos entre ventanas completas. Si pierde el lock, se detiene;
el consumidor de cada Collection debe ser idempotente por `collection_id`.

La conciliación normalizada valida `collector_id`, esquema, destino, importe,
moneda y fecha antes de tocar D1. La transacción D1 clasifica la observación,
registra el pago y confirma la reserva exactamente una vez. Una prueba de
importe cero queda como `prueba_cero` y no crea un pago. Cuenta desconocida,
reserva no pendiente, pago tardío, moneda o importe incorrectos quedan en
`revision_manual`; no cancelan ni confirman automáticamente. El pago Cucuru no
se escribe en `mp_payment_id`, que continúa siendo sólo compatibilidad legacy
de Mercado Pago. Una redelivery con el mismo `collection_id` y el mismo hash es
un duplicado inocuo; si cambia el hash, crea una entrada pendiente en
`cucuru_revisiones_pago` sin repetir el pago ni los efectos de inventario.

El webhook se expone en
`/api/v1/integrations/cucuru/collection_received`. Cucuru no documenta una
firma criptográfica: permite configurar un encabezado estático propio. El
endpoint exige un secreto de al menos 24 caracteres, compara en tiempo
constante, valida `collector_id` y deduplica durablemente por `collection_id`.
`X-Redelivery-attempt` es informativo; no cambia la idempotencia. La prueba de
alta del webhook con importe cero responde 200 sin crear un pago.

## Activación segura

`CUCURU_TRANSFER_ENABLED` es una feature flag server-side y sólo el valor
literal `true` habilita intentos. Ausente o falsa, la creación de reservas
funciona normalmente y registra el destino como `disabled` sin llamar al
proveedor. La respuesta pública nunca incluye credenciales ni errores internos.

La activación real requiere, como mínimo:

- API key, Collector ID y secreto de webhook por ambiente;
- confirmación operativa de unicidad de `customer_id`;
- validación del contrato contra una cuenta real antes de activar la flag;
- límites, costos, liquidación a la cuenta operativa y SLA validados;
- prueba de importe cero y varias cuentas liquidando al mismo destino.

Hasta completar esos puntos, `CUCURU_TRANSFER_ENABLED` permanece en `false`.
Una configuración incompleta falla cerrado: la reserva permanece
`pendiente_pago`, el intento queda recuperable y nunca se confirma por un error
del proveedor.

### Modo mock para desarrollo y Preview

Mientras el acceso externo no esté disponible, el adaptador de cuentas puede
reemplazarse sin cambiar la lógica de reservas, idempotencia ni persistencia:

```text
CUCURU_TRANSFER_ENABLED=true
CUCURU_PROVIDER_MODE=mock
CUCURU_MOCK_ALLOWED=true
CUCURU_ALIAS_PREFIX=magico.qa
```

El modo mock no realiza llamadas de red. Genera de forma determinista un CVU
que comienza con `99`, un identificador externo `mock-*` y el alias normal de
Preview. La respuesta pública informa `proveedor: cucuru_mock` y
`simulado: true`; D1 también conserva `simulada = 1`. Repetir la misma reserva
devuelve el mismo destino y no crea otra asignación.

La doble activación es intencional: si falta `CUCURU_MOCK_ALLOWED=true`, el
modo mock falla cerrado. Esta variable sólo se configura en desarrollo o en
las variables de Preview de Cloudflare y nunca en producción. El backfill real
queda bloqueado mientras el adaptador está en mock.

## Variables

Sólo se documentan nombres, nunca valores:

- `CUCURU_API_KEY`
- `CUCURU_COLLECTOR_ID`
- `CUCURU_WEBHOOK_HEADER_NAME`
- `CUCURU_WEBHOOK_SECRET`
- `CUCURU_API_BASE_URL`
- `CUCURU_TRANSFER_ENABLED`
- `CUCURU_PROVIDER_MODE`
- `CUCURU_MOCK_ALLOWED`
- `CUCURU_ALIAS_PREFIX`

Los secretos locales van en `.dev.vars`, que está ignorado por Git. Preview y
producción deben usar valores distintos en Cloudflare; ninguna variable Cucuru
puede llevar prefijo `VITE_`.
