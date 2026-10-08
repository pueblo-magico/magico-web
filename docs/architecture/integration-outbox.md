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
