---
description: Commit code using conventional commits
---

# Commit Code Using Conventional Commits

This project uses commitizen and commitlint to enforce conventional commit messages.

## Interactive Commit

1. Stage your changes:

```bash
git add <files>
```

2. Use commitizen for an interactive commit prompt:

```bash
npm run commit
```

This will guide you through creating a properly formatted conventional commit.

## Commit Message Format

Commits should follow the conventional commits format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

## Validate Commits

Check if commit messages follow the convention:

```bash
npm run commitlint:edit
```

Check a range of commits:

```bash
npm run commitlint:range
```

## Pre-commit Hooks

Husky is configured to:

1. Run linting and formatting on staged files (via lint-staged)
2. Validate commit messages (via commitlint)

Configuration:

- Commitlint: `commitlint.config.js`
- Lint-staged: `lint-staged.config.mjs`
- Husky: `.husky/` directory
