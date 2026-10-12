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

## Envío de comunicaciones transaccionales por email

Importar `docs/integrations/n8n-arrepentimientos-email.workflow.json`. El
workflow atiende tanto `arrepentimiento.notificacion_pendiente` como
`comunicacion.intencion_creada`. Queda inactivo, no contiene credenciales y no
conserva datos de ejecuciones exitosas, fallidas ni manuales, porque durante la
entrega procesa el email del huésped.

Después de importar:

1. Confirmar que el nodo **Enviar email** usa la credencial OAuth2 conectada
   `Gmail account`. El remitente es la cuenta autorizada por esa credencial.
2. Configurar `RESERVAS_API_BASE_URL` como variable de n8n. La URL no lleva `/`
   final.
3. Configurar `INTEGRATION_EVENTS_WEBHOOK_SECRET` y `N8N_INBOUND_SECRET` como
   secretos de proceso de n8n; deben coincidir con el ambiente Cloudflare.
4. Para Preview, cambiar el path del Webhook a `reservas-eventos-preview`. No
   activar dos workflows con el mismo path en una misma instancia n8n.
5. Copiar la URL productiva del nodo Webhook (`/webhook/...`, no
   `/webhook-test/...`) a `INTEGRATION_EVENTS_WEBHOOK_URL` del ambiente.

El workflow autentica el Bearer enviado por Reservas, ignora con `202` los
eventos que no sean comunicaciones admitidas y procesa el email. Para
arrepentimientos usa el contrato existente. Para reservas usa
`POST /api/v1/integrations/comunicaciones/notificaciones` con las mismas
acciones `reclamar` y `resultado`, pero identifica la entrega mediante
`intencion_uid`.

Las comunicaciones de reserva cubren: pago pendiente, pago aprobado, retención
vencida, modificación, cancelación y reservas administrativas creadas. La
creación pública y el inicio de la retención producen un único email combinado
de pago pendiente. Si la reserva no tiene email, la intención queda en
`sin_canal`, el workflow responde `200` y no llama a Gmail.

El flujo de arrepentimiento funciona así:

1. Leer `notification_id` del evento. El evento no contiene PII.
2. Reclamar la entrega con `POST /api/v1/integrations/arrepentimientos/notificaciones`,
   cabeceras `X-Integration-Id: n8n`, `X-Service-Secret: <N8N_INBOUND_SECRET>` y body:
   `{"accion":"reclamar","notificacion_uid":"<notification_id>"}`.
3. Enviar `destinatario`, `asunto` y `cuerpo` con el proveedor de email. No guardar
   esos valores en logs ni datos de ejecución persistentes de n8n.
4. Informar el resultado al mismo endpoint con `accion=resultado`, los tres IDs
   devueltos (`notificacion_uid`, `claim_uid`, `delivery_uid`) y uno de:
   `entregada`, `retry` o `dead_letter`. En una falla, enviar sólo un
   `error_code` estable como `EMAIL_DELIVERY_ERROR`; nunca el mensaje crudo del proveedor.

Un resultado repetido con el mismo `delivery_uid` es idempotente. Ante una falla
de Gmail, los primeros intentos registran `retry` y el webhook responde `503` para
que el dispatcher no marque el evento como entregado. Al llegar a
`max_intentos`, registra `dead_letter` y responde `200`; queda visible para
reproceso manual en Administración. Un `409 NOTIFICACION_NO_DISPONIBLE`
significa que otro proceso conserva el lease o que la entrega ya terminó.

### Validación manual del correo

1. Mantener el workflow inactivo y usar **Listen for test event** en el Webhook.
2. Configurar temporalmente `INTEGRATION_EVENTS_WEBHOOK_URL` con la URL
   `/webhook-test/` mostrada por n8n y disparar manualmente un lote del outbox
   desde Administración.
3. Confirmar que llega el correo, la notificación queda `entregada` y la
   ejecución no queda guardada en el historial al finalizar.
4. Repetir en ES y EN con dos solicitudes nuevas y dos reservas nuevas.
5. Confirmar para una reserva pendiente que el mensaje incluye código, fechas,
   seña, vencimiento y el enlace del mismo ambiente. Confirmar después el pago y
   verificar que llega un segundo mensaje con enlace a la reserva confirmada.
6. Crear una reserva sin email: debe quedar `sin_canal`, sin llamada a Gmail y sin
   bloquear la reserva.
7. Probar la falla desconectando temporalmente la credencial Gmail sólo en Preview:
   los primeros intentos deben
   quedar en `pendiente` y devolver `503`; el tercero debe quedar en
   `dead_letter`. Reconectar Gmail y usar **Reintentar email** desde Administración.
8. Reemplazar la URL de test por `/webhook/`, activar el workflow de Preview y
   ejecutar nuevamente el recorrido antes de configurar Producción.

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
