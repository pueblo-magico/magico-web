# AGENTS — magico-web

## Lectura obligatoria y panorama Mágico OS
Mágico OS es un ecosistema de módulos **comprables e instalables independientemente**; cada instalación de cliente es single-tenant dedicada por defecto, con un único artefacto/release de código por módulo. OS Core incluye Shell + Admin Center para la **organización local**, usuarios OS, módulos, Domains e integraciones; no sustituye Admin ni permisos propios de Reservas/Commerce/Operaciones. La herramienta de proveedor global es distinta. **Domain** = workspace operativo (Refugio/Huerta), no módulo. Mágico Operaciones (Expo) = interfaz del personal en sitio; futura Mágico Companion = interfaz cliente. Sitios existentes se integran a productos vía checkout hospedado/links/API; Mágico Sites es futuro opcional.

**Owns:** sitio público de Pueblo Mágico, navegación, páginas, eventos editoriales, SEO y conexiones mediante CTAs/launchers al producto Reservas.
**Does not own:** ser motor perpetuo de reservas, disponibilidad, cotización y pagos tras cutover; Admin Center OS, la tienda o Learning.
**Cuidado al editar:** Aún existen writers legacy de Reservas en magico-web. No retirarlos ni activar rutas nuevas hasta cumplir gate WRESERV-29 y conciliación de autoridad, evitar doble escritura; el sitio es cliente del módulo standalone..

Mágico Auth/OIDC autentica, módulos verifican roles/permisos propios; no compartir bases, cookies, secretos ni acceder D1 externo. Usar APIs/eventos versionados, actor autenticado, idempotencia/auditoría. **Ahora:** Reservas v0.1 Pueblo+SOMA en dos instalaciones dedicadas. Eventos/Retiros v0.2 y Memberships cercanos tras v0.1; Finance, Insights, Learning, Companion (free/paid y guía on-site) y Sites futuros; no agregar estos a tickets actuales por inferencia.

Leer [ADR versionado en este repo](docs/architecture/adr-2026-10-27-magico-os-product-structure.md), [Masterplan v1.1](https://experienciamagico.atlassian.net/wiki/spaces/VD/pages/54263809/THE+MAGICO+OS+MASTERPLAN), README y documentación/AGENTS locales antes de modificar código. Ante decisión de arquitectura cross-repo, preservar histórico/supersesión en ADR(s) en código, actualizar Masterplan y comentar Jira afectado explicando estado. No desplegar ni ejecutar migraciones/merge sin gates expresos.
