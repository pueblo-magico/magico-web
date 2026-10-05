# Cloudflare Pages previews for pull requests

The `Cloudflare Pages PR Preview` workflow tests and builds every pull request.
For branches in this repository it applies pending migrations to the isolated
preview D1 database and then deploys the generated `dist` folder to the existing
`pueblo-magico-web` Cloudflare Pages project.

Each pull request gets a stable Cloudflare branch named `pr-<number>`. After a
successful deployment, the workflow creates or updates one pull-request comment
containing the preview URL. Cloudflare also creates an immutable URL for each
individual deployment.

All pull-request deployments share the non-production database configured in
`wrangler.toml`:

- Name: `magico-ensueno-db-preview`
- ID: `d893fa4d-96d8-49f2-a9f5-d9feb55ab0d3`

The production binding remains `magico-ensueno-db`. Cloudflare selects the
`env.preview` binding for Pages preview deployments, so preview traffic never
uses the production reservations database.

## Automatic schema deployment

Versioned SQL files in `migrations/` are the source of truth for database
schema changes. Before deploying a trusted in-repository pull request, the
workflow runs:

`wrangler d1 migrations apply DB --remote --env preview`

Wrangler records applied migrations in D1, so subsequent deployments apply
only pending files. Do not create preview tables manually.

## One-time activation

1. In Cloudflare, open **My Profile > API Tokens > Create Token > Custom token**.
2. Give the token the **Account > Cloudflare Pages > Edit** and
   **Account > D1 > Edit** permissions, and scope it to the account containing
   the `pueblo-magico-web` Pages project and preview D1 database.
3. Copy the account ID from the Cloudflare dashboard.
4. In GitHub, open **Settings > Secrets and variables > Actions** for this
   repository and create these repository secrets:
   - `CLOUDFLARE_API_TOKEN`: the token from step 2.
   - `CLOUDFLARE_ACCOUNT_ID`: the account ID from step 3.
5. In **Settings > Actions > General**, keep GitHub Actions enabled. If the
   organization restricts the automatic `GITHUB_TOKEN`, allow workflows to
   create deployments and write pull-request comments. The workflow declares
   only `contents: read`, `deployments: write`, and `pull-requests: write`.
6. Re-run the `Cloudflare Pages PR Preview` workflow for the open pull request,
   or push a new commit to it.

The stable URL for pull request 7 will normally be:

`https://pr-7.pueblo-magico-web.pages.dev`

Use the URL posted by the workflow as the authoritative value, because
Cloudflare may normalize a branch alias.

## Security behavior

Pull requests from forks run the build but skip deployment. This prevents
untrusted fork code from receiving the Cloudflare credentials. A maintainer can
create an in-repository branch for a trusted external change when a preview is
required.

The preview D1 database is shared by all pull requests. Manual test data should
therefore use an identifiable prefix such as `QA-PR-<number>` and must never
contain real guest or payment data. Overlapping, cancelled, and failed-payment
scenarios are safe here because the production database has a separate binding.
