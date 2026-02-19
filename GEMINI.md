# Gemini CLI Project-Specific Instructions

This file is used by the Gemini CLI to understand project-specific mandates, workflows, and configurations. Instructions defined here take precedence over the default Gemini CLI behavior.

**For comprehensive guidance on working in this repository, refer to `AGENTS.md`.**

## Project Overview

This project is a full-stack TypeScript monorepo with the following key technologies and structure:

- **Frontend:** React (located in `react/`)
- **Backend API:** Hono (located in `api/`)
- **Core Library:** Effect-TS (used across the stack)
- **Shared Code:** `shared/` directory for common utilities and types.

## Mandates

- **Technology Stack Adherence:** When implementing new features or making changes, prioritize the use of React for frontend, Hono for backend APIs, and Effect-TS for functional, type-safe programming patterns.
- **Monorepo Structure:** Respect the existing monorepo structure, ensuring changes within `react/`, `api/`, and `shared/` directories align with their respective responsibilities.
- **File Size & Function Parameters:** Keep files small. For functions with three or more parameters, use a single options object parameter.
- **Linting Awareness:** Understand and adhere to strict linting rules _before_ generating code.
- **No Barrel Files:** `index.ts` re-export hubs are disallowed; use direct imports from source files.
- **Use Direct Imports:** Always use direct imports from source files.
- **TypeScript Strictness:** Avoid `any` type.
- **React Compiler Friendly:** This is a React Compiler project. Therefore, `useMemo` and `useCallback` are generally not necessary; avoid manual memoization unless clearly necessary.
- **JSDoc in TS/TSX:** Do not repeat types in JSDoc comments.
- **Config Files:** Use ESM (`export default`, no CommonJS).
- **Docs Filenames:** Filenames in `docs/` must be kebab-case.
- **Colocate Unit Tests:** When adding tests, colocate unit tests next to source files.

## Conventions

- **Commenting:** Use JSDoc for documenting symbols. For other comments, use `//` syntax.
- **JSDoc for Options Objects:** For functions accepting a single options object parameter, document its properties directly using `@param propertyName` (e.g., `@param isProd - Description`) rather than `@param options` followed by `@param options.propertyName`.

## Workflows

- **Frontend Data Handling:** The frontend should primarily focus on `select` and `subscribe` operations. All `update`, `delete`, and `insert` operations must be handled server-side.
- **Client Data Fetching:** For initial client data needs, perform a combined fetch. Subsequently, subscribe to individual data parts as needed.

## Configuration

- **Local Development:** HTTPS is used for localhost development in this project.
