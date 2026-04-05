# React Best Practices

This document captures UI and React-specific conventions we prefer across the codebase.

## Component props: prefer required props

When designing component APIs prefer required props over many optional props. Required props make intent explicit, simplify call sites, and avoid surprising runtime behavior. Use these patterns:

- **Use explicit presence flags**: pass a boolean like `hasLyrics` rather than making several lyric-related handlers optional.
- **Pass concrete refs/handlers**: supply a noop handler and fallback ref for non-active fields instead of leaving props undefined.
- **Keep optional props rare and documented**: only make a prop optional when there is a clear, documented reason (e.g., for legacy compatibility).

Example — prefer required props:

```tsx
// ❌ Optional handlers spread across many call sites
type CellProps = { textareaRef?: RefObject<HTMLTextAreaElement>; onSyncSelection?: () => void };

// ✅ Prefer required props with explicit fallbacks
type CellProps = { textareaRef: RefObject<HTMLTextAreaElement>; onSyncSelection: () => void };

// Caller uses a noop and fallback ref for non-lyrics fields
const noop = () => {};
const fallbackRef = useRef<HTMLTextAreaElement | null>(null);
<Cell textareaRef={isLyrics ? lyricsRef : fallbackRef} onSyncSelection={isLyrics ? sync : noop} />
```

Rationale: this approach avoids `foo?: T` vs `T | undefined` confusion under `exactOptionalPropertyTypes`, removes conditional rendering logic in many components, and makes TypeScript errors surface at the call site where decisions should be made.

## Other UI patterns

- Prefer small focused components with one responsibility.
- Keep presentation logic in components and pure utilities in shared files.
- Use explicit feature flags/props instead of toggling behavior through many optional callbacks.

---

See also: `docs/strict-typescript-patterns.md` for TypeScript-specific rules that interact with these patterns.
