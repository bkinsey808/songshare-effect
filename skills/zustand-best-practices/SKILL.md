---
name: zustand-best-practices
description: >
  Zustand state management patterns for this project — store creation,
  selectors, Immer middleware, async actions with loading states, devtools,
  persist, and testing. Use when authoring or editing Zustand stores
  (use*Store files) or components that subscribe to stores. Do NOT use for
  React component structure or TypeScript-only utilities.
---

**Requires:** file-read, terminal (linting/testing). No network access needed.

**Full reference:** [/docs/zustand-best-practices.md](/docs/zustand-best-practices.md)

## Preconditions

- Read the store file before editing.
- Check `docs/ai/rules.md` for repo-wide constraints.

## Defaults (proceed without asking)

- Apply all key rules below; edit the file already open or mentioned.
- **Always ask:** which store file if not specified and cannot be inferred.

## Key rules

- **Always use selectors** — never subscribe to the whole store; select only the fields needed.
  [→ full detail](/docs/zustand-best-practices.md#basic-selector-pattern)

- **`useShallow` for derived arrays/objects** — prevents unnecessary re-renders when a selector returns a new reference.
  [→ full detail](/docs/zustand-best-practices.md#memoized-selectors)

- **Named selector constants** — define selectors outside components for reuse and stability.
  [→ full detail](/docs/zustand-best-practices.md#selector-factory-pattern)

- **One store per domain** — split by concern; do not grow one monolithic store.
  [→ full detail](/docs/zustand-best-practices.md#store-composition)

- **Track `isLoading` and `error`** for every async action.
  [→ full detail](/docs/zustand-best-practices.md#async-actions-with-loading-states)

- **Use Immer** for deeply nested state updates.
  [→ full detail](/docs/zustand-best-practices.md#immer-middleware)

- **Wrap with `devtools`** in all stores; use `partialize` when adding `persist`.
  [→ full detail](/docs/zustand-best-practices.md#middleware)

- **Never mock the store in tests** — reset with `useStore.setState(initialState)` in `beforeEach`.
  [→ full detail](/docs/zustand-best-practices.md#testing)

## Output format

Write code changes directly. After edits, output a brief bullet list of which patterns were applied and which validation commands were run.

## Error handling

If `npm run lint` fails after changes, report verbatim and fix before declaring success.

## Validation

```bash
npm run lint
```

## Skill handoffs

- Components using stores → also load `react-best-practices`.
- TypeScript-only type errors → load `typescript-best-practices`.
