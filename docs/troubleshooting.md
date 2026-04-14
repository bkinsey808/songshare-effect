# Troubleshooting Guide

Common issues and solutions for the SongShare Effect project.

## Table of Contents

- [Development Server Issues](#development-server-issues)
    - [Port Already in Use](#port-already-in-use)
    - [Frontend Can't Connect to API](#frontend-cant-connect-to-api)
    - [Hot Reload Not Working](#hot-reload-not-working)
- [Database Issues](#database-issues)
    - [Connection Refused / Can't Connect to Supabase](#connection-refused--cant-connect-to-supabase)
    - [Schema Generation Fails](#schema-generation-fails)
    - [Migration Fails](#migration-fails)
- [Build Issues](#build-issues)
    - [TypeScript Errors](#typescript-errors)
    - [Vite Build Fails](#vite-build-fails)
    - [Functions Dist Import Check Fails](#functions-dist-import-check-fails)
- [Testing Issues](#testing-issues)
    - [Playwright Tests Fail to Start](#playwright-tests-fail-to-start)
    - [Vitest Tests Fail](#vitest-tests-fail)
    - [E2E Tests Timeout](#e2e-tests-timeout)
- [Linting/Formatting Issues](#lintingformatting-issues)
    - [Oxlint Errors Won't Auto-Fix](#oxlint-errors-wont-auto-fix)
    - [Formatting Conflicts](#formatting-conflicts)
    - [Pre-commit Hook Fails](#pre-commit-hook-fails)
- [Authentication Issues](#authentication-issues)
    - [Visitor Token Not Working](#visitor-token-not-working)
    - [OAuth Sign-In Fails](#oauth-sign-in-fails)
    - [Session Cookie Not Set](#session-cookie-not-set)
- [Deployment Issues](#deployment-issues)
    - [Cloudflare Pages Deploy Fails](#cloudflare-pages-deploy-fails)
    - [Cloudflare Workers Deploy Fails](#cloudflare-workers-deploy-fails)
    - [Environment Variables Not Working in Production](#environment-variables-not-working-in-production)
- [Dependency Issues](#dependency-issues)
    - [npm install Fails](#npm-install-fails)
    - [Playwright Install Fails](#playwright-install-fails)
- [Environment Setup Issues](#environment-setup-issues)
    - [Missing PostgreSQL Tools](#missing-postgresql-tools)
    - [Wrong Node Version](#wrong-node-version)
- [General Tips](#general-tips)
    - [Check Logs](#check-logs)
    - [Fresh Start](#fresh-start)
    - [Get Help](#get-help)
- [Reporting Issues](#reporting-issues)

---

<a id="development-server-issues"></a>

## 🚨 Development Server Issues

<a id="port-already-in-use"></a>

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5173` or `:::8787`

**Solution**:

```bash
# The dev script automatically kills ports, but if it fails:
npx kill-port 5173 8787
# Then restart:
npm run dev
```

<a id="frontend-cant-connect-to-api"></a>

### Frontend Can't Connect to API

**Problem**: Network errors when calling API from frontend

**Checklist**:

1. ✅ Is the API server running? Check http://localhost:8787/health
2. ✅ Check CORS configuration in `api/src/server.ts`
3. ✅ Verify `VITE_API_BASE_URL` in the active keyring environment (should be `http://localhost:8787` for local API dev)
4. ✅ Check browser console for CORS errors
5. ✅ Ensure both servers are running: `npm run dev`

<a id="hot-reload-not-working"></a>

### Hot Reload Not Working

**Problem**: Changes not reflecting in browser

**Solutions**:

```bash
# Kill all dev processes and restart
pkill -f "vite|wrangler"
npm run dev
```

Check Vite config caching:

```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

---

<a id="database-issues"></a>

## 🗄️ Database Issues

<a id="connection-refused--cant-connect-to-supabase"></a>

### Connection Refused / Can't Connect to Supabase

**Problem**: Database connection errors

**Checklist**:

1. ✅ Check the active keyring environment has correct `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
2. ✅ Verify Supabase project is active (not paused)
3. ✅ Check if IP is allowed in Supabase dashboard
4. ✅ Test connection with: `npm run supabase:keep-alive`

<a id="schema-generation-fails"></a>

### Schema Generation Fails

**Problem**: `npm run supabase:generate` fails

**Common causes**:

```bash
# 1. Missing PostgreSQL client tools
# On macOS:
brew install postgresql

# On Ubuntu/Debian:
sudo apt-get install postgresql-client

# 2. Check schema.sql exists
ls -la shared/src/generated/schema.sql

# 3. Re-export schema first
npm run supabase:export
# Then generate
npm run supabase:generate
```

<a id="migration-fails"></a>

### Migration Fails

**Problem**: Migration script errors

**Solution**:

```bash
# Check which migrations have been applied
# (requires access to Supabase dashboard or direct DB query)

# Run migrations manually
npm run supabase:migrate

# Or run a specific migration
npm run supabase:migrate:single -- path/to/migration.sql
```

---

<a id="build-issues"></a>

## 🛠️ Build Issues

<a id="typescript-errors"></a>

### TypeScript Errors

**Problem**: Type errors during build

**Solutions**:

```bash
# 1. Check all TypeScript configs
tsc -p tsconfig.json --noEmit
tsc -p tsconfig.app.json --noEmit
tsc -p api/tsconfig.json --noEmit

# 2. Clear TypeScript cache
rm -rf node_modules/.cache
npm run build

# 3. Ensure shared types are generated
npm run supabase:generate
```

<a id="vite-build-fails"></a>

### Vite Build Fails

**Problem**: Build errors with Vite

**Solutions**:

```bash
# Clear all caches
rm -rf node_modules/.vite dist
npm run build:client

# Check for circular dependencies
# Review import statements in error logs
```

<a id="functions-dist-import-check-fails"></a>

### Functions Dist Import Check Fails

**Problem**: `npm run check:functions-dist-imports` fails

**Cause**: Cloudflare Pages Functions have restrictions on imports

**Solution**:

```bash
# Review the errors - they'll point to problematic imports
npm run check:functions-dist-imports

# Common issues:
# - Node.js built-ins without 'node:' prefix
# - Imports from outside allowed directories
# - Missing dependencies in functions package.json
```

---

<a id="testing-issues"></a>

## 🧪 Testing Issues

<a id="playwright-tests-fail-to-start"></a>

### Playwright Tests Fail to Start

**Problem**: E2E tests won't run or hang

**Solutions**:

```bash
# 1. Ensure Playwright browsers are installed
npm run playwright:install

# 2. Check dev servers are running
npm run dev
# In another terminal:
npm run test:e2e:dev

# 3. Check ports are available
npx kill-port 5173 8787
```

<a id="vitest-tests-fail"></a>

### Vitest Tests Fail

**Problem**: Unit tests failing

**Solutions**:

```bash
# Run tests in watch mode for debugging
npx vitest

# Run specific test file
npx vitest path/to/test.test.ts

# Check test setup in vitest.config.ts
```

<a id="e2e-tests-timeout"></a>

### E2E Tests Timeout

**Problem**: Playwright tests timeout

**Common causes**:

1. Dev server not fully started - increase `test:e2e:dev` timeout
2. Slow network requests - check API responses
3. UI not rendering - check browser console in headed mode

**Debug**:

```bash
# Run in headed mode to see what's happening
PLAYWRIGHT_BASE_URL=https://127.0.0.1:5173 npx playwright test --headed

# Run with debug
PLAYWRIGHT_BASE_URL=https://127.0.0.1:5173 npx playwright test --debug
```

---

<a id="lintingformatting-issues"></a>

## 🎨 Linting/Formatting Issues

<a id="oxlint-errors-wont-auto-fix"></a>

### Oxlint Errors Won't Auto-Fix

**Problem**: `npm run lint:fix` doesn't fix all issues

**Solution**: Some rules can't auto-fix. Review the output and fix manually:

```bash
# See which files have issues
npm run lint:list-files

# Run lint to see specific errors
npm run lint
```

<a id="formatting-conflicts"></a>

### Formatting Conflicts

**Problem**: oxfmt and editor formatting conflict

**Solution**:

1. Ensure VS Code is using oxfmt (check `.vscode/settings.json`)
2. Disable other formatters (Prettier, etc.) for this workspace
3. Run format manually: `npm run format`

<a id="pre-commit-hook-fails"></a>

### Pre-commit Hook Fails

**Problem**: Husky pre-commit hook blocks commit

**Solution**:

```bash
# See what's failing
git add .
npm run lint
npm run format:check

# Fix issues
npm run lint:fix
npm run format

# If urgent, bypass (NOT recommended):
git commit --no-verify -m "message"
```

---

<a id="authentication-issues"></a>

## 🔐 Authentication Issues

<a id="visitor-token-not-working"></a>

### Visitor Token Not Working

**Problem**: Anonymous access fails

**Checklist**:

1. ✅ Check `SUPABASE_VISITOR_EMAIL` and `SUPABASE_VISITOR_PASSWORD` in the active keyring environment
2. ✅ Verify visitor account exists in Supabase Auth
3. ✅ Check API endpoint: `curl http://localhost:8787/api/auth/visitor`
4. ✅ Review browser console for token errors

<a id="oauth-sign-in-fails"></a>

### OAuth Sign-In Fails

**Problem**: OAuth redirect issues

**Checklist**:

1. ✅ Check OAuth provider credentials in Supabase dashboard
2. ✅ Verify redirect URLs are configured correctly
3. ✅ Check cookie settings (Secure/SameSite) in `api/src/cookie/`
4. ✅ Review CORS settings for OAuth callback

<a id="session-cookie-not-set"></a>

### Session Cookie Not Set

**Problem**: User stays signed out after OAuth

**Common causes**:

1. Cookie domain mismatch - check `buildCookieHeader` in `api/src/cookie/`
2. HTTPS required for Secure cookies - use HTTPS in production
3. SameSite=None requires Secure flag
4. Browser blocking third-party cookies

---

<a id="deployment-issues"></a>

## 🚀 Deployment Issues

<a id="cloudflare-pages-deploy-fails"></a>

### Cloudflare Pages Deploy Fails

**Problem**: `npm run deploy:pages` fails

**Solutions**:

```bash
# 1. Check build succeeds locally
npm run build:client

# 2. Verify functions dist imports
npm run check:functions-dist-imports

# 3. Check Wrangler authentication
cd dist
npx wrangler auth list

# 4. Re-login if needed
npx wrangler login
```

<a id="cloudflare-workers-deploy-fails"></a>

### Cloudflare Workers Deploy Fails

**Problem**: `npm run deploy:api` fails

**Solutions**:

```bash
# 1. Build API locally first
npm run build:api

# 2. Check wrangler.toml configuration
cat api/wrangler.toml

# 3. Verify environment variables are set in Cloudflare dashboard
# (not in wrangler.toml for production secrets)

# 4. Check account/project settings
cd api
npx wrangler whoami
```

<a id="environment-variables-not-working-in-production"></a>

### Environment Variables Not Working in Production

**Problem**: App works locally but not in production

**Solution**:

1. ✅ Check Cloudflare Pages settings - add environment variables
2. ✅ For Workers, add secrets via dashboard or `wrangler secret put`
3. ✅ Verify variable names match (case-sensitive)
4. ✅ Check that `VITE_*` prefix is used for client-side vars

---

<a id="dependency-issues"></a>

## 📦 Dependency Issues

<a id="npm-install-fails"></a>

### npm install Fails

**Problem**: Installation errors

**Solutions**:

```bash
# 1. Clear npm cache
npm cache clean --force

# 2. Delete node_modules and lock file
rm -rf node_modules package-lock.json
npm install

# 3. Check Node version (requires 20+)
node --version

# 4. If using .nvmrc:
nvm use
```

<a id="playwright-install-fails"></a>

### Playwright Install Fails

**Problem**: Playwright browser installation fails

**Solution**:

```bash
# Install manually with system dependencies
npx playwright install --with-deps

# Or install just the browsers
npx playwright install chromium
```

---

<a id="environment-setup-issues"></a>

## 🔧 Environment Setup Issues

<a id="missing-postgresql-tools"></a>

### Missing PostgreSQL Tools

**Problem**: `pg_dump` command not found

**Solution**:

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Download from https://www.postgresql.org/download/windows/
```

<a id="wrong-node-version"></a>

### Wrong Node Version

**Problem**: Compatibility issues with Node.js version

**Solution**:

```bash
# Use nvm to switch to correct version
nvm use
# Or install the version from .nvmrc
nvm install
```

---

<a id="general-tips"></a>

## 💡 General Tips

<a id="check-logs"></a>

### Check Logs

```bash
# API logs (if running)
# Check terminal where `npm run dev:api` is running

# Frontend logs
# Check browser console (F12)

# Build logs
npm run build:all 2>&1 | tee build.log
```

<a id="fresh-start"></a>

### Fresh Start

When all else fails:

```bash
# Nuclear option - fresh start
rm -rf node_modules package-lock.json dist .cache
npm install
npm run dev
```

<a id="get-help"></a>

### Get Help

1. Check [documentation](/docs)
2. Review [`.agent/workflows/`](/.agent/workflows/) for common tasks
3. Search [GitHub issues](https://github.com/bkinsey808/songshare-effect/issues)
4. Check Cloudflare/Supabase status pages

---

<a id="reporting-issues"></a>

## 🐛 Reporting Issues

When reporting an issue, include:

- [ ] Steps to reproduce
- [ ] Error messages (full stack trace)
- [ ] Environment (OS, Node version, browser)
- [ ] What you've already tried
- [ ] Relevant logs

Use the issue template in the repository if available.
