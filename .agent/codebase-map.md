# Codebase Map

A quick orientation guide to the SongShare Effect project structure.

## 🎯 Quick Start Entry Points

### Frontend Entry

- **Main entry**: [`react/src/main.tsx`](/.agent/file:/home/bkinsey/bkinsey808/songshare-effect/react/src/main.tsx) - React app initialization
- **Root component**: [`react/src/App.tsx`](/.agent/file:/home/bkinsey/bkinsey808/songshare-effect/react/src/App.tsx) - Routing and app structure
- **Navigation**: [`react/src/Navigation.tsx`](/.agent/file:/home/bkinsey/bkinsey808/songshare-effect/react/src/Navigation.tsx) - Main navigation component

### API Entry

- **Server**: [`api/src/server.ts`](/.agent/file:/home/bkinsey/bkinsey808/songshare-effect/api/src/server.ts) - Hono API server with all routes
- **Environment**: [`api/src/env.ts`](/.agent/file:/home/bkinsey/bkinsey808/songshare-effect/api/src/env.ts) - Environment variable types
- **Errors**: [`api/src/errors.ts`](/.agent/file:/home/bkinsey/bkinsey808/songshare-effect/api/src/errors.ts) - Effect-TS error definitions

### Shared Code

- **Generated types**: [`shared/src/generated/`](/.agent/file:/home/bkinsey/bkinsey808/songshare-effect/shared/src/generated) - Supabase-generated schemas
- **Paths**: [`shared/src/paths.ts`](/.agent/file:/home/bkinsey/bkinsey808/songshare-effect/shared/src/paths.ts) - Route path constants
- **Constants**: [`shared/src/constants/`](/.agent/file:/home/bkinsey/bkinsey808/songshare-effect/shared/src/constants)

## 📁 Directory Structure

### `/react/src/` - Frontend React Application

```
react/src/
├── App.tsx                    # Main app with routing
├── Navigation.tsx             # Navigation bar
├── main.tsx                   # App entry point
├── index.css                  # Global styles
├── pages/                     # Page components (20 pages)
├── auth/                      # Authentication components (8 files)
├── song/                      # Song-related components (41 files)
├── song-library/              # Song library features (7 files)
├── form/                      # Form components (10 files)
├── design-system/             # Design system components (6 files)
├── popover/                   # Popover components (7 files)
├── language/                  # Language selection (6 files)
├── i18n/                      # Internationalization (4 files)
├── hooks/                     # Custom React hooks (3 files)
├── providers/                 # React context providers (4 files)
├── zustand/                   # Zustand state management (2 files)
├── utils/                     # Frontend utilities (7 files)
├── supabase/                  # Supabase client setup (2 files)
└── demo/                      # Demo components (7 files)
```

### `/api/src/` - Hono API Server

```
api/src/
├── server.ts                  # Main server with route definitions
├── env.ts                     # Environment variable type definitions
├── errors.ts                  # Effect-TS error types
├── logger.ts                  # Logging utilities
├── account/                   # Account management (register, delete)
├── song/                      # Song endpoints
├── oauth/                     # OAuth authentication (12 files)
├── oauth-callback-factory/    # OAuth callback handling
├── cookie/                    # Cookie management (6 files)
├── cors/                      # CORS handling (5 files)
├── csrf/                      # CSRF protection (2 files)
├── http/                      # HTTP utilities (2 files)
├── hono/                      # Hono-specific utilities
├── provider/                  # OAuth provider configs (4 files)
├── register/                  # Registration logic (3 files)
├── supabase/                  # Supabase integration (6 files)
├── user/                      # User management (4 files)
└── user-session/              # User session handling (4 files)
```

### `/shared/src/` - Shared Code (Frontend + API)

```
shared/src/
├── generated/                 # Auto-generated from Supabase (3 files)
│   ├── schema.sql            # Database schema export
│   ├── database.types.ts     # TypeScript types from Supabase
│   └── supabaseSchema.ts     # Effect schemas
├── paths.ts                   # Route path constants
├── cookies.ts                 # Cookie name constants
├── providers.ts               # OAuth provider definitions
├── queryParams.ts             # Query parameter constants
├── sessionStorageKeys.ts      # Session storage keys
├── signinTokens.ts            # Sign-in token utilities
├── userSessionData.ts         # User session data types
├── constants/                 # Shared constants
├── demo/                      # Demo data/types
├── env/                       # Environment utilities
├── language/                  # Language/i18n types (4 files)
├── oauth/                     # OAuth types (2 files)
├── register/                  # Registration types
├── types/                     # General shared types
├── utils/                     # Shared utilities (9 files)
└── validation/                # Validation schemas (6 files)
```

### `/scripts/` - Build & Utility Scripts

```
scripts/
├── build/                                    # Build-time scripts (33 files)
│   ├── generate-effect-schemas/             # Supabase schema generator
│   └── prepare-functions/                   # Cloudflare Functions bundler
├── migrate/                                  # Database migration scripts (5 files)
├── dev/                                      # Development utilities
├── playwright/playwright-start-dev.bun.ts    # E2E test dev server orchestration (Bun TypeScript)
├── playwright-run-and-test.bun.ts           # Run dev + E2E tests
├── purge-cache.sh                           # Cloudflare cache purging
└── run-migrations.sh                        # Database migration runner
```

### `/docs/` - Documentation

```
docs/
├── auth/                                 # Authentication docs
├── client/                               # Frontend docs
├── devops/                               # Deployment and operations docs
│   ├── deploy.md                         # Deployment instructions
│   ├── github-actions-workflows.md       # CI/CD workflows
│   ├── cache-management.md               # Cache strategy
│   ├── branch-protection.md              # Branch protection guidance
│   └── r2-bucket-setup.md                # Cloudflare R2 setup
├── server/                               # API and backend docs
├── testing/                              # Testing docs
└── commit-message-instructions.md        # Commit conventions
```

### `/.agent/` - AI Assistant Configuration

```
.agent/
├── rules.md                   # Coding guidelines for AI assistants
└── workflows/                 # Common workflow instructions
    ├── run-dev-servers.md    # Start development servers
    ├── lint-and-format.md    # Linting and formatting
    ├── commit-code.md        # Commit using conventions
    ├── deploy.md             # Deployment workflow
    ├── database-migrations.md # Database migration workflow
    └── run-tests.md          # Testing workflow
```

## 🔍 Finding Things

### To Find...

- **A React component**: Check `react/src/pages/` for pages, or feature-specific directories like `react/src/song/`, `react/src/auth/`
- **An API endpoint**: Look in `api/src/server.ts` for route definitions, implementation in feature directories
- **Shared types**: `shared/src/types/` or `shared/src/generated/database.types.ts`
- **Database schema**: `shared/src/generated/schema.sql` (auto-generated, don't edit)
- **Environment variables**: `.env` (root), `api/src/env.ts` (type definitions)
- **Styles**: Tailwind CSS in components, global styles in `react/src/index.css`
- **Tests**:
  - Unit tests (`.test.ts`): Colocated with source files
  - E2E tests (`.spec.ts`): In `e2e/` directory
- **Build configuration**: `vite.config.ts`, `tsconfig.*.json`, `api/wrangler.toml`

## 🏗️ Common Patterns

### Adding a New Feature

1. **API Endpoint**:
   - Add route in `api/src/server.ts`
   - Create feature directory in `api/src/[feature]/`
   - Use Effect-TS for error handling
   - Add types to `shared/src/` if needed

2. **React Component**:
   - Create in appropriate directory (`pages/`, `song/`, etc.)
   - Follow React Compiler guidelines (no manual memoization)
   - Use TypeScript with strict typing
   - Import directly (no barrel files)
   - Colocate unit tests (`*.test.tsx`)

3. **Database Changes**:
   - Create migration in `supabase/migrations/`
   - Run migration with `npm run supabase:migrate`
   - Regenerate schemas: `npm run supabase:generate`

### Import Patterns

```typescript
// ✅ Correct - Direct imports with path aliases
import { apiMePath } from "@/shared/paths";
import { LoginPage } from "@/react/pages/LoginPage";
import { songSave } from "@/api/song/songSave";

// ❌ Wrong - Barrel files
import { LoginPage } from "@/react/pages";
```

### Path Aliases (defined in `tsconfig.base.json`)

- `@/shared/*` → `./shared/src/*`
- `@/react/*` → `./react/src/*`
- `@/api/*` → `./api/src/*`

## 🚀 Development Workflow

### Start Development

```bash
npm run dev         # Starts both frontend (5173) and API (8787)
```

### Code Quality

```bash
npm run lint        # Run oxlint
npm run format      # Run oxfmt
npm run test:unit   # Run Vitest tests
```

### Database

```bash
npm run supabase:migrate     # Run migrations
npm run supabase:generate    # Generate Effect schemas from DB
```

### Deploy

```bash
npm run deploy:pages   # Deploy frontend to Cloudflare Pages
npm run deploy:api     # Deploy API to Cloudflare Workers
```

See [workflows](/.agent/file:/home/bkinsey/bkinsey808/songshare-effect/.agent/workflows) for detailed workflow instructions.

## 🔑 Key Technologies

- **Frontend**: React 19, Vite, React Router v7, Zustand, Tailwind CSS
- **API**: Hono, Effect-TS, Cloudflare Workers
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT with dual-token system (visitor + user)
- **Testing**: Vitest (unit), Playwright (E2E)
- **Tooling**: TypeScript, oxlint, oxfmt, Bun (scripts)
- **Deployment**: Cloudflare Pages + Workers

## 📚 Key Documentation

- [`.agent/rules.md`](/.agent/file:/home/bkinsey/bkinsey808/songshare-effect/.agent/rules.md) - **START HERE** - Coding guidelines
- [`README.md`](/.agent/file:/home/bkinsey/bkinsey808/songshare-effect/README.md) - Project overview and setup
- [`docs/auth/authentication-system.md`](/.agent/file:/home/bkinsey/bkinsey808/songshare-effect/docs/auth/authentication-system.md) - Auth architecture
- [`CONTRIBUTING.md`](/.agent/file:/home/bkinsey/bkinsey808/songshare-effect/CONTRIBUTING.md) - Contribution guidelines

## 💡 Tips for AI Assistants

1. **Always check** `.agent/rules.md` for coding preferences
2. **No barrel files** - import directly from source files
3. **React Compiler is enabled** - don't add `useCallback`, `useMemo`, or `memo`
4. **Effect-TS for API** - use structured error handling
5. **Unit tests** use `.test.ts`, **E2E tests** use `.spec.ts`
6. **Path aliases** are configured - use `@/shared/`, `@/react/`, `@/api/`
7. **Only humans run git** - don't run git commands that modify the repo
8. **Use workflows** - Check `.agent/workflows/` for common tasks
