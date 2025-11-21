**Branch protection & required checks**

Set up GitHub branch protection rules for `main` (or your release branch) to enforce CI checks and a safe merge process.

Recommended checks

- Require status checks to pass before merging:
  - `PR Checks (lint & unit)` (the workflow we added)
  - `Validate commit messages` (commitlint workflow)
  - Optionally: `E2E Tests (Playwright)` (if you want to block merges until e2e pass)
- Require pull request reviews before merging (1 or 2 reviewers depending on team size).
- Optionally enable "Require branches to be up to date before merging" to force merges to include latest main changes.

How to add (UI steps)

1. Go to `Settings` → `Branches` → `Branch protection rules`.
2. Click `Add rule` and set `Branch name pattern` to `main`.
3. Check `Require status checks to pass before merging` and select the checks above.
4. Check `Require pull request reviews before merging`.
5. Optionally enable other protections (force push/require linear history) as desired.

Notes

- If your repo is in an organization, an admin should configure these rules.
- For high-volume projects, consider allowing e2e to run on merges only and not block PR iteration unless necessary.
