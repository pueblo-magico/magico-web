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
2. Regla de precio legacy, aislada para ser reemplazada por WRESERV-25.
3. Consulta de disponibilidad a través de `RepositorioDisponibilidad`.
4. Cálculo de seña y saldo.

`D1RepositorioDisponibilidad` conserva las consultas actuales. WRESERV-6 y WRESERV-11 podrán reemplazar el esquema y la proyección sin cambiar el dominio ni los contratos HTTP al mismo tiempo.

La disponibilidad pública de `/api/disponibilidad` usa `consultarCalendarioDisponibilidad`. La proyección nocturna es una función pura y el handler ya no contiene SQL ni reglas de ocupación. `D1RepositorioCalendarioDisponibilidad` conserva las lecturas legacy hasta que WRESERV-6 introduzca el esquema normalizado.

El dashboard principal de `/api/admin/reservas` usa `consultarPanelReservas`. Las consultas legacy están encapsuladas en `D1RepositorioPanelReservas` y las métricas son una función pura. El cálculo de “hoy” continúa en UTC para preservar comportamiento; WRESERV-17 es responsable del cambio de zona horaria.

La asignación manual de unidades usa `asignarUnidadReserva` con puertos separados para persistencia y auditoría. El handler conserva autenticación, validación HTTP y serialización, pero no ejecuta SQL.

La creación manual usa `crearReservaManual` y `D1RepositorioCreacionReserva`. El control de solapamiento sigue siendo informativo —se crea la reserva aunque exista conflicto— para mantener el comportamiento operativo actual hasta que un ticket funcional cambie esa política.

## Reglas de implementación

- No agregar SQL a `functions/api` ni a `functions/_domain`.
- No duplicar reglas entre web, administración, ManyChat o webhooks.
- Los cambios de comportamiento requieren pruebas de dominio o contrato.
- Los importes actuales siguen siendo legacy; WRESERV-25 definirá unidades menores y snapshots versionados.
- El esquema actual no se modifica dentro de WRESERV-5.

## Estrategia de pruebas

- Node 24 ejecuta las pruebas unitarias TypeScript sin una capa adicional de runtime.
- `npm run test:reservas` ejecuta dominio, aplicación, límites arquitectónicos y adaptadores aislados.
- `npm run test:reservas:coverage` exige como mínimo 90% de líneas, 85% de ramas y 100% de funciones sobre los módulos cargados.
- Los repositorios D1 se prueban primero como adaptadores aislados; WRESERV-6/WRESERV-10 incorporarán una base D1 real para integración.
- Playwright queda reservado para contratos de navegador y administración cuando exista un ambiente de prueba con Chromium instalado.
