---
description: Troubleshoot common issues
---

# Troubleshoot Common Issues

Quick reference for diagnosing and fixing common problems.

## Quick Diagnostics

// turbo
Run these commands to check system health:

```bash
# Check if dev servers are running
curl http://localhost:5173
curl http://localhost:8787/health

# Check Node version (should be 20+)
node --version

# Check for port conflicts
lsof -i :5173
lsof -i :8787
```

## Common Issues

### 🚨 Servers Won't Start

**Quick Fix:**
// turbo

```bash
npx kill-port 5173 8787
npm run dev
```

**If that doesn't work:**

```bash
# Full restart
pkill -f "vite|wrangler"
npm run dev
```

### 🔌 Frontend Can't Connect to API

**Checklist:**
// turbo

```bash
# 1. Check API is running
curl http://localhost:8787/health

# 2. Check environment
grep VITE_API_BASE_URL .env

# 3. Restart both servers
npm run dev
```

### 🗄️ Database Connection Issues

**Quick Fix:**
// turbo

```bash
# Test connection
npm run supabase:keep-alive

# Check environment variables
grep PG .env
```

**Still failing?**

1. Check Supabase dashboard - is project paused?
2. Verify IP allowlist in Supabase settings
3. Check credentials in `.env`

### 🛠️ Build Fails

**TypeScript errors:**
// turbo

```bash
# Check for type errors
tsc --noEmit

# Regenerate database types
npm run supabase:generate
```

**Vite build fails:**
// turbo

```bash
# Clear cache and rebuild
rm -rf node_modules/.vite dist
npm run build:client
```

### 🧪 Tests Failing

**Playwright won't start:**
// turbo

```bash
# Ensure browsers are installed
npm run playwright:install

# Check dev servers are running
npm run dev
```

**Vitest errors:**
// turbo

```bash
# Run in watch mode to debug
npx vitest
```

### 🎨 Linting Issues

**Oxlint errors:**
// turbo

```bash
# Auto-fix what's possible
npm run lint:fix

# See which files have issues
npm run lint:list-files
```

**Format issues:**
// turbo

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

### 🔐 Authentication Not Working

**Visitor token fails:**
// turbo

```bash
# Test visitor endpoint
curl http://localhost:8787/api/auth/visitor

# Check visitor credentials in .env
grep SUPABASE_VISITOR .env
```

**OAuth issues:**

1. Check OAuth provider setup in Supabase dashboard
2. Verify redirect URLs
3. Check cookie settings (Secure/SameSite)

### 📦 Dependency Problems

**npm install fails:**
// turbo

```bash
# Nuclear option
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Playwright install fails:**
// turbo

```bash
# Install with system dependencies
npx playwright install --with-deps
```

### 🚀 Deployment Issues

**Pages deploy fails:**
// turbo

```bash
# Build locally first
npm run build:client

# Check functions dist
npm run check:functions-dist-imports
```

**Workers deploy fails:**
// turbo

```bash
# Build API locally
npm run build:api

# Check authentication
cd api && npx wrangler whoami
```

## When All Else Fails

### Nuclear Option 💣

// turbo-all

```bash
# Complete fresh start
rm -rf node_modules package-lock.json dist .cache .wrangler
npm cache clean --force
npm install
npm run dev
```

### Check Logs

```bash
# API logs - check terminal where dev:api is running
# Frontend logs - check browser console (F12)

# Save build logs
npm run build:all 2>&1 | tee build.log
```

### Environment Check

```bash
# Node version
node --version

# npm version
npm --version

# Check .nvmrc
cat .nvmrc

# Use correct Node version
nvm use
```

## Detailed Troubleshooting

For detailed troubleshooting steps, see:

- [Troubleshooting Guide](file:///home/bkinsey/bkinsey808/songshare-effect/.agent/troubleshooting.md)

## Get Help

1. Check [documentation](file:///home/bkinsey/bkinsey808/songshare-effect/docs/)
2. Review [workflows](file:///home/bkinsey/bkinsey808/songshare-effect/.agent/workflows/)
3. Search GitHub issues
4. Check service status pages (Cloudflare, Supabase)
