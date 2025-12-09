# SongShare Effect — Architecture Recommendations

This document collects prioritized, actionable architectural recommendations for the SongShare Effect project. It is the companion to the project's README and docs and assumes the existing architecture described in the repo:
- Frontend: React + Vite + React Compiler (react/)
- API: Hono + Effect‑TS server (api/) for Cloudflare Workers/Pages
- Shared: `shared/` for types and generated schemas
- Data: Supabase (Postgres with RLS) and Cloudflare R2 for file storage

The aim is to make the project production-ready, secure, observable, maintainable, and easy for contributors to reason about and extend.

---

## Quick summary (1-line)
Prioritize API contract tests + discovery, authentication lifecycle hardening, observability and metrics, RLS validation & migration hygiene, and upload/CND caching patterns.

---

## Table of contents
1. Goals & assumptions
2. High-level findings
3. Top recommendations (prioritized)
4. Quick wins (days)
5. Medium-term improvements (weeks)
6. Long-term/strategic work (months)
7. Suggested CI checks and tests
8. PR/acceptance checklist (for architecture changes)
9. Implementation examples & starter snippets

---

## 1. Goals & assumptions
- Keep strong type-safety across client/server using `shared/` generated schemas.
- Preserve the dual-token model for visitor + user auth while making it secure in production.
- Ensure RLS policies never accidentally leak private data due to interface drift.
- Ensure media uploads and streaming are robust, low-cost, and performant.

---

## 2. High-level findings
- The repo’s foundation, docs, and test strategy are solid. The split between `react/`, `api/`, and `shared/` is clean and maintainable.
- Authentication model (visitor token + user token) is thoughtful and matches RLS policies, but token lifecycle and refresh/rotation aren't hardened in the repo docs enough for production.
- Observability, metrics, and error-tracing are not yet fully specified; Workers/Edge runtimes require special attention here.
- RLS and migration hygiene are crucial — missing checks could allow regressions that leak private data.
- Upload/caching patterns (R2 + Cloudflare) are in plan but need a concrete presigned upload, caching headers, and streaming strategies.

---

## 3. Top recommendations (prioritized)
Below are recommended priorities, the risk they mitigate, impact, and concrete next steps.

### 1 — Add API contracts and automated contract checks (High)
- Risk mitigated: client ↔ server drift that leads to subtle runtime bugs, broken clients, or malformed requests.
- Impact: High — prevents regressions and makes integration safer.
- Next steps:
  - Generate an API contract (OpenAPI or JSON Schema) from the server's Effect schemas or handlers.
  - Add a CI job that validates client code uses the contract (generate client types or fail the build if contract drift exists).
  - Optionally auto-generate endpoint docs for README (e.g., `/docs/api.html`).

### 2 — Harden auth token lifecycle: refresh, rotation, and revocation (High)
- Risk mitigated: long-lived visitor or user tokens, session inconsistency, inability to revoke compromised tokens.
- Impact: High (security + UX).
- Next steps:
  - Add refresh token mechanism that supports server-side revocation.
  - Ensure visitor tokens are short-lived and rotated periodically, or use a signed ephemeral token pattern for visitor mode.
  - Add tests exercising token expiry, refresh, and revoked token access.

### 3 — Observability & structured telemetry (High)
- Risk mitigated: inability to diagnose production issues in Workers; low visibility on error rates and request latency.
- Impact: High — essential for production operations.
- Next steps:
  - Add a structured logger utility used across `api/` (JSON logs with trace / request id).
  - Hook into Sentry (or another provider with worker integration), send contextual metadata (user_id, request_id, env).
  - Add a `/health` and `/metrics` endpoint (or export metrics to Cloudflare analytics/Loki/Prometheus if available).

### 4 — Add strict RLS validation & migration hygiene (Medium → High)
- Risk mitigated: regressions in RLS policies leading to data exposure.
- Impact: High for data safety.
- Next steps:
  - Make migrations the source of truth and include them in CI checks.
  - Add unit/integration tests that use test DB infra for RLS behaviors: ensure visitor-only tables vs private tables behave as expected.
  - Add a small test harness that emulates tokens with both user and visitor claims to validate RLS policies.

### 5 — Upload & CDN strategy for R2 (Medium)
- Risk mitigated: poor performance, high costs, and insecure upload flows.
- Impact: High for UX and costs.
- Next steps:
  - Implement presigned or signed upload URLs for direct client uploads to R2.
  - Enforce uploader metadata and boundaries (max file size, mime types, content-scanning or virus checks if required).
  - Set cache-control and CDN TTL headers for public assets.

### 6 — CI, testing, and flakiness mitigation (Medium)
- Risk mitigated: flaky E2E tests hide regressions, poor coverage for critical features.
- Impact: Medium to High.
- Next steps:
  - Add contract tests and type-check enforcement between `shared/`, `api/`, and `react/`.
  - Add a CI smoke test (Playwright) for the core auth flow, token switching, and reading public/private tables.
  - Add a flaky test report stage and retry policy with health checks for CI stability.

### 7 — Secrets & environment hygiene (Medium)
- Risk mitigated: accidental secret leaking and inconsistent env configs between local/CI/prod.
- Impact: High security-wise.
- Next steps:
  - Use Cloudflare secrets and Vault-style secret management for production (document how to store visitor credentials and service keys).
  - Add local `.env.example` and secure CI variable checks that fail the build if required envs are missing.

---

## 4. Quick wins (days)
- Add `docs/architecture-recommendations.md` (this doc) and an architecture diagram image (if possible).
- Add a `/health` endpoint to `api/` (simple pass/fail + dependency check) and add it to the `api/src/server.ts` health route.
- Add a CI job that runs `tsc` across mono-repo scopes and verifies `shared/` types are consumed by `api/` and `react/` (simple script). Example: `node -e 'require("../shared")'` or compile checks.
- Add an E2E smoke test to CI verifying: visitor mode, sign-in, token-switching, reading public vs private resources.
- Add a rule to pre-commit or CI to check for secrets in commits (simple scan / `git-secrets` / npm audit for packages).

---

## 5. Medium-term improvements (weeks)
- Add refresh tokens, token revocation endpoints, and tests; update `react/` client flow to handle refresh + fallback to visitor tokens.
- Add structured logging + Sentry + metrics collection for `api/` using a worker-friendly SDK.
- Implement presigned uploads for R2 and CDN caching headers for public assets; add a small end-to-end test for uploads.
- Expand migration tests and add RLS constraint tests for private tables; run them in CI using a disposable test DB or test Supabase instance.

---

## 6. Long-term / Strategic (months)
- Multi-region/edge strategies for low-latency streaming if user growth needs it.
- Admin tooling for session management and token revocation.
- Offline-first caching of frequently used public songs, or localized caching layers.
- Role-based access control and audit logging for sensitive operations.

---

## 7. Suggested CI checks & tests (concrete ideas)
- Contract check: generate OpenAPI/JSON schema from `api/` and fail CI if generation differs from committed contract.
- RLS test runner: run small integration tests emulating tokens with different claims to validate RLS restrictions.
- Token lifecycle test: unit and integration tests for refresh/expiry/revoke behaviors.
- Observability smoke: CI integrates a step to exercise error telemetry (dev env only) to ensure Sentry/hook is healthy.
- Dependency scans: `npm audit` or GitHub Dependabot checks in CI + enforce minimum necessary privileges for `SUPABASE_SERVICE_KEY` and other secret keys.

---

## 8. PR/acceptance checklist for architecture changes
- [ ] Update `docs/architecture-recommendations.md` with rationale for the change
- [ ] Add/expand tests (unit + integration) validating functional behavior
- [ ] Add or update CI checks as needed (contract or migration checks)
- [ ] Add / update migration files if DB changes are required
- [ ] Add runbook or short playbook entry for production remediation (where applicable)
- [ ] Update README or top-level docs with changes to the runtime/topology

---

## 9. Implementation examples & starter snippets
Below are short examples that can be used as starting points.

### 9.1 `api` health endpoint example (TypeScript/Hono)
```ts
// api/src/server.ts — add a route like this
app.get('/health', async (c) => {
  // run a couple of lightweight checks: PG connection, R2 ping, optional cache check
  return c.json({ status: 'ok', time: Date.now() });
});
```

### 9.2 Contract generation (high-level)
  `npm run build:api` -> `bun ./scripts/generate-openapi-from-schemas.bun.ts` -> diff generated `shared/src/generated/openapi.json` with committed `shared/src/generated/openapi.json` and fail if there are diffs.
     - `npm run build:api` -> `npm run api:openapi:generate` -> diff generated `shared/src/generated/openapi.json` with committed `shared/src/generated/openapi.json` and fail if there are diffs.

     will run `npx -y tsc -b` and then `npm run api:openapi:generate` and fail the PR if `shared/src/generated/openapi.json` is stale.

### 9.3 Token refresh pattern (starter flow)
- Short lived access token + refresh token.
- Refresh token stored server-side (redis or DB token store) with revocation flag.
- `/auth/refresh` endpoint validates refresh token and issues a new access token.
- Client ensures token refresh runs on 401 responses or proactively when token is nearing expiry.

---

## Closing notes: immediate recommended next steps (for the next 48–72 hours)
1. Add a CI smoke test that exercise key auth flows (visitor token + user token) and verify read vs write on public/private tables.
2. Add a minimal `/health` endpoint to `api/` and wire it to CI (failing on serious dependency errors).
3. Begin a simple contract-generation step in CI: generate API contract from `api/` schemas and fail when the contract differs.

---

If you'd like I can: 
- scaffold the OpenAPI generation flow and add a CI job, or
- implement refresh token + revocation end-to-end (server + client + tests), or
- add observability (Sentry + /metrics) scaffolding to `api/`.

Pick one of the three and I’ll open a PR-style patch plan for it next.
