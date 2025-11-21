**Contributing: commit messages & hooks**

This project enforces Conventional Commits and runs pre-commit checks for quality.
Follow these steps when contributing.

1. Commit message format

- Use Conventional Commits: `type(scope?): subject`
- Examples: `feat(song): add quick preview`, `fix(api): handle missing cookie`
- Use `npm run commit` to open an interactive Commitizen prompt (recommended).
- See `docs/commit-message-instructions.md` for full guidance and examples.

2. Local checks (hooks)

- Husky runs hooks installed by `npm run prepare`.
- Pre-commit: `lint-staged` will auto-fix staged files (ESLint, Prettier).
- Commit-msg: `commitlint` validates commit messages.

3. Useful commands

- Install dependencies: `npm ci`
- Install husky hooks (run after `npm ci` locally): `npm run prepare`
- Interactive commit (Commitizen): `npm run commit` or `npx git-cz`
- Validate commit messages for a range: `npm run commitlint:range`
- Validate a single commit message file: `npm run commitlint:edit -- <path-to-msg-file>`

4. CI

- Pull requests run a GitHub Action that validates commit messages. Commits that don't follow the rules will fail the PR check.

Thank you for contributing! Please keep messages clear and follow the repo's ESM config conventions.
