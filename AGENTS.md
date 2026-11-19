# AGENTS — magico-web

## Lectura obligatoria y panorama Mágico OS
Mágico OS es un ecosistema de módulos **comprables e instalables independientemente**; cada instalación de cliente es single-tenant dedicada por defecto, con un único artefacto/release de código por módulo. OS Core incluye Shell + Admin Center para la **organización local**, usuarios OS, módulos, Domains e integraciones; no sustituye Admin ni permisos propios de Reservas/Commerce/Operaciones. La herramienta de proveedor global es distinta. **Domain** = workspace operativo (Refugio/Huerta), no módulo. Mágico Operaciones (Expo) = interfaz del personal en sitio; futura Mágico Companion = interfaz cliente. Sitios existentes se integran a productos vía checkout hospedado/links/API; Mágico Sites es futuro opcional.

**Owns:** sitio público de Pueblo Mágico, navegación, páginas, eventos editoriales, SEO y conexiones mediante CTAs/launchers al producto Reservas.
**Does not own:** ser motor perpetuo de reservas, disponibilidad, cotización y pagos tras cutover; Admin Center OS, la tienda o Learning.
**Cuidado al editar:** Aún existen writers legacy de Reservas en magico-web. No retirarlos ni activar rutas nuevas hasta cumplir gate WRESERV-29 y conciliación de autoridad, evitar doble escritura; el sitio es cliente del módulo standalone..

Mágico Auth/OIDC autentica, módulos verifican roles/permisos propios; no compartir bases, cookies, secretos ni acceder D1 externo. Usar APIs/eventos versionados, actor autenticado, idempotencia/auditoría. **Ahora:** Reservas v0.1 Pueblo+SOMA en dos instalaciones dedicadas. Eventos/Retiros v0.2 y Memberships cercanos tras v0.1; Finance, Insights, Learning, Companion (free/paid y guía on-site) y Sites futuros; no agregar estos a tickets actuales por inferencia.

Leer [ADR versionado en este repo](docs/architecture/adr-2026-10-27-magico-os-product-structure.md), [Masterplan v1.1](https://experienciamagico.atlassian.net/wiki/spaces/VD/pages/54263809/THE+MAGICO+OS+MASTERPLAN), README y documentación/AGENTS locales antes de modificar código. Ante decisión de arquitectura cross-repo, preservar histórico/supersesión en ADR(s) en código, actualizar Masterplan y comentar Jira afectado explicando estado. No desplegar ni ejecutar migraciones/merge sin gates expresos.

<!-- BEGIN: MAGICO-ARCHITECTURE-REGISTRY v1.1 -->
## Central ADR library — immutable candidate for review

The central technical [Mágico Architecture repository](https://github.com/pueblo-magico/magico-architecture) now exists. Read its [ADR index](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/README.md) and the five globally scoped decisions: [magico-architecture/ADR-0001 Modular products](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/0001-modular-product-architecture.md) · [magico-architecture/ADR-0002 Dedicated deployments](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/0002-dedicated-installations.md) · [magico-architecture/ADR-0003 Identity/authorization](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/0003-identity-and-authorization.md) · [magico-architecture/ADR-0004 Module APIs/events](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/0004-module-integration-contract.md) · [magico-architecture/ADR-0005 OS Admin Center](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/0005-admin-center-ownership.md). They are pinned at commit `076927d720af` in [draft PR #1](https://github.com/pueblo-magico/magico-architecture/pull/1), not yet merged into the default branch.

This file remains self-contained for repo-only agents. [Masterplan v1.2](https://experienciamagico.atlassian.net/wiki/spaces/VD/pages/54263809/THE+MAGICO+OS+MASTERPLAN) determines product strategy. The [local ADR](docs/architecture/adr-2026-10-27-magico-os-product-structure.md) covers only this module's technical boundaries; do not duplicate global rationale or replace historical local ADRs. Namespace global IDs as `magico-architecture/ADR-NNNN`, distinct from same-numbered local ADRs.

For a shared architecture change, propose a new/superseding global ADR, check affected module contracts and AGENTS files, update Confluence/Jira impact comments, and retain evidence. ADR acceptance does not authorize deployment, production migrations or falsely marking Jira work Done.
<!-- END: MAGICO-ARCHITECTURE-REGISTRY v1.1 -->

## Branching and deployment — mandatory

Canonical policy: [magico-architecture/ADR-0008](https://github.com/pueblo-magico/magico-architecture/blob/main/docs/adr/0008-protected-branch-promotion.md) and the [branching/deployment guide](https://github.com/pueblo-magico/magico-architecture/blob/main/docs/engineering/branching-and-deployment.md). The repository-specific mapping is `.magico/deployment-policy.json`.

Repository mapping:

- Development: `planned`; branch `dev`; workflow `none`.
- Production: `active`; branch `main`; workflow `.github/workflows/deploy.yml`.
- A pull-request deployment is a preview, never the shared DEV environment.

Mandatory behavior:

- Work on a feature or fix branch and use a pull request. Never develop directly on an environment-authoritative branch.
- “Deploy to development” means merge the reviewed commit into the configured development branch and let the configured workflow deploy that merged commit.
- “Deploy to production” means merge the reviewed release into `main` (or the explicitly declared transitional production branch), obtain explicit production approval, and let the configured workflow deploy that exact merged commit.
- Never deploy a local checkout directly to shared DEV or PROD, dispatch a deployment from an arbitrary ref, bypass required checks, or expose production credentials to previews.
- A merge does not authorize a remote migration, secret rotation, destructive operation or package publication unless that action is explicitly included and approved.
- If an environment is `planned`, do not claim it is deployable. Prepare its branch, workflow, credentials and verification through a dedicated reviewed change.
- Verify and report branch, commit SHA, workflow run, target environment, migration result and health evidence. Distinguish local, preview, DEV and production evidence.
- Normal rollback is a revert PR merged into the environment-authoritative branch followed by its workflow. Do not rewrite protected history.

