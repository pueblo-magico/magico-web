# Outbox de integraciones

WRESERV-19 agrega un outbox transaccional entre el dominio de reservas y los
canales externos. Ningún cambio confirmado depende de que n8n, ManyChat u otro
consumidor esté disponible en ese momento.

## Escritura atómica

`reserva_eventos` continúa siendo el ledger de dominio append-only. La
migración `0021` crea `integration_outbox` y un trigger que proyecta cada nuevo
evento al outbox dentro de la misma transacción D1. El envelope sólo contiene
`event_id`, tipo y versión de esquema, agregado, `reservation_id` y timestamps;
no copia el payload de dominio ni datos personales.

Los eventos anteriores a la migración no se publican automáticamente. Esto
evita enviar como nuevos cambios históricos durante el despliegue.

## Entrega y recuperación

El dispatcher reclama lotes con un lease de cinco minutos. Un proceso caído
puede ser reclamado nuevamente cuando vence el lease. La entrega es al menos
una vez: un fallo se reprograma con backoff exponencial y jitter; al agotar el
límite queda en `dead_letter`, sin borrar el evento.

Cada intento queda en `integration_outbox_attempts` con código de error seguro,
sin guardar cuerpos ni mensajes del proveedor. Los consumidores deduplican por
`consumer + event_id` mediante `integration_processed_events`.

Cloudflare Queues puede implementarse como transporte del puerto
`EntregadorEventoIntegracion`. D1 permanece como fuente durable y recuperable;
el envío externo nunca ocurre dentro de la transacción de reservas.

## Dispatcher HTTP

`POST /api/v1/integrations/outbox/dispatch` permite que un cron o Worker reclame
un lote. Usa una identidad exclusiva mediante `OUTBOX_DISPATCH_SECRET` y además
requiere `INTEGRATION_OUTBOX_ENABLED=true`; no reutiliza secretos entrantes de
ManyChat, n8n ni pagos.

El adaptador HTTP sólo acepta un destino HTTPS configurado en
`INTEGRATION_EVENTS_WEBHOOK_URL`. Envía el secreto server-side como Bearer y el
`event_id` estable en `Idempotency-Key`. Nunca registra el secreto ni el cuerpo
de error del consumidor. Preview y producción deben usar secretos y destinos
distintos.

El scheduler operativo recomendado es n8n. El workflow versionado en
`docs/integrations/n8n-jobs-operativos.workflow.json` invoca el dispatcher cada
minuto; no contiene lógica de negocio ni secretos. Su configuración, validación
y pausa se documentan en `docs/operations/n8n-jobs-reservas.md`.

## Operación administrativa

`GET /api/v1/admin/integraciones/outbox` expone conteos por estado, edad del
pendiente más antiguo, tasa de fallas de entrega de las últimas 24 horas y, por
evento, estado, intentos, error seguro y latencia de entrega. No expone el
payload.

Un super admin puede recuperar un evento agotado con
`POST /api/v1/admin/integraciones/outbox/reprocesar`, indicando `event_id` y un
`motivo`. La acción reinicia el presupuesto de intentos, vuelve el evento a
`pending` y deja una entrada en `auditoria_admin`. Editores y viewers sólo
pueden consultar el estado operativo.

Para validaciones o intervención operativa, un super admin puede iniciar un
lote desde la interfaz mediante `POST /api/v1/admin/integraciones/outbox/despachar`.
La acción respeta la misma feature flag y el mismo destino server-side; ningún
secreto se envía al navegador.

Cada corrida emite `outbox.batch_dispatched` con un resultado acotado y sin PII.
Las fallas de configuración o entrega emiten `outbox.dispatch_failed`; ambos
eventos comparten el `X-Request-ID` enviado por el scheduler.
