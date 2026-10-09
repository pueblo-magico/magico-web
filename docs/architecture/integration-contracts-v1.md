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
- `POST /api/v1/integrations/consultas`
- `POST /api/v1/integrations/reservas`

Los contratos reutilizan los mismos repositorios y casos de uso que la web. Responden
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
POST /api/v1/integrations/consultas
X-Integration-Id: n8n
X-Service-Secret: <secret server-side>
Idempotency-Key: <clave estable de esta consulta>
Content-Type: application/json

{
  "contacto_id": "contacto-estable-en-n8n",
  "conversacion_id": "ejecucion-o-conversacion-opcional",
  "cliente": {
    "nombre": "Nombre del huésped",
    "telefono": "+549...",
    "email": "huesped@example.com"
  },
  "alojamiento_interes": "domo privado",
  "fecha_desde": "2028-02-10",
  "fecha_hasta": "2028-02-12",
  "cantidad_personas": 2,
  "monto_estimado_centavos": 15000000,
  "cotizacion_codigo": "COT-..."
}
```

La consulta responde con un código público `CON-*`. No crea una reserva,
retención ni ocupación y declara `meta.bloquea_inventario=false`. La cotización
es opcional; si se informa, debe existir. Los reintentos siguen las mismas reglas
de idempotencia que la creación de reservas.

Ejemplo de conversión posterior en reserva:

```http
POST /api/v1/integrations/reservas
X-Integration-Id: n8n
X-Service-Secret: <secret server-side>
Idempotency-Key: <clave estable de esta operación>
Content-Type: application/json

{
  "cotizacion_codigo": "COT-...",
  "espacio_codigo": "domo-1",
  "consulta_codigo": "CON-...",
  "contacto_id": "contacto-estable-en-n8n",
  "conversacion_id": "ejecucion-o-conversacion-opcional",
  "cliente": {
    "nombre": "Nombre del huésped",
    "telefono": "+549...",
    "email": "huesped@example.com"
  }
}
```

`consulta_codigo` es opcional. Cuando se envía, la API exige que pertenezca al
mismo `contacto_id`, `conversacion_id` e integración antes de vincularla con la
reserva. Esto conserva la trazabilidad consulta → cotización → reserva sin
permitir que un workflow vincule consultas ajenas.

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
inventario. El contrato versionado mantiene el vínculo opcional
consulta → cotización → reserva. El retiro del endpoint legacy requiere una
migración posterior de los workflows existentes.
