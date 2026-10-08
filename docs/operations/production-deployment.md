# Despliegue productivo de reservas

Producción no se despliega por un push o merge a `main`. El workflow **Deploy
to Cloudflare Pages** sólo se inicia manualmente desde GitHub Actions y el job
usa el environment protegido `production`.

Este runbook implementa WRESERV-29. No autoriza un lanzamiento: cada ejecución
requiere una decisión humana, el texto exacto `PRODUCCION` y la aprobación del
environment. La rama de trabajo nunca se despliega a Producción.

## Responsables y puntos de control

| Rol | Responsabilidad |
| --- | --- |
| Responsable de release | fija el SHA de `main`, completa el preflight y ejecuta el workflow |
| Aprobador de negocio | confirma ventana, textos legales, tarifas y medio de pago vigente |
| Operaciones | pausa jobs, observa reservas/pagos y ejecuta el smoke test real controlado |
| Aprobador técnico | revisa bookmark, reconciliación y autoriza continuar o revertir |

Los puntos de control son: **Go/No-Go antes del workflow**, aprobación del
environment antes de tocar D1 y **Go/No-Go posterior** después de la
reconciliación y los smoke tests. Cualquier diferencia no explicada implica
No-Go.

## Configuración única en GitHub y Cloudflare

1. Crear o revisar el environment **production** en **Settings > Environments**.
2. Agregar al menos un revisor obligatorio y evitar autoaprobación cuando la
   política de la organización lo permita.
3. Mantener `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` como secretos del
   environment o del repositorio con acceso mínimo a Pages y D1.
4. Configurar `PRODUCTION_BASE_URL` como variable del environment, con la URL
   HTTPS canónica del sitio.
5. Verificar en Cloudflare que `DB` apunta a `magico-ensueno-db`; Preview debe
   seguir apuntando exclusivamente a `magico-ensueno-db-preview`.
6. Verificar sin copiar valores que Producción tenga `SESSION_SECRET`, el token
   y secreto de webhook de Mercado Pago, `DNI_HMAC_SECRET` y el usuario súper
   admin inicial. Cucuru debe permanecer desactivado para este lanzamiento.

El environment es una segunda barrera. El workflow también requiere inicio
manual y un motivo de release visible en la ejecución.

## Procedimiento

1. Confirmar que el SHA de `main` elegido coincide con la versión MVP de Jira y
   pasó Preview, pruebas, revisión y validación legal.
2. Pausar temporalmente los jobs n8n de vencimientos y outbox. Activar la regla
   de mantenimiento acordada para que los POST de reserva e integraciones
   respondan `503` y los proveedores reintenten; no bloquear lecturas ni el
   panel. Registrar hora UTC, responsable y el estado de las colas. No borrar
   pendientes. Sin pausa de escrituras, la reconciliación exacta debe dar No-Go.
3. Confirmar acceso al panel, al usuario súper admin y a Mercado Pago. Ejecutar
   el drill local `npm run test:reservas:recovery`; no probar restore sobre
   Producción.
4. Abrir **Actions > Deploy to Cloudflare Pages > Run workflow**.
5. Elegir `main`, ingresar el motivo/referencia de aprobación y escribir
   `PRODUCCION`. Cualquier otra rama o texto deja el job omitido.
6. Verificar en el log `Show approved production commit` que el SHA coincide.
7. Aprobar el environment `production` sólo después de esa verificación.
8. El workflow guarda el bookmark Time Travel y la reconciliación previa,
   aplica las migraciones, ejecuta verificadores y compara conteos, estados e
   importes antes de desplegar Pages. Descargar el artifact
   `reservas-cutover-<SHA>` y adjuntarlo al registro de release.
9. Si la reconciliación pasa, el workflow despliega y verifica catálogo público,
   protección administrativa y rechazo seguro de un webhook sin firma.
10. Ejecutar una reserva real controlada: cotizar, crear `RES-…`, pagar la seña
    por el medio Mercado Pago vigente y comprobar que sólo el webhook confirma.
    Repetir la entrega del webhook y comprobar idempotencia. Para un rechazo,
    usar el escenario de prueba aprobado por Mercado Pago, nunca un cobro real.
11. Retirar la regla de mantenimiento y reanudar jobs de a uno. Verificar
    retenciones, outbox, comunicaciones y pagos en **Administración >
    Integraciones**. Registrar el Go posterior.

## Pausa y rollback

Antes de aprobar el environment se puede cancelar sin tocar producción. Si el
job falla después de iniciar migraciones, pausar nuevas ejecuciones, conservar
logs y aplicar este orden:

1. Si D1 está consistente y el error es de aplicación, redesplegar manualmente
   el último SHA compatible. No revertir datos.
2. Si la reconciliación demuestra daño de datos, obtener una segunda aprobación
   técnica y de negocio. Verificar que el bookmark del artifact pertenece a
   `magico-ensueno-db` y es anterior al cutover.
3. Ejecutar Time Travel restore sólo desde una terminal autenticada y guardar el
   bookmark que devuelve la restauración. Volver a ejecutar todos los
   verificadores antes de habilitar escrituras y jobs.
4. Si no es posible explicar el alcance, mantener el sistema pausado y escalar;
   nunca aplicar un `down.sql`, borrar tablas o importar un dump manual.

El restore se ensaya fuera de Producción con `npm run test:reservas:recovery`,
que aplica todas las migraciones descubiertas, altera un registro, restaura el
snapshot y valida versiones y claves foráneas.

## Retiro de endpoints legacy

Fecha objetivo: **2026-12-15**. No retirar antes de que durante 30 días corridos
se cumplan todas estas condiciones:

- cero tráfico legítimo en `/api/disponibilidad`, `/api/cotizar` y
  `/api/manychat`;
- sitio público y n8n consumen exclusivamente `/api/v1/`;
- no existen reservas pendientes creadas por un cliente legacy;
- Operaciones aprobó la evidencia y existe un rollback del consumidor.

Hasta entonces los endpoints quedan observados y compatibles. El retiro debe
ser un ticket separado, con respuesta de deprecación previa; no forma parte del
cutover inicial.
