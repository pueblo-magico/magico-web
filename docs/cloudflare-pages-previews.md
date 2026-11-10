# Cloudflare Pages environments

Pull requests targeting `main` run `.github/workflows/preview.yml` as a
build-only validation. That workflow does not receive Cloudflare credentials,
create a GitHub deployment, or publish a Cloudflare Pages preview.

This prevents ordinary pull requests from creating one Cloudflare branch per
PR. The production account keeps one explicitly promoted DEV branch only.

## Stable DEV deployment

Development releases use `.github/workflows/deploy-dev.yml`. Pushing an
explicitly selected commit to the Git branch `dev` builds it and deploys to the
Cloudflare Pages branch `dev` in the production-account
`pueblo-magico-web` project. The workflow can also be started manually with an
explicit confirmation. The stable origin and registered OIDC callback remain:

`https://dev.pueblo-magico-web.pages.dev`

The workflow uses the existing repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The production workflow remains isolated in `.github/workflows/deploy.yml` and
retains its explicit `confirm_production` gate. The DEV branch currently uses
the Pages preview-environment bindings of the production project; this is a
temporary operating decision and does not re-enable per-PR deployments.

## Legacy preview cleanup

`.github/workflows/cleanup-preview.yml` remains temporarily enabled on pull
request closure so legacy `pr-*` deployments can be deleted. It does not target
the stable `dev` branch and does not create deployments. Remove the cleanup
workflow after all legacy PR aliases have been removed.

## OIDC behavior

Mágico Auth requires an exact callback origin. The stable DEV deployment uses
same-origin `/api/v1/auth/login`; pull-request builds set the public login URL
to the registered stable DEV origin only for build validation. No ephemeral
`pr-*` callback hosts or wildcard callbacks are registered.
