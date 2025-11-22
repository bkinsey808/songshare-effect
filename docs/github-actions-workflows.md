# GitHub Actions: workflows, what they do, and how the VS Code extension helps

This document explains the workflows stored in `.github/workflows/` for this repository, maps them to the key GitHub Actions concepts (triggers, jobs, artifacts, caches, secrets), and explains how the GitHub Actions VS Code extension can speed up authoring and debugging them.

If you want a quick interactive look at runs, install the GitHub Actions extension for VS Code — it dramatically speeds up triage and iteration.

## Recent improvements (applied)

- Added concurrency to expensive/long-running workflows so duplicate runs for the same ref are canceled (e2e, PR checks, functions-dist).
- Standardized the Bun installation strategy across workflows — we now use the official bun installer directly with retries and explicit PATH/BUN_INSTALL exports (this avoids flaky third-party action failures and ensures the binary is discoverable immediately in later steps).
- Removed `|| true` usage that was swallowing build failures in the _full_ E2E workflow and consolidated functions/dist validation. Note: the _PR-level_ Playwright smoke job intentionally uses a non-blocking Playwright invocation (it may run tests with `|| true` on purpose so small smoke regressions don't block PRs) — the full E2E job run on `main` will fail on test errors.
- Added least-privilege `permissions: contents: read` to workflows so the default token scope is limited.
- Added a path filter to `check-functions-dist.yml` so function-dist checks only run for PRs that modify relevant code/scripts.
- Added workflow status badges to the top of the README for quick CI visibility.
- Added unit test coverage (Vitest) + JUnit reporting and coverage artifacts in PR checks and set a baseline coverage threshold so CI will fail if coverage drops below the baseline.
- Added a GitHub-only coverage workflow `coverage.yml` (runs on push to `main`) that uploads coverage artifacts and provides a workflow badge in the README so you can track latest coverage runs without an external coverage service.
- Added GitHub Checks integration for unit tests: PR checks now publish the JUnit report (`reports/unit-junit.xml`) to GitHub Checks so failing tests and details are visible inline in the Checks UI.
- Added a PR-level Playwright "smoke" job that runs a very small set of end-to-end checks (quick render + basic UI smoke tests) so obvious regressions surface earlier without running the full E2E suite.

---

## Workflows in this repository (summary)

There are five workflow files in `.github/workflows/` used by this project. Below is a short description of each and why it exists.

- `pr-checks.yml` (PR Checks)
  - Trigger: `pull_request` (opened, synchronize, reopened)
  - Jobs:
    - `lint-and-unit`: runs linting and unit tests (Node 20, npm ci, `npm run lint`, `npm run test:unit`).
    - `check-functions-dist`: depends on `lint-and-unit`. Builds function artifacts via a `prepare-functions` script and validates the built `dist/functions` imports.
  - Purpose: catch issues early in PRs (style, failing tests, function bundle problems) before merging.

- `commitlint.yml` (Validate commit messages on PR)
  - Trigger: `pull_request` (types: opened, synchronize, reopened)
  - Runs `commitlint` comparing PR commit range (base..head) to ensure commit messages follow rules.
  - Purpose: keep commit history consistent and machine-readable (important for changelog/release tooling).

- `e2e.yml` (End-to-end tests using Playwright)
  - Trigger: `push` to `main`, `schedule` (nightly cron), and `workflow_dispatch` for manual execution.
  - Steps include: checkout, install Node, install dependencies, build frontend & API, start a preview server bound to IPv4 localhost (`--host 127.0.0.1`), wait for it to become ready (we check `localhost` then `127.0.0.1` with a timeout), cache Playwright browser binaries, ensure browsers are installed, run Playwright tests, and upload test reports and logs as artifacts.
  - Purpose: validate end-to-end user flows across the whole app regularly and after changes.

- `check-functions-dist.yml` (validate functions bundle)
  - Trigger: `push` to `main` and `pull_request` targeting `main` (pull requests run only when files that affect function packaging change).
  - Prepares the functions bundle and validates that the compiled `dist/functions` doesn't contain illegal import styles (e.g. non-relative imports that could break in runtime or packaging).
  - Purpose: ensure serverless function bundles are valid and safe to deploy.

---

## How the YAML maps to GitHub Actions concepts

- Workflows: a YAML file in `.github/workflows/` automatically becomes a GitHub Actions workflow.
- Triggers: `on: push | pull_request | schedule | workflow_dispatch` decide when a workflow runs.
- Jobs: a workflow contains one or more jobs that run on a runner (e.g., `ubuntu-latest`). Jobs can run in parallel or depend on others via `needs:`.
- Steps: inside a job, steps either use actions (`uses:`) or run commands (`run:`). Typical steps: checkout, setup-node, install deps, run tests, upload artifacts.
- Caching: actions like `actions/cache@v4` speed CI by preserving dependencies or heavy binaries (Playwright browsers in this repo).
- Artifacts: `actions/upload-artifact@v4` stores test reports and logs so you can review them after a run.
- Secrets and env:
  - This repo's existing workflows don't rely on repository secrets for builds/tests, but deploys or integrations would use `secrets.*` when needed.
  - Environment variables are used to configure runtime behavior (e.g., `PLAYWRIGHT_BROWSERS_PATH`).

---

## Why these workflows are useful for this repo

- PR checks (lint + unit + bundle checks) protect `main` from regressions and enforce maintainability.
- Commitlint keeps commit history consistent, which helps readability and release automation.
- Nightly & push e2e tests help catch regressions that unit tests miss (interaction, UI, integrations). Artifacts make diagnosis straightforward.
- Bundle checks for `dist/functions` ensure that serverless functions will have valid import semantics at runtime.

---

## How the GitHub Actions VS Code extension makes your life easier

Install the official “GitHub Actions” extension in VS Code and you get a rich local experience for observing and debugging runs right from your editor:

- Browse workflows and recent runs without the browser — fast triage.
- Drill into run details (jobs → steps) and view logs inline next to your code.
- Re-run or cancel workflows from VS Code (if you have permissions) — handy for retrying flaky runs.
- Inline schema validations and autocompletion when editing YAML workflows.
- Quick access to artifacts and logs — no need to switch to the browser to download them.

Practical tips when you use the extension:

- After a failed workflow, open the run in VS Code → expand the failing step → view the log and copy failing commands to reproduce locally.
- Use `workflow_dispatch` to add manual testing hooks (a manual run can accept inputs and act like a “try in CI” button).
- Use the extension alongside local debugging (for example: run Playwright locally) to iterate quickly on failing E2E tests.

---

## Quick suggestions / next steps you might want to add

- Add a workflow badge to `README.md` so contributors can quickly see CI health for `main`.
- If you add deployments, make sure to add secrets and secure workflow triggers (protect manual dispatch or require specific permissions).
- Consider adding a “canary” scheduled workflow for critical end-to-end smoke tests at shorter intervals if you need quicker regression detection.

---

If you'd like I can:

- Add a README badge and link to this doc, or
- Add an additional workflow that runs a lighter smoke test on `pull_request` to catch obvious e2e regressions earlier.

Happy to expand this doc with run examples, screenshots of the extension UI, or a short troubleshooting checklist for common CI failures.
