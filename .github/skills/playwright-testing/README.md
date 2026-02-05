# Playwright Testing

This directory complements the `SKILL.md` with a quick reference for Playwright test authors and reviewers.

Key points:

- Use route mocking for backend responses and stable locators for UI queries.
- Always wait for hydration after navigation (`HYDRATION_WAIT_MS`) to avoid flakiness with React Compiler hydration.
- Prefer auth helpers in `e2e/utils` for authenticated flows.

See also: `/.github/agents/Playwright Agent.agent.md` and `/.github/skills/playwright-testing/SKILL.md`.
