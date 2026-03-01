---
name: deployment-operations
description: Cloudflare deployment rollback, health monitoring, and production troubleshooting. Use when recovering from a failed deployment, checking deployment health, or diagnosing production issues.
license: MIT
compatibility: Cloudflare Pages, Cloudflare Workers, GitHub Actions
metadata:
  author: bkinsey808
  version: "1.0"
---

# Deployment Operations Skill

## What This Skill Does

- **Rollback** — fast recovery when a deployment breaks production
- **Health checks** — verifying the API and frontend are running correctly
- **Troubleshooting** — diagnosing the most common post-deploy problems

---

## Rollback Procedures

### Rollback via Git Revert (recommended)

```bash
# Revert the last commit and push — GitHub Actions auto-deploys the reversion
git revert HEAD
git push origin main
# Wait ~2 minutes for deployment
```

### Manual Rollback (faster if CI is slow)

```bash
# Build and deploy the previous commit directly
git checkout main~1
npm run build:all
npm run deploy:production

# Reset HEAD back to current state
git checkout main
```

### API-Only Rollback (if only the Worker broke)

```bash
wrangler rollback --env production
```

### Verify Rollback Succeeded

```bash
npm run health:check
curl https://effect.bardoshare.com/api/health
wrangler tail --env production
```

---

## Monitoring & Health Checks

### Health Check Endpoint

```bash
curl https://effect.bardoshare.com/api/health
# Expected: { "status": "ok", "environment": "production", "timestamp": "..." }
```

```bash
npm run health:check   # automated — checks API, frontend, DB, realtime
npm run status:deployment
wrangler tail --env production   # live log stream
```

### Cloudflare Analytics

Go to **Analytics → Traffic** in the Cloudflare dashboard to check for 5xx error spikes or response time regressions after deploy.

---

## Troubleshooting

### Users Still See Old Version After Deploy

```bash
# 1. Try hard refresh in browser (Ctrl+Shift+R) — if that works, it's a cache issue
# 2. Open incognito window — if that works, it's browser cache only

npm run cache:purge         # purge Cloudflare CDN
npm run status:deployment   # confirm correct commit is deployed
```

If still broken after 5 minutes, manually purge in the Cloudflare dashboard: **Caching → Purge Cache → Purge Everything**.

### Deployment Hangs or Times Out

```bash
# Reproduce locally
npm run build:all

# Check Node version (must be 20+)
node --version

# Clear build cache and retry
npm run clean
npm run build:all
```

Then check `wrangler tail --env production` for runtime startup errors.

### Environment Variables Not Working

```bash
# List what's deployed
wrangler secret list --env production

# If missing, set and redeploy
wrangler secret put KEY_NAME --env production
npm run deploy
```

---

## References

- [docs/DEPLOY.md](../../../docs/DEPLOY.md)
- Core deploy workflow: [deployment-strategies skill](../deployment-strategies/SKILL.md)
- Cache + CI/CD: [cloudflare-cache-cicd skill](../cloudflare-cache-cicd/SKILL.md)
