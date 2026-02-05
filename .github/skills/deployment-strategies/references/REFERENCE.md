# Deployment Strategies Reference Guide

## Detailed Implementation Patterns

### Environment-Specific Configuration

#### Development Environment

**Characteristics:**

- Local machine or CI runner
- Fast feedback loop
- Aggressive logging

**Frontend Configuration (.env):**

```javascript
VITE_API_URL=http://localhost:8787
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev-anon-key
VITE_ENVIRONMENT=development
```

**API Configuration (wrangler.toml):**

```toml
[env.development]
vars = { ENVIRONMENT = "development" }

[env.development.d1]
binding = "DB"
database_name = "songshare-dev"
```

**Secrets (.env.development - local only, never committed):**

```bash
SUPABASE_SERVICE_KEY=dev-service-key
SUPABASE_VISITOR_EMAIL=visitor@dev.local
SUPABASE_VISITOR_PASSWORD=dev-password
```

#### Staging Environment

**Characteristics:**

- GitHub Actions deployment
- Test database (separate from production)
- Slower cache (5 minute TTL)
- Optional: Slack notifications on failure

**Frontend Environment (Cloudflare Pages settings):**

```
VITE_API_URL=https://staging-api.songshare.app
VITE_SUPABASE_URL=https://staging.supabase.co
VITE_SUPABASE_ANON_KEY=staging-anon-key
VITE_ENVIRONMENT=staging
```

**API Secrets (Cloudflare Workers):**

```bash
wrangler secret put SUPABASE_SERVICE_KEY --env staging
wrangler secret put SUPABASE_VISITOR_EMAIL --env staging
wrangler secret put SUPABASE_VISITOR_PASSWORD --env staging
```

**Cache Policy (via \_headers file):**

```
/
  Cache-Control: public, max-age=300

/assets/*
  Cache-Control: public, max-age=3600
```

#### Production Environment

**Characteristics:**

- Manual approval before deploy (if desired)
- Production database with backups
- Aggressive caching (1 year for assets)
- Error tracking and monitoring
- CloudFlare DDoS protection

**Frontend Environment (Cloudflare Pages):**

```
VITE_API_URL=https://api.songshare.app
VITE_SUPABASE_URL=https://prod.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key
VITE_ENVIRONMENT=production
```

**API Production Route (wrangler.toml):**

```toml
[env.production]
routes = [
  { pattern = "api.songshare.app/*", zone_name = "songshare.app" }
]

[env.production.vars]
ENVIRONMENT = "production"
CACHE_TTL = "31536000"
```

**Secrets Setup:**

```bash
# Run once to configure
wrangler secret put SUPABASE_SERVICE_KEY --env production
wrangler secret put SUPABASE_VISITOR_EMAIL --env production
wrangler secret put SUPABASE_VISITOR_PASSWORD --env production
wrangler secret put MONITORING_WEBHOOK --env production
```

---

### Cache Management Deep Dive

#### Cache Headers by Asset Type

**HTML (index.html):**

```
Cache-Control: public, max-age=300, must-revalidate
```

- Revalidates every 5 minutes
- Ensures users always check for new app shell
- Allows browsers/CDN to serve if server unreachable

**JavaScript & CSS (built by Vite with content hash):**

```
Cache-Control: public, max-age=31536000, immutable
```

- Cache forever (1 year)
- Only served if filename in HTML matches (verified by hash)
- Safe because Vite generates unique filenames: `app.a1b2c3d4.js`

**Images & Fonts:**

```
Cache-Control: public, max-age=2592000
```

- Cache for 30 days
- Revise if images update

**API Responses (from Worker):**

```
Cache-Control: no-cache, no-store, must-revalidate
```

- Never cache (critical data)
- Forces revalidation on every request

#### Implementing Cache Headers

**Using \_headers file (Cloudflare Pages):**

Create `_headers` in public/:

```
/index.html
  Cache-Control: public, max-age=300, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/api/*
  Cache-Control: no-cache, no-store, must-revalidate
```

Deploy as part of static assets:

```bash
npm run build:client
# _headers copied to dist/
npm run deploy:pages
```

**Using Worker Middleware (for dynamic routes):**

```typescript
// api/src/server.ts
export default {
  fetch: (request, env) => {
    const response = handleRequest(request);

    // Don't cache API responses
    response.headers.set(
      'Cache-Control',
      'no-cache, no-store, must-revalidate'
    );

    return response;
  },
};
```

#### Cache Purge Strategies

**Full Purge (nuclear option):**

```bash
# Purge all Cloudflare cache
npm run cache:purge

# Command:
# npx wrangler publish --env production
# (forces cache invalidation)
```

- Use only if cache is corrupted
- Causes slowness for 5-10 minutes while cache rebuilds

**Targeted Purge (preferred):**

```bash
# Cloudflare API to purge specific URLs
curl -X POST \
  "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://app.com/index.html"]}'
```

- Purges only changed files
- Faster recovery

**Cache Purge on Deploy:**

```bash
# Automatically included in deploy:
npm run deploy:production

# Steps:
# 1. Build frontend
# 2. Build API
# 3. Deploy both
# 4. Purge /index.html (forces check)
# 5. Run health checks
```

#### Debugging Cache Issues

**Check what's cached:**

```bash
# View response headers in browser DevTools
# Network tab → index.html → Response Headers
# Look for: Cache-Control, CF-Cache-Status

# CF-Cache-Status values:
# HIT = served from cache
# MISS = not in cache
# EXPIRED = was cached, now expired
```

**Force fresh copy:**

```bash
# Keyboard shortcut (in browser)
Ctrl+Shift+R  # Hard refresh (clears browser cache)

# Or check in DevTools:
# Network tab → Disable cache (checkbox)
# Reload page
```

**Test cache headers locally:**

```bash
# With local dev server
npm run dev

# Check headers:
curl -I http://localhost:5173/index.html
curl -I http://localhost:5173/assets/app.js

# Look for Cache-Control header in response
```

---

### GitHub Actions Workflow Patterns

#### Branch Protection Rules

GitHub `main` branch configuration:

```
✅ Require pull request reviews before merging
   - Dismiss stale reviews on new push
   - Require review from code owner

✅ Require status checks to pass:
   - Lint
   - Type check
   - Unit tests
   - E2E tests (staging only)

✅ Require branches to be up to date

✅ Require signed commits

✅ Restrict who can push (optional)
```

#### Commit Message Validation

Enforced by `commitlint`:

```bash
# Valid messages (Conventional Commits)
feat(auth): add Google OAuth sign-in
fix(cache): purge old entries on deploy
docs: update deployment guide
test: add tests for cache invalidation

# Invalid messages (will fail pre-commit hook)
Fixed stuff
changed api
update
```

#### Workflow Triggers

**PR Checks** - Runs on every PR:

```yaml
on:
  pull_request:
    types: [opened, synchronize]
```

**Deploy to Staging** - Runs when merged to `staging`:

```yaml
on:
  push:
    branches: [staging]
```

**Deploy to Production** - Runs when merged to `main`:

```yaml
on:
  push:
    branches: [main]
```

#### Common Workflow Steps

```yaml
# Lint step
- name: Lint
  run: npm run lint

# Type check step
- name: Type check
  run: npx tsc -b .

# Build step
- name: Build
  run: npm run build:all
  timeout-minutes: 15

# Test step
- name: Run tests
  run: npm run test:unit

# Deploy step (production only)
- name: Deploy to Cloudflare
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  run: npm run deploy:production
```

---

### Rollback Procedures

#### Quick Git-Based Rollback

**When previous commit should be reverted:**

```bash
# On main branch:
git revert HEAD

# This creates a NEW commit that undoes HEAD
# Then push to trigger auto-deploy
git push origin main

# GitHub Actions sees new commit
# Deploys reverted code
# Takes ~2 minutes
```

**Advantages:**

- Clean git history (revert is a commit, not a loss)
- Automatic GitHub Actions deploy
- Easy to see what was rolled back

**Disadvantages:**

- Slower (~2 minutes for Actions)
- Creates extra commit

#### Immediate Cloudflare Rollback

**For faster recovery (Workers only):**

```bash
# List recent deployments
wrangler deployments list --env production

# Rollback to previous version
wrangler rollback --env production

# Verify it worked
npm run health:check

# Then revert git commit to keep history clean
git revert HEAD
git push origin main
```

**Advantages:**

- Instant (seconds, not minutes)
- No git history pollution until later

**Disadvantages:**

- Doesn't match git state
- Must clean up git afterward

#### Staged Rollback (Testing Before Full Rollback)

```bash
# Deploy old version to staging first
git checkout main~1
npm run deploy:staging

# Test thoroughly
npm run test:e2e:dev

# If successful, rollback main
git checkout main
git revert HEAD
git push origin main
```

---

### Deployment Monitoring

#### Health Check Endpoint

**API health check:**

```bash
curl https://api.app.com/health -v
```

Expected response:

```json
{
  "status": "ok",
  "environment": "production",
  "timestamp": "2024-01-15T12:00:00Z",
  "checks": {
    "database": "ok",
    "supabase": "ok"
  }
}
```

#### Automated Health Checks (Post-Deploy)

GitHub Actions runs after deployment:

```bash
# Waits for deployment to be live
sleep 30

# Checks API health
curl https://api.app.com/health

# Checks frontend loads
curl https://app.com

# Verifies no 500 errors in logs
wrangler tail --env production --status error
```

#### Monitoring Deployment Metrics

**Cloudflare Analytics:**

- Response times
- Error rate (4xx, 5xx)
- Cache hit rate

**Check in Cloudflare dashboard:**

1. Go to Analytics → Traffic
2. Look for spikes in error rate
3. Check response time graph

**Real-time logs:**

```bash
# Tail production logs in real-time
wrangler tail --env production

# Filter for errors
wrangler tail --env production --status error

# Follow specific IP
wrangler tail --env production | grep "client_ip=123.456"
```

#### Error Tracking

**For runtime errors, integrate with:**

- Sentry (recommended)
- LogRocket
- DataDog

**Setup in frontend:**

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.VITE_ENVIRONMENT,
});
```

---

### Manual Deployment (Rare)

**When GitHub Actions isn't sufficient:**

```bash
# 1. Build everything locally
npm run build:all

# 2. Verify builds look correct
ls -la dist/  # frontend
ls -la api/dist/  # api

# 3. Deploy API
cd api
wrangler publish --env production

# 4. Deploy frontend
cd ..
npm run deploy:pages

# 5. Verify health
npm run health:check
```

**Only use if:**

- GitHub Actions is broken
- Emergency rollback needed faster than Actions
- Testing deployment process locally

---

### Secrets Management

#### Adding a New Secret

**Development (local only):**

```bash
# Add to .env.development (never commit!)
echo "MY_SECRET=value" >> .env.development

# Use in code
const secret = process.env.MY_SECRET;
```

**Staging (Cloudflare):**

```bash
wrangler secret put MY_SECRET --env staging
# Paste value and press Enter
```

**Production (Cloudflare):**

```bash
wrangler secret put MY_SECRET --env production
# Paste value and press Enter
```

#### Rotating Secrets

```bash
# View all secrets (names only, not values)
wrangler secret list --env production

# Update a secret
wrangler secret put SECRET_NAME --env production
# Paste new value

# Verify by redeploying
npm run deploy:production
```

#### Secret Security Best Practices

- ❌ Never log secrets
- ❌ Never commit `.env` files
- ✅ Use Cloudflare Vault for sensitive data
- ✅ Rotate regularly (quarterly)
- ✅ Audit who has access
- ✅ Use environment-specific values (never share between environments)

---

### Performance Optimization

#### Build Optimization

```bash
# Check build size
npm run build:all
ls -lh dist/assets/

# If bundle is large:
# 1. Analyze bundle composition
npm run build:analyze

# 2. Identify large dependencies
# 3. Consider code splitting or lazy loading
```

#### Deploy Optimization

```bash
# Reduce deploy time by caching
# (GitHub Actions caches node_modules automatically)

# Local deploy is fast:
npm run deploy:production  # ~10 seconds

# GitHub Actions deploy:
# Install: 1-2 minutes
# Build: 1-3 minutes
# Deploy: 30 seconds
# Health check: 1 minute
# Total: 4-7 minutes
```

#### Runtime Optimization

```bash
# Monitor API response times
wrangler tail --env production

# Look for slow requests
# If > 1s, investigate:
# - Database query optimization
# - Cache strategies
# - Edge location latency
```
