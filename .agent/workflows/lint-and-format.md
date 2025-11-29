---
description: Lint and format code with oxlint and oxfmt
---

# Lint and Format Code

This project uses oxlint for linting and oxfmt for formatting.

## Formatting (oxfmt)

// turbo

1. Check formatting without making changes:

```bash
npm run format:check
```

// turbo 2. List files with formatting issues:

```bash
npm run format:list-different
```

// turbo 3. Format all files:

```bash
npm run format
```

## Linting (oxlint)

// turbo 4. Run oxlint with type-aware checks:

```bash
npm run lint
```

// turbo 5. Run oxlint and auto-fix issues:

```bash
npm run lint:fix
```

// turbo 6. List files with lint issues:

```bash
npm run lint:list-files
```

## Pre-commit Hooks

This project uses husky and lint-staged to automatically lint and format staged files before committing.

The configuration is in `lint-staged.config.mjs`.
