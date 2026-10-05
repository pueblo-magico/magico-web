# Migraciones D1 del servicio de reservas

WRESERV-6 establece `migrations/` como la única fuente ejecutable del esquema.
Los archivos SQL sueltos de la raíz son antecedentes legacy y no deben volver a
ejecutarse. Wrangler aplica los archivos pendientes en orden y registra cada uno
en `d1_migrations`; `schema_migrations` ofrece una proyección legible para la
aplicación y los reportes operativos.

## Estrategia de convivencia

`0002_normalize_reservation_core.sql` es aditiva. Conserva `reservas`,
`alojamientos`, `consultas`, `usuarios_admin` y `auditoria_admin`, y agrega:

- identificador estable, código visible, moneda, importes en centavos,
  `updated_at` y versión a `reservas`;
- `reserva_estadias`, `asignaciones_inventario` y `ocupacion_noches`;
- `pagos` y `reserva_eventos`;
- `mapeo_ids_legacy` y `schema_migrations`.

Cada reserva legacy genera exactamente una estadía inicial, un evento de
importación y dos mapeos verificables. Los pagos de Mercado Pago conocidos se
preservan; no se inventan intentos que la base anterior nunca registró.
`consultas` permanece separada porque representa un lead incompleto, no una
reserva que deba bloquear inventario. Su importe estimado obtiene una proyección
en centavos.

Las asignaciones libres de `unidad_asignada` se copian a
`unidad_legacy_texto`. No se interpretan automáticamente como camas, domos o
parcelas. WRESERV-7 creará el catálogo físico y resolverá esos textos mediante
una decisión operativa explícita.

Mientras los endpoints existentes continúen escribiendo el modelo anterior,
triggers de compatibilidad proyectan cada alta o cambio hacia estadías,
asignaciones, pagos, eventos y mapeos. Esos triggers no contienen reglas de
negocio nuevas: preservan el mismo dato en ambas representaciones. Los tickets
WRESERV-11, WRESERV-12 y WRESERV-13 los retirarán después de migrar las
escrituras a repositorios normalizados.

## Preflight y verificación

Antes de una migración productiva, ejecutar
`scripts/reservas/preflight-migracion.sql` sobre una copia exportada o el target
controlado. El reporte enumera tablas, columnas, conteos, IDs externos
duplicados, filas inválidas y asignaciones pendientes de mapeo.

La propia migración repite como guards bloqueantes las condiciones que harían
ambiguo el backfill. Si una falla, D1 revierte `0002` y no la registra como
aplicada. Después de aplicar, `scripts/reservas/verificar-migracion.sql`
reconcilia conteos, importes, mapeos, eventos y claves foráneas. CI ejecuta esta
verificación antes del despliegue de Pages.

## Recuperación

Cloudflare captura un backup al aplicar migraciones D1. Como `0002` no elimina
ni renombra columnas legacy, el rollback inmediato de aplicación consiste en
volver a desplegar el commit anterior; los consumidores anteriores siguen
leyendo el mismo esquema. Si fuera necesario retirar físicamente la migración,
restaurar el backup capturado antes de `0002` en vez de escribir un `down` que
borre datos. El cutover y la eliminación de columnas legacy pertenecen a
WRESERV-29 y requieren reconciliación aprobada.
