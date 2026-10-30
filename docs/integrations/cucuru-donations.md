# Webhook Cucuru para aportes de reforestación

## Endpoints

- Principal: `POST /api/v1/integrations/cucuru`
- Compatible con PR #45: `POST /api/v1/integrations/cucuru/collection_received`

Los dos paths ejecutan el mismo handler y comparten la deduplicación por
`collection_id`. El endpoint principal coincide con la URL configurada
históricamente en Cucuru.

## Seguridad y clasificación

El listener reutiliza el contrato validado en PR #45:

- secreto estático en `X-Cucuru-Webhook-Secret` (nombre configurable);
- comparación en tiempo constante;
- validación del `collector_id`;
- normalización estricta de importe, moneda, fecha y CVU;
- hash del contenido canónico, sin persistir el payload completo;
- prueba autenticada de importe cero sin efectos financieros;
- idempotencia durable por `collection_id`.

Una Collection real solamente se registra como aporte cuando
`collection_account` coincide exactamente con `CUCURU_DONATIONS_ACCOUNT`.
También debe coincidir con `CUCURU_DONATIONS_CURRENCY` (`ARS` por defecto).
Las Collections de otra cuenta o moneda quedan en revisión manual y nunca
incrementan los aportes. Las Collections rechazadas se ignoran. Esto permite
usar el mismo Collector para reservas y donaciones sin mezclar movimientos.

## Persistencia

Antes de activar el endpoint, aplicar `add_cucuru_donations.sql` en la D1 del
ambiente. Se crean tres tablas:

- `cucuru_webhook_eventos`: ledger mínimo e idempotente;
- `reforestacion_aportes`: aportes confirmados;
- `cucuru_revisiones_aporte`: destinos desconocidos o redeliveries
  inconsistentes.

No se conservan `customer_name`, `customer_tax_id`, `transfer_data` ni el
payload crudo.

## Respuesta automática

Después de registrar un aporte nuevo, el sitio envía una notificación interna
por Resend a `NOTIFY_EMAIL`. La entrega queda marcada como `enviada` o
`fallida` en D1. Una redelivery legítima no vuelve a mandar el correo.

El webhook de Cucuru no aporta por sí solo un email o WhatsApp confiable del
donante. El agradecimiento directo requiere una referencia previamente
vinculada a un contacto con consentimiento; no se infiere desde datos
bancarios.

## Activación

1. Desplegar el código en Preview.
2. Aplicar `add_cucuru_donations.sql` en la D1 de Preview.
3. Configurar secretos server-side por ambiente.
4. Ejecutar pruebas autenticadas de importe cero, aporte real, redelivery y
   cuenta que no sea la de reforestación.
5. Desplegar a producción y aplicar la migración remota.
6. Cambiar Cucuru a
   `https://experienciamagico.com/api/v1/integrations/cucuru`.
7. Repetir la prueba de importe cero y verificar D1/Resend.
