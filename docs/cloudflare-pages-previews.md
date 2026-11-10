# Cloudflare Pages environments

Pull requests targeting `main` run `.github/workflows/preview.yml` as a
build-only validation. That workflow does not receive Cloudflare credentials,
create a GitHub deployment, or publish a Cloudflare Pages preview.

This keeps unreviewed branch artifacts out of the production Cloudflare
account and the production `pueblo-magico-web` Pages project.

## Stable DEV deployment

Development releases use `.github/workflows/deploy-dev.yml`. The workflow is
manual, references the GitHub `development` environment, and deploys the
selected commit to the `pueblo-magico-web` project in the dedicated DEV
Cloudflare account. The project production branch is `main`, so the stable
origin and registered OIDC callback remain:

`https://dev.pueblo-magico-web.pages.dev`

The `development` GitHub environment must own this secret:

- `CLOUDFLARE_API_TOKEN`: a DEV-account token scoped to Cloudflare Pages Edit.

It must also define these non-secret variables:

- `CLOUDFLARE_ACCOUNT_ID`: the dedicated DEV Cloudflare account ID.
- `MAGICO_WEB_DEV_D1_DATABASE_ID`: the isolated `magico-web-dev` D1 database.

Do not configure the production account credentials in this environment. The
manual production workflow remains isolated in `.github/workflows/deploy.yml`
and retains its explicit `confirm_production` gate.

Immediately before deployment, the DEV workflow rewrites the ephemeral runner's
copy of `wrangler.toml` to use `magico-web-dev`. The committed file continues to
reference the production D1 database for the separately gated production
workflow; DEV never binds to or copies production data.

## Legacy preview cleanup

`.github/workflows/cleanup-preview.yml` remains temporarily enabled on pull
request closure so previews previously created in the production Pages project
can be deleted. It does not create deployments. Remove the cleanup workflow
after all legacy `pr-*` deployments have been removed from production.

## OIDC behavior

Mágico Auth requires an exact callback origin. The stable DEV deployment uses
same-origin `/api/v1/auth/login`; pull-request builds set the public login URL
to the registered stable DEV origin only for build validation. No ephemeral
`pr-*` callback hosts or wildcard callbacks are registered.
