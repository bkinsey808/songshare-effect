````skill
---
name: naming-conventions
description: Symbol and file naming conventions for functions, types, variables, and React components. Use when naming a new function, hook, type, file, or variable, or when reviewing whether an existing name is appropriate.
license: MIT
compatibility: TypeScript 5.x, React 18+
metadata:
  author: bkinsey808
  version: "1.0"
---

# Naming Conventions Skill

## Function / Hook Prefix Guide

The prefix signals the responsibility of the function. Pick the most precise one.

| Prefix | When to use | Example |
|---|---|---|
| `use*` | React hook — **must** call at least one React hook internally | `useEventPermissions` → ❌ (no hooks inside); `useActiveEventSync` → ✅ |
| `compute*` | Pure function that **derives** a value via non-trivial logic | `computeEventPermissions`, `computeSlidePosition` |
| `get*` | Simple **retrieval** — property access, map lookup, array find | `getErrorMessage`, `getSupabaseClient` |
| `fetch*` | **Async** data load (network/DB) | `fetchEventBySlug`, `fetchCommunityLibrary` |
| `subscribe*` | Sets up a **realtime / WebSocket** subscription | `subscribeToCommunityEvent`, `subscribeToPresence` |
| `run*` | Executes a multi-step **Effect pipeline** or async flow | `runAction`, `runCommunityAction` |
| `create*` | **Factory** — returns a new instance or slice | `createEventSlice`, `createAuthSlice` |
| `make*` | Builds a **data structure** or test double | `makeNavigationSliceMock`, `makeUseManageView` |
| `build*` | Incrementally **assembles** a value (builder pattern) | `buildPathWithLang` |
| `handle*` | Implements an **event handler** (not a prop name) | `handleSubmit`, `handleSelectCommunity` |
| `on*` | **Callback prop** passed to a React component | `onInviteClick`, `onKickParticipant` |
| `set*` | **State setter** (side-effect, void) | `setActionState`, `setCurrentEvent` |
| `is*` / `has*` / `can*` | **Boolean predicate** — plain value or derived flag | `isOwner`, `canManageEvent`, `hasPermission` |
| `update*` | **Mutates** existing state (async or sync) | `updateActiveSong`, `updateActiveSlidePosition` |
| `refresh*` | **Re-fetches** already-loaded data | `refreshEvent`, `refreshCommunity` |
| `format*` | Pure **string / display** transformation | `formatDate`, `formatDuration` |

### `use*` vs `compute*` — the most common mistake

```typescript
// ❌ BAD: named like a hook but has no React hooks inside
export default function useEventPermissions({ currentUserId, ownerId, participants }) {
  const isOwner = currentUserId === ownerId;
  // ... pure computation, no useState/useEffect/etc.
  return { isOwner, canManageEvent };
}

// ✅ GOOD: rename to compute* to signal it is a pure function
export default function computeEventPermissions({ currentUserId, ownerId, participants }) {
  const isOwner = currentUserId === ownerId;
  return { isOwner, canManageEvent };
}

// ✅ GOOD: use* is correct when React hooks are called
export default function useEventManageView() {
  const [actionState, setActionState] = useState<ActionState>(...);
  useEffect(() => { ... }, []);
  // ...
}
```

## Type / Interface Naming

```typescript
// Props for React components — suffix *Props
type EventManageViewProps = { ... };

// Return shapes — suffix *Return or *Result
type ComputeEventPermissionsReturn = { ... };
type UseEventManageStateResult = { ... };

// Error types — suffix *Error
class DatabaseError { ... }
type EventError = "validation" | "not_found" | "unauthorized";

// Slice state — suffix *Slice or *State
type EventSlice = EventState & { ... };

// Generic type parameters — single uppercase or short descriptive PascalCase
type Selector<TState, TValue> = (state: TState) => TValue;
```

## Variable Naming

```typescript
// ✅ Booleans — always is*/has*/can* prefix
const isOwner = currentUserId === ownerId;
const hasParticipants = participants.length > 0;
const canManageEvent = isOwner || isEventAdmin;

// ✅ Module-level constants — UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const DEFAULT_LANG = "en";

// ✅ Local variables — camelCase
const currentParticipant = participants.find(...);

// ✅ Callbacks stored in variables — handle* prefix
const handleClick = () => { ... };

// ✅ Refs — camelCase with Ref suffix
const currentEventIdRef = useRef<string | undefined>(undefined);
```

## React Component Naming

```typescript
// ✅ Components — PascalCase, matches filename
export default function EventManageView(): ReactElement { ... }
// file: EventManageView.tsx

// ✅ Context providers — suffix *Provider
export default function AuthProvider({ children }: { children: ReactNode }) { ... }
// file: AuthProvider.tsx

// ✅ Compound/sub-components — PascalCase, descriptive
function ParticipantRow({ participant }: ParticipantRowProps) { ... }
```

## File Naming (Summary)

| What | Convention | Example |
|---|---|---|
| React component | PascalCase `.tsx` | `EventManageView.tsx` |
| Single-symbol util / function | camelCase `.ts` | `computeEventPermissions.ts`, `fetchEventBySlug.ts` |
| Multi-symbol file | kebab-case `.ts` | `auth-utils.ts` |
| Type-only file | camelCase or PascalCase `.type.ts` | `EventEntry.type.ts` |
| Test file | same name + `.test.ts/.tsx` | `computeEventPermissions.test.ts` |
| Test helper | same name + `.test-util.ts` | `makeUseManageView.test-util.ts` |
| Directory | kebab-case | `event-manage-view/`, `community-search-input/` |
| Doc files | kebab-case `.md` | `authentication-system.md` |

> For complete file organization rules see [file-organization skill](../file-organization/SKILL.md).

## Validation Checklist

Before finalizing a name, ask:

- [ ] Does the prefix accurately describe what the function **does** (not what it returns)?
- [ ] If prefixed `use*`, does it call at least one React hook internally?
- [ ] If it's a pure derivation, is it prefixed `compute*` rather than `get*` or `use*`?
- [ ] Do boolean variables start with `is*`, `has*`, or `can*`?
- [ ] Does the filename match the primary exported symbol?

## References

- [file-organization skill](../file-organization/SKILL.md) — full file/directory naming rules
- [react-conventions skill](../react-conventions/SKILL.md) — React-specific patterns
- [typescript-conventions skill](../typescript-conventions/SKILL.md) — type declaration conventions
- [.agent/rules.md](../../../.agent/rules.md) — canonical project rules
````
