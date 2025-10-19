## Deploying the SongShare Effect app to mysongshare.com

This document outlines the step-by-step actions required to deploy the frontend (React Vite / Cloudflare Pages) and API (Hono on Cloudflare Workers) from this repository to the custom domain `mysongshare.com`.

Assumptions
- You have admin access to the Cloudflare account that manages `mysongshare.com`.
- The repo already contains a Cloudflare Pages-compatible frontend (Vite) and a Hono-based Worker in `api/` with `wrangler.toml` configuration.
- Supabase (or other backend services) credentials are available and stored securely.
- You are comfortable running shell commands locally and using Cloudflare dashboard or `wrangler` CLI.

High-level plan
1. Inventory and prep (this repo)
2. DNS and Cloudflare domain setup
3. Configure and deploy Cloudflare Pages (frontend)
4. Configure and deploy Cloudflare Worker (API) with route /api/*
5. Set secrets/environment variables
6. Test (staging -> production)
7. Monitor and document rollback

1) Inventory and repo checks
- Verify `package.json` scripts for build and preview. Typical scripts in this repo:
  - `npm run build` (frontend)
  - `npm run dev` (frontend dev server at :5173)
  - `npm run dev:api` / `wrangler dev` for Worker API
- Confirm `api/wrangler.toml` exists and contains an account id, zone id (optional), name, and route configuration (we'll add/update route `mysongshare.com/api/*`). There's also `wrangler.toml.example` for reference.
- Confirm any static assets or redirects that need to be set (Cloudflare Pages `_headers`/`_redirects` or Vite `public/`).

Files of interest in this repo
- `api/wrangler.toml` and `api/src/index.ts` - worker code
- `react/` - frontend source (build output goes to `dist/` or `build/` depending on Vite config)
- `package.json`, `vite.config.ts` - build tooling
- `docs/` - docs to update after deploy

2) DNS & Cloudflare setup
- Add a CNAME record for `effect` to the Cloudflare Pages domain, or if you're using Cloudflare-managed domain:
  - In Cloudflare dashboard, go to Pages -> your Pages project -> Custom domains -> Add `mysongshare.com`.
  - Verify domain ownership using the provided TXT or CNAME verification.
- If you're not using Pages and choose to serve frontend via Workers (not recommended for static site), create DNS A or CNAME to the Worker route. The recommended approach is Pages + Worker for API routes.

3) Configure Cloudflare Pages (frontend)
- In Pages project settings, set the production branch (likely `main`) and build command (e.g., `npm run build`) and output directory (Vite default: `dist`).
- Add the custom domain `mysongshare.com` to Pages.
- Configure automatic builds from GitHub if desired.

4) Configure Cloudflare Worker (API)
- In `api/wrangler.toml` ensure the worker name, account_id, and the compatibility flags are correctly set. Example snippet:

  name = "songshare-effect-api"
  main = "./src/index.ts"
  account_id = "<CLOUDFLARE_ACCOUNT_ID>"
  type = "webpack" # or 'javascript' depending on build

- Add a route in `wrangler.toml` or in Cloudflare Dashboard:
  - route = "mysongshare.com/api/*"

- If using Cloudflare Pages Functions for server-side endpoints, ensure those are configured. In this repo the API lives in `api/` and should be published with `wrangler publish`.

5) Environment variables and secrets
- Identify required env vars (from `api/src/env.ts`, `shared/` or `docs/SUPABASE_CLIENT_SETUP.md`):
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (if the API needs it; prefer worker-only secrets)
  - JWT_SECRET or any signing keys used by the authentication system
- Set secrets in Cloudflare:
  - For Pages (frontend): use Pages UI -> Settings -> Environment variables & secrets. Add variables used by client (only public-safe values).
  - For Workers: use `wrangler secret put <NAME>` or Workers dashboard -> Add secret. Keep private keys/service keys only in Worker secrets.

6) CORS, cookies, and domain-specific settings
- The app uses cookies for session/auth. Ensure cookie domain is set to `mysongshare.com` and `SameSite` attributes are compatible with your flows (likely `Lax` or `None` with Secure).
- If frontend and API live on the same domain, CORS is simplified, but you must ensure the API routes are under `/api/*` on the same domain.

7) Local build & test
- Build frontend locally:

  npm install
  npm run build

- Serve the build locally for a smoke test (e.g., serve the `dist/` dir). Vite's preview command:

  npm run preview

- Run Worker locally for API testing:

  cd api
  wrangler dev

- Test flows using a local hosts file trick if you need the same domain: add `127.0.0.1 mysongshare.com` to `/etc/hosts` for local testing (only if safe and you understand implications).

8) Deploy flow (staging then prod)
- Option A: Deploy directly to production domain
  1. Add the custom domain to Pages and verify.
  2. Publish Worker with `wrangler publish` and set route to `mysongshare.com/api/*` in `wrangler.toml` or dashboard.

- Option B (recommended): Deploy to staging subdomain first
  1. Create `staging.mysongshare.com` via Pages + Worker route.
  2. Deploy and run smoke tests.
  3. Promote to production (map `mysongshare.com`).

9) Smoke tests and verification
- Perform these quick checks:
  - Visit https://mysongshare.com and confirm TLS certificate is valid.
  - Hit https://mysongshare.com/api/health (or equivalent endpoint) to confirm Worker responds.
  - Run login flows, and ensure cookies are set for `mysongshare.com`.
  - Test file uploads, streaming or auth-dependent flows.

10) Monitoring & logging
- Enable Cloudflare Logs for Workers (Logpush or dashboard) and Pages analytics.
- Add Sentry/bug reporting if available for client and server errors.

11) Rollback plan
- Cloudflare Pages keeps previous builds—use Pages UI to rollback to a previous deployment if needed.
- For Workers, re-publish a previous working revision or use a pinned tag in `wrangler publish`.
- If a secret needs rotation, update the secret and re-deploy the affected component.

12) CI/CD and automation (optional)
- Add GitHub Actions to automatically build and deploy Pages on merge to `main` and to run `wrangler publish` for the API. Use `cloudflare/wrangler-action` and `cloudflare/pages-deploy-action` or call `wrangler` directly.

Helpful commands summary
- Build frontend:

  npm ci
  npm run build

- Preview built frontend locally:

  npm run preview

- Run Worker locally:

  cd api
  npm ci
  wrangler dev

- Publish Worker:

  cd api
  wrangler publish --env production

- Set a Worker secret:

  cd api
  wrangler secret put SUPABASE_SERVICE_ROLE_KEY

Notes & gotchas
- Cookie domains: for same-domain cookies ensure path and domain match; for cross-subdomain flows consider `SameSite=None; Secure`.
- If you change the Pages output directory, update the Pages build settings accordingly.
- If you experience 403/401 from Supabase, verify the key used (anon vs service role) and RLS policies.

Post-deploy tasks
- Add the production domain to any internal docs (`README.md`, `docs/`) and update `docs/AUTHENTICATION_SYSTEM.md` if domain-specific settings were added.
- Schedule a post-release review for monitoring and any fixes.

Contact & support
- For Cloudflare account or DNS issues, contact the domain owner or Cloudflare support.

Completion checklist
- [ ] Domain added and verified in Cloudflare Pages
- [ ] DNS CNAME/A configured and propagated
- [ ] Frontend deployed to Pages and serving at mysongshare.com
- [ ] Worker published and routes configured for /api/*
- [ ] All required secrets set in Pages & Workers
- [ ] Smoke tests passed
- [ ] Monitoring configured

If you want, I can next:
- Inspect `api/wrangler.toml` and `package.json` to produce exact commands and recommended `wrangler.toml` content for this repo.
- Draft GitHub Actions workflows for automatic deploys to Pages and Workers.

-- end
