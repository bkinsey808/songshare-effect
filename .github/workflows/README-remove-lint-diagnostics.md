This file contains a quick instruction for removing the temporary lint diagnostics artifact upload step from `.github/workflows/pr-checks.yml`.

How to revert the diagnostic upload step (option 1 — apply the patch):

1. From the repository root, apply the patch:

```bash
# apply the patch file created by the assistant
git apply .github/workflows/revert-lint-diagnostics.patch
```

2. Commit & push the revert:

```bash
git add .github/workflows/pr-checks.yml
git commit -m "ci(pr-checks): remove debug lint artifacts"
git push origin test-workflows
```

How to revert the diagnostic upload step (option 2 — manual edit):

- Open `.github/workflows/pr-checks.yml` and remove the step named "Upload lint diagnostics (ESLint config + lint log)". Commit and push the change.

Notes:

- Keep this file while you're debugging. Remove it later when it's no longer needed.
