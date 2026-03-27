# Deploying

This project deploys as two Cloudflare components:

- **Frontend** — React/Vite app on Cloudflare Pages
- **API** — Hono Worker on Cloudflare Workers, handling all `/api/*` routes

All secrets are managed via the OS keyring. See [env-vars-and-secrets.md](/docs/env-vars-and-secrets.md) for the full secrets setup.

---

## Quick deploy

```bash
# Most changes — build and deploy both frontend and API:
npm run deploy

# User-facing changes — also purges the CDN cache:
npm run deploy:full
```

Use `deploy:full` when updating UI, changing API behavior, or fixing bugs. Without a cache purge, users may see stale versions for 5–10 minutes.

### Staging

```bash
npm run deploy:staging
```

---

## Pre-deploy checklist

Always validate locally before deploying to production:

```bash
npm run lint
npm run test:unit
npm run build:all
```

---

## Post-deploy verification

```bash
# Check the API is healthy
curl https://<your-domain>/api/health
# Expected: { "status": "ok", ... }

# Watch live Worker logs
wrangler tail --env production
```

In the browser: hard-refresh (`Ctrl+Shift+R`), check DevTools for 5xx errors.

---

## First-time setup

### 1. Secrets

Store all required values in the keyring and push to Cloudflare:

```bash
# Populate keyring for production (see config/env-secrets.production.list for all names):
echo -n "value" | keyring set songshare-production VAR_NAME

# Push Worker secrets to Cloudflare:
bun run scripts/env/set-cloudflare-secrets.bun.ts --env production

# Generate local .dev.vars for wrangler dev:
npm run generate:dev-vars
```

### 2. Cloudflare Pages

- Create a Pages project, set the production branch to `main`
- Add your custom domain under Pages → Custom domains
- Build command: `npm run build:client` · Output directory: `dist`

### 3. Cloudflare Worker

Worker route (`<your-domain>/api/*`) is passed at deploy time via the `$DOMAIN` keyring var — no route is hardcoded in `wrangler.toml`.

```bash
npm run deploy:api
```

### 4. DNS

Point your domain at the Cloudflare Pages project via CNAME or use Cloudflare-managed DNS.

---

## Rollback

- **Frontend:** Cloudflare Pages keeps all previous builds — revert via the Pages dashboard.
- **API:** Redeploy a previous commit, or use the Workers dashboard to roll back to a prior version.
- **Secrets:** Rotate a secret with `echo -n "new-value" | keyring set songshare-production VAR_NAME`, then re-run `set-cloudflare-secrets.bun.ts` and redeploy.

---

## Deployment checklist

- [ ] `npm run lint && npm run test:unit && npm run build:all` passed
- [ ] Secrets pushed: `bun run scripts/env/set-cloudflare-secrets.bun.ts --env production`
- [ ] Frontend deployed to Pages
- [ ] Worker deployed with correct route
- [ ] `/api/health` returns OK
- [ ] Frontend loads and hard-refresh shows new version
- [ ] `wrangler tail` shows no startup errors
