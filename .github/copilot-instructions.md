# GitHub Copilot Instructions

This file provides quick reference and orientation for GitHub Copilot.

## 📚 Documentation Structure

This project uses **Agent Skills** (portable, task-specific guidance) and **custom rules** (universal guidelines):

### Skills (Task-Focused Guidance)

These skills are automatically loaded when relevant to your task:

- [**effect-ts-patterns**](/.github/skills/effect-ts-patterns/SKILL.md) - Effect-TS API patterns, error handling, schema validation
- [**authentication-system**](/.github/skills/authentication-system/SKILL.md) - JWT tokens, visitor/user auth, client-side token management, React auth patterns
- [**realtime-rls-architecture**](/.github/skills/realtime-rls-architecture/SKILL.md) - RLS policy templates for Realtime tables, JWT validation logic, access control layers
- [**realtime-rls-debugging**](/.github/skills/realtime-rls-debugging/SKILL.md) - Debugging Realtime subscriptions that connect but deliver no updates, empty filter errors
- [**file-organization**](/.github/skills/file-organization/SKILL.md) - No barrel files, direct imports, naming conventions
- [**naming-conventions**](/.github/skills/naming-conventions/SKILL.md) - Function prefix guide (use* vs compute* vs get\* etc.), type/variable/file naming rules
- [**typescript-best-practices**](/.github/skills/typescript-best-practices/SKILL.md) - Strict typing, no `any`, JSDoc rules
- [**react-best-practices**](/.github/skills/react-best-practices/SKILL.md) - React Compiler (no memoization), ReactElement ambient type, useEffect comment rule, component organization
- [**manage-page-patterns**](/.github/skills/manage-page-patterns/SKILL.md) - Local actionState, runCommunityAction/runAction helpers, realtime update path for admin/manage pages
- [**app-store-patterns**](/.github/skills/app-store-patterns/SKILL.md) - Zustand slice pattern, createXxxSlice factories, AppSlice type, useAppStore selectors, getTypedState
- [**supabase-client-patterns**](/.github/skills/supabase-client-patterns/SKILL.md) - Which Supabase client to use in React (public/token/withAuth), safe-query helpers, SupabaseClientLike type
- [**form-patterns**](/.github/skills/form-patterns/SKILL.md) - useAppForm hook, Effect-based form validation, handleSubmit, handleApiResponseEffect
- [**internationalization**](/.github/skills/internationalization/SKILL.md) - useLocale/useLanguage hooks, URL-path language routing, adding translation keys
- [**code-comment-best-practices**](/.github/skills/code-comment-best-practices/SKILL.md) - Comment conventions, JSDoc guidelines
- [**lint-error-resolution**](/.github/skills/lint-error-resolution/SKILL.md) - Guide for resolving ESLint, TypeScript, and oxlint errors in strict environments
- [**lint-first-authoring**](/.github/skills/lint-first-authoring/SKILL.md) - Lint-first code authoring workflow for producing repo-consistent changes that are more likely to pass lint on first try
- [**unit-test-best-practices**](/.github/skills/unit-test-best-practices/SKILL.md) - Core Vitest setup, mocking strategies, API handler testing, and common pitfalls. Full reference: docs/testing/unit-test-best-practices.md
- [**unit-test-hook-best-practices**](/.github/skills/unit-test-hook-best-practices/SKILL.md) - React hook testing: renderHook, Documentation by Harness, installStore, fixtures, subscriptions, lint/compiler traps, pre-completion checklist. Full reference: docs/testing/unit-test-hook-best-practices.md
- [**source-refactoring**](/.github/skills/source-refactoring/SKILL.md) - Splitting files, default exports, test colocation
- [**file-splitting**](/.github/skills/file-splitting/SKILL.md) - Step-by-step guide for breaking consolidated files into single-function files
- [**hono-best-practices**](/.github/skills/hono-best-practices/SKILL.md) - Hono route handlers, Effect integration, error mapping, middleware patterns, architectural conventions
- [**scripts**](/.github/skills/scripts/SKILL.md) - Bun script conventions, naming, linting, testing scripts
- [**playwright-testing**](/.github/skills/playwright-testing/SKILL.md) - E2E test patterns and stability tips
- [**deployment-strategies**](/.github/skills/deployment-strategies/SKILL.md) - Core Cloudflare Pages/Workers deploy workflow, env vars, secrets management
- [**cloudflare-cache-cicd**](/.github/skills/cloudflare-cache-cicd/SKILL.md) - CDN cache invalidation and GitHub Actions CI/CD workflows
- [**`doc-best-practices`**](/.github/skills/doc-best-practices/SKILL.md) - File naming, structure, writing style, formatting, skill+doc pairs, placement, and maintenance for Markdown docs
- [**deployment-operations**](/.github/skills/deployment-operations/SKILL.md) - Rollback, health monitoring, and production troubleshooting

### Master Rules

The single source of truth for all coding guidelines:

- [**`.agent/rules.md`**](/.agent/rules.md) - **Canonical reference** for coding standards, architecture, and project conventions

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

- [**README.md**](/README.md) - Project setup and architecture overview
- [**CONTRIBUTING.md**](/CONTRIBUTING.md) - Commit message conventions and pre-commit hooks
- [**docs/authentication-system.md**](/docs/auth/authentication-system.md) - Complete auth guide (JWT, RLS, tokens)
- [**docs/effect-implementation.md**](/docs/effect-implementation.md) - Effect-TS patterns used in API
- [**docs/unit-test-best-practices.md**](/docs/testing/unit-test-best-practices.md) - Unit testing reference (mocking, pitfalls, API handler testing)
- [**docs/unit-test-hook-best-practices.md**](/docs/testing/unit-test-hook-best-practices.md) - React hook testing reference (Harness, fixtures, subscriptions, checklist)

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

Always consult [`.agent/rules.md`](/.agent/rules.md) for the canonical source of all coding guidelines and project conventions.
