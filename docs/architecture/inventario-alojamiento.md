# Inventario físico de alojamiento

WRESERV-7 separa cuatro conceptos que el esquema legacy mezclaba en
`alojamientos` y `unidad_asignada`:

- `espacios`: lugares jerárquicos como refugio, habitaciones, domos, camping,
  salón y futuras bell tents;
- `modalidades_espacio`: reglas de venta privada, compartida o camping según
  contexto y unidad de venta;
- `unidades_inventario`: camas, plazas flexibles, parcelas o unidades físicas
  que pueden asignarse;
- `instalaciones`: baños y duchas compartidos, siempre no reservables.

## Configuración inicial

El refugio contiene habitaciones de 3, 4 y 8 plazas, con quince camas simples.
Las tres habitaciones permiten modalidad compartida; solamente la habitación de
4 permite modalidad privada.

Cada domo mantiene capacidad comercial 7 y máximo operativo 10. Las siete
plazas vendidas normalmente se registran como `plaza_flexible`: todavía no hay
evidencia suficiente para inventar cuántas camas simples o dobles existen en
cada domo. El modelo acepta ambas configuraciones cuando se complete el
relevamiento. Las excepciones de 8 a 10 personas pertenecen a WRESERV-8.

El camping exterior queda en `configuracion_pendiente` y su modalidad permanece
deshabilitada hasta identificar parcelas y capacidades reales. Se pueden crear
bell tents como espacios con camas sin modificar la tabla de reservas.

El salón tiene capacidad general cero y ninguna modalidad habilitada. Existe
una modalidad compartida de retiro deshabilitada como preparación para
WRESERV-30; los constraints actuales impiden habilitarla sin una migración y un
caso de uso explícitos.

Las instalaciones iniciales son un baño del refugio, ocho baños secos y seis
duchas exteriores. Viven en `instalaciones`, nunca en
`unidades_inventario`, por lo que ninguna consulta de disponibilidad o
asignación puede ofrecerlas como alojamiento.

## Disponibilidad y convivencia

`D1RepositorioInventarioAlojamiento` lista únicamente espacios con modalidad
habilitada y unidades activas/asignables. La consulta de unidades recorre hijos
con un CTE recursivo, de modo que el refugio puede ofrecer las camas de sus tres
habitaciones sin aplanar la jerarquía.

Las funciones puras `modalidadValidaParaEspacio` y
`calcularDisponibilidadInventario` validan contexto, modalidad, capacidad y
unidades ocupadas sin depender de D1. WRESERV-11 conecta estas proyecciones a
la disponibilidad pública.

## Asignación administrativa

WRESERV-15 reemplaza la asignación de texto libre para el flujo nuevo. Cada
cambio usa `asignaciones_inventario` para indicar dónde duerme cada huésped y
`ocupacion_noches` para bloquear unidades físicas con intervalo de checkout
exclusivo. Una cama doble sigue siendo una unidad con capacidad dos; no se
duplica artificialmente.

La modalidad privada ocupa todas las unidades del espacio durante cada noche,
aunque sólo las camas efectivamente utilizadas tengan huéspedes asignados. La
modalidad compartida y camping ocupan las camas o parcelas seleccionadas. Por
eso una asignación privada y una compartida no pueden coexistir sobre el mismo
inventario.

Los cambios nunca borran filas anteriores: las asignaciones y noches previas
pasan a `liberada`, y una operación nueva registra las unidades activas. La
reserva usa control optimista mediante `version`; una edición concurrente se
rechaza antes de mezclar decisiones administrativas. La operación, el evento
`reserva.asignada` o `reserva.asignacion_liberada`, la auditoría y la nueva
versión se guardan en un único batch D1.

La API administrativa versionada expone `GET`, `POST` y `DELETE` en
`/api/v1/admin/reservas/:id/asignaciones`. La lectura devuelve las unidades
bloqueadas, huéspedes por unidad y la capacidad física mínima restante a lo
largo de la estadía. WRESERV-14 puede consumir este contrato para el tablero sin
volver a leer `unidad_asignada`.

El camping y las bell tents usan el mismo servicio cuando sus espacios,
modalidades y unidades estén activos. El salón continúa excluido: habilitarlo
para un retiro exige el caso de uso específico de WRESERV-30.

La columna `asignaciones_inventario.unidad_inventario_id` fue creada antes que
el catálogo. SQLite no permite agregarle una FK con `ALTER TABLE`; WRESERV-7
aplica la misma integridad mediante triggers hasta el rebuild controlado del
cutover. Las claves nuevas sí usan foreign keys nativas.

`reserva_estadia_espacios` resuelve con foreign keys los alojamientos legacy
1/2/3 hacia Domo 1, Domo 2 y Refugio. El backfill cubre las estadías existentes
y triggers mantienen el mapeo para altas y cambios realizados por los
adaptadores legacy.

## Excepciones de capacidad

La capacidad comercial de cada domo permanece en siete y su máximo operativo
en diez. `excepciones_capacidad` registra una autorización puntual vinculada a
la estadía, nunca un cambio temporal sobre `espacios`.

Cada solicitud exige capacidad, motivo y plan de camas. Puede abarcar toda la
estadía o un rango nocturno interno. Su ciclo es `solicitada` → `aprobada` o
`rechazada`; una aprobación puede pasar a `revocada`. Las solicitudes y cada
decisión generan tanto un evento de reserva como una entrada de auditoría
administrativa.

El flujo público conserva el máximo de siete. Para llevar una reserva
administrativa a 8–10 personas se solicita y aprueba primero la excepción; los
triggers rechazan cualquier actualización sin esa aprobación y todo valor por
encima de diez. Los editores pueden solicitar y solamente el permiso
`reservas.capacidad.autorizar`, asignado hoy a `super_admin`, puede aprobar,
rechazar o revocar.
