# SongShare Effect

A modern song sharing platform built with React, Vite, and Hono for Cloudflare deployment.

[![PR Checks (lint, unit, functions-dist, smoke-e2e)](https://github.com/bkinsey808/songshare-effect/actions/workflows/pr-checks.yml/badge.svg?branch=main)](https://github.com/bkinsey808/songshare-effect/actions/workflows/pr-checks.yml)
[![E2E Tests](https://github.com/bkinsey808/songshare-effect/actions/workflows/e2e.yml/badge.svg?branch=main)](https://github.com/bkinsey808/songshare-effect/actions/workflows/e2e.yml)
[![Coverage (GitHub)](https://github.com/bkinsey808/songshare-effect/actions/workflows/coverage.yml/badge.svg?branch=main)](https://github.com/bkinsey808/songshare-effect/actions/workflows/coverage.yml)

## For AI Agents

- Read `AGENTS.md` for repository workflow and guardrails.
- Treat `docs/ai/rules.md` as the canonical source of coding standards.
- Read `docs/ai/ai-system.md` for the shared cross-tool AI-system layout.
- Treat `skills/` and `agents/` as shared, model-agnostic AI assets, while noting that not every tool consumes both layers the same way.
- Treat `.codex/agents/`, `.codex/hooks.json`, and `.codex/config.toml` as Codex-specific wrappers and guardrails, while keeping reusable instructions in `agents/` and `skills/`.
- Treat `.agent/workflows/` as Antigravity-specific workflow playbooks that complement the shared `skills/` layer, not replace it.
- Use `.github/copilot-instructions.md`, `CLAUDE.md`, `GEMINI.md`, and `.cursor/rules/` as thin tool-specific adapters.

## Architecture

- **Frontend**: React + TypeScript + Vite with React Compiler (deployed to Cloudflare Pages)
- **Backend**: Hono API server with Effect-TS (deployed to Cloudflare Workers)
- **Database**: Supabase PostgreSQL
- **Storage**: Cloudflare R2 for file uploads
- **Styling**: Tailwind CSS
- **Package Manager**: npm

## Development Setup

### Prerequisites

- Node.js 20+ (recommended for Vite 5+ and modern tooling)
- npm
- PostgreSQL client tools (`pg_dump` for database schema export)
- Supabase account (for database)
- Cloudflare account (for deployment)

### Installation

1. Install PostgreSQL client tools (required for database schema export):

```bash
# On macOS with Homebrew
brew install postgresql

# On Ubuntu/Debian
sudo apt-get install postgresql-client

# On Windows
# Download and install from https://www.postgresql.org/download/windows/
```

2. Install frontend dependencies:

```bash
npm install
```

3. Install API dependencies:

```bash
cd api
npm install
```

### Development

#### Start both servers at once (recommended):

```bash
npm run dev:all
# Frontend will be available at https://127.0.0.1:5173
# API will be available at http://localhost:8787
```

#### Or start them individually:

1. Start the staging API server:

```bash
npm run dev:api:staging
# API will be available at http://localhost:8787
```

2. Start the staging frontend (in a new terminal):

```bash
npm run dev
# Frontend will be available at https://127.0.0.1:5173
```

## Deployment

### API (Cloudflare Workers)

1. Configure Wrangler:

```bash
cd api
npx wrangler login
```

2. Deploy:

```bash
cd api
npm run deploy
```

### Frontend (Cloudflare Pages)

1. Build the frontend:

```bash
npm run build:client
```

2. Build everything:

```bash
npm run build:all
```

3. Deploy to Cloudflare Pages:
   - Connect your Git repository to Cloudflare Pages
   - Set build command: `npm run build:client`
   - Set build output directory: `dist`
   - Set environment variables if needed

## Project Structure

```
songshare-effect/
├── .agent/                 # Antigravity-specific workflow playbooks and notes
├── .codex/                 # Codex-native config, hooks, and custom-agent wrappers
├── .cursor/                # Cursor-specific adapters and project-rule files
├── .github/                # GitHub-native automation plus Copilot adapter files
├── docs/ai/                # Shared AI rules, codebase map, and AI-system docs
├── agents/                 # Shared custom agent prompts and hook configs
├── api/                    # Hono API server with Effect-TS
│   ├── src/
│   └── src/               # Routes, services, middleware, and server helpers
├── docs/                  # Human-facing project and architecture docs
├── react/                 # React frontend with React Compiler
│   └── src/               # Components, hooks, pages, and client-side state
├── shared/                # Shared code between API and frontend
│   └── src/               # Types, schemas, utilities, and generated SQL/types
├── skills/                # Shared model-agnostic task guidance
├── scripts/               # Build and utility scripts
├── supabase/              # Supabase configuration
├── AGENTS.md              # Shared AI entry point
└── package.json           # Main dependencies and scripts
```

### Shared Code & Effect-TS Integration

The `shared/` directory contains TypeScript interfaces, utilities, schemas, and generated types that are used by both the frontend and API. This ensures type safety and code consistency across the entire application.

The API is built with **Effect-TS** for functional programming, providing:

- Structured error handling with typed errors
- Schema validation using Effect Schema
- Dependency injection with Effect's Context system
- Composable operations with Effect combinators

See documentation:

- [ai-system.md](/docs/ai/ai-system.md) - Shared AI-system layout for Codex, Copilot, Claude, Gemini, and Cursor
- [.agent/README.md](/.agent/README.md) - Antigravity-specific workflow and playbook notes
- [.cursor/README.md](/.cursor/README.md) - Cursor-specific rules, skills wiring, and adapter notes
- [.github/README.md](/.github/README.md) - What in `.github/` is GitHub-native versus adapter-only
- [effect-ts-best-practices.md](/docs/effect-ts-best-practices.md) - Effect-TS implementation details
- [authentication-system.md](/docs/auth/authentication-system.md) - Complete authentication guide
- [api-reference.md](/docs/server/api-reference.md) - Server endpoints and API behavior
- [playwright-best-practices.md](/docs/testing/playwright-best-practices.md) - How Playwright is wired up in this repo
- [github-actions-workflows.md](/docs/devops/github-actions-workflows.md) - CI workflows, Playwright e2e, and debugging with the GitHub Actions extension

## API Endpoints

### Core Endpoints

- `GET /health` - Health check
- `GET /api/songs` - List all songs
- `POST /api/songs` - Create a new song
- `GET /api/songs/:id` - Get song by ID
- `POST /api/upload` - Upload song file

### Authentication Endpoints

- `GET /api/auth/visitor` - Get visitor token for anonymous access
- `POST /api/auth/user` - Authenticate user and get user token

## Features

- ✅ Song listing and display with API integration
- ✅ Effect-TS powered API with structured error handling
- ✅ Schema validation using Effect Schema
- ✅ Supabase database integration with RLS
- ✅ Dual authentication system (visitor + user tokens)
- ✅ JWT-based authentication with automatic token switching
- ✅ Row Level Security (RLS) for data access control
- ✅ React Router v7 with nested routing
- ✅ React Compiler integration for optimized rendering
- ✅ Tailwind CSS for styling
- ✅ Responsive design
- ✅ TypeScript support with strict configuration
- ✅ ESLint + oxfmt configuration
- ✅ Shared type definitions across frontend/backend
- 🚧 File upload functionality to Cloudflare R2
- 🚧 Song playback
- 🚧 Song metadata editing

## Environment Variables

This repo does not use `.env` files for normal development, CI, or deploys.
Secrets live in the OS keyring and are injected into each command at runtime.

- Environment names and required keys live in `config/env-secrets.*.list`
- Worker runtime bindings are documented in `config/worker-vars.list`
- Full setup and flow are documented in [docs/devops/env-vars-and-secrets.md](/docs/devops/env-vars-and-secrets.md)

Example local setup:

```bash
keyring set songshare-staging VITE_SUPABASE_URL
keyring set songshare-staging VITE_SUPABASE_ANON_KEY
keyring set songshare-staging SUPABASE_VISITOR_EMAIL
keyring set songshare-staging SUPABASE_VISITOR_PASSWORD
```

### Available Scripts

- `npm run dev` - Start frontend development server
- `npm run dev:api:staging` - Start the staging API development server
- `npm run dev:api:prod` - Start the production-config API development server locally
- `npm run dev:all` - Start both servers concurrently
- `npm run build:client` - Build frontend for production
- `npm run build:client:staging` - Build frontend for the staging/local E2E environment
- `npm run build:api` - Build API for production
- `npm run build:all` - Build everything
- `npm run test:e2e:dev` - Run local E2E against compiled preview + local API
- `npm run deploy:api` - Deploy API to Cloudflare Workers
- `npm run supabase:generate` - Generate Effect schemas from Supabase

## Contributing

1. Fork the repository
2. Read `CONTRIBUTING.md` for commit message guidelines, pre-commit hooks, and local setup steps (Husky / Commitlint / Commitizen).
3. If you use an AI coding agent, read `AGENTS.md` and `docs/ai/rules.md` before making changes.
4. Create a feature branch
5. Make your changes
6. Add tests if applicable
7. Submit a pull request

## License

MIT
