# API pública de reservas v1

La API pública comparte el mismo motor de disponibilidad y cotización que los
flujos internos existentes. D1 sigue siendo la fuente operativa de verdad.

## Contratos

- `GET /api/v1/public/alojamientos?contexto=general`
- `GET /api/v1/public/disponibilidad?check_in=2027-04-10&check_out=2027-04-12&personas=2&tipo_alojamiento=domo&modalidad=privada&contexto=general`
- `POST /api/v1/public/cotizaciones`

Ejemplo de solicitud de cotización:

```json
{
  "check_in": "2027-04-10",
  "check_out": "2027-04-12",
  "personas": 2,
  "tipo_alojamiento": "domo",
  "modalidad": "privada",
  "contexto": "general"
}
```

Las estadías usan el intervalo `[check_in, check_out)`: la noche de checkout no
se ocupa. Las fechas son días operativos de Pueblo Mágico y no timestamps; esto
evita conversiones de zona horaria sobre una fecha de alojamiento.

Los importes v1 se expresan en centavos enteros y siempre incluyen moneda,
código y versión del plan tarifario. Cada cotización persiste un snapshot del
desglose vigente, sin datos personales.

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
