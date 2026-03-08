---
name: deployment-strategies
description: Core Cloudflare Pages/Workers deployment workflow, environment variable configuration, and secrets management. Use when deploying code, configuring environments, or managing secrets.
compatibility: Cloudflare Pages, Cloudflare Workers, Node.js 20+
metadata:
  author: bkinsey808
  version: "1.1"
---

# Deployment Strategies Skill

## Use When

Use this skill when:

- Preparing or executing staging/production deployments.
- Updating environment configuration or secrets management steps.

Execution workflow:

1. Run pre-deploy quality checks before deployment changes.
2. Use the appropriate deploy command for the change type (including cache purge when needed).
3. Keep env/secrets handling aligned with existing Cloudflare workflow conventions.
4. Verify deployment health immediately after rollout.

Output requirements:

- Summarize deploy/config changes and affected environments.
- Include exact deploy and verification commands used.

## What This Skill Does

Core deployment patterns for SongShare Effect:

- **Deploy commands** — `npm run deploy`, `npm run deploy:full` (with cache purge)
- **Environment configuration** — per-environment env vars for frontend and API
- **Secrets management** — Cloudflare Worker secrets via `wrangler secret put`

## Common Scenarios

- Deploying API server to Cloudflare Workers or frontend to Cloudflare Pages
- Configuring environment variables for staging or production
- Adding new secrets or credentials
- Running pre-deploy validation

---

## Deploy Workflow

### Local Development

```bash
npm run dev:all   # Frontend: http://localhost:5173 | API: http://localhost:8787
```

### Pre-Deploy Checklist

Always run before pushing to production:

```bash
npm run lint
npx tsc -b .
npm run test:unit
```

### Deploy Commands

```bash
# Standard deploy
npm run deploy

# Deploy + purge CDN cache (use this for any user-facing change)
npm run deploy:full

# Staging
npm run deploy:staging
```

Use `deploy:full` whenever updating UI components, API behavior, or fixing bugs — ensures users see new code immediately rather than cached versions.

### Verify After Deploy

```bash
# Check API is healthy
curl https://effect.bardoshare.com/api/health

# Tail live logs for errors
wrangler tail --env production
```

---

## Environment Configuration

### Frontend Variables

Set in `.env` (dev) or Cloudflare Pages environment (staging/prod):

```env
VITE_API_URL=http://localhost:8787          # Development
VITE_API_URL=https://staging-api.app.com   # Staging
VITE_API_URL=https://api.app.com           # Production

VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### API Variables

Non-secret config in `wrangler.toml`:

```toml
[env.production.vars]
ENVIRONMENT = "production"
SUPABASE_URL = "https://project.supabase.co"
```

### Secrets Management

**Never commit secrets to git.** Use Cloudflare Worker secrets instead:

```bash
# Set a secret in production
wrangler secret put SUPABASE_SERVICE_KEY --env production
# (paste value, press Enter)

# List current secrets
wrangler secret list --env production
```

Local development secrets go in `.env` files (gitignored).

---

## Sub-Skills

- [Cache management + GitHub Actions CI/CD](../cloudflare-cache-cicd/SKILL.md)
- [Rollback, monitoring, troubleshooting](../deployment-operations/SKILL.md)

## References

- [docs/DEPLOY.md](../../../docs/DEPLOY.md)
- [docs/cache-management.md](../../../docs/cache-management.md)
- [docs/github-actions-workflows.md](../../../docs/github-actions-workflows.md)

## Do Not

- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not expand scope beyond the requested task without calling it out.

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If active production recovery is required, also load `deployment-operations`.
- If CDN cache behavior must change with deploy, also load `cloudflare-cache-cicd`.
