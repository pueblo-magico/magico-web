# Seguridad del sistema de reservas

## Límites de confianza

El navegador administrativo se autentica con una sesión firmada y el servidor vuelve a consultar el usuario activo y su rol en D1 en cada request. Las integraciones no usan sesiones humanas: presentan una credencial propia y reciben un alcance mínimo. La UI puede ocultar acciones, pero la autorización siempre ocurre en la API.

Los controles cubren los riesgos principales: elevación de privilegios, CSRF, fuerza bruta, abuso de endpoints públicos, payloads excesivos o malformados, filtración de secretos y exposición innecesaria de datos personales en logs o auditoría.

## Matriz de permisos

| Capacidad | viewer | editor | super_admin |
|---|---:|---:|---:|
| Ver reservas, consultas y métricas | Sí | Sí | Sí |
| Crear, editar, cancelar y asignar | No | Sí | Sí |
| Modificar importes o pagos | No | No | Sí |
| Solicitar capacidad excepcional | No | Sí | Sí |
| Aprobar, rechazar o revocar capacidad | No | No | Sí |
| Sincronizar Airbnb | No | Sí | Sí |
| Gestionar usuarios y ver auditoría | No | No | Sí |
| Exportar o anonimizar PII | No | No | Sí |

## Sesiones, CSRF y contraseñas

- `SESSION_SECRET` firma una cookie `HttpOnly`, `Secure`, `SameSite=Strict`. Debe ser aleatorio, tener como mínimo 32 caracteres y ser distinto por ambiente.
- Cada sesión posee ID y token CSRF propios. Toda mutación administrativa exige que el header `X-CSRF-Token` coincida con el valor firmado y con la cookie CSRF.
- Desactivar un usuario o cambiar su rol tiene efecto en el siguiente request.
- Las contraseñas nuevas o reseteadas deben tener al menos 12 caracteres. El login mantiene bloqueo por usuario y agrega rate limiting por origen.

## Servicios y secretos

Los secretos se configuran como secretos de Cloudflare Pages, nunca como variables `VITE_*`, archivos versionados, logs o datos en D1.

| Identidad | Variable | Alcance actual |
|---|---|---|
| ManyChat entrante | `MANYCHAT_INBOUND_SECRET` | `reservas:crear` |
| n8n | `N8N_INBOUND_SECRET` | `reservas:crear`, `reservas:leer` |
| Contabilidad | `ACCOUNTING_API_SECRET` | `reservas:leer` |
| Stock | `STOCK_API_SECRET` | `stock:leer` |

`RATE_LIMIT_SALT` separa los hashes usados por los límites de tráfico. Si no está definido, se usa `SESSION_SECRET` como fallback operativo; se recomienda configurar un valor aleatorio independiente. Las credenciales de Mercado Pago y ManyChat saliente mantienen su uso específico y no otorgan acceso a APIs internas.

La integración futura con Cucuru debe tener identidad y secreto propios, firma verificable de webhooks, protección contra replay, idempotencia, rotación documentada y alcance mínimo. No se habilita ningún acceso Cucuru en esta tarea.

## Auditoría y datos personales

La auditoría persiste actor, acción, tipo e ID de entidad, fecha, motivo, correlation ID y metadata operativa acotada. No guarda nombres de huéspedes, emails, teléfonos, tokens, secretos ni valores de campos editados.
La migración elimina el campo libre `detalle` de registros históricos porque podía contener PII; conserva actor, acción y fecha.

`POST /api/admin/datos-personales` permite a `super_admin`:

- `accion=exportar`: devolver los datos personales asociados a una reserva, con `Cache-Control: no-store`.
- `accion=anonimizar`: eliminar nombre, teléfono, email e identificador ManyChat, preservando estadía, importes, pagos y trazabilidad financiera.

Ambas acciones exigen un motivo y generan una solicitud y auditoría correlacionadas. Los plazos de retención de huéspedes, auditoría, logs y backups quedan en `politicas_retencion_datos` como `pendiente_configuracion`: deben definirse con fundamento legal/operativo antes de automatizar eliminaciones. No se inventan plazos.

Los backups deben heredar el mismo control de acceso que producción y una política de expiración aprobada. Logs y datos de prueba no deben contener PII real. La anonimización en la base primaria no reescribe backups históricos; ese tratamiento depende de la política de backup que se apruebe.

## Operación

- La migración `0005_security_rbac_pii.sql` crea límites, auditoría estructurada y registros del ciclo de PII.
- `verificar-seguridad.sql` se ejecuta en CI después de aplicar migraciones, tanto en preview como en producción.
- Los contadores guardan un hash con salt del origen, nunca la IP ni el secreto en claro.
- Los handlers públicos e integraciones devuelven errores seguros; los detalles internos no se envían al cliente ni se imprimen con payloads.
