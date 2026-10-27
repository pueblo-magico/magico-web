# ADR 2026-10-27 — Integración modular de magico-web en Mágico OS

**Estado:** Accepted — arquitectura, no implementación completa. [THE MAGICO OS MASTERPLAN v1.1](https://experienciamagico.atlassian.net/wiki/spaces/VD/pages/54263809/THE+MAGICO+OS+MASTERPLAN).

## Decisión transversal
- Mágico OS = productos modulares autocontenidos comprables/instalables por separado. Despliegue single-tenant dedicado por cliente predeterminado; misma versión sin forks. OS Core/Shell/Admin Center local gestiona organización, usuarios OS, Domains, módulos integrados, config, health/auditoría, pero no precios/reservas/órdenes ni Admin propia de módulos. Panel del proveedor global queda separado.
- **Módulo** = producto con datos/API/roles/Admin propios (Reservas, Commerce, Operaciones, otros futuros); **Domain** = workspace operativo (Refugio, Huerta, Cocina) sin propiedad de transacciones; **Interfaz/canal** = staff Operaciones, admin especializado, website o futura Companion.
- Mágico Operaciones = app Expo web/native y API para el equipo in situ, no OS Shell ni Companion. Websites existentes (Pueblo magico-web, SOMA) integran módulos por deep links/hosted checkout/API; Mágico Sites es módulo opcional a futuro. CMS editorial y SEO no controlan reserva/cupo/precio.
- Auth usa OIDC, issuer+sub → magicoUserId; cada producto verifica membresía/permiso de dominio. Nunca compartir DB, cookies, secretos ni scripts de escritura entre productos. APIs/eventos versionados, autorización, auditoría e idempotencia en dueño.
- **Corte cercano:** Reservas v0.1 mismo artefacto desplegado independientemente en Pueblo y SOMA (D1/R2/credenciales/config separados). Tras v0.1: Eventos/Retreats como extensión Reservas v0.2 y Memberships/Subscriptions con beneficiarios aún a definir. Finance, Insights, Learning, Mágico Sites y Companion free/paid con guía on-site son roadmap futuro, no trabajo de v0.1. No confundir suscripciones B2B de módulos con membresías de usuarios.

## Límite de este repositorio
- **Owns:** sitio público de Pueblo Mágico, navegación, páginas, eventos editoriales, SEO y conexiones mediante CTAs/launchers al producto Reservas.
- **Does not own:** ser motor perpetuo de reservas, disponibilidad, cotización y pagos tras cutover; Admin Center OS, la tienda o Learning.
- **Safety/current state:** Aún existen writers legacy de Reservas en magico-web. No retirarlos ni activar rutas nuevas hasta cumplir gate WRESERV-29 y conciliación de autoridad, evitar doble escritura; el sitio es cliente del módulo standalone..

## Historia y vigencia
- 08/10 [límites de dominios/Events v0](https://experienciamagico.atlassian.net/wiki/spaces/VD/pages/42401795) priorizó fuentes de verdad.
- 13/10 [MAGOS-99](https://experienciamagico.atlassian.net/browse/MAGOS-99) propuso bundle OS Base obligatorio; [WRESERV-50](https://experienciamagico.atlassian.net/browse/WRESERV-50) migró entre standalone y OS module.
- 20/10 SOMA piloto website externo/checkout alojado.
- 26/10 [Reservas PR #2](https://github.com/pueblo-magico/magico-reservas/pull/2) implementó multi-tenant piloto preservado en `archive/multitenant-mvp-2026-10-26` (a358fa3); NO-GO.
- 27/10 Masterplan v1.1 adopta venta autónoma y dedicated-per-customer; supersede OS Base obligatorio y shared runtime como requisito v0.1. [ADR Reservas extendido](https://github.com/pueblo-magico/magico-reservas/blob/codex/modular-dedicated-v0.1/docs/architecture/adr-2026-10-27-modular-dedicated-installations.md).

ADR de código y Masterplan prevalecen donde contratos viejos discrepan; conservar los históricos. Decisiones cross-repo = ADR en código + Masterplan + Jira comment y estado verdadero, no release automáticamente.
