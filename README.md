# SongShare Effect

A modern song sharing platform built with React, Vite, and Hono for Cloudflare deployment.

## Architecture

- **Frontend**: React + TypeScript + Vite (deployed to Cloudflare Pages)
- **Backend**: Hono API server (deployed to Cloudflare Workers)
- **Storage**: Cloudflare R2 for file uploads
- **Package Manager**: pnpm

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm
- Cloudflare account (for deployment)

### Installation

1. Install frontend dependencies:
```bash
pnpm install
```

2. Install API dependencies:
```bash
cd api
pnpm install
```

### Development

1. Start the API server:
```bash
cd api
pnpm dev
# API will be available at http://localhost:8787
```

2. Start the frontend (in a new terminal):
```bash
pnpm dev
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
pnpm deploy
```

### Frontend (Cloudflare Pages)

1. Build the frontend:
```bash
pnpm build
```

2. Deploy to Cloudflare Pages:
   - Connect your Git repository to Cloudflare Pages
   - Set build command: `pnpm build`
   - Set build output directory: `dist`
   - Set environment variables if needed

## Project Structure

```
songshare-effect/
├── api/                    # Hono API server
│   ├── src/
│   │   └── index.ts       # API routes and handlers
│   ├── wrangler.toml      # Cloudflare Workers config
│   ├── package.json
│   └── tsconfig.json
├── src/                   # React frontend
│   ├── App.tsx           # Main app component
│   ├── App.css           # App styles
│   └── main.tsx          # App entry point
├── package.json          # Frontend dependencies
└── vite.config.ts        # Vite configuration
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/songs` - List all songs
- `POST /api/songs` - Create a new song
- `GET /api/songs/:id` - Get song by ID
- `POST /api/upload` - Upload song file

## Features

- ✅ Song listing and display
- ✅ Responsive design
- ✅ TypeScript support
- ✅ ESLint configuration
- 🚧 File upload functionality
- 🚧 Song playback
- 🚧 User authentication
- 🚧 Song metadata editing

## Environment Variables

### API (.env)
```
ENVIRONMENT=development
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:8787
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT
