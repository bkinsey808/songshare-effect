# Shared Code Structure

This document explains the shared code organization between the React frontend and Hono API server.

## Directory Structure

```
shared/
├── types/
│   ├── index.ts          # Re-exports all types
│   ├── song.ts           # Song-related interfaces
│   ├── user.ts           # User-related interfaces
│   └── api.ts            # API response types
├── utils/
│   ├── index.ts          # Re-exports all utilities
│   ├── constants.ts      # Configuration constants
│   ├── helpers.ts        # Utility functions
│   └── validation.ts     # Data validation functions
└── index.ts              # Main entry point
```

## Usage Examples

### In the API (Hono Server)

```typescript
import {
  type Song,
  type ApiResponse,
  HTTP_STATUS,
  validateSongData,
  generateId
} from "../../shared/index.js";

// Use shared types for consistent API responses
const response: ApiResponse<Song> = {
  success: true,
  data: newSong,
  message: "Song created successfully",
};

// Use validation functions
if (!validateSongData(body)) {
  return c.json({ success: false, error: "Invalid data" }, HTTP_STATUS.BAD_REQUEST);
}
```

### In the React App

```typescript
import {
  type Song,
  type ApiResponse,
  API_CONFIG,
  formatDuration
} from "../../shared/index.js";

// Use shared types for state management
const [songs, setSongs] = useState<Song[]>([]);

// Use shared utilities
<p>Duration: {formatDuration(song.duration)}</p>

// Use shared configuration
fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SONGS}`)
```

## Benefits

1. **Type Safety**: Consistent interfaces between frontend and backend
2. **Code Reuse**: Validation logic, utilities, and constants shared
3. **Maintainability**: Single source of truth for data structures
4. **Development Speed**: Auto-completion and type checking across projects

## TypeScript Configuration

The `shared/` directory is included in both TypeScript configurations:

- **Frontend** (`tsconfig.app.json`): `"include": ["react/src", "shared"]`
- **API** (`api/tsconfig.json`): `"include": ["src/**/*", "../shared/**/*"]`

## What to Put in Shared

### ✅ Should be shared:

- TypeScript interfaces and types
- API request/response schemas
- Validation functions (pure functions)
- Constants and configuration
- Utility functions that work in both environments
- Error codes and status constants

### ❌ Should NOT be shared:

- React components
- Hono middleware
- Environment-specific code
- Database models (if using ORM)
- Framework-specific utilities

## File Extensions

Use `.ts` for the source files and import with `.js` extensions to ensure compatibility with both environments:

```typescript
import { type Song } from "./types/song.js";
```
