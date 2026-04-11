---
name: cloudflare-cache-cicd
description: Cloudflare CDN cache management and GitHub Actions CI/CD workflows. Use when setting up or debugging CI/CD pipelines, handling cache invalidation, or troubleshooting workflow failures.
---

**Requires:** file-read, terminal (Cloudflare/GitHub CLI). No network access needed.

# Cloudflare Cache & CI/CD Skill

## Use When

Use this skill when:

- Updating cache behavior, deploy workflows, or CI pipeline steps.
- Debugging stale assets, failed GitHub Actions runs, or cache invalidation issues.

Execution workflow:

1. Confirm the intended deploy path (standard deploy vs deploy with cache purge).
2. Validate workflow/config changes in the narrowest scope first.
3. Preserve existing environment/workflow conventions unless there is a clear reason to change them.
4. Report operational validation steps for cache and CI behavior.

Output requirements:

- Summarize workflow/cache files changed and expected operational impact.
- Include exact verification commands/run checks used.

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

- [docs/devops/deploy.md](/docs/devops/deploy.md)
- [docs/devops/cache-management.md](/docs/devops/cache-management.md)
- [docs/devops/github-actions-workflows.md](/docs/devops/github-actions-workflows.md)
- Core deploy workflow: [deployment-strategies skill](/skills/deployment-strategies/SKILL.md)
- Rollback / monitoring: [deployment-operations skill](/skills/deployment-operations/SKILL.md)

## Do Not

- Do not violate repo-wide rules in `docs/ai/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not expand scope beyond the requested task without calling it out.

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If incident response or rollback steps are needed, also load `deployment-operations`.
- If task is release planning/configuration, also load `deployment-strategies`.
