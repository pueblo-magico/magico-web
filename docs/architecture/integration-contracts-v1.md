# Contratos de integración de reservas v1

## Límite

ManyChat y n8n consumen APIs autenticadas; no reciben credenciales D1 ni
ejecutan SQL. Cada request declara `X-Integration-Id: manychat|n8n` y usa su
propio secreto server-side en `X-Service-Secret` o Bearer. Los scopes se validan
antes de leer el body o consultar datos.

## Primer corte

- `GET /api/v1/integrations/reservas/disponibilidad`
- `POST /api/v1/integrations/reservas/cotizaciones`

Ambos reutilizan los mismos repositorios y casos de uso que la web. Responden
con `meta.version=v1`, códigos de error estables y `reintentable`; no devuelven
PII ni IDs internos de inventario.

Ejemplo de headers sanitizado:

```http
X-Integration-Id: n8n
X-Service-Secret: <secret server-side>
Content-Type: application/json
```

## Compatibilidad legacy

`POST /api/manychat` permanece disponible durante la convivencia. El nuevo
flujo migra en orden: disponibilidad, cotización, creación idempotente y luego
comunicaciones. La confirmación directa desde el webhook de pago se mantiene
hasta WRESERV-28.

La tabla `consultas` representa un lead incompleto y no una reserva: no bloquea
inventario. Su contrato versionado y el vínculo opcional
consulta → cotización → reserva se implementan en el siguiente corte antes de
retirar el endpoint legacy.
