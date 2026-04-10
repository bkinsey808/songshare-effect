# SongShare Effect

A modern song sharing platform built with React, Vite, and Hono for Cloudflare deployment.

[![PR Checks (lint, unit, functions-dist, smoke-e2e)](https://github.com/bkinsey808/songshare-effect/actions/workflows/pr-checks.yml/badge.svg?branch=main)](https://github.com/bkinsey808/songshare-effect/actions/workflows/pr-checks.yml)
[![E2E Tests](https://github.com/bkinsey808/songshare-effect/actions/workflows/e2e.yml/badge.svg?branch=main)](https://github.com/bkinsey808/songshare-effect/actions/workflows/e2e.yml)
[![Coverage (GitHub)](https://github.com/bkinsey808/songshare-effect/actions/workflows/coverage.yml/badge.svg?branch=main)](https://github.com/bkinsey808/songshare-effect/actions/workflows/coverage.yml)

## For AI Agents

- Read `AGENTS.md` for repository workflow and guardrails.
- Treat `.agent/rules.md` as the canonical source of coding standards.
- Review `.github/copilot-instructions.md` for available skills and project orientation.

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
# Frontend will be available at http://localhost:5173
# API will be available at http://localhost:8787
```

#### Or start them individually:

1. Start the API server:

```bash
npm run dev:api
# API will be available at http://localhost:8787
```

2. Start the frontend (in a new terminal):

```bash
npm run dev
# Frontend will be available at http://localhost:5173
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
├── api/                    # Hono API server with Effect-TS
│   ├── src/
│   │   ├── server.ts       # API routes and handlers
│   │   ├── errors.ts      # Effect-TS error definitions
│   │   ├── http/         # HTTP utilities for Effect (handleHttpEndpoint, errorToHttpResponse)
│   │   ├── schemas.ts     # Effect Schema definitions
│   │   └── services.ts    # Service layer with dependency injection
│   ├── wrangler.toml      # Cloudflare Workers config
│   ├── package.json       # API dependencies (Effect, Hono)
│   └── tsconfig.json
├── shared/                 # Shared code between API and frontend
│   ├── types/             # TypeScript interfaces and types
│   ├── utils/             # Utility functions and constants
│   ├── schemas/           # Shared schema definitions
│   ├── generated/         # Generated Supabase types and schemas
│   └── index.ts           # Main exports
├── react/                 # React frontend with React Compiler
│   └── src/               # React source code
│       ├── App.tsx        # Main app component with routing
│       ├── main.tsx       # App entry point
│       ├── components/    # Reusable React components
│       └── pages/         # Page components
├── docs/                  # Project documentation
│   ├── EFFECT_IMPLEMENTATION.md    # Effect-TS implementation guide
│   ├── SHARED_CODE_GUIDE.md       # Shared code documentation
│   └── SUPABASE_EFFECT_SCHEMAS.md # Supabase schema documentation
├── scripts/               # Build and utility scripts
├── supabase/             # Supabase configuration
├── package.json          # Main dependencies and scripts
├── vite.config.ts        # Vite configuration with aliases
└── tailwind.config.js    # Tailwind CSS configuration
```

### Shared Code & Effect-TS Integration

The `shared/` directory contains TypeScript interfaces, utilities, schemas, and generated types that are used by both the frontend and API. This ensures type safety and code consistency across the entire application.

The API is built with **Effect-TS** for functional programming, providing:

- Structured error handling with typed errors
- Schema validation using Effect Schema
- Dependency injection with Effect's Context system
- Composable operations with Effect combinators

See documentation:

- [SHARED_CODE_GUIDE.md](/docs/SHARED_CODE_GUIDE.md) - Shared code structure
- [EFFECT_IMPLEMENTATION.md](/docs/EFFECT_IMPLEMENTATION.md) - Effect-TS implementation details
- [SUPABASE_EFFECT_SCHEMAS.md](/docs/SUPABASE_EFFECT_SCHEMAS.md) - Database schema integration
- [AUTHENTICATION_SYSTEM.md](/docs/AUTHENTICATION_SYSTEM.md) - Complete authentication guide
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

### Root (.env)

```
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_SERVICE_KEY=your-service-key

# Visitor Authentication (for shared anonymous access)
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

### API Environment Variables (via wrangler.toml)

```
ENVIRONMENT=development
```

### Available Scripts

- `npm run dev` - Start frontend development server
- `npm run dev:api` - Start API development server
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
3. If you use an AI coding agent, read `AGENTS.md` and `.agent/rules.md` before making changes.
4. Create a feature branch
5. Make your changes
6. Add tests if applicable
7. Submit a pull request

## License

MIT
