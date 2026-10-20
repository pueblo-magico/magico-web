# Observabilidad y recuperación de Reservas

Este runbook cubre las señales activas de Reservas y la recuperación segura de
D1. No contiene secretos ni datos de huéspedes.

## Logs y correlación

Los logs de cada deployment de Cloudflare Pages Functions reciben los objetos
JSON que emiten los handlers instrumentados, con un vocabulario acotado:

- `service`, `event`, `operation`, `level`;
- `request_id` en toda solicitud y en la cabecera `X-Request-ID` de respuesta;
- `reservation_id` y `event_id` sólo cuando son identificadores internos
  válidos;
- `status`, `duration_ms`, `outcome` y `metric`.

No se registran URL, query string, body, email, teléfono, nombre, cookies,
tokens ni errores internos. Para seguir una operación, buscar primero por
`request_id` en **Workers & Pages > pueblo-magico-web > deployment > Functions
logs**. Para diagnóstico en vivo también se puede usar
`npx wrangler pages deployment tail` sobre el deployment correcto.

`functions/_middleware.ts` aplica esta correlación a toda la superficie `/api`
y deja pasar páginas y archivos estáticos sin telemetría adicional. Los handlers
con señales de negocio propias se excluyen del log genérico para evitar eventos
duplicados. Las rutas desconocidas usan `api.unknown`, sin incorporar el path
potencialmente sensible al log.

## Señales y alertas

Configurar alertas del destino operativo sobre estas consultas. Los umbrales
son iniciales y deben ajustarse con tráfico real, conservando el evento estable:

| Prioridad | Condición | Ventana | Acción |
| --- | --- | --- | --- |
| P1 | `event=http.request.failed` o `status>=500`, 5 eventos | 5 min | avisar a guardia y revisar por `request_id` |
| P1 | `event=payment.webhook_processing_failed`, 1 evento | inmediata | revisar pago y ejecutar reconciliación antes de confirmar manualmente |
| P1 | falla el step de migración o cualquier verificador SQL | inmediata | bloquear deploy; no reintentar a ciegas |
| P2 | `event=payment.webhook_rejected`, 10 eventos | 10 min | revisar secreto, firma y origen; no copiar payloads a Jira |
| P2 | `event=reservation.conflict`, 10 eventos | 10 min | revisar disponibilidad y concurrencia |
| P2 | `event=notification.delivery_failed`, 5 eventos | 15 min | revisar canal; la reserva confirmada no se revierte |
| P2 | `event=reservation.hold_expiration_failed`, 1 evento | inmediata | revisar el job y reintentar; una retención vencida deja de bloquear disponibilidad por fecha |
| P2 | `event=outbox.dispatch_failed`, 3 eventos | 5 min | revisar flag, destino y conectividad usando `request_id` |
| P2 | `event=outbox.batch_dispatched outcome=dead_letter`, 1 evento | inmediata | revisar el evento en el panel y reprocesar sólo con motivo auditado |

La pestaña **Integraciones** del panel calcula además alertas visibles y sin PII
para retenciones vencidas, outbox con más de 15 minutos, dead letter, tasa de
error superior al 20 % con al menos cinco intentos, comunicaciones sin canal y
webhooks de Mercado Pago inconsistentes.
También compara los pendientes creados en los últimos 15 minutos con los 15
minutos anteriores. Si una cola suma al menos cinco elementos y sigue creciendo,
muestra una alerta de presión de cola.

## Recuperación operativa desde el panel

1. Abrir **Administración > Integraciones** y pulsar **Actualizar**. Empezar por
   las alertas rojas y copiar únicamente el código de reserva, evento o
   correlación; nunca copiar payloads ni datos del huésped a un incidente.
2. Si hay retenciones vencidas, verificar que el job de vencimientos esté activo
   y ejecutarlo desde n8n. Volver a actualizar: el contador debe llegar a cero y
   el inventario debe quedar liberado.
3. Si el outbox está en `dead_letter`, validar primero el destino y su secreto.
   Como súper admin, elegir **Preparar reintento**, escribir un motivo concreto y
   devolver el evento a Pendiente. Luego usar **Procesar pendientes ahora**.
4. Si una comunicación está `sin_canal` o `dead_letter`, habilitar o reparar el
   adaptador antes de reprocesarla. El reproceso exige motivo y queda en
   `auditoria_admin`; no cambia el estado de la reserva.
5. Para un webhook de Mercado Pago `inconsistente`, buscar por `correlation_id`,
   contrastar monto, moneda, referencia y estado directamente en Mercado Pago.
   No confirmar por una captura o mensaje del huésped. Si la acreditación es
   comprobable, usar la confirmación manual de la reserva con motivo; esa acción
   es versionada y auditada.
6. Actualizar nuevamente el panel y comprobar el estado final. Registrar en el
   incidente código, motivo, actor, hora UTC y resultado, sin PII.

Repetir una acción ya resuelta no crea otra entrega ni otra transición: los
eventos, webhooks y solicitudes usan claves idempotentes y los cambios de estado
rechazan regresiones.

## Verificación de recuperación sin D1 remoto

`npm run test:reservas:recovery` crea una SQLite efímera, aplica todas las
migraciones, guarda un snapshot, simula pérdida de datos, restaura el snapshot y
verifica el registro, las versiones y las foreign keys. Preview y producción
ejecutan este drill antes de desplegar. No toca D1 ni conserva archivos.

## Runbook D1 de preview

Time Travel de D1 es el mecanismo de recuperación remota. Restaurar sobrescribe
la base y cancela consultas en vuelo; por eso nunca se ejecuta automáticamente.

1. Identificar el commit desplegado, la migración fallida y el alcance. Pausar
   escrituras de prueba y avisar a quienes estén usando la preview compartida.
2. Obtener y guardar en el incidente el bookmark actual:
   `npx wrangler d1 time-travel info DB --env preview --json`.
3. Resolver el bookmark anterior al incidente con `time-travel info` y un
   timestamp RFC3339 UTC. Verificar dos veces que el target sea
   `magico-ensueno-db-preview`.
4. Con aprobación explícita, ejecutar
   `npx wrangler d1 time-travel restore DB --env preview --bookmark=<BOOKMARK>`.
5. Aplicar sólo las migraciones compatibles y ejecutar, en orden, los scripts
   `verificar-migracion.sql`, `verificar-inventario.sql`,
   `verificar-capacidad.sql` y `verificar-seguridad.sql`.
6. Ejecutar los smoke tests de disponibilidad y sesión administrativa. Comparar
   conteos operativos con el registro previo al incidente.
7. Conservar el bookmark que Wrangler devuelve para poder deshacer el restore.
   Registrar responsable, timestamps UTC, comandos, resultados y decisión.

## Producción

No realizar un restore productivo desde este runbook sin aprobación de cutover.
Primero reproducir el procedimiento en preview. El rollback de aplicación es
volver al commit compatible; el rollback de datos usa Time Travel sólo si la
reconciliación demuestra que es necesario. Nunca escribir un `down` destructivo
ni importar un `.sql` sobre producción como atajo.
