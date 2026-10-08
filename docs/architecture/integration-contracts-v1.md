# Contratos de integración de reservas v1

## Límite

n8n consume APIs autenticadas; no recibe credenciales D1 ni ejecuta SQL.
ManyChat queda detrás de los workflows de n8n y no forma parte del contrato
nuevo. Cada request declara `X-Integration-Id: n8n` y usa su secreto server-side
en `X-Service-Secret` o Bearer. Los scopes se validan antes de leer el body o
consultar datos.

## Primer corte

- `GET /api/v1/integrations/reservas/disponibilidad`
- `POST /api/v1/integrations/reservas/cotizaciones`
- `POST /api/v1/integrations/reservas`

Ambos reutilizan los mismos repositorios y casos de uso que la web. Responden
con `meta.version=v1`, códigos de error estables y `reintentable`; no devuelven
PII ni IDs internos de inventario. Crear una reserva exige `Idempotency-Key`,
`contacto_id`, una cotización vigente y el espacio ofrecido por esa cotización.
La respuesta usa el código público `RES-*`; no expone el ID numérico D1.

Ejemplo de headers sanitizado:

```http
X-Integration-Id: n8n
X-Service-Secret: <secret server-side>
Content-Type: application/json
```

Ejemplo de creación desde n8n:

```http
POST /api/v1/integrations/reservas
X-Integration-Id: n8n
X-Service-Secret: <secret server-side>
Idempotency-Key: <clave estable de esta operación>
Content-Type: application/json

{
  "cotizacion_codigo": "COT-...",
  "espacio_codigo": "domo-1",
  "contacto_id": "contacto-estable-en-n8n",
  "conversacion_id": "ejecucion-o-conversacion-opcional",
  "cliente": {
    "nombre": "Nombre del huésped",
    "telefono": "+549...",
    "email": "huesped@example.com"
  }
}
```

n8n debe conservar y reutilizar la misma clave idempotente al reintentar la
misma operación. Un primer alta responde `201`; el reintento idéntico responde
`200` con el mismo `RES-*` y `meta.idempotente=true`. Reutilizar la clave con
otro payload responde `409`.

## Compatibilidad legacy

`POST /api/manychat` permanece disponible durante la convivencia. El nuevo
flujo objetivo es `ManyChat → n8n → API de reservas`. No se agregan capacidades
nuevas al endpoint directo de ManyChat. La confirmación directa desde el webhook
de pago se mantiene hasta WRESERV-28.

La tabla `consultas` representa un lead incompleto y no una reserva: no bloquea
inventario. Su contrato versionado y el vínculo opcional
consulta → cotización → reserva se implementan en el siguiente corte antes de
retirar el endpoint legacy.
