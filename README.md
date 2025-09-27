# SongShare Effect

A modern song sharing platform built with React, Vite, and Hono for Cloudflare deployment.

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
│   │   ├── index.ts       # API routes and handlers
│   │   ├── errors.ts      # Effect-TS error definitions
│   │   ├── http-utils.ts  # HTTP utilities for Effect
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

- [SHARED_CODE_GUIDE.md](./docs/SHARED_CODE_GUIDE.md) - Shared code structure
- [EFFECT_IMPLEMENTATION.md](./docs/EFFECT_IMPLEMENTATION.md) - Effect-TS implementation details
- [SUPABASE_EFFECT_SCHEMAS.md](./docs/SUPABASE_EFFECT_SCHEMAS.md) - Database schema integration

## API Endpoints

- `GET /health` - Health check
- `GET /api/songs` - List all songs
- `POST /api/songs` - Create a new song
- `GET /api/songs/:id` - Get song by ID
- `POST /api/upload` - Upload song file

## Features

- ✅ Song listing and display with API integration
- ✅ Effect-TS powered API with structured error handling
- ✅ Schema validation using Effect Schema
- ✅ Supabase database integration
- ✅ React Router v7 with nested routing
- ✅ React Compiler integration for optimized rendering
- ✅ Tailwind CSS for styling
- ✅ Responsive design
- ✅ TypeScript support with strict configuration
- ✅ ESLint + Prettier configuration
- ✅ Shared type definitions across frontend/backend
- 🚧 File upload functionality to Cloudflare R2
- 🚧 Song playback
- 🚧 User authentication
- 🚧 Song metadata editing

## Environment Variables

### Root (.env)

```
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_SERVICE_KEY=your-service-key

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
- `npm run build:api` - Build API for production
- `npm run build:all` - Build everything
- `npm run deploy:api` - Deploy API to Cloudflare Workers
- `npm run supabase:generate` - Generate Effect schemas from Supabase

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT
