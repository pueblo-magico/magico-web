# Despliegue productivo de reservas

Producción no se despliega por un push o merge a `main`. El workflow **Deploy
to Cloudflare Pages** sólo se inicia manualmente desde GitHub Actions y el job
usa el environment protegido `production`.

## Configuración única en GitHub

1. Crear o revisar el environment **production** en **Settings > Environments**.
2. Agregar al menos un revisor obligatorio y evitar autoaprobación cuando la
   política de la organización lo permita.
3. Mantener `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` como secretos del
   environment o del repositorio con acceso mínimo a Pages y D1.

El environment es una segunda barrera. El workflow también requiere inicio
manual y un motivo de release visible en la ejecución.

## Procedimiento

1. Confirmar que el commit elegido pasó Preview, pruebas y revisión.
2. Crear el backup y completar el preflight de WRESERV-29.
3. Abrir **Actions > Deploy to Cloudflare Pages > Run workflow**.
4. Elegir la rama o commit aprobado e ingresar el motivo y referencia del
   release.
5. Verificar en el log `Show approved production commit` que el SHA coincide.
6. Aprobar el environment `production` sólo después de esa verificación.
7. Observar migraciones, verificadores D1 y despliegue. No reintentar a ciegas
   si una migración o verificación falla.
8. Ejecutar los smoke tests y la reconciliación definidos en WRESERV-29.

## Pausa y rollback

Antes de aprobar el environment se puede cancelar sin tocar producción. Si el
job falla después de iniciar migraciones, pausar nuevas ejecuciones, conservar
logs y aplicar el runbook de rollback de WRESERV-29. No restaurar ni editar D1
manualmente sin validar primero el alcance y el backup objetivo.
