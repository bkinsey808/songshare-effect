---
name: deployment-strategies
description: Deployment workflows for Cloudflare Pages/Workers, environment configuration, cache management, GitHub Actions CI/CD, and production monitoring. Use when deploying code, configuring environments, setting up CI/CD pipelines, or troubleshooting deployment issues.
license: MIT
compatibility: Cloudflare Pages, Cloudflare Workers, GitHub Actions, Node.js 20+
metadata:
  author: bkinsey808
  version: "1.0"
---

# Deployment Strategies Skill

## What This Skill Does

Covers end-to-end deployment workflows for SongShare Effect:

- **Multi-environment deployment** - Development, staging, and production environments
- **Environment configuration** - Secrets, API keys, and per-environment settings
- **Cache management** - Cache invalidation, HTTP headers, CDN strategies
- **CI/CD automation** - GitHub Actions workflows for testing and deployment
- **Git workflows** - Branch protection rules and release procedures
- **Rollback strategies** - Quick recovery from failed deployments
- **Monitoring** - Health checks and post-deployment verification

## When to Use

- Deploying API server to Cloudflare Workers
- Deploying frontend to Cloudflare Pages
- Configuring environment variables for staging or production
- Setting up or troubleshooting CI/CD pipelines
- Troubleshooting cache-related issues (users seeing old versions)
- Implementing rollback procedures
- Adding new secrets or credentials
- Monitoring deployment health

## Key Concepts

### Environment Hierarchy

```
Development (Local)
  ↓
Staging (GitHub Actions)
  ↓
Production (GitHub Actions)
```

Each environment has:

- **API URL** - Different for dev/staging/prod
- **Secrets** - Database credentials, API keys
- **Cache policy** - How aggressively content is cached
- **Monitoring** - Health checks and error tracking

### Deployment Pipeline

```
1. Developer pushes to feature branch
  ↓
2. GitHub Actions: Lint + Test
  ↓
3. Pull request review
  ↓
4. Merge to main
  ↓
5. GitHub Actions: Deploy to production
  ↓
6. Health checks verify deployment
```

## Deployment Workflow

### Local Development

```bash
# Start development servers
npm run dev:all

# Frontend: http://localhost:5173
# API: http://localhost:8787
```

### Deploy Best Practices

Before deploying to production, follow these practices to ensure reliability:

#### 1. **Run Pre-Deploy Checks Locally**

Always validate the build before deploying:

```bash
# Check code quality
npm run lint

# Verify types are correct
npx tsc -b .

# Run unit tests
npm run test:unit

# Then deploy
npm run deploy
```

**Why:** Catching errors locally prevents production outages. Type errors and lint issues can cause runtime failures.

#### 2. **Use Full Deploy for Cache Invalidation**

```bash
# Automatically purges cache after deploy
npm run deploy:full

# Equivalent to:
npm run deploy && npm run cache:purge
```

**When to use:** Always use this when:

- Updating core UI components
- Changing API behavior
- Fixing critical bugs
- Making any user-facing changes

**Why:** Ensures users immediately see new code instead of cached versions. Without this, users may see old versions for 5-10 minutes.

#### 3. **Verify Deployment Success**

After deploying, verify the deployment worked:

```bash
# Check API is running
curl https://effect.bardoshare.com/api/health

# Check frontend loads (in browser)
# https://effect.bardoshare.com

# Verify in DevTools Network tab:
# - index.html loads successfully
# - Assets load from /assets/*
# - No 5xx errors in console
```

#### 4. **Monitor Post-Deploy for Errors**

```bash
# Watch API logs for errors
wrangler tail --env production

# Check for:
# - Startup errors
# - Database connection issues
# - Environment variable problems
```

#### 5. **Never Deploy Broken Tests**

```bash
# ❌ BAD - Skipping tests before deploy
npm run deploy

# ✅ GOOD - Verify all tests pass
npm run test:unit && npm run lint && npm run deploy
```

#### Future Improvements

Consider automating these checks in your deploy script:

```json
"deploy": "npm run lint && npm run test:unit && npm run deploy:pages && npm run deploy:api",
"deploy:full": "npm run deploy && npm run cache:purge"
```

This ensures tests and lint always run before pushing to production, preventing bad deployments at the source.

### Staging Deployment

Triggered automatically when PR is merged to `staging` branch:

```bash
# Manual staging deployment
npm run deploy:staging
```

**Staging environment:**

- Uses staging database
- Slower cache (TTL: 5 minutes)
- Error emails sent to developers
- No real user traffic

### Production Deployment

Triggered automatically when PR is merged to `main` branch:

```bash
# Manual production deployment (rarely needed)
npm run deploy:production
```

**Production environment:**

- Uses production database
- Aggressive caching (TTL: 1 year for assets)
- Errors tracked in monitoring system
- Real user traffic

## Environment Configuration

### Frontend Environment Variables

Set in `.env` (development) or Cloudflare Pages environment (staging/prod):

```env
# API endpoint
VITE_API_URL=http://localhost:8787        # Development
VITE_API_URL=https://staging-api.app.com  # Staging
VITE_API_URL=https://api.app.com          # Production

# Supabase
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Analytics
VITE_ANALYTICS_KEY=key-if-needed
```

### API Environment Variables

Set in `wrangler.toml` (development) or Cloudflare Worker secrets (staging/prod):

```toml
[env.production]
routes = [
  { pattern = "api.app.com/*", zone_name = "app.com" }
]

[env.production.vars]
ENVIRONMENT = "production"
SUPABASE_URL = "https://project.supabase.co"
```

**To set secrets on Cloudflare:**

```bash
# Development (local .env.production)
echo "SUPABASE_SERVICE_KEY=..." > api/.env.production

# Production (Cloudflare secrets)
wrangler secret put SUPABASE_SERVICE_KEY --env production
```

### Secrets Management

**Never commit secrets to git:**

```bash
# ❌ BAD
git add api/.env  # Contains actual secrets!

# ✅ GOOD
echo "api/.env" >> .gitignore
wrangler secret put KEY_NAME --env production
```

**Where secrets live:**

- **Development**: `.env` files (local only, not committed)
- **Staging**: Cloudflare Worker environment variables
- **Production**: Cloudflare Worker secrets
- **Sensitive data**: Use Cloudflare Vault for passwords/API keys

## Cache Management

### Why Cache Matters

Cache invalidation is **the hardest problem in computer science**. After deployment:

- Users may see old code for 5-10 minutes
- Hard refresh (Ctrl+F5) should always show new version
- Some assets cache indefinitely

### Cache Strategy

**Frontend (React app):**

```
# HTML - Short cache (5 minutes)
/*.html
  Cache-Control: public, max-age=300, must-revalidate

# JS/CSS/Images - Long cache (1 year)
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

**Why this works:**

- HTML always checks Cloudflare (users see new app shell)
- Vite generates unique filenames: `app.abc123.js`
- Old JS files never load (browser doesn't have them)

### Cache Invalidation

When users report seeing old version:

```bash
# Option 1: Automatic purge on deploy
npm run deploy:full

# Option 2: Manual purge
npm run cache:purge

# Option 3: Cloudflare dashboard
# Go to Caching > Purge Cache > Purge Everything
```

## GitHub Actions CI/CD

### Automated Workflows

The project includes three GitHub Actions workflows:

**1. PR Checks** - Runs on every PR:

- Lint (oxlint)
- Type check (TypeScript)
- Unit tests (Vitest)
- E2E tests (Playwright - staging only)

**2. Deploy to Staging** - Runs when PR merged to `staging`:

- Build frontend
- Build API
- Deploy to Cloudflare (staging)
- Run smoke tests
- Notify Slack on failure

**3. Deploy to Production** - Runs when PR merged to `main`:

- Run full test suite
- Build frontend
- Build API
- Deploy to Cloudflare (production)
- Purge cache
- Run health checks
- Notify team

### Viewing Workflow Status

1. Go to repository → **Actions** tab
2. Click workflow name to see details
3. Click job name to see logs
4. Check "Annotations" for errors

### Common Workflow Failures

**Lint failed:**

```bash
npm run lint:fix
git add .
git commit -m "fix: lint issues"
```

**Tests failed:**

```bash
npm run test:unit -- --reporter=verbose
npm run test:e2e:dev  # Run interactive E2E
```

**Deploy failed (check logs):**

- `wrangler.toml` syntax error
- Missing secrets
- Build step timed out

## Rollback Procedures

### If Deployment Fails in Staging

```bash
# Revert the last merge
git revert main

# Push to main (GitHub Actions will deploy previous version)
git push origin main
```

### If Deployment Fails in Production

**Option 1: Fast revert (immediate)**

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# GitHub Actions auto-deploys reverted code
# Wait ~2 minutes for deployment
```

**Option 2: Manual rollback (if Git revert is slow)**

```bash
# Deploy previous version directly
git checkout main~1

npm run build:all
npm run deploy:production

# Then reset main back to HEAD
git checkout main
```

**Option 3: Cloudflare Workers rollback**

```bash
# If API deployed but frontend is fine
wrangler rollback --env production
```

### Verifying Rollback

```bash
# Check deployment status
npm run health:check

# Monitor logs
wrangler tail --env production

# Check app works
# Open https://app.com in browser
# Check Network tab for 200 responses
```

## Monitoring & Health Checks

### Health Check Endpoint

```bash
# Verify API is running and healthy
curl https://api.app.com/health

# Expected response:
# {
#   "status": "ok",
#   "environment": "production",
#   "timestamp": "2024-01-15T12:00:00Z"
# }
```

### Automated Health Checks

GitHub Actions runs health checks after each deployment:

```bash
# Manual health check
npm run health:check

# Checks:
# 1. API /health endpoint
# 2. Frontend loads without errors
# 3. Database connectivity
# 4. Realtime subscriptions work
```

### Monitoring Deployment Health

**CloudFlare Analytics:**

- Go to Analytics → Traffic
- Check for 5xx errors spike
- Monitor response time

**Error Tracking:**

- Sentry or similar for runtime errors
- GitHub Deployments API for status

## Troubleshooting

### Users See Old Version After Deploy

**Diagnosis:**

1. Hard refresh (Ctrl+Shift+R): Does it show new version?
2. Incognito window: Does it show new version?
3. Check deployed commit: `git log --oneline -5`

**Solution:**

```bash
# 1. Verify correct version deployed
npm run status:deployment

# 2. Purge cache
npm run cache:purge

# 3. Wait 5 minutes and check again
# If still broken, manually verify in Cloudflare dashboard
```

### Deployment Hangs/Times Out

**Check logs:**

```bash
wrangler tail --env production
```

**Common causes:**

- Build step taking >10 minutes
- Network timeout
- Secrets not available

**Solution:**

```bash
# 1. Run build locally
npm run build:all

# 2. If it hangs, check Node version
node --version  # Should be 20+

# 3. Clear cache and rebuild
npm run clean
npm run build:all
```

### Environment Variables Not Working

```bash
# Check what's deployed
wrangler secret list --env production

# Verify in running worker
wrangler tail --env production
# Look for ENVIRONMENT=... in logs

# If missing, set it
wrangler secret put KEY_NAME --env production
# Paste value and press Enter
# Then deploy again
```

## Deep Reference

For detailed technical reference on Cloudflare deployment APIs, GitHub Actions secrets, cache policies, rollback strategies, and environment-specific configurations, see [the reference guide](references/REFERENCE.md).

## Validation Commands

```bash
# Verify deployment readiness
npm run build:all
npm run lint
npm run test:unit

# Check current deployment status
npm run status:deployment

# Run health checks
npm run health:check

# Manual cache purge (if needed)
npm run cache:purge
```

## References

- Reference guide: [references/REFERENCE.md](references/REFERENCE.md) - Detailed deployment patterns
- Deployment guide: [docs/DEPLOY.md](../../../docs/DEPLOY.md)
- Cache management: [docs/cache-management.md](../../../docs/cache-management.md)
- GitHub Actions: [docs/github-actions-workflows.md](../../../docs/github-actions-workflows.md)
- Cloudflare Pages docs: https://developers.cloudflare.com/pages/
- Cloudflare Workers docs: https://developers.cloudflare.com/workers/
