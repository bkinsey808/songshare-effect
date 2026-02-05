# File Organization Reference

Detailed reference for import patterns, naming conventions, project structure, and file organization strategies.

## Import Organization Pattern

Standard organization for all TypeScript/React files:

```typescript
// 1. External packages (npm dependencies)
import React, { useState, useEffect } from "react";
import { Effect, pipe } from "effect";
import { createClient } from "@supabase/supabase-js";
import { clsx } from "clsx";

// 2. Absolute imports (if aliased in tsconfig)
import { Button } from "@shared/components/Button";
import { Song, SongError } from "@shared/types/song";
import { formatDuration } from "@shared/utils/formatDuration";

// 3. Internal relative imports (from same package/feature)
import { SongCard } from "../components/SongCard";
import { useSongLibrary } from "../hooks/useSongLibrary";
import { SONG_BATCH_SIZE } from "./constants";
import type { PageProps } from "./types";

// 4. Style imports (if using CSS files - rare with Tailwind)
import styles from "./Page.module.css";
```

## Naming Conventions

### Component Files (React Components)

**PascalCase** - Each component per file:

```
src/components/
├── SongCard.tsx          # Main export: export function SongCard
├── SongCard.test.tsx     # Colocated test
├── UserMenu.tsx
├── UserMenu.test.tsx
└── PlaybackControls.tsx
```

**Pattern:** Match filename exactly to main export name.

### Utility & Function Files

**camelCase** - Descriptor-based naming:

```
src/utils/
├── formatDate.ts         # export function formatDate(...)
├── formatDate.test.ts
├── parseDuration.ts
├── calculatePlaybackTime.ts
└── validateSongInput.ts
```

**Pattern:** `verb` + `noun` where applicable (`format`, `calculate`, `validate`, `parse`).

### Type & Interface Files

**camelCase.ts** for types, or **types.ts** in feature folders:

```
src/types/
├── song.ts               # export type Song, type SongLibrary, ...
├── api.ts                # export type ApiResponse, type ErrorResponse, ...
└── ui.ts                 # export type ButtonProps, type ModalProps, ...

react/src/auth/
├── auth-types.ts         # export type AuthState, type User, ...
└── auth-slice.ts
```

### Hook Files

**useHookName.ts** - Always start with `use`:

```
src/hooks/
├── useSongLibrary.ts     # export function useSongLibrary() ...
├── useSongLibrary.test.ts
├── usePlaybackState.ts
└── useAuth.ts
```

### Feature/Domain Directories

**kebab-case** - Group related files:

```
src/
├── auth/                 # Authentication feature
│   ├── auth-slice.ts
│   ├── auth-slice.test.ts
│   ├── useAuth.ts
│   ├── useAuth.test.ts
│   └── types.ts
├── song-library/         # Song library feature
│   ├── SongLibrary.tsx
│   ├── SongLibrary.test.tsx
│   ├── useSongLibrary.ts
│   └── constants.ts
└── playback/             # Playback feature
    ├── PlaybackControls.tsx
    └── usePlayback.ts
```

### Documentation Files

**kebab-case** - All documentation:

```
docs/
├── authentication-system.md
├── effect-implementation.md
├── commit-message-instructions.md
├── component-patterns.md
└── file-organization.md
```

### Configuration Files

**Preserve original, use ESM** (not CommonJS):

```
vite.config.ts           # ESM: export default { ... }
tailwind.config.js       # ESM: export default { ... }
tsconfig.json            # JSON (not .js)
commitlint.config.js     # ESM: export default { ... }
```

## Project Structure Example

### Monorepo Layout

```
songshare-effect/
├── api/                          # Hono API server (Effect-TS)
│   ├── src/
│   │   ├── server.ts            # Main server & routes
│   │   ├── errors.ts            # Typed error classes
│   │   ├── schemas.ts           # Effect schemas
│   │   ├── services.ts          # Service layer (DI)
│   │   ├── http-utils.ts        # HTTP utilities
│   │   ├── supabase/            # Supabase integration
│   │   │   ├── getSupabaseClientToken.ts
│   │   │   └── types.ts
│   │   └── user-session/        # User session management
│   │       └── getUserToken.ts
│   ├── wrangler.toml            # Cloudflare Workers config
│   └── tsconfig.json
├── react/                        # React Vite frontend
│   ├── src/
│   │   ├── App.tsx              # Root component
│   │   ├── main.tsx             # Entry point
│   │   ├── components/          # Reusable components
│   │   │   ├── SongCard.tsx
│   │   │   ├── SongCard.test.tsx
│   │   │   └── UserMenu.tsx
│   │   ├── pages/               # Page components
│   │   │   ├── LibraryPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── hooks/               # Custom hooks
│   │   │   ├── useSongLibrary.ts
│   │   │   ├── useSongLibrary.test.ts
│   │   │   └── useAuth.ts
│   │   ├── auth/                # Auth feature
│   │   │   ├── auth-slice.ts
│   │   │   ├── auth-slice.test.ts
│   │   │   └── SignInForm.tsx
│   │   ├── supabase/            # Supabase integration
│   │   │   ├── supabaseClient.ts
│   │   │   └── getSupabaseAuthToken.ts
│   │   └── types/               # Type definitions
│   │       └── song.ts
│   └── tsconfig.json
├── shared/                       # Shared code
│   ├── src/
│   │   ├── types/
│   │   │   ├── song.ts          # Shared song type
│   │   │   └── api.ts           # API types
│   │   ├── utils/
│   │   │   ├── formatDuration.ts
│   │   │   ├── formatDuration.test.ts
│   │   │   └── validateInput.ts
│   │   ├── schemas/             # Shared schemas
│   │   │   └── song-schema.ts
│   │   └── index.ts             # Main exports (careful: no barrel abuse)
│   └── tsconfig.json
├── docs/                         # Documentation (kebab-case filenames)
│   ├── authentication-system.md
│   ├── effect-implementation.md
│   └── file-organization.md
├── scripts/                      # Build & utility scripts
│   ├── build/
│   │   └── generate-schemas/
│   │       ├── index.ts
│   │       └── helpers/
│   │           └── toPascalCase.ts
│   └── dev/
├── .github/
│   ├── skills/                   # Agent Skills
│   │   └── react-conventions/
│   │       ├── SKILL.md
│   │       └── references/
│   │           └── REFERENCE.md
│   └── agents/                   # Custom agents
│       └── Comment Agent.agent.md
├── vite.config.ts               # ESM
├── tailwind.config.js           # ESM
└── tsconfig.json
```

## Import Antipatterns & How to Fix

### ❌ Barrel File Abuse

**Problem:** Index.ts re-exports hide actual file structure:

```typescript
// BAD: songshare-effect/react/src/components/index.ts
export { SongCard } from "./SongCard";
export { UserMenu } from "./UserMenu";
export { PlaybackControls } from "./PlaybackControls";

// Import hides actual location
import { SongCard, UserMenu } from "./components";  // Where are they really?
```

**Solution:** Import directly from source files:

```typescript
// GOOD: Direct imports clarify structure
import { SongCard } from "./components/SongCard";
import { UserMenu } from "./components/UserMenu";
```

### ❌ Inconsistent Path Styles

**Problem:** Mix of relative and absolute imports:

```typescript
// BAD: Inconsistent
import { Song } from "../../../shared/types/song";     // Fragile relative
import { Button } from "@shared/components/Button";   // But also absolute
import { useState } from "react";
```

**Solution:** Consistent import style per codebase:

```typescript
// GOOD: All absolute where configured (recommended)
import { Song } from "@shared/types/song";
import { Button } from "@shared/components/Button";
import { useState } from "react";

// OR all relative (only if no alias configured)
import { Song } from "../../shared/types/song";
import { Button } from "../../shared/components/Button";
import { useState } from "react";
```

### ❌ Circular Dependencies

**Problem:** Modules importing each other creates hidden coupling:

```typescript
// BAD: auth/index.ts imports from components, components import from auth
// auth/index.ts
export { AuthContext } from "./AuthContext";
export { useAuth } from "./useAuth";

// components/Button.tsx
import { useAuth } from "../auth";  // ← Creates circular dependency

// hooks/useAuth.ts
import { Button } from "../components/Button";  // ← Circular!
```

**Solution:** Organize by dependency flow:

```
auth/
├── AuthContext.tsx
├── useAuth.ts
├── types.ts

components/
├── Button.tsx          // Imports from auth/ (one direction only)
└── UserMenu.tsx

hooks/
├── usePlayback.ts      // Doesn't import from components/
└── useSongLibrary.ts   // Can import from shared, services, types
```

## Refactoring Imports Step-by-Step

### Example: Removing Barrel File

**Before (with barrel):**

```
src/utils/
├── index.ts              # BAD: Re-exports everything
├── formatDate.ts
├── formatDuration.ts
└── validateInput.ts

// In component:
import { formatDate, formatDuration, validateInput } from "../utils";
```

**After (direct imports):**

```
src/utils/
├── formatDate.ts
├── formatDate.test.ts
├── formatDuration.ts
├── formatDuration.test.ts
├── validateInput.ts
└── validateInput.test.ts

// In component:
import { formatDate } from "../utils/formatDate";
import { formatDuration } from "../utils/formatDuration";
import { validateInput } from "../utils/validateInput";
```

### Steps to Execute:

1. **Delete index.ts:**

   ```bash
   rm src/utils/index.ts
   ```

2. **Find all imports from the barrel:**

   ```bash
   grep -r "from.*utils" src/ --include="*.ts" --include="*.tsx"
   ```

3. **Replace each import:**

   ```typescript
   // Before
   import { formatDate, formatDuration } from "../utils";

   // After
   import { formatDate } from "../utils/formatDate";
   import { formatDuration } from "../utils/formatDuration";
   ```

4. **Validate no imports remain from index:**
   ```bash
   grep -r "from.*utils\"" src/ --include="*.ts" --include="*.tsx"
   ```

## File Organization Checklist

- [ ] No `index.ts` files in source directories (except `shared/src/index.ts` with caution)
- [ ] Components are PascalCase, one per file
- [ ] Utilities are camelCase, descriptively named
- [ ] Tests colocated with source (`.test.ts` in same directory)
- [ ] Features group related files (auth/, song-library/, etc.)
- [ ] Documentation uses kebab-case filenames
- [ ] Config files use ESM (`export default`, not `module.exports`)
- [ ] Imports organized in standard order (external, absolute, relative, styles)
- [ ] No circular dependencies between modules
- [ ] Path aliases used consistently (all relative or all absolute, not mixed)

## References

- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Vite Path Aliasing](https://vitejs.dev/config/shared-options.html#resolve-alias)
- [ES6 Modules Best Practices](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
