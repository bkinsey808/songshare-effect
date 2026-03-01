---
name: cloudflare-cache-cicd
description: Cloudflare CDN cache management and GitHub Actions CI/CD workflows. Use when setting up or debugging CI/CD pipelines, handling cache invalidation, or troubleshooting workflow failures.
license: MIT
compatibility: Cloudflare Pages, GitHub Actions
metadata:
  author: bkinsey808
  version: "1.0"
---

# Cloudflare Cache & CI/CD Skill

## What This Skill Does

- **Cache management** — `_headers` cache strategy, invalidation commands
- **GitHub Actions workflows** — what each workflow does, how to debug failures

---

## Cache Management

### Cache Strategy

Set in the `_headers` file at project root:

```
# HTML — short cache so users get app shell updates quickly
/*.html
  Cache-Control: public, max-age=300, must-revalidate

# Hashed JS/CSS/images — long cache (immutable because Vite adds content hash)
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

### Cache Invalidation

When users report seeing an old version:

```bash
# Purge automatically via deploy:full
npm run deploy:full

# Manual purge only
npm run cache:purge

# Or: Cloudflare dashboard → Caching → Purge Cache → Purge Everything
```

Always use `npm run deploy:full` (not bare `deploy`) for any user-facing change.

---

## GitHub Actions CI/CD

### Three Workflows

**1. PR Checks** — runs on every PR:
- Lint (oxlint)
- Type check (TypeScript)
- Unit tests (Vitest)
- E2E tests (Playwright — staging only)

**2. Deploy to Staging** — runs when PR merged to `staging`:
- Build frontend + API
- Deploy to Cloudflare (staging)
- Run smoke tests

**3. Deploy to Production** — runs when PR merged to `main`:
- Full test suite
- Build frontend + API
- Deploy to Cloudflare (production)
- Purge CDN cache
- Run health checks

### Viewing Workflow Status

1. Repository → **Actions** tab
2. Click the workflow run → click the job → read logs
3. Check "Annotations" section for error summaries

### Common Workflow Failures

**Lint failed:**
```bash
npm run lint:fix
git add . && git commit -m "fix: lint issues"
```

**Tests failed:**
```bash
npm run test:unit -- --reporter=verbose
npm run test:e2e:dev   # interactive Playwright
```

**Deploy failed:**
- Check `wrangler.toml` for syntax errors
- Verify all required secrets are set (`wrangler secret list --env production`)
- Check if build step timed out (run `npm run build:all` locally to reproduce)

---

## References

- [docs/DEPLOY.md](../../../docs/DEPLOY.md)
- [docs/cache-management.md](../../../docs/cache-management.md)
- [docs/github-actions-workflows.md](../../../docs/github-actions-workflows.md)
- Core deploy workflow: [deployment-strategies skill](../deployment-strategies/SKILL.md)
- Rollback / monitoring: [deployment-operations skill](../deployment-operations/SKILL.md)
