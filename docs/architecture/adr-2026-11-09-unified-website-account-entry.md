# ADR local — Cuenta única visible desde el sitio público

- **Estado:** Aprobado como dirección; implementación DEV parcial.
- **Fecha:** 2026-11-09
- **Repositorio:** magico-web

## Decisión

El sitio público presenta un único ingreso de Pueblo Mágico. `magico-web` usa un cliente OIDC propio y una cookie de sesión propia, cifrada, `HttpOnly`, `Secure`, `SameSite=Lax` y sin atributo `Domain`.

Mágico Auth autentica identidad solamente. Companion, Staff Portal y Reservas conservan clientes, cookies, autorización y sesiones independientes. El sitio no comparte tokens ni cookies y no convierte roles OIDC, dominios de email o variables frontend en permisos de producto.

## Menú de cuenta

- `Mi cuenta` aparece para toda identidad autenticada y abre Companion.
- `Portal del equipo` aparece únicamente después de una decisión afirmativa y vigente del Staff Portal.
- Una decisión denegada omite el acceso interno.
- Una decisión no disponible falla cerrada sin afectar `Mi cuenta`.
- Cambiar de cuenta inicia una autorización nueva con `prompt=select_account` y conserva la sesión actual si el flujo se cancela.
- Cerrar sesión elimina solamente la sesión del sitio; no afirma cerrar sesiones de otros productos.

## Implementación DEV por etapas

1. Cliente web OIDC separado, Authorization Code + PKCE, validación de `state`, `nonce`, issuer, audience y expiración.
2. Sesión web minimizada; ningún token se expone a React ni se guarda en `localStorage` o `sessionStorage`.
3. Menú accesible con estados de carga, ingreso, cuenta autenticada, cambio de cuenta y cierre local.
4. Contrato autenticado de decisión de membresía con Staff Portal. Hasta que exista, el acceso interno queda oculto.

### Origen DEV estable y builds de pull request

Mágico Auth exige callbacks exactos. Por eso no se registra cada host `pr-*` ni
se usan comodines. Los pull requests se validan con un build sin despliegue y
configuran `VITE_WEBSITE_LOGIN_URL` para delegar el ingreso al endpoint del
origen DEV estable:

`https://dev.pueblo-magico-web.pages.dev/api/v1/auth/login`

La autorización y la cookie de sesión permanecen en ese origen estable. Los
despliegues DEV se hacen en el proyecto `pueblo-magico-web` de la cuenta
Cloudflare DEV dedicada. Los builds del origen DEV estable y de producción
omiten la variable y usan `/api/v1/auth/login` en el mismo origen. La variable
es una URL pública; no contiene tokens, secretos ni concede permisos de Staff o
Reservas.

## Fuera de alcance

- SSO por cookies compartidas.
- Migrar o reemplazar el login propio de Reservas.
- Autorizar módulos desde Mágico Auth.
- Logout global coordinado.
- Inferir acceso del equipo por email, configuración del navegador o selección de onboarding.

## Puertas antes de producción

- Verificar un origen DEV HTTPS estable y registrar URLs exactas, sin comodines.
- Completar login, callback inválido, expiración, cambio de cuenta, logout y aislamiento entre productos.
- Implementar y probar la decisión de membresía propiedad del Staff Portal.
- Revisar el ADR transversal correspondiente y actualizar Masterplan/Jira antes de fijar el contrato productivo.
- Crear un cliente productivo distinto solamente después de aprobar la evidencia DEV.
