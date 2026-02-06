# GitHub Copilot Instructions

This file provides quick reference and orientation for GitHub Copilot.

## 📚 Documentation Structure

This project uses **Agent Skills** (portable, task-specific guidance) and **custom rules** (universal guidelines):

### Skills (Task-Focused Guidance)

These skills are automatically loaded when relevant to your task:

- [**effect-ts-patterns**](./skills/effect-ts-patterns/SKILL.md) - Effect-TS API patterns, error handling, schema validation
- [**authentication-system**](./skills/authentication-system/SKILL.md) - JWT tokens, RLS, visitor/user auth
- [**file-organization**](./skills/file-organization/SKILL.md) - No barrel files, direct imports, naming conventions
- [**typescript-conventions**](./skills/typescript-conventions/SKILL.md) - Strict typing, no `any`, JSDoc rules
- [**react-conventions**](./skills/react-conventions/SKILL.md) - React Compiler, functional components, hooks patterns
- [**code-comments**](./skills/code-comments/SKILL.md) - Comment conventions, JSDoc guidelines
- [**unit-testing**](./skills/unit-testing/SKILL.md) - Vitest patterns and best practices
- [**source-refactoring**](./skills/source-refactoring/SKILL.md) - Splitting files, default exports, test colocation
- [**playwright-testing**](./skills/playwright-testing/SKILL.md) - E2E test patterns and stability tips

### Master Rules

The single source of truth for all coding guidelines:

- [**`.agent/rules.md`**](../.agent/rules.md) - **Canonical reference** for coding standards, architecture, and project conventions

## 🎯 Project Overview

**SongShare Effect** is a React Vite project with Hono API server for Cloudflare Pages and Workers deployment.

- **Frontend**: React + Vite at http://localhost:5173/
- **API**: Hono + Effect-TS at http://localhost:8787/
- **Database**: Supabase with RLS and Realtime
- **Auth**: Dual system (visitor + user tokens) with JWT and RLS enforcement

### Quick Start

```bash
npm install
npm run dev:all
```

## 🔗 Key Documentation

- [**README.md**](../README.md) - Project setup and architecture overview
- [**CONTRIBUTING.md**](../CONTRIBUTING.md) - Commit message conventions and pre-commit hooks
- [**docs/authentication-system.md**](../docs/authentication-system.md) - Complete auth guide (JWT, RLS, tokens)
- [**docs/effect-implementation.md**](../docs/effect-implementation.md) - Effect-TS patterns used in API

## ✅ Golden Rules (See `.agent/rules.md` for Complete List)

1. ❌ **NO BARREL FILES** - Import directly from source files
2. ✅ **Direct imports only** - No index.ts re-exports
3. ✅ **React Compiler ready** - No manual memoization
4. ✅ **TypeScript strict** - No `any` types
5. ✅ **JSDoc without types** - Don't repeat types in comments
6. ✅ **Colocated tests** - Unit tests next to source
7. ✅ **ESM config files** - Use `export default`, not CommonJS
8. ✅ **Kebab-case docs** - Documentation filenames in kebab-case

## 🛠️ Common Commands

```bash
npm run dev           # Frontend only
npm run dev:api       # API only
npm run dev:all       # Both servers

npm run build:all     # Build everything
npm run lint          # Check code style
npm run test:unit     # Run unit tests
npm run test:e2e:dev  # Run E2E tests (interactive)
npm run commit        # Interactive commit (Commitizen)
```

---

## 📖 For Complete Reference

Always consult [`.agent/rules.md`](../.agent/rules.md) for the canonical source of all coding guidelines and project conventions.
