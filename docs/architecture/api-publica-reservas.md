# API pública de reservas v1

La API pública comparte el mismo motor de disponibilidad y cotización que los
flujos internos existentes. D1 sigue siendo la fuente operativa de verdad.

## Contratos

- `GET /api/v1/public/alojamientos?contexto=general`
- `GET /api/v1/public/disponibilidad?check_in=2027-04-10&check_out=2027-04-12&personas=2&tipo_alojamiento=domo&modalidad=privada&contexto=general`
- `POST /api/v1/public/cotizaciones`
- `POST /api/v1/public/reservas`

Ejemplo de solicitud de cotización:

```json
{
  "check_in": "2027-04-10",
  "check_out": "2027-04-12",
  "personas": 2,
  "tipo_alojamiento": "domo",
  "modalidad": "privada",
  "contexto": "general",
  "regimen_alimentacion": "pension_completa"
}
```

Las estadías usan el intervalo `[check_in, check_out)`: la noche de checkout no
se ocupa. Las fechas son días operativos de Pueblo Mágico y no timestamps; esto
evita conversiones de zona horaria sobre una fecha de alojamiento.

Los importes v1 se expresan en centavos enteros y siempre incluyen moneda,
código y versión del plan tarifario. Cada cotización persiste un snapshot del
desglose vigente, sin datos personales.

## Alimentación

La cotización admite únicamente dos valores estables:

- `desayuno_incluido`: incluido en el alojamiento, sin recargo.
- `pension_completa`: agrega almuerzo y cena por cada persona y noche.

Cada comida cuesta ARS 20.000. Por lo tanto, `pension_completa` agrega ARS
40.000 por persona y noche. La respuesta separa `alojamiento_centavos` de
`alimentacion_centavos`, y la seña se calcula sobre la suma de ambos. El
snapshot conserva el régimen, el precio por comida y la versión de la tarifa.

Para compatibilidad, si se omite `regimen_alimentacion` se utiliza
`desayuno_incluido`.

## Creación y retención

`POST /api/v1/public/reservas` acepta una cotización vigente, el código del
espacio ofrecido y datos mínimos del titular. Requiere el header
`Idempotency-Key`; repetir la misma clave y payload devuelve la misma reserva,
mientras que reutilizarla con otros datos responde conflicto.

```json
{
  "cotizacion_codigo": "COT-...",
  "espacio_codigo": "domo-1",
  "cliente": {
    "nombre": "Nombre del huésped",
    "telefono": "+54...",
    "email": "huesped@example.com"
  }
}
```

La reserva queda en `pendiente_pago` con una retención de 15 minutos. La
escritura de reserva, estadía, noches ocupadas, retención, eventos y respuesta
idempotente se ejecuta como una única operación D1. Si el inventario cambió
desde la cotización, no queda una reserva parcial.

## Capacidad y disponibilidad

- Los domos publican una capacidad comercial máxima de 7, aunque su capacidad
  operativa admita excepciones administrativas auditadas.
- El Refugio compartido ofrece 15 plazas y calcula la menor capacidad disponible
  de todas las noches solicitadas.
- La habitación de 4 plazas puede cotizarse como privada. Mientras no exista una
  asignación física definitiva, cualquier ocupación relacionada con el Refugio
  la bloquea de forma conservadora.
- Reservas `pendiente` y `confirmada`, bloqueos y estadías no comerciales afectan
  el mismo cálculo.

Motivos estables: `DISPONIBLE`, `INVENTARIO_OCUPADO`,
`CAPACIDAD_INSUFICIENTE` y `MODALIDAD_NO_DISPONIBLE`.

## Seguridad y límites de esta etapa

Las respuestas públicas no incluyen PII, identificadores de reserva ni IDs
internos del inventario. Los endpoints tienen CORS explícito, lectura JSON
limitada y rate limiting persistido por hash.

Hasta WRESERV-12, una reserva `pendiente` bloquea inventario sin vencimiento
automático: ese ticket incorporará holds de pago con expiración explícita.
Hasta WRESERV-15, los domos y la habitación privada se resuelven de manera
conservadora; ese ticket incorporará asignación física definitiva por unidad.

El endpoint legacy `POST /api/cotizar` continúa disponible y delega al mismo
caso de uso. Acepta opcionalmente `modalidad` y `contexto` para una migración
gradual de consumidores.
