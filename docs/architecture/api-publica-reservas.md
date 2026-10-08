# API pública de reservas v1

La API pública comparte el mismo motor de disponibilidad y cotización que los
flujos internos existentes. D1 sigue siendo la fuente operativa de verdad.

## Contratos

- `GET /api/v1/public/alojamientos?contexto=general`
- `GET /api/v1/public/disponibilidad?check_in=2027-04-10&check_out=2027-04-12&personas=2&tipo_alojamiento=domo&modalidad=privada&contexto=general`
- `POST /api/v1/public/cotizaciones`
- `POST /api/v1/public/reservas`
- `GET /api/v1/public/reservas/:codigo`

Ejemplo de solicitud de cotización:

```json
{
  "check_in": "2027-04-10",
  "check_out": "2027-04-12",
  "personas": 2,
  "tipo_alojamiento": "domo",
  "modalidad": "privada",
  "contexto": "general",
  "regimen_alimentacion": "pension_completa"
}
```

Las estadías usan el intervalo `[check_in, check_out)`: la noche de checkout no
se ocupa. Las fechas son días operativos de Pueblo Mágico y no timestamps; esto
evita conversiones de zona horaria sobre una fecha de alojamiento.

Los importes v1 se expresan en centavos enteros y siempre incluyen moneda,
código y versión del plan tarifario. Cada cotización persiste un snapshot del
desglose vigente, sin datos personales.

## Alimentación

La cotización admite únicamente dos valores estables:

- `desayuno_incluido`: incluido en el alojamiento, sin recargo.
- `pension_completa`: agrega almuerzo y cena por cada persona y noche.

Cada comida cuesta ARS 20.000. Por lo tanto, `pension_completa` agrega ARS
40.000 por persona y noche. La respuesta separa `alojamiento_centavos` de
`alimentacion_centavos`, y la seña se calcula sobre la suma de ambos. El
snapshot conserva el régimen, el precio por comida y la versión de la tarifa.

Para compatibilidad, si se omite `regimen_alimentacion` se utiliza
`desayuno_incluido`.

## Creación y retención

`POST /api/v1/public/reservas` acepta una cotización vigente, el código del
espacio ofrecido y datos mínimos del titular. Requiere el header
`Idempotency-Key`; repetir la misma clave y payload devuelve la misma reserva,
mientras que reutilizarla con otros datos responde conflicto.

```json
{
  "cotizacion_codigo": "COT-...",
  "espacio_codigo": "domo-1",
  "cliente": {
    "nombre": "Nombre del huésped",
    "telefono": "+54...",
    "email": "huesped@example.com"
  }
}
```

La reserva queda en `pendiente_pago` con una retención cuyo valor inicial es 15
minutos y cuya fuente efectiva es `payment_hold_minutes`. La
escritura de reserva, estadía, noches ocupadas, retención, eventos y respuesta
idempotente se ejecuta como una única operación D1. Si el inventario cambió
desde la cotización, no queda una reserva parcial.

Después de completar esa operación durable, el sistema prepara la asignación
del destino de transferencia Cucuru. `data.cuenta_cobro` informa proveedor y
estado. Sólo cuando el estado es `ready` incluye CVU, alias y moneda. Con
`CUCURU_TRANSFER_ENABLED` ausente o falsa responde `disabled` y no realiza
ninguna llamada externa. El provisionamiento nunca revierte ni deja parcial la
reserva ya creada.

Cuando `MP_CHECKOUT_ENABLED=true` y existe `MP_ACCESS_TOKEN`, el mismo endpoint
prepara fuera de la transacción una preferencia de Mercado Pago y devuelve
`data.pago.checkout_url`. La preferencia usa el código opaco `RES-…` como
`external_reference`, de modo que preview y producción no se confunden aunque
sus IDs internos coincidan. Un retry idempotente recupera la preferencia ya
persistida; ante un resultado externo incierto, primero se busca por esa
referencia antes de crear otra.

Una selección explícita de Checkout Pro o transferencia pertenece al adaptador
de Mercado Pago y no provisiona cuentas Cucuru. Las solicitudes legacy que aún
omiten `pago.metodo` conservan temporalmente su comportamiento anterior para no
romper integraciones existentes.

Los retornos `/reserva-confirmada`, `/reserva-pendiente` y `/reserva-fallida`
no confían en los parámetros del redirect. Consultan
`GET /api/v1/public/reservas/:codigo`, que devuelve solamente código, estado,
vencimiento y estado de pago. La reserva se muestra como confirmada únicamente
después de que el webhook autenticado validó el pago y persistió la transición.
Si Mercado Pago falla, la reserva pendiente continúa durable y el destino de
transferencia o la gestión manual siguen disponibles como fallback.

Cuando `MP_TRANSFER_ENABLED=true`, existe `MP_TRANSFER_ALIAS` o un
`MP_TRANSFER_CVU` de 22 dígitos y `PAYMENT_RECONCILIATION_SECRET` tiene al menos
32 caracteres, la cotización ofrece también transferencia directa a la cuenta
de Mercado Pago. El huésped elige el medio antes de crear la reserva. Para una
transferencia debe informar el DNI asociado a la cuenta pagadora.

El DNI completo nunca se persiste: se normaliza, se protege con HMAC-SHA256 y
se conservan sólo el hash y sus últimos cuatro dígitos. Al consultar el pago
notificado, el adaptador aplica la misma protección a
`payer.identification.number`. Una transferencia aprobada se confirma
automáticamente sólo si DNI, importe y moneda encuentran exactamente una
reserva pendiente y vigente. Cero o múltiples coincidencias quedan registradas
para revisión manual; nunca se elige una reserva por aproximación.

Al vencer la retención, deja de bloquear disponibilidad aun antes de ejecutar
la limpieza. El proceso autenticado de n8n invoca
`POST /api/v1/integrations/reservas/expirar-retenciones` para marcar la reserva
como `vencida`, liberar sus noches y registrar el evento de dominio. La
operación es idempotente y procesa las retenciones vencidas en lotes.

El plazo se lee una sola vez al crear la reserva y el timestamp resultante se
persiste como snapshot. Un cambio administrativo posterior sólo afecta nuevas
reservas y nunca recalcula una retención existente.

## Capacidad y disponibilidad

- Los domos publican una capacidad comercial máxima de 7, aunque su capacidad
  operativa admita excepciones administrativas auditadas.
- El Refugio compartido ofrece 15 plazas y calcula la menor capacidad disponible
  de todas las noches solicitadas.
- La habitación de 4 plazas puede cotizarse como privada. Mientras no exista una
  asignación física definitiva, cualquier ocupación relacionada con el Refugio
  la bloquea de forma conservadora.
- Reservas `pendiente` y `confirmada`, bloqueos y estadías no comerciales afectan
  el mismo cálculo.

Motivos estables: `DISPONIBLE`, `INVENTARIO_OCUPADO`,
`CAPACIDAD_INSUFICIENTE` y `MODALIDAD_NO_DISPONIBLE`.

## Seguridad y límites de esta etapa

Las respuestas públicas no incluyen PII ni IDs internos del inventario. El
código opaco `RES-…` identifica la reserva en el flujo de pago y permite leer
únicamente su estado mínimo. Los endpoints tienen CORS explícito, lectura JSON
limitada y rate limiting persistido por hash.

Hasta WRESERV-15, los domos y la habitación privada se resuelven de manera
conservadora; ese ticket incorporará asignación física definitiva por unidad.

El endpoint legacy `POST /api/cotizar` continúa disponible y delega al mismo
caso de uso. Acepta opcionalmente `modalidad` y `contexto` para una migración
gradual de consumidores.

## Arrepentimiento

`POST /api/v1/public/arrepentimientos` registra una solicitud idempotente en ES
o EN y devuelve únicamente código `ARR-…`, estado y fecha de recepción. No
cancela la reserva ni ejecuta una devolución.

`GET /api/v1/public/arrepentimientos?codigo=ARR-…&email=…` permite consultar el
estado y el mensaje público del equipo. Exige la combinación exacta de código y
email normalizado, aplica rate limit, usa una respuesta genérica para datos que
no coinciden y nunca devuelve la nota interna ni datos de la reserva vinculada.
