# Comunicaciones de reservas independientes del canal

WRESERV-28 separa la decisión de comunicar un cambio de la tecnología usada para entregarlo. La reserva, el pago y la ocupación siguen siendo la fuente de verdad; correo, mensajería u otros canales son adaptadores posteriores y reemplazables.

## Flujo

1. Un caso de uso persiste el cambio de la reserva y su evento de dominio.
2. D1 proyecta el evento a una intención durable e idempotente.
3. La intención conserva tipo, idioma y versión de plantilla, pero no copia nombre, correo, teléfono ni otros datos personales.
4. Un despachador reclama un lote mediante un lease y llama al adaptador activo.
5. La entrega queda como `entregada`, se reprograma con backoff o termina en `dead_letter`.
6. Si no hay adaptador habilitado, queda en `sin_canal`. Esto nunca revierte ni bloquea la reserva.

Los tipos iniciales son: reserva creada, pago pendiente, pago aprobado, retención vencida, reserva modificada y reserva cancelada. Cada uno tiene plantillas publicadas e inmutables en español e inglés.

La intención `pago_aprobado` se proyecta desde `reserva.confirmada`, no desde el
evento técnico del proveedor de pago. De este modo una confirmación manual y una
confirmación por webhook de Mercado Pago generan la misma comunicación durable,
sin duplicarla ni depender del origen de la confirmación.

## Operación y seguridad

- La clave de deduplicación impide crear dos intenciones para el mismo evento.
- El claim con vencimiento evita entregas concurrentes del mismo trabajo.
- Los reintentos registran únicamente códigos de error seguros; no guardan cuerpos del proveedor ni PII.
- Una intención en `sin_canal` o `dead_letter` puede volver a `pendiente` mediante el caso de uso de reproceso, que exige motivo y registra actor, correlación y estado anterior en `auditoria_admin`.
- El modelo operativo expone conteos por estado, antigüedad del pendiente más antiguo, tasa de fallas de las últimas 24 horas y el listado reciente sin PII. WRESERV-21 lo presentará junto al resto de integraciones en el panel administrativo.

## Arrepentimientos por email

WRESERV-43 agrega el primer contrato de correo para el lanzamiento. Crear una solicitud o cambiar su estado genera una notificación idempotente en la misma operación D1. El outbox publica sólo `notification_id`, intención, idioma y versión; nunca copia el email ni el mensaje del huésped.

Cuando n8n recibe `arrepentimiento.notificacion_pendiente`, reclama los datos sensibles con `POST /api/v1/integrations/arrepentimientos/notificaciones`, identidad `n8n` y alcance `comunicaciones:entregar`. Después de enviar el correo, informa `entregada`, `retry` o `dead_letter` al mismo endpoint. La reserva y la decisión administrativa no se revierten si el correo falla.

Administración ve el último estado de entrega y puede reprocesar un `dead_letter` con motivo auditado. La nota interna nunca se usa en la plantilla: sólo `mensaje_cliente` puede llegar al huésped. Las decisiones sobre ManyChat quedan fuera de este flujo.

## Reservas por email

El mismo webhook de n8n procesa `comunicacion.intencion_creada`. n8n reclama la
intención mediante `POST /api/v1/integrations/comunicaciones/notificaciones`; la
API resuelve el email y renderiza la versión inmutable de la plantilla sólo para
un consumidor autenticado. El outbox no contiene email, nombre ni cuerpo.

La respuesta incluye el código, fechas, importe de la seña, vencimiento y un
enlace del ambiente actual. El consumidor informa `entregada`, `retry` o
`dead_letter`. Si no existe email, Reservas finaliza la intención como
`sin_canal` sin llamar al proveedor y conserva el caso visible para Operaciones.

Para evitar dos correos al crear una reserva pública, el evento
`reserva.retencion_iniciada` produce un único mensaje combinado de recepción y
pago pendiente. `reserva.creada_admin` conserva su mensaje independiente.

Al confirmar una reserva, tanto Administración como el webhook de Mercado Pago
programan en `waitUntil` solamente la intención `pago_aprobado` de esa reserva.
El botón administrativo **Enviar comunicaciones pendientes** también se limita
a `comunicacion.intencion_creada`: nunca vacía en bloque las notificaciones de
arrepentimiento, que se operan desde su sección y conservan su recuperación
programada independiente.
