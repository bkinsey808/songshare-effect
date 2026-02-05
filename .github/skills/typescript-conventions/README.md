# TypeScript Conventions

Quick reference for reviewers and contributors:

- **Avoid `any`** — prefer `unknown` or concrete types.
- **Prefer `type` over `interface`** for object shapes when appropriate.
- **No manual memoization** — avoid `useMemo` / `useCallback` / `memo` unless there is a documented performance reason.
- **JSDoc rules** — write JSDoc for symbols with `@param` and `@returns` descriptions (no types).
- **Validation** — run `npm run lint && npx tsc -b .` after changes and add tests for non-trivial behavior.

See: `/.github/agents/TypeScript Agent.agent.md` and `.agent/rules.md` for detailed guidance.
