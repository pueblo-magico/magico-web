# Políticas de cancelación y devolución

WRESERV-27 separa las reglas comerciales del proveedor de pagos y de la UI.
Las políticas se versionan en `politicas_cancelacion`; una versión publicada es
inmutable y las nuevas reglas requieren una versión nueva.

Todavía no existe una definición comercial aprobada de plazos o porcentajes.
Por eso la migración crea `reservas-general` versión 1 con estado
`pendiente_configuracion` y sin reglas. El motor devuelve
`CONFIGURACION_PENDIENTE`: nunca interpreta la ausencia de configuración como
una devolución total, parcial o no reembolsable.

Cada cotización copia el código, la versión, el estado y el JSON de la política
vigente. Al aceptar la cotización, la reserva guarda una copia inmutable en
`reserva_politica_snapshots`. Las reservas de canales sin cotización también
reciben un snapshot explícito, pendiente mientras no haya una política
publicada.

El cálculo de devolución recibe timestamps explícitos, el importe efectivamente
pagado y el snapshot de la reserva. Selecciona la regla configurada más
específica para la anticipación de la cancelación y opera en basis points e
importes enteros. Si no existe una regla aplicable, devuelve
`REGLA_NO_DEFINIDA` en lugar de asumir un resultado.

`devoluciones_reserva` vincula cada devolución con la reserva, el pago original
y el snapshot aplicado. La clave idempotente evita duplicados. Las excepciones
administrativas se registran en `excepciones_politica_reserva` con motivo,
solicitante y resolución. `GET/POST /api/admin/politicas-reserva` permite listar,
crear y publicar versiones, además de solicitar y resolver excepciones. Todas
las escrituras requieren sesión, CSRF y el permiso exclusivo
`reservas.politicas.gestionar`; también generan auditoría y eventos de dominio.

El vencimiento de las retenciones de pago continúa siendo de 15 minutos. Es un
control operativo independiente de las reglas comerciales de devolución y su
ejecución idempotente permanece en el flujo de WRESERV-12.
