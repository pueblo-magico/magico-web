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

## Operación y seguridad

- La clave de deduplicación impide crear dos intenciones para el mismo evento.
- El claim con vencimiento evita entregas concurrentes del mismo trabajo.
- Los reintentos registran únicamente códigos de error seguros; no guardan cuerpos del proveedor ni PII.
- Una intención en `sin_canal` o `dead_letter` puede volver a `pendiente` mediante el caso de uso de reproceso, que exige motivo y registra actor, correlación y estado anterior en `auditoria_admin`.
- El modelo operativo expone conteos por estado, antigüedad del pendiente más antiguo, tasa de fallas de las últimas 24 horas y el listado reciente sin PII. WRESERV-21 lo presentará junto al resto de integraciones en el panel administrativo.

## Límites de esta entrega

No hay un canal saliente activo en el MVP base. WRESERV-43 implementará el primer adaptador de correo. Las decisiones sobre ManyChat quedan fuera de este flujo y se mantienen en WRESERV-36. El endpoint entrante legado puede seguir existiendo, pero ningún webhook de pago llama directamente a ManyChat.
