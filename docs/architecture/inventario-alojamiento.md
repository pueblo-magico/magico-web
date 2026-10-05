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
unidades ocupadas sin depender de D1. WRESERV-11 conectará estas proyecciones a
la disponibilidad pública; WRESERV-15 realizará asignaciones definitivas.

La columna `asignaciones_inventario.unidad_inventario_id` fue creada antes que
el catálogo. SQLite no permite agregarle una FK con `ALTER TABLE`; WRESERV-7
aplica la misma integridad mediante triggers hasta el rebuild controlado del
cutover. Las claves nuevas sí usan foreign keys nativas.

`reserva_estadia_espacios` resuelve con foreign keys los alojamientos legacy
1/2/3 hacia Domo 1, Domo 2 y Refugio. El backfill cubre las estadías existentes
y triggers mantienen el mapeo para altas y cambios realizados por los
adaptadores legacy.
