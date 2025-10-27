# Playwright E2E Tests

## 📚 Complete Documentation

For comprehensive information about all E2E testing scripts, when to use them, and how they work, see:

**[📖 E2E Testing Guide](../docs/e2e-testing.md)**

## Quick Start

### Development Testing (Fastest)

```bash
# Quick feedback - auto-starts dev server
pnpm test:e2e:quick

# Comprehensive local testing - auto-starts dev server
pnpm test:e2e:fast
```

### Specialized Testing

```bash
# Test PWA functionality specifically
pnpm test:e2e:pwa

# Test security configuration specifically
pnpm test:e2e:security
```

### Production-like Testing

```bash
# Test built application with SSR
pnpm test:e2e:preview
```

### CI/Standard Testing

```bash
# Full testing with virtual display
pnpm test:e2e
```

## Available Commands

| Command             | Speed | Auto-Start | Use Case             |
| ------------------- | ----- | ---------- | -------------------- |
| `test:e2e:quick`    | ~5s   | ✅ Dev     | Development feedback |
| `test:e2e:fast`     | ~8s   | ✅ Dev     | Local comprehensive  |
| `test:e2e`          | ~10s  | ✅ Dev     | CI/Standard          |
| `test:e2e:pwa`      | ~3s   | ✅ Dev     | PWA testing          |
| `test:e2e:security` | ~3s   | ✅ Dev     | Security testing     |
| `test:e2e:preview`  | ~25s  | ✅ Preview | Production-like      |
| `test:e2e:test`     | ~18s  | ❌ Remote  | Test deployment      |
| `test:e2e:prod`     | ~18s  | ❌ Remote  | Production           |

## Setup Requirements

1. **Playwright is already installed** - dependencies are in `package.json`

2. **Browser installation** (if needed):

   ```bash
   npx playwright install chromium
   ```

3. **Environment variables** (for deployment testing):

   ```bash
   # .env.test
   DOMAIN=your-test-domain.workers.dev

   # .env.production
   DOMAIN=your-production-domain.com
   ```

## Test Files

- **`e2e.spec.ts`** - Core functionality tests (page loads, interactions)
- **`smoketest.spec.ts`** - Basic health checks (quick validation)
- **`pwa.spec.ts`** - Progressive Web App functionality tests
- **`security.spec.ts`** - Security best practices validation
- **`seo.spec.ts`** - Content and SEO validation
- **`cache-invalidation.spec.ts`** - Cache behavior tests (deployed environments only)
- **`accessibility.spec.ts`** - Automated accessibility and a11y best practices (axe, color contrast, keyboard nav)

## Features

✅ **Automatic server startup** - No manual server management needed  
✅ **Smart test skipping** - Tests skip when servers aren't available  
✅ **Environment detection** - Different tests for dev/preview/deployed  
✅ **Optimized performance** - Fast execution with minimal overhead  
✅ **CI/CD ready** - Works in headless environments with xvfb

---

**💡 Pro Tip:** Use `pnpm test:e2e:quick` during development for the fastest feedback loop!
