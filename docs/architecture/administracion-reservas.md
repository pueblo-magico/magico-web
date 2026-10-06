# Administración de reservas v1

El panel administrativo usa contratos versionados para consultar y gestionar
reservas sin escribir directamente sobre D1. Todos los endpoints requieren una
sesión administrativa; las mutaciones también requieren un token CSRF válido.

## Contratos

- `GET /api/v1/admin/reservas`: listado paginado con filtros por fechas, estado
  de flujo, origen, espacio y titular. Requiere `reservas.leer`.
- `GET /api/v1/admin/reservas/:id`: detalle compuesto con estadías,
  asignaciones, pagos, eventos y excepciones. Requiere `reservas.leer`.
- `GET /api/v1/admin/reservas/panel`: alojamientos y métricas agregadas para
  la vista operativa, sin duplicar el listado de reservas.
- `GET /api/v1/admin/reservas/exportar`: exportación CSV filtrada y auditada.
  Requiere `datos_personales.exportar`; sólo incluye PII cuando se solicita
  explícitamente con `incluir_pii=true`. Por defecto exporta el mínimo dato
  financiero necesario y limita el resultado a 5.000 filas.
- `POST /api/v1/admin/reservas`: crea una reserva comercial confirmada y ocupa
  sus noches de forma atómica. Requiere `reservas.crear`.
- `PATCH /api/v1/admin/reservas/:id`: corrige nombre, teléfono, email u origen.
  Requiere `reservas.editar` y `expected_version`.
- `POST /api/v1/admin/reservas/:id/estado`: confirma, cancela o vence una
  reserva. Requiere `reservas.editar` para confirmar y `reservas.cancelar` para
  cancelar o vencer. Siempre exige `expected_version` y un motivo.

La versión optimista evita que dos administradores sobrescriban cambios. Un
conflicto devuelve HTTP `409`; el cliente debe refrescar la reserva antes de
reintentar. Cada mutación registra el actor, la correlación, la versión y, en
los cambios de estado, el motivo. Cancelar o vencer libera tanto la ocupación
comercial nocturna como las asignaciones físicas sin borrar su historial.

Las fechas, importes y asignaciones no se corrigen con el endpoint genérico de
edición porque afectan inventario y trazabilidad. Las asignaciones tienen su
contrato específico, y las estadías no comerciales se gestionan como ocupación
operativa, no como reservas de monto cero.

## Catálogos y tiempo operativo

El contrato v1 usa un único catálogo de estados:
`pendiente_pago`, `confirmada`, `cancelada`, `vencida` y `rechazada`. La columna
legacy `reservas.estado` se conserva temporalmente para compatibilidad, pero no
se expone como estado operativo; `reservas.estado_flujo` es la fuente de verdad
para API y panel. Los tipos de estadía admitidos son `huesped`, `staff`,
`voluntario` y `residente`.

Las fechas de estadía son fechas civiles con intervalo `[check-in, check-out)`.
Los timestamps técnicos se guardan en UTC. Cualquier cálculo de “hoy”, nombre
de reporte o ventana operativa se resuelve en `America/Argentina/Cordoba` para
evitar que la medianoche UTC cambie el día mostrado al equipo local.

La descarga del panel siempre atraviesa el endpoint protegido: no se genera
otro CSV con PII en el navegador. Cada exportación registra actor, correlación,
filtros no sensibles, cantidad, truncamiento y si incluyó datos personales.
