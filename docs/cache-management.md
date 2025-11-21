````markdown
# Cache Management Strategy

## Overview

This document explains the caching behavior you might experience with the SongShare Effect application and how to manage it effectively.

## Why Cache Invalidation is Important

When you deploy changes to a Cloudflare Pages application, several layers of caching can cause users to see old versions:

1. **Cloudflare Edge Cache** - Global CDN caching
2. **Browser Cache** - Local browser storage
3. **Service Worker Cache** - PWA-style caching (if implemented)

## What's Normal vs. What's Not

### ✅ **Normal Behavior**

- Needing to refresh to see changes immediately after deployment
- Some users seeing old version for up to 5 minutes after deployment
- Static assets (images, fonts) taking longer to update

### ❌ **Problematic Behavior**

- Changes not appearing after 10+ minutes
- Hard refresh (Ctrl+F5) not showing new version
- Different users seeing different versions for hours

## Our Cache Management Solutions

### 1. Automatic Asset Versioning

```typescript
// vite.config.ts - Content-based hashing
build: {
  rollupOptions: {
    output: {
      entryFileNames: "assets/[name].[hash].js",
      chunkFileNames: "assets/[name].[hash].js",
      assetFileNames: "assets/[name].[hash].[ext]",
    },
  },
}
```

### 2. HTTP Cache Headers

```
# _headers file
/*.html
  Cache-Control: public, max-age=300, must-revalidate

/assets/*.js
  Cache-Control: public, max-age=31536000, immutable
```

### 3. Client-Side Version Checking

```typescript
// Automatically checks for updates every 5 minutes
import { initCacheManagement } from "@/react/utils/cacheManagement";
```

### 4. Manual Cache Purging

```bash
# Purge Cloudflare cache manually
npm run cache:purge

# Deploy with automatic cache purge
npm run deploy:full
```

## Recommended Deployment Workflow

### Option 1: Manual Cache Control

```bash
# Standard deployment
npm run deploy

# If users report old version, purge cache
npm run cache:purge
```

### Option 2: Automatic Cache Purging

```bash
# Deploy with automatic cache purge
npm run deploy:full
```

## Setting Up Cache Purging

1. **Get Cloudflare API Token**
   - Go to https://dash.cloudflare.com/profile/api-tokens
   - Create token with "Zone.Zone Settings:Read, Zone.Cache Purge:Edit" permissions

2. **Get Zone ID**
   - Go to your domain dashboard in Cloudflare
   - Copy Zone ID from the sidebar

3. **Add to Environment**

```bash
# Add to your .env file
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ZONE_ID=your_zone_id
```

## Troubleshooting Cache Issues

### For Developers

```bash
# Clear all caches and rebuild
npm run build:all
npm run deploy:full

# Check cache headers
curl -I https://effect.bardoshare.com/

# Force cache purge
npm run cache:purge
```

### For Users

1. **Hard Refresh**: `Ctrl+F5` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Clear Browser Cache**: Browser settings → Clear browsing data
3. **Incognito/Private Mode**: Test if changes appear in private browsing

## Monitoring Cache Performance

### Key Metrics to Watch

- **Time to update**: How long before changes are visible
- **Cache hit ratio**: Efficiency of caching
- **User complaints**: Reports of seeing old versions

### Tools for Monitoring

- Cloudflare Analytics dashboard
- Browser DevTools Network tab
- Web Vitals metrics

## Best Practices

### Development

- Test deployments in incognito mode
- Use version numbers in manifest.json for tracking
- Monitor cache headers in DevTools

### Production

- Deploy during low-traffic hours when possible
- Purge cache for critical updates
- Communicate major updates to users

### User Education

- Inform users about hard refresh for immediate updates
- Consider showing update notifications in the app
- Provide clear instructions for cache clearing

## Future Improvements

Consider implementing:

- **Service Worker**: For more granular cache control
- **Update Notifications**: Alert users when new version is available
- **Progressive Enhancement**: Graceful degradation for cache failures
- **A/B Testing**: Gradual rollout of new versions

```markdown

```
````
