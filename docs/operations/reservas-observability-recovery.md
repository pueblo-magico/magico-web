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

`functions/api/_middleware.ts` aplica esta correlación a toda la superficie
`/api`. Los handlers con señales de negocio propias se excluyen del log genérico
para evitar eventos duplicados. Las rutas desconocidas usan `api.unknown`, sin
incorporar el path potencialmente sensible al log.

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

Los eventos `outbox.pending`, `dlq.growing` y `calendar.conflict` quedan
reservados para los tickets que incorporen esos componentes. No configurar una
alerta que aparente cobertura antes de que exista su productor.

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
