---
description: Deploy the application to production
---

# Deploy to Production

This workflow deploys both the frontend (Cloudflare Pages) and API (Cloudflare Workers) to production.

## Full Deployment with Cache Purge

1. Run the full deployment command:

```bash
npm run deploy:full
```

This will:

- Build the client
- Prepare functions
- Deploy to Cloudflare Pages
- Build the API
- Deploy to Cloudflare Workers
- Purge the Cloudflare cache

## Individual Deployments

### Deploy Frontend Only

1. Build and deploy the client to Cloudflare Pages:

```bash
npm run deploy:pages
```

### Deploy API Only

1. Build and deploy the API to Cloudflare Workers:

```bash
npm run deploy:api
```

### Deploy Both (without cache purge)

1. Deploy both frontend and API:

```bash
npm run deploy
```

## Manual Cache Purge

If you need to purge the cache separately:

```bash
npm run cache:purge
```
