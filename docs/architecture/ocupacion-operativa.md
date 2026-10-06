# Bloqueos operativos y estadías no comerciales

WRESERV-2 / WRESERV-26 separa el uso operativo del inventario de las reservas comerciales. Un mantenimiento, cierre o alojamiento de staff no crea un huésped ni un pago ficticio.

## Agregados

- `bloqueos_inventario`: mantenimiento, cierre, uso interno o bloqueo de propietario sobre un espacio o una unidad y un intervalo `[fecha_desde, fecha_hasta)`.
- `estadias_no_comerciales`: ocupación de staff, voluntariado o residentes, con referencia operativa y cantidad de personas, sin campos monetarios.
- `ocupacion_operativa`: proyección de registros activos consumida por disponibilidad y calendario.

Cada registro apunta exactamente a un espacio o a una unidad. Las fechas usan checkout exclusivo. Los datos originales son inmutables: una corrección se cancela y se vuelve a crear, preservando quién hizo cada acción.

## Conflictos y capacidad

La base rechaza un alta que se superpone con una reserva pendiente o confirmada sobre el mismo inventario. También impide combinar un bloqueo con una estadía no comercial activa sobre el mismo espacio, un hijo o una de sus unidades.

Una estadía no comercial debe respetar la capacidad operativa del espacio o la capacidad de la unidad. La cancelación libera inmediatamente la proyección de disponibilidad, pero no elimina el historial.

Mientras WRESERV-11 y WRESERV-15 completan las modalidades y asignaciones normalizadas, un bloqueo parcial de un domo se interpreta de forma conservadora para el cotizador legacy: ese domo no se ofrece. En el refugio se descuenta la capacidad del espacio o unidad afectada y la cantidad de personas de las estadías internas.

## Seguridad y API

`GET /api/admin/ocupacion-operativa` lista los registros y los objetivos de inventario disponibles para el formulario administrativo. `POST` admite crear o cancelar bloqueos y estadías no comerciales. El dashboard ofrece estas operaciones en la pestaña `Bloqueos`.

Las operaciones requieren sesión, CSRF y `reservas.bloqueos.gestionar`, disponible para `super_admin` y `editor`. Cada alta y cancelación genera auditoría estructurada sin incluir PII ni secretos.

La migración `0007` se aplica automáticamente en el despliegue. Los workflows verifican tablas, vista, estados, objetivos e integridad referencial en preview y producción.
