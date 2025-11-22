# SongShare Effect — modern architecture, built for scale and developer happiness

SongShare Effect is an opinionated, full-stack demo showcasing a modern frontend backed by a typed, functional API. It’s designed as a showcase of fast developer experience and production-grade patterns:

- Modern frontend (React 19 + React Compiler + Vite) with strict TypeScript typings
- An Effect-TS + Hono-based API running on Cloudflare Workers
- Single source of truth: shared schemas and generated types from Supabase
- Real-world features: dual auth (visitor + user), Row Level Security (RLS), Playwright end-to-end tests, CI, and Cloudflare Pages/Workers deployment

[![E2E Tests](https://github.com/bkinsey808/songshare-effect/actions/workflows/e2e.yml/badge.svg?branch=main)](https://github.com/bkinsey808/songshare-effect/actions/workflows/e2e.yml) [![Coverage (GitHub)](https://github.com/bkinsey808/songshare-effect/actions/workflows/coverage.yml/badge.svg?branch=main)](https://github.com/bkinsey808/songshare-effect/actions/workflows/coverage.yml)

## Architecture & technical highlights

This project demonstrates a modern, pragmatic stack that focuses on type-safety, composability, and fast iteration:

- Frontend: React 19 + TypeScript + Vite + React Compiler for performance-aware builds and better runtime behavior.
- Backend: Hono + Effect-TS on Cloudflare Workers — functional, composable business logic and a small, fast edge runtime.
- Schema-driven: Shared types and Effect Schema objects get generated from Supabase so the frontend and API remain strongly typed and consistent.
- Database: Supabase-managed PostgreSQL with Row Level Security for policy-driven access controls.
- Testing & CI: Playwright-driven e2e tests, Vitest unit tests, GitHub Actions workflows for CI and coverage reporting.
- Tools & DX: Husky + Commitizen + Commitlint, ESLint+Prettier, Bun helpers for developer scripts, and extensive example scripts for debugging in the repo.

## Development Setup

### Prerequisites

- Node.js 20+ (recommended for Vite 5+ and modern tooling)
- npm
- PostgreSQL client tools (`pg_dump` for database schema export)
- Supabase account (for database)
- Cloudflare account (for deployment)

### Quick developer setup

1. Install PostgreSQL client tools (required for database schema export):

```bash
# On macOS with Homebrew
brew install postgresql

# On Ubuntu/Debian
sudo apt-get install postgresql-client

# On Windows
# Download and install from https://www.postgresql.org/download/windows/
```

2. Install repo dependencies and get started.

```bash
npm install
```

### Development

#### Start in development (both servers)

Run both frontend and API dev servers together (recommended):

```bash
npm run dev
# Frontend: http://localhost:5173
# API:      http://localhost:8787 (wrangler dev)
```

#### Or start them individually:

1. Start the frontend and backend

```bash
npm run dev
# Frontend will be available at http://localhost:5173
```

## Deployment & hosting

This project targets Cloudflare as its production platform:

- The frontend can be built and published to Cloudflare Pages (`npm run deploy:pages`).
- The API is built and deployed to Cloudflare Workers using Wrangler (`npm run deploy:api`).

See `wrangler.toml.example` and the `api/` folder for example configuration that wire environment bindings, Supabase keys, and R2 buckets.

## Project structure (high level)

This repository is organized around a full-stack, type-first app split into clear, focused pieces. Below are the top-level folders and their purpose — we deliberately avoid listing every file so this stays future-proof and easier to skim.

- `react/` — React frontend (React Compiler + Vite). Contains the client app, components, pages, and frontend-specific tooling and tests.
- `api/` — Hono-based API server implemented with Effect-TS and prepared for Cloudflare Workers (wrangler). Contains server code, service layers, and server-side build configuration.
- `shared/` — Shared TypeScript code (generated Supabase types, schemas, types and utilities) used by both client and server to keep contracts exact.
- `supabase/` — Supabase project artifacts and schema-related tooling (migrations, schema generation helpers).
- `functions/` — prepared serverless/edge functions and helpers used by Cloudflare Pages / workers builds.
- `scripts/` — Build, developer tooling, and helper scripts (playwright helpers, schema generation, debug tooling).
- `docs/` — Documentation, design notes, and guides (Effect-TS integration, authentication system, CI workflows, etc.).
- `.github/workflows/` — CI and test workflows (PR checks, E2E, coverage, and related automation).
- `public/`, `vite.config.ts`, `package.json`, `tsconfig.*` — standard frontend tooling and config at the repo root.

For more details about specific subsystems, see the docs in `docs/` or the README files that live next to the related code in `react/`, `api/`, and `supabase/`.

### Shared code & Effect-TS integration

Shared code is central to the developer experience — `shared/` holds the generated Supabase schemas and shared utilities so both client and server share the same types.

The API uses Effect-TS to give you:

- Structured, typed errors and composable, testable effects
- Runtime schema validation (Effect Schema) and central schema generation from Supabase
- Dependency injection via Effect's Context so services are composable and testable
- Clear separation of concerns and safe IO boundaries that work extremely well on a Cloudflare Workers runtime

## API snapshot — what’s here

Core endpoints include health checks, song listing and CRUD routes, and authentication helpers. Highlights:

- Authentication: a dual-token system (visitor + user) with endpoints to create short-lived client tokens for Supabase access.
- Supabase integration: server-side helpers to mint client tokens and a secure user token flow.
- Uploads: designed to leverage Cloudflare R2 (implementation notes in the code indicate R2 support / TODOs where relevant).

See `api/src` and `/docs` for full endpoint descriptions and authentication details.

## Why this project is interesting (TL;DR — the tech that makes it shine)

- Type-first, full-stack dev experience: generated Supabase types + shared code keeps client/server contracts exact.
- Functional backend: Effect-TS gives clean composition, typed errors and a highly-testable service layer.
- Modern frontend stack: React 19 + React Compiler and Vite for fast iteration and optimized builds.
- Edge platform ready: Hono + Wrangler means the API runs at the edge with minimal cold start and great global performance.
- Testing & quality: Playwright for deterministic e2e tests, Vitest for unit tests, and CI workflows keep the quality bar high.

If you’re looking for a modern reference implementation of building with Effect-TS + React under a Cloudflare deployment model — this project is a great starting point.

## Environment variables

### Root (.env) (development examples)

```
# Supabase configuration (do not commit real keys)
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_SERVICE_KEY=your-service-key

# Visitor authentication (dev/shared anonymous user)
SUPABASE_VISITOR_EMAIL=visitor@yourdomain.com
SUPABASE_VISITOR_PASSWORD=your-visitor-password

# Frontend Configuration
API_BASE_URL=http://localhost:8787  # For development

# Database Connection (for schema generation)
PGHOST=your-db-host
PGPORT=6543
PGUSER=your-db-user
PGPASSWORD=your-db-password
PGDATABASE=postgres
```

### API environment configuration

The API uses `wrangler.toml` (see `api/wrangler.toml.example`) for Cloudflare bindings (Supabase keys, R2 buckets and environment settings).

### Useful scripts

Common tasks:

- `npm run dev` — start the frontend and the API (concurrently)
- `npm run build` — build client and api for production
- `npm run deploy` — build + deploy frontend and backend Cloudflare
- `npm run supabase:generate` — generate typed Effect Schema artifacts from Supabase

## Contributing / code quality

1. Fork the repository
2. Read `CONTRIBUTING.md` for commit message guidelines, pre-commit hooks, and local setup steps (Husky / Commitlint / Commitizen).
3. Create a feature branch
4. Make your changes
5. Add tests if applicable
6. Submit a pull request

We follow a strict developer tooling setup — Husky for pre-commit hooks, Commitizen + conventional commits, ESLint + Prettier, plus unit and e2e tests to keep the quality high.

Contributions welcome — fork, read `CONTRIBUTING.md`, and send PRs.
