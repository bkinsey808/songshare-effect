# TypeScript Configuration Guide

This document explains the TypeScript configuration architecture for the SongShare Effect project, which uses a monorepo structure with multiple TypeScript projects.

## Architecture Overview

The project uses **TypeScript Project References** with a shared base configuration to maintain consistency while allowing project-specific customizations.

```
├── tsconfig.base.json          # Shared base configuration
├── tsconfig.json              # Workspace references (project orchestration)
├── tsconfig.app.json          # React SPA configuration
├── tsconfig.node.json         # Build tools and Node.js scripts
├── tsconfig.functions.json    # Cloudflare Pages Functions
└── api/
    └── tsconfig.json          # Cloudflare Workers API (separate but integrated)
```

## Configuration Files Breakdown

### 1. Base Configuration (`tsconfig.base.json`)

**Purpose**: Shared configuration inherited by all projects to ensure consistency.

```json
{
	"compilerOptions": {
		/* Language and Environment */
		"target": "ES2022",
		"lib": ["ES2022"],
		"module": "ESNext",
		"moduleResolution": "bundler",
		"moduleDetection": "force",

		/* Type Checking - Strict Configuration */
		"strict": true,
		"noUnusedLocals": true,
		"noUnusedParameters": true,
		"noFallthroughCasesInSwitch": true,
		"noImplicitOverride": true,
		"noImplicitReturns": true,
		"noPropertyAccessFromIndexSignature": true,
		"noUncheckedIndexedAccess": true,
		"exactOptionalPropertyTypes": true,
		"allowUnusedLabels": false,
		"allowUnreachableCode": false,

		/* Modules */
		"allowImportingTsExtensions": true,
		"verbatimModuleSyntax": true,
		"resolveJsonModule": true,
		"noUncheckedSideEffectImports": true,

		/* Emit */
		"noEmit": true,
		"noErrorTruncation": true,
		"preserveWatchOutput": true,

		/* Interop Constraints */
		"forceConsistentCasingInFileNames": true,
		"isolatedDeclarations": true,
		"skipLibCheck": true,

		/* Path Mapping */
		"baseUrl": ".",
		"paths": {
			"@/shared/*": ["./shared/*"],
			"@/react/*": ["./react/src/*"],
			"@/api/*": ["./api/src/*"]
		}
	}
}
```

**Key Features**:

- **Modern ES2022 target** for current browser/runtime support
- **Bundler module resolution** optimized for Vite/modern tooling
- **Strict type checking** with all recommended safety flags (including latest additions)
- **Path mapping** for clean imports across the monorepo
- **JSON module support** for importing JSON files
- **Advanced import control** with `verbatimModuleSyntax` and `allowImportingTsExtensions`
- **Side-effect import validation** with `noUncheckedSideEffectImports` to catch import typos
- **Isolated declarations** with `isolatedDeclarations` for faster tooling and explicit type annotations

### 2. Workspace Orchestration (`tsconfig.json`)

**Purpose**: Project references for workspace-wide TypeScript operations.

```json
{
	"files": [],
	"references": [
		{ "path": "./tsconfig.app.json" },
		{ "path": "./tsconfig.node.json" },
		{ "path": "./tsconfig.functions.json" },
		{ "path": "./api" }
	]
}
```

**Enables**:

- `tsc -b` builds all projects
- Workspace-wide type checking
- Incremental compilation
- Proper dependency ordering

### 3. React App Configuration (`tsconfig.app.json`)

**Purpose**: Configuration for the React SPA frontend.

```json
{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"composite": true,
		"tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
		"useDefineForClassFields": true,
		"lib": ["ES2022", "DOM", "DOM.Iterable"],
		"types": ["vite/client"],
		"jsx": "react-jsx"
	},
	"include": ["react/src", "shared"]
}
```

**Specific Features**:

- **DOM types** for browser APIs
- **React JSX** with modern transform
- **Vite client types** for HMR and asset imports
- **Class fields** for modern JavaScript syntax

### 4. Node.js Tools Configuration (`tsconfig.node.json`)

**Purpose**: Configuration for build tools, scripts, and Node.js environments.

```json
{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"composite": true,
		"tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
		"types": ["node"]
	},
	"include": ["vite.config.ts", "scripts/**/*", "shared/**/*"]
}
```

**Specific Features**:

- **Node.js types** for server-side APIs
- **Build tools** (Vite config, scripts)
- **Shared utilities** access for build scripts
- **No DOM types** (server environment)

### 5. Cloudflare Pages Functions (`tsconfig.functions.json`)

**Purpose**: Configuration for Pages Functions middleware (language detection).

```json
{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"composite": true,
		"tsBuildInfoFile": "./node_modules/.tmp/tsconfig.functions.tsbuildinfo",
		"types": ["@cloudflare/workers-types", "node"],
		"lib": ["ES2022", "WebWorker"]
	},
	"include": [
		"functions/**/*",
		"shared/types/**/*",
		"shared/utils/languageUtils.ts",
		"shared/supportedLanguages.ts"
	]
}
```

**Specific Features**:

- **Cloudflare Workers types** for Pages Functions APIs
- **Node types** for server-side utilities
- **WebWorker lib** for edge runtime APIs
- **Selective shared includes** for needed utilities
- **Inherits all path mappings** from base

### 6. API Configuration (`api/tsconfig.json`)

**Purpose**: Configuration for the Cloudflare Workers API server.

```json
{
	"extends": "../tsconfig.base.json",
	"compilerOptions": {
		"composite": true,
		"tsBuildInfoFile": "./node_modules/.tmp/tsconfig.api.tsbuildinfo",

		"target": "ES2022",
		"lib": ["ES2022"],
		"types": ["@cloudflare/workers-types"],
		"allowJs": true,
		"esModuleInterop": true,
		"noEmit": false,
		"outDir": "./dist",

		"baseUrl": "..",
		"paths": {
			"@/shared/*": ["./shared/*"],
			"@/react/*": ["./react/src/*"],
			"@/api/*": ["./api/src/*"]
		}
	},
	"include": ["src/**/*", "../shared/**/*"],
	"exclude": ["node_modules", "dist"]
}
```

**Specific Features**:

- **Separate but integrated** with workspace
- **Actual compilation** (`noEmit: false`) for deployment
- **Output directory** for built files
- **Cloudflare Workers types** for runtime APIs
- **JavaScript support** for gradual migration
- **Relaxed strict options** (`noPropertyAccessFromIndexSignature: false`, `isolatedDeclarations: false`) for Workers compatibility
- **Module syntax compatibility** (disables `allowImportingTsExtensions` and `verbatimModuleSyntax` for emit)

## Design Principles

### 1. **Inheritance Over Duplication**

- Base config contains all common settings
- Projects only override what's necessary
- Reduces maintenance burden

### 2. **Environment-Specific Types**

- **DOM types**: Only for frontend (app)
- **Node types**: Only for build tools
- **Workers types**: Only for Cloudflare environments

### 3. **Composite Projects**

- Enable incremental compilation
- Support workspace-wide operations
- Proper dependency tracking

### 4. **Path Mapping Consistency**

- Same import paths work across all projects
- Clean separation of concerns
- Easy refactoring and code sharing

## Common Operations

### Build All Projects

```bash
# Type check all projects
npx tsc -b --dry

# Build all projects
npx tsc -b

# Watch mode for all projects
npx tsc -b --watch

# Clean all build artifacts
npx tsc -b --clean
```

### Project-Specific Operations

```bash
# Build only React app
npx tsc -b tsconfig.app.json

# Build only API
cd api && npx tsc

# Type check functions
npx tsc -b tsconfig.functions.json
```

### Path Import Examples

```typescript
// From any project, these imports work:
import { ApiType } from "@/api/types";
import { ReactComponent } from "@/react/components/Button";
import { someUtility } from "@/shared/utils/helpers";
```

## Best Practices

### 1. **Adding New Projects**

1. Create new `tsconfig.{name}.json` extending base
2. Add to workspace references in root `tsconfig.json`
3. Include appropriate types for the environment
4. Set up composite project with unique `tsBuildInfoFile`

### 2. **Modifying Base Config**

- Changes automatically apply to all projects
- Test with `tsc -b --dry` after changes
- Consider impact on all environments

### 3. **Path Mapping**

- Add new paths to base config for workspace-wide access
- Use relative paths in project-specific overrides when needed
- Keep imports consistent across projects

### 4. **Type Dependencies**

```typescript
// Good: Import from shared types
// Avoid: Cross-project dependencies
import type { ReactProps } from "@/react/components";
import type { User } from "@/shared/types/user";

// API shouldn't import React types
```

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**:
   - Check path mappings in relevant tsconfig
   - Ensure baseUrl is correct for the project
   - Verify include/exclude patterns

2. **Type checking differences between IDE and CLI**:
   - IDE might use different tsconfig
   - Check VS Code TypeScript version
   - Restart TypeScript service in IDE

3. **Build performance issues**:
   - Use `tsc -b` instead of `tsc` for project references
   - Enable incremental compilation with composite projects
   - Check .tsbuildinfo files are being generated

4. **Path mapping not working**:
   - Ensure baseUrl is set correctly
   - Check paths are relative to baseUrl
   - Verify the target files are included in the project

### Debug Commands

```bash
# Check project structure
npx tsc -b --listFiles --dry

# Verbose build information
npx tsc -b --verbose

# Force rebuild (ignore incremental info)
npx tsc -b --force
```

## Configuration Validation

### Pre-commit Checks

```bash
# Ensure all projects type check
npx tsc -b

# Check for unused dependencies in path mappings
# (custom script recommended)
```

### IDE Setup

- Install TypeScript extension
- Configure to use workspace TypeScript version
- Enable "TypeScript and JavaScript Language Features"
- Set up proper project detection for monorepo

## TypeScript 5.x Features & Considerations

### Current Version

This project uses **TypeScript 5.9.2**, which includes several modern features enabled in our configuration:

### Modern Features in Use

- **`verbatimModuleSyntax`**: Ensures predictable import/export behavior
- **`allowImportingTsExtensions`**: Allows importing `.ts` files directly (with `noEmit`)
- **`bundler` module resolution**: Optimal for modern bundlers like Vite
- **`moduleDetection: "force"`**: Ensures consistent module detection

### Modern Features in Active Use

- **`noUncheckedSideEffectImports`** (5.6+): Catches typos in side-effect imports like CSS or polyfills
- **`isolatedDeclarations`** (5.5+): Enables faster declaration generation with explicit type annotations
- **`verbatimModuleSyntax`**: Ensures predictable import/export behavior
- **`allowImportingTsExtensions`**: Allows importing `.ts` files directly (with `noEmit`)
- **`bundler` module resolution**: Optimal for modern bundlers like Vite
- **`moduleDetection: "force"`**: Ensures consistent module detection

### Optional Newer Features to Consider

For future TypeScript versions, consider adding:

- **`rewriteRelativeImportExtensions`** (5.7+): Automatically rewrites `.ts` to `.js` in output

## Migration Notes

When upgrading TypeScript or changing configurations:

1. **Update base config first** - changes propagate to all projects
2. **Test incrementally** - build each project separately
3. **Check tool compatibility** - ensure Vite, ESLint, etc. work with changes
4. **Update CI/CD** - modify build commands if needed
5. **Review new compiler options** - consider enabling newer strict flags

This architecture provides a robust, maintainable TypeScript setup that scales with the project while maintaining consistency and performance across all environments.
