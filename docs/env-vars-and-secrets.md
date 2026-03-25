# Environment Variables and Secrets

This project uses a **keyring-based secrets management** approach. No secrets are stored in `.env` files or committed to the repository. All sensitive values live in the OS keyring (Windows Credential Manager via `keyring` on WSL) and are injected at runtime.

---

## Architecture Overview

```
OS Keyring (per environment)
  └─ songshare-dev / songshare-staging / songshare-production
        │
        ├─ run-with-env.bun.ts ──► subprocess env  ──► vite build / scripts / playwright
        │
        └─ generate-dev-vars.bun.ts ──► api/.dev.vars ──► wrangler dev (local Worker)
                                                               │
        set-cloudflare-secrets.bun.ts ──────────────────► Cloudflare Secrets (deployed Worker)
```

There are three keyring services — one per deployment environment:

| Service                | Used for                                   |
| ---------------------- | ------------------------------------------ |
| `songshare-dev`        | Local development                          |
| `songshare-staging`    | Staging deploys and E2E against staging DB |
| `songshare-production` | Production deploys and E2E against prod    |

---

## Config Files

### `config/env-secrets.<env>.list`

Lists every var name that `run-with-env.bun.ts` reads from the keyring for that environment. Used for:

- Vite builds (`dev:client`, `build:client`)
- Deployment scripts (`deploy:pages`, `deploy:api`)
- Supabase migrations
- E2E tests

There are three files: `env-secrets.dev.list`, `env-secrets.staging.list`, `env-secrets.production.list`.

### `config/worker-vars.list`

Lists the subset of vars that are pushed to **Cloudflare Workers** as secrets. This is the authoritative list for `wrangler secret put`. Contains only vars the Worker runtime actually reads — no build-time-only VITE\_ vars, no infra-only vars.

---

## How Secrets Flow

### Local Worker dev (`wrangler dev`)

1. Run `npm run generate:dev-vars` — reads all names from `config/worker-vars.list`, looks each up in the `songshare-dev` keyring, writes `api/.dev.vars`.
2. `wrangler dev` automatically reads `api/.dev.vars` and injects those as Worker bindings.
3. `api/.dev.vars` is `.gitignore`d — never committed.

### Vite dev / builds

```bash
# Uses production keyring for Vite env vars:
bun run scripts/env/run-with-env.bun.ts --env production -- vite

# Uses staging keyring:
bun run scripts/env/run-with-env.bun.ts --env staging -- vite --mode staging-local
```

Secrets are injected into the subprocess environment. Vite automatically picks up `VITE_*` vars from the environment and embeds them in the built JS bundle.

### Deployed Worker (Cloudflare)

```bash
# Push all worker-vars.list entries from production keyring to Cloudflare:
bun run scripts/env/set-cloudflare-secrets.bun.ts --env production

# For staging:
bun run scripts/env/set-cloudflare-secrets.bun.ts --env staging
```

### Scripts and E2E tests

```bash
# Run any command with env vars from keyring:
bun run scripts/env/run-with-env.bun.ts --env <dev|staging|production> -- <command>
```

The `--env <name>` shorthand expands to:

- `--service songshare-<name>` (keyring service)
- `--secrets config/env-secrets.<name>.list` (var names to read)

---

## Two Classes of Vars

### 1. Worker runtime vars (`config/worker-vars.list`)

Read by the Cloudflare Worker at request time via `ctx.env.VAR_NAME` or `getEnvString(ctx.env, "VAR_NAME")`. Typed in `api/src/env.ts`. Deployed via `set-cloudflare-secrets.bun.ts`.

### 2. Build-time vars (`VITE_*` in env-secrets lists, not in worker-vars.list)

Injected at Vite build time and embedded in the JS bundle. Accessible in React via `import.meta.env.VITE_*` or the helpers in `react/src/lib/utils/env.ts`:

```ts
getEnvValue("SUPABASE_URL"); // reads VITE_SUPABASE_URL, throws if missing
getEnvValueSafe("STORAGE_BACKEND"); // reads VITE_STORAGE_BACKEND, returns undefined if missing
```

Note: helpers automatically prepend `VITE_` — pass the name _without_ the prefix.

---

## Variable Reference

### Worker Runtime (`api/src/env.ts` / `config/worker-vars.list`)

| Variable                       | Required | Purpose                                                                            |
| ------------------------------ | -------- | ---------------------------------------------------------------------------------- |
| `ENVIRONMENT`                  | ✓        | `"development"` \| `"staging"` \| `"production"`                                   |
| `VITE_SUPABASE_URL`            | ✓        | Supabase project URL (shared name with Vite var)                                   |
| `SUPABASE_SERVICE_KEY`         | ✓        | Supabase service-role key (admin access)                                           |
| `SUPABASE_VISITOR_EMAIL`       | ✓        | Visitor/anonymous account email                                                    |
| `SUPABASE_VISITOR_PASSWORD`    | ✓        | Visitor/anonymous account password                                                 |
| `SUPABASE_JWT_SECRET`          | —        | JWT signing secret (falls back to `STATE_HMAC_SECRET`)                             |
| `STATE_HMAC_SECRET`            | —        | HMAC secret for OAuth state verification                                           |
| `OAUTH_REDIRECT_ORIGIN`        | —        | Origin used in OAuth redirect URIs                                                 |
| `ALLOWED_ORIGINS`              | —        | Comma-separated CORS allowed origins                                               |
| `ALLOWED_REDIRECT_ORIGINS`     | —        | Comma-separated origins allowed for post-auth redirects                            |
| `STORAGE_BACKEND`              | —        | `"supabase"` (default) or `"r2"`                                                   |
| `REGISTER_COOKIE_CLIENT_DEBUG` | —        | Set to `"1"` to output cookie headers to client instead of setting HttpOnly cookie |
| `DEBUG_API_HEADERS`            | —        | Set to `"1"` to log request headers in `/api/me` response                          |
| `GOOGLE_CLIENT_ID`             | —        | Google OAuth client ID                                                             |
| `GOOGLE_CLIENT_SECRET`         | —        | Google OAuth client secret                                                         |
| `MS_CLIENT_ID`                 | —        | Microsoft OAuth client ID                                                          |
| `MS_CLIENT_SECRET`             | —        | Microsoft OAuth client secret                                                      |
| `AMAZON_CLIENT_ID`             | —        | Amazon OAuth client ID                                                             |
| `AMAZON_CLIENT_SECRET`         | —        | Amazon OAuth client secret                                                         |

### Frontend Build-Time (`VITE_*`)

| Variable                     | Purpose                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`          | Supabase project URL                                                                           |
| `VITE_SUPABASE_ANON_KEY`     | Supabase anonymous key (public, safe to embed)                                                 |
| `VITE_API_BASE_URL`          | API base URL                                                                                   |
| `VITE_WEB_BASE_URL`          | Web base URL (used for QR codes)                                                               |
| `VITE_ENVIRONMENT`           | `"staging"` shows a staging badge in the nav; production/dev leave it unset                    |
| `VITE_STORAGE_BACKEND`       | `"r2"` routes image requests through the API; omit or `"supabase"` for direct Supabase storage |
| `VITE_APP_NAME`              | Application name (falls back to i18n translation)                                              |
| `VITE_APP_BRAND`             | Brand identifier                                                                               |
| `VITE_BUILD_NUMBER`          | Build/version number                                                                           |
| `VITE_SUPPORT_EMAIL_ADDRESS` | Support contact email                                                                          |
| `VITE_SEO_APP_TITLE`         | SEO title tag                                                                                  |
| `VITE_SEO_APP_DESCRIPTION`   | SEO meta description                                                                           |
| `VITE_SEO_APP_KEYWORDS`      | SEO meta keywords                                                                              |
| `VITE_CLIENT_DEBUG`          | Set to `"1"` in dev to keep console.debug output (default: suppressed)                         |

### Infrastructure / Scripts Only

| Variable                             | Used by                            | Purpose                                    |
| ------------------------------------ | ---------------------------------- | ------------------------------------------ |
| `CLOUDFLARE_PROJECT`                 | `deploy:pages`                     | Pages project name                         |
| `CLOUDFLARE_STAGING_PROJECT`         | `deploy:pages:staging`             | Staging Pages project name                 |
| `CLOUDFLARE_ZONE_ID`                 | `cache:purge`                      | Cloudflare zone ID for cache purge         |
| `CLOUDFLARE_API_TOKEN`               | `cache:purge`                      | Cloudflare API token                       |
| `DOMAIN`                             | `deploy:api`, `deploy:api:staging` | Domain for Worker routes (`$DOMAIN/api/*`) |
| `SUPABASE_PROJECT_REF`               | migrations, keep-alive             | Supabase project reference                 |
| `SUPABASE_STAGING_PROJECT_REF`       | `supabase:migrate:staging`         | Staging project ref                        |
| `SUPABASE_STAGING_PW`                | `supabase:migrate:staging`         | Staging DB password                        |
| `PGHOST/PORT/USER/DATABASE/PASSWORD` | migrations, `supabase:export`      | Direct Postgres access                     |

### E2E / Testing Only

| Variable                          | Purpose                                   |
| --------------------------------- | ----------------------------------------- |
| `PLAYWRIGHT_BASE_URL`             | Test target URL                           |
| `E2E_TEST_SONG_SLUG`              | Fixture song slug                         |
| `E2E_TEST_PLAYLIST_SLUG`          | Fixture playlist slug                     |
| `E2E_TEST_COMMUNITY_SLUG`         | Fixture community slug                    |
| `E2E_TEST_EVENT_SLUG`             | Fixture event slug                        |
| `E2E_TEST_IMAGE_SLUG`             | Fixture image slug                        |
| `E2E_TEST_USER2_USERNAME`         | Second test user username                 |
| `E2E_GOOGLE_USER2_EMAIL`          | Second test user Google email             |
| `SUPABASE_VISITOR_EMAIL/PASSWORD` | Visitor session credentials (also Worker) |

---

## Adding a New Variable

### New Worker runtime var

1. Add the name to `config/worker-vars.list`
2. Add it to `api/src/env.ts` (`Env` type) — required or optional as appropriate
3. Add it to all three `config/env-secrets.*.list` files
4. Store the value in each keyring: `keyring set songshare-<env> VAR_NAME value`
5. For deployed Workers: `bun run scripts/env/set-cloudflare-secrets.bun.ts --env <env>`
6. Regenerate `.dev.vars`: `npm run generate:dev-vars`

### New Vite build-time var

1. Name it with a `VITE_` prefix
2. Add it to all three `config/env-secrets.*.list` files (NOT to `worker-vars.list`)
3. Store the value in each keyring: `keyring set songshare-<env> VITE_VAR_NAME value`
4. Access in React code via `getEnvValue("VAR_NAME")` or `getEnvValueSafe("VAR_NAME")` (prefix is added automatically)

### New infrastructure-only var (deploy scripts, etc.)

1. Add to the relevant `config/env-secrets.*.list` files only
2. Store in keyring: `keyring set songshare-<env> VAR_NAME value`
3. Access via `$VAR_NAME` in shell scripts (already in subprocess env from `run-with-env.bun.ts`)

---

## Storing Values in the Keyring

```bash
# Store a value (pipe via stdin to avoid shell history exposure):
echo -n "the-value" | keyring set songshare-dev VAR_NAME

# Read a value:
keyring get songshare-dev VAR_NAME

# List all names for a service:
keyring list songshare-dev
```

See [docs/wsl-keyring.md](wsl-keyring.md) for setup instructions on WSL.

---

## Security Notes

- **Secrets never touch disk** during normal workflows — `run-with-env.bun.ts` injects them directly into the subprocess environment.
- **`api/.dev.vars`** is the one exception: it writes Worker secrets to disk for `wrangler dev`. It is `.gitignore`d. Regenerate it with `npm run generate:dev-vars` after any keyring change.
- **`VITE_*` vars are public** — they are embedded in the JS bundle and visible to anyone who downloads the app. Only put public/read-only values there (URLs, public keys, feature flags).
- **Debug flags** (`DEBUG_API_HEADERS`, `REGISTER_COOKIE_CLIENT_DEBUG`) should never be set in production. They are absent from production keyring by default.
- **OAuth secrets** (`GOOGLE_CLIENT_SECRET` etc.) are read dynamically by the Worker via `getEnvString()` and never logged.
