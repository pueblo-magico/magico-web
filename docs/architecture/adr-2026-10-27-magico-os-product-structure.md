# ADR local — Sitio público de Pueblo y transición a Reservas standalone

- **Estado:** Límites aceptados a nivel de arquitectura; las integraciones conservan gates propios.
- **Fecha:** 2026-10-27
- **Repositorio:** magico-web
- **Masterplan:** [THE MAGICO OS MASTERPLAN](https://experienciamagico.atlassian.net/wiki/spaces/VD/pages/54263809/THE+MAGICO+OS+MASTERPLAN).
- **ADRs transversales — edición en revisión:** [Índice técnico](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/README.md) · [magico-architecture/ADR-0001 Modular products](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/0001-modular-product-architecture.md) · [magico-architecture/ADR-0002 Dedicated deployments](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/0002-dedicated-installations.md) · [magico-architecture/ADR-0003 Identity/authorization](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/0003-identity-and-authorization.md) · [magico-architecture/ADR-0004 Module APIs/events](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/0004-module-integration-contract.md) · [magico-architecture/ADR-0005 OS Admin Center](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/0005-admin-center-ownership.md). Archivos publicados en commit inmutable `076927d720af` de [magico-architecture PR #1](https://github.com/pueblo-magico/magico-architecture/pull/1), que sigue draft, sin fusionar a main. La decisión de producto vigente permanece en Confluence Masterplan y los límites específicos están en este ADR local.

## Propiedad de este repositorio

Este repositorio posee la presentación pública y contenido de Pueblo Mágico, experiencias, eventos editoriales, UX del visitante, CTAs y conectores frontend. No debe convertirse en autoridad permanente de reservas, precios/ocupación o pagos tras el cutover.

## Restricciones que el agente debe mantener

Hay writers legacy en magico-web. Antes de apagar rutas o redirigir APIs: completar inventario de escritores, reconciliar IDs y contratos, confirmar una sola autoridad de D1, migrar uno a uno con respaldo y rollback. Hospedar checkout completo en Reservas, con sitio público integrado por deep link/API. No exigir OS Shell a Pueblo/SOMA ni duplicar CMS/content en Reservas.

## Implementación y dependencias

[WRESERV-29](https://experienciamagico.atlassian.net/browse/WRESERV-29), [WRESERV-54](https://experienciamagico.atlassian.net/browse/WRESERV-54) y [runbook writer cutover](https://github.com/pueblo-magico/magico-reservas/blob/codex/production-mvp-launch/docs/architecture/magico-web-writer-cutover.md) son puertas operativas, no Done por documentación.

## Precedencia/historia

El Masterplan v1.1 aceptado el 27/10/2026 supersede OS Base obligatorio y tenancy compartida como requisito Reservas v0.1. Se conservan Jira/historia Git, las fuentes de verdad por dominio y las decisiones propias de cada repo. Esta ADR local no es una copia canónica de los cinco ADRs transversales y está en una PR docs draft (sin aprobación productiva implícita).
