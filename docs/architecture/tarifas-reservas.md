# Tarifas y snapshots de cotización

WRESERV-2 / WRESERV-25 reemplaza los importes embebidos en los handlers por planes tarifarios versionados en D1. El objetivo es que web, administración e integraciones coticen con las mismas reglas y que una reserva conserve la evidencia comercial aplicada.

## Modelo

- `planes_tarifa`: identidad, moneda, versión y estado (`borrador`, `publicado`, `retirado`). Sólo puede existir una versión publicada por código.
- `temporadas`: vigencia inclusiva y prioridad dentro de un plan.
- `reglas_precio`: alojamiento, modalidad, rango de ocupación, base de cálculo e importe en centavos.
- `reglas_sena`: bandas continuas de subtotal, con porcentaje en puntos básicos o importe fijo.
- `cotizaciones`: snapshot con código, versión, moneda, fechas, importes, desglose, hash de la solicitud y vencimiento.
- `reservas.cotizacion_id`: vincula como máximo una reserva con el snapshot que aceptó el cliente.

Los planes publicados y sus reglas son inmutables por triggers de D1. Para cambiar un precio se crea una versión nueva en borrador y se publica; la versión publicada anterior pasa a `retirado` en la misma operación atómica.

## Resolución y validaciones

Cada noche se resuelve por separado, para permitir estadías que atraviesan temporadas. Gana la temporada vigente de mayor prioridad. Dentro de ella debe existir exactamente una regla compatible con tipo de alojamiento, modalidad y ocupación.

Antes de escribir un borrador se rechazan:

- códigos, moneda, fechas, ocupación o importes inválidos;
- reglas superpuestas para el mismo alojamiento y modalidad;
- temporadas solapadas con igual prioridad y reglas compatibles ambiguas;
- bandas de seña superpuestas, con huecos o sin cobertura desde cero hasta un máximo abierto.

Publicar requiere al menos una temporada, una regla de precio y una regla de seña. El cálculo usa enteros; no usa punto flotante para dinero.

## Administración y seguridad

`GET /api/admin/tarifas` lista versiones. `POST /api/admin/tarifas` acepta las acciones `crear_borrador` y `publicar`.

Ambas operaciones requieren sesión administrativa, protección CSRF y el permiso `reservas.tarifas.gestionar`, asignado únicamente a `super_admin`. La creación y publicación generan eventos de auditoría sin incluir datos personales.

El endpoint es un contrato de backend. La interfaz administrativa visual puede agregarse después consumiendo este contrato sin mover SQL ni reglas de negocio al navegador.

## Cotización pública e integraciones

`/api/cotizar` y el flujo entrante de ManyChat usan el mismo caso de uso y el mismo repositorio de tarifas. Una cotización válida se persiste antes de responder; el flujo de reserva enlaza ese snapshot a la reserva pendiente.

El snapshot evita recalcular reservas históricas cuando cambian las tarifas. `request_hash` permite correlación técnica sin guardar datos personales y `expires_at` delimita cuánto tiempo puede aceptarse la oferta.

## Alcance actual

La migración inicial conserva las tarifas vigentes como `alojamiento-base`, versión 1, en ARS. El esquema admite `domo`, `refugio`, `camping` y `bell_tent`, pero nuevas tarifas, descuentos de retiros u otras políticas comerciales deben cargarse como decisiones explícitas; no se infieren desde el código.

## Pruebas relevantes

La cobertura funcional incluye cálculo por noche y temporada, ambigüedad, bandas de seña, snapshots, inmutabilidad, creación/publicación atómica, auditoría, autorización HTTP, migración desde una base vacía y recuperación. Los porcentajes de cobertura son una alarma de regresión, no una condición para escribir pruebas sin valor de negocio.
