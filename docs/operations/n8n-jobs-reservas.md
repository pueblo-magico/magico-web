# Jobs operativos de Reservas en n8n

Este runbook implementa WRESERV-41. n8n sólo agenda y observa llamadas HTTP;
las reglas de vencimiento, leases, reintentos e idempotencia permanecen dentro
de Reservas.

## Frecuencia y endpoints

Importar `docs/integrations/n8n-jobs-operativos.workflow.json`. El workflow
queda inactivo por seguridad y contiene dos ejecuciones independientes:

| Frecuencia | Endpoint | Objetivo |
| --- | --- | --- |
| cada minuto | `POST /api/v1/integrations/reservas/expirar-retenciones` | vencer retenciones impagas y liberar inventario |
| cada minuto | `POST /api/v1/integrations/outbox/dispatch` | reclamar y entregar un lote de eventos externos |

Cada nodo espera hasta 15 segundos y reintenta como máximo tres veces con cinco
segundos entre intentos. Repetir una llamada es seguro: una retención ya vencida
no vuelve a vencer y el outbox usa leases e identificadores de evento estables.

## Configuración por ambiente

Crear un workflow separado para Preview y otro para Producción. No duplicar un
workflow activo conservando sus variables anteriores.

En n8n configurar:

- variable `RESERVAS_API_BASE_URL`: URL estable del ambiente, sin `/` final;
- secreto de proceso `N8N_INBOUND_SECRET`: igual al secreto server-side del
  ambiente de Cloudflare para el job de vencimientos;
- secreto de proceso `OUTBOX_DISPATCH_SECRET`: igual al secreto exclusivo del
  dispatcher de ese ambiente.

En Cloudflare configurar, por ambiente:

- `N8N_INBOUND_SECRET` y `OUTBOX_DISPATCH_SECRET`, distintos entre sí y entre
  Preview y Producción;
- `INTEGRATION_OUTBOX_ENABLED=true` sólo cuando el consumidor haya sido
  validado;
- `INTEGRATION_EVENTS_WEBHOOK_URL` y `INTEGRATION_EVENTS_WEBHOOK_SECRET` con el
  destino del mismo ambiente.

Los secretos no se guardan en el JSON ni se pasan al navegador. Si la instancia
de n8n bloquea `$env` en expresiones, reemplazar cada cabecera por una credencial
**Header Auth** de n8n con el mismo nombre `X-Service-Secret`; nunca pegar el
valor en el workflow exportable.

## Validación antes de activar

1. Ejecutar manualmente `Vencer retenciones`. Debe responder `200` con
   `{"ok":true,"expiradas":0}` o una cantidad positiva.
2. Repetir el nodo. Debe responder `200`; una repetición no crea nuevos efectos.
3. Ejecutar `Despachar outbox`. Debe responder `200` con los contadores
   `reclamados`, `entregados`, `reprogramados` y `deadLetter`.
4. Verificar que cada respuesta incluya `X-Request-ID` y buscar el mismo valor
   en los logs de Cloudflare.
5. Confirmar en el panel administrativo que no crecen los pendientes ni
   `dead_letter` antes de activar la agenda.

Un `401` indica secreto o ambiente incorrecto. Un `409` del dispatcher indica
que la feature flag o el destino no están listos. Un `503` es reintentable; si
persiste después de los tres intentos, n8n debe marcar la ejecución como fallida
y alertar al responsable, sin copiar bodies ni datos de huéspedes.

## Señales operativas

Cloudflare emite señales estructuradas sin PII:

- `reservation.holds_expired`, con outcome `expired` o `noop`;
- `reservation.hold_expiration_failed`, reintentable;
- `outbox.batch_dispatched`, con outcome `delivered`, `retry_scheduled`,
  `dead_letter` o `noop`;
- `outbox.dispatch_failed`, por configuración o falla reintentable;
- `http.request.completed`, para status y duración.

Alertar de inmediato ante `dead_letter` o errores repetidos. La recuperación de
un evento agotado se hace desde el panel admin con motivo auditado; no se edita
D1 manualmente.

## Envío de arrepentimientos por email

El webhook consumidor de `INTEGRATION_EVENTS_WEBHOOK_URL` debe derivar los eventos
`arrepentimiento.notificacion_pendiente` a un subflujo de correo:

1. Leer `notification_id` del evento. El evento no contiene PII.
2. Reclamar la entrega con `POST /api/v1/integrations/arrepentimientos/notificaciones`,
   cabeceras `X-Integration-Id: n8n`, `X-Service-Secret: <N8N_INBOUND_SECRET>` y body:
   `{"accion":"reclamar","notificacion_uid":"<notification_id>"}`.
3. Enviar `destinatario`, `asunto` y `cuerpo` con el proveedor de email. No guardar
   esos valores en logs ni datos de ejecución persistentes de n8n.
4. Informar el resultado al mismo endpoint con `accion=resultado`, los tres IDs
   devueltos (`notificacion_uid`, `claim_uid`, `delivery_uid`) y uno de:
   `entregada`, `retry` o `dead_letter`. En una falla, enviar sólo un
   `error_code` estable como `SMTP_TIMEOUT`; nunca el mensaje crudo del proveedor.

Un resultado repetido con el mismo `delivery_uid` es idempotente. `retry`
reprograma también el evento del outbox; `dead_letter` queda visible para
reproceso manual en Administración. Un `409 NOTIFICACION_NO_DISPONIBLE` significa
que otro proceso conserva el lease o que la entrega ya terminó.

## Pausa, recuperación y cutover

Para pausar, desactivar primero el workflow de n8n. Si también debe impedirse un
despacho manual, cambiar `INTEGRATION_OUTBOX_ENABLED=false` en el ambiente. No
rotar ni borrar secretos como mecanismo habitual de pausa.

Durante un cutover:

1. dejar inactivo el workflow productivo;
2. validar endpoints y secretos en Preview;
3. activar Producción una sola vez y observar al menos dos ciclos;
4. comprobar que una segunda ejecución no duplica efectos;
5. documentar el `request_id`, la hora UTC y los contadores obtenidos.

La recuperación D1 sigue el runbook
`docs/operations/reservas-observability-recovery.md`. Nunca restaurar Producción
para resolver solamente una entrega externa fallida.
