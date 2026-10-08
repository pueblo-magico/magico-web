# Arquitectura del servicio de reservas

Este documento fija los límites iniciales de WRESERV-1 / WRESERV-5. La migración es incremental: los endpoints existentes conservan su contrato mientras la lógica se mueve a capas explícitas.

## Capas y dependencias

```text
interfaces HTTP → aplicación → dominio
                           ↑
infraestructura D1 ────────┘
```

- `functions/_domain/reservas`: tipos y reglas puras. No conoce HTTP, Cloudflare, D1, SQL, Mercado Pago ni ManyChat.
- `functions/_application/reservas`: casos de uso y puertos. Coordina reglas del dominio a través de interfaces.
- `functions/_infrastructure`: adaptadores técnicos que implementan puertos, inicialmente D1.
- `functions/api`: interfaces HTTP de Cloudflare Pages. Validan el contrato, invocan un caso de uso y serializan el resultado.
- `functions/_lib`: fachadas temporales para migrar consumidores legacy sin un corte coordinado.

Las dependencias siempre apuntan hacia el dominio. Un caso de uso no importa un endpoint ni un adaptador concreto.

## Primera migración vertical

La cotización compartida por `/api/cotizar` y `/api/manychat` usa ahora `cotizarEstadia`. El caso de uso coordina:

1. Validación del rango de fechas.
2. Selección del plan tarifario publicado y cálculo por noche, temporada, modalidad y ocupación.
3. Consulta de disponibilidad a través de `RepositorioDisponibilidad`.
4. Cálculo de seña y saldo.

`D1RepositorioDisponibilidad` conserva las consultas actuales. WRESERV-6 y WRESERV-11 podrán reemplazar el esquema y la proyección sin cambiar el dominio ni los contratos HTTP al mismo tiempo.

La disponibilidad pública de `/api/disponibilidad` usa `consultarCalendarioDisponibilidad`. La proyección nocturna es una función pura y el handler ya no contiene SQL ni reglas de ocupación. `D1RepositorioCalendarioDisponibilidad` conserva las lecturas legacy hasta que WRESERV-6 introduzca el esquema normalizado.

El dashboard principal de `/api/admin/reservas` usa `consultarPanelReservas`. Las consultas legacy están encapsuladas en `D1RepositorioPanelReservas` y las métricas son una función pura. El cálculo de “hoy” continúa en UTC para preservar comportamiento; WRESERV-17 es responsable del cambio de zona horaria.

La asignación manual de unidades usa `asignarUnidadReserva` con puertos separados para persistencia y auditoría. El handler conserva autenticación, validación HTTP y serialización, pero no ejecuta SQL.

La creación manual usa `crearReservaManual` y `D1RepositorioCreacionReserva`. El control de solapamiento sigue siendo informativo —se crea la reserva aunque exista conflicto— para mantener el comportamiento operativo actual hasta que un ticket funcional cambie esa política.

La edición parcial usa `editarReserva` y `D1RepositorioEdicionReserva`. El adaptador vuelve a validar la lista cerrada de columnas antes de construir el `UPDATE`; los valores permanecen parametrizados y la cancelación conserva una acción de auditoría diferenciada.

Las interfaces HTTP de reservas usan `jsonReserva` y `respuestaErrorReserva`. Los errores tipados conservan código y estado estables; las excepciones desconocidas reciben un mensaje público genérico y no exponen texto de D1 al cliente.

La integración de ManyChat usa `iniciarReservaManyChat`, el mismo caso de uso de cotización, un repositorio D1 para la reserva pendiente y un adaptador de Mercado Pago. El handler conserva autenticación, validación y traducción del resultado externo, sin SQL ni llamadas directas al proveedor de pagos. `MANYCHAT_INBOUND_SECRET` autentica exclusivamente las solicitudes entrantes; nunca se reutiliza como credencial de la API pública. La URL de notificación de Mercado Pago conserva el origen de la solicitud, por lo que una preferencia creada en preview vuelve al webhook de preview y no al productivo.

El webhook de Mercado Pago conserva la validación HMAC en la interfaz HTTP y delega la consulta del pago, la transición de reserva y la notificación de ManyChat a puertos separados mediante `procesarPagoMercadoPago`. La salida a ManyChat solo se habilita cuando existen `MANYCHAT_API_KEY` y `MANYCHAT_CONFIRMATION_FLOW_NS`, y se apaga explícitamente con `MANYCHAT_NOTIFICATIONS_ENABLED=false`; sin ellas, la confirmación de D1 continúa con un notificador nulo. La firma, reintentos e idempotencia integral se endurecen en WRESERV-13.

El checkout público de Mercado Pago reutiliza ese mismo webhook y se activa de
forma explícita con `MP_CHECKOUT_ENABLED=true`. La reserva se persiste antes de
llamar al proveedor; `prepararCheckoutReservaPublica` coordina el intento y
`D1RepositorioCheckoutReservaPublica` conserva la preferencia en el ledger de
pagos. Las nuevas preferencias usan el código global `RES-…` como referencia,
mientras el procesador conserva compatibilidad con referencias numéricas
legacy. Los redirects nunca confirman el pago: sólo consultan el estado mínimo
persistido mediante la API pública.

## Reglas de implementación

- No agregar SQL a `functions/api` ni a `functions/_domain`.
- No duplicar reglas entre web, administración, ManyChat o webhooks.
- Los cambios de comportamiento requieren pruebas de dominio o contrato.
- Los importes se guardan como enteros en unidades menores. Cada cotización persiste un snapshot versionado e inmutable del plan tarifario utilizado; ver `tarifas-reservas.md`.
- El esquema actual no se modifica dentro de WRESERV-5.

## Estrategia de pruebas

- Node 24 ejecuta las pruebas unitarias TypeScript sin una capa adicional de runtime.
- `npm run test:reservas` ejecuta dominio, aplicación, límites arquitectónicos y adaptadores aislados.
- `npm run test:reservas:coverage` mantiene umbrales de regresión de 85% de líneas, 75% de ramas y 90% de funciones sobre los módulos cargados. No se agregan pruebas para alcanzar un porcentaje: se priorizan reglas de negocio, contratos HTTP, autorización, adaptadores D1, migraciones e integraciones.
- Los repositorios D1 se prueban como adaptadores y, para los flujos críticos, contra SQLite efímero aplicando las mismas migraciones SQL que despliega Cloudflare D1.
- Playwright queda reservado para contratos de navegador y administración cuando exista un ambiente de prueba con Chromium instalado.
