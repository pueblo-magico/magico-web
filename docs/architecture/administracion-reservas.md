# Administración de reservas v1

El panel administrativo usa contratos versionados para consultar y gestionar
reservas sin escribir directamente sobre D1. Todos los endpoints requieren una
sesión administrativa; las mutaciones también requieren un token CSRF válido.

## Contratos

- `GET /api/v1/admin/reservas`: listado paginado con filtros por fechas, estado
  de flujo, origen, espacio y titular. Requiere `reservas.leer`.
- `GET /api/v1/admin/reservas/:id`: detalle compuesto con estadías,
  asignaciones, pagos, eventos y excepciones. Requiere `reservas.leer`.
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
