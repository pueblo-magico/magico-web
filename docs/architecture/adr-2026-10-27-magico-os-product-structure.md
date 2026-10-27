# ADR local — Sitio público de Pueblo y transición a Reservas standalone

- **Estado:** Límites aceptados a nivel de arquitectura; las integraciones conservan gates propios.
- **Fecha:** 2026-10-27
- **Repositorio:** magico-web
- **Masterplan:** [THE MAGICO OS MASTERPLAN](https://experienciamagico.atlassian.net/wiki/spaces/VD/pages/54263809/THE+MAGICO+OS+MASTERPLAN).
- **ADRs transversales propuestos:** `pueblo-magico/magico-architecture/docs/adr` (repositorio pendiente de creación): **magico-architecture/ADR-0001** módulos, **ADR-0002** instalaciones dedicadas, **ADR-0003** identidad/autorización, **ADR-0004** integración, **ADR-0005** Admin Center. Hasta su publicación, leer el Masterplan; no considerar viva una URL futura.

## Propiedad de este repositorio

Este repositorio posee la presentación pública y contenido de Pueblo Mágico, experiencias, eventos editoriales, UX del visitante, CTAs y conectores frontend. No debe convertirse en autoridad permanente de reservas, precios/ocupación o pagos tras el cutover.

## Restricciones que el agente debe mantener

Hay writers legacy en magico-web. Antes de apagar rutas o redirigir APIs: completar inventario de escritores, reconciliar IDs y contratos, confirmar una sola autoridad de D1, migrar uno a uno con respaldo y rollback. Hospedar checkout completo en Reservas, con sitio público integrado por deep link/API. No exigir OS Shell a Pueblo/SOMA ni duplicar CMS/content en Reservas.

## Implementación y dependencias

[WRESERV-29](https://experienciamagico.atlassian.net/browse/WRESERV-29), [WRESERV-54](https://experienciamagico.atlassian.net/browse/WRESERV-54) y [runbook writer cutover](https://github.com/pueblo-magico/magico-reservas/blob/codex/production-mvp-launch/docs/architecture/magico-web-writer-cutover.md) son puertas operativas, no Done por documentación.

## Precedencia/historia

El Masterplan v1.1 aceptado el 27/10/2026 supersede OS Base obligatorio y tenancy compartida como requisito Reservas v0.1. Se conservan Jira/historia Git, las fuentes de verdad por dominio y las decisiones propias de cada repo. Esta ADR local no es una copia canónica de los cinco ADRs transversales y está en una PR docs draft (sin aprobación productiva implícita).
