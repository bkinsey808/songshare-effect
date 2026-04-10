# React Best Practices

> **Note:** For TypeScript-specific best practices (type definitions, return types, type safety), see [TypeScript Best Practices](typescript-best-practices.md).

<a id="toc"></a>

## Table of Contents

- [Component Props](#component-props)
  - [Prefer Required Props](#prefer-required-props)
  - [Common Prop Types](#common-prop-types)
  - [Prop Ordering Consistency](#prop-ordering-consistency)
  - [Prop Organization](#prop-organization)
  - [JSDoc Comments](#jsdoc-comments)
- [Naming Conventions](#naming-conventions)
  - [Event Handler Naming](#event-handler-naming)
  - [Boolean Prop Naming](#boolean-prop-naming)
  - [Function Declaration Style](#function-declaration-style)
- [Component Structure](#component-structure)
  - [Component Size and Focus](#component-size-and-focus)
  - [Split Hooks Over Prop Spreading](#split-hooks-over-prop-spreading)
  - [Composition Over Inheritance](#composition-over-inheritance)
  - [Avoid React.FC](#avoid-react-fc)
  - [useId for Accessible Form Labels](#useid)
  - [useEffect Rules](#useeffect-rules)
  - [useEffect Effect Scope](#useeffect-effect-scope)
  - [One-Time Initialization](#one-time-initialization)
  - [Conditional Rendering](#conditional-rendering)
  - [Refactor and Extraction Symmetry](#refactor-and-extraction-symmetry)
- [File and Import Conventions](#file-and-import-conventions)
- [React Compiler](#react-compiler)

---

<a id="component-props"></a>

## Component Props

<a id="prefer-required-props"></a>

### Prefer Required Props

Prefer required props over many optional props. Required props make intent explicit, simplify call sites, and avoid surprising runtime behavior:

- **Use explicit presence flags** — pass a boolean like `hasLyrics` rather than making several lyric-related handlers optional.
- **Pass concrete refs/handlers** — supply a noop handler and fallback ref for non-active fields instead of leaving props undefined.
- **Keep optional props rare and documented** — only make a prop optional when there is a clear, documented reason (e.g., legacy compatibility).

```tsx
// ❌ Optional handlers spread across many call sites
type CellProps = { textareaRef?: RefObject<HTMLTextAreaElement>; onSyncSelection?: () => void };

// ✅ Required props with explicit fallbacks at the call site
type CellProps = { textareaRef: RefObject<HTMLTextAreaElement>; onSyncSelection: () => void };

const noop = () => {};
const fallbackRef = useRef<HTMLTextAreaElement | null>(null);
<Cell textareaRef={isLyrics ? lyricsRef : fallbackRef} onSyncSelection={isLyrics ? sync : noop} />;
```

This also avoids `foo?: T` vs `T | undefined` confusion under `exactOptionalPropertyTypes` — see [TypeScript Best Practices](typescript-best-practices.md#exactoptionalpropertytypes-handling).

<a id="common-prop-types"></a>

### Common Prop Types

**`ReactNode` for children and renderable content:**

Use `ReactNode` for props that accept any renderable React content:

```tsx
type CardProps = {
  children: ReactNode;           // any renderable content
  header?: ReactNode;            // optional renderable content
  footer: ReactNode | undefined; // required but can be explicitly undefined
};
```

**`ReactElement` for specific component instances:**

Use `ReactElement` when you need a JSX element, not text or primitives:

```tsx
type ModalProps = {
  trigger: ReactElement; // must be a React element
  content: ReactNode;    // can be any renderable content
};
```

**When to use each:**

- `ReactNode` — `children` and any content that can include text, numbers, or elements
- `ReactElement` — when you specifically need a JSX element (component instance)
- `ReactElement` — for component return types
- `string` — when only text is valid (e.g., `label`, `title`)

**Import note:** `ReactElement` is ambient in this project (no import needed). `ReactNode` must be imported:

```tsx
import type { ReactNode } from "react";
```

<a id="prop-ordering-consistency"></a>

### Prop Ordering Consistency

Maintain consistent prop ordering across the type definition, destructuring, and JSX usage:

```tsx
// 1. Type definition — required props first, optional last
type EditModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedItems: Item[] | undefined;
  onSave: (values: FormValues) => void;
  releaseVersion?: number;
};

// 2. Destructuring matches type definition order
export function EditModal({
  isOpen,
  setIsOpen,
  selectedItems,
  onSave,
  releaseVersion,
}: EditModalProps): ReactElement { ... }

// 3. JSX usage matches type definition order
<EditModal
  isOpen={isModalOpen}
  setIsOpen={setModalOpen}
  selectedItems={items}
  onSave={handleSave}
  releaseVersion={version}
/>;
```

<a id="prop-organization"></a>

### Prop Organization

Group props logically in type definitions with comments:

```tsx
type ComponentProps = {
  // 1. Visibility controls
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;

  // 2. Data props
  selectedItems: Item[] | undefined;

  // 3. Configuration
  featureState: FeaturesState | undefined;

  // 4. Callbacks
  onSave: (values: FormValues) => void;

  // 5. Optional overrides
  customValidator?: (values: FormValues) => boolean;
};
```

<a id="jsdoc-comments"></a>

### JSDoc Comments

Add JSDoc to new or materially changed public components explaining purpose, behavior, and key business rules. Use `@param propName` format (not `@param props.propName`):

```tsx
/**
 * Modal dialog for editing chord sequences in the song form.
 *
 * Maintains its own local state and syncs with the parent form via the
 * `onSave` callback when the user confirms.
 *
 * @param isOpen - Whether the modal is open
 * @param setIsOpen - Opens or closes the modal
 * @param onSave - Callback invoked with the confirmed chord sequence
 * @returns Modal dialog for editing chords
 */
export function EditChordsModal({ isOpen, setIsOpen, onSave }: EditChordsModalProps): ReactElement {
  // ...
}
```

**Include:** purpose, key business rules, state management approach, important data flow, each prop with `@param propName - description`, `@returns` describing what renders.

**Avoid:** `@param props` or `@param props.propName` format, repeating TypeScript types, implementation details, obvious behavior clear from the name.

---

<a id="naming-conventions"></a>

## Naming Conventions

<a id="event-handler-naming"></a>

### Event Handler Naming

Distinguish internal handlers from handler props:

```tsx
type ComponentProps = {
  onSave: (data: FormData) => void; // ✅ prop from parent — on* prefix
};

export function MyComponent({ onSave }: ComponentProps): ReactElement {
  // ✅ internal handler — handle* prefix, plain function declaration
  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    onSave(collectData());
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

- **`handle*`** — "I handle this internally"
- **`on*`** — "my parent handles this"

<a id="boolean-prop-naming"></a>

### Boolean Prop Naming

Use consistent prefixes:

```tsx
type ComponentProps = {
  isOpen: boolean;         // state or condition
  isLoading: boolean;
  hasError: boolean;       // possession or presence
  hasPermission: boolean;
  shouldValidate: boolean; // intention or configuration
  canEdit: boolean;        // capability or permission
};
```

Avoid ambiguous names like `open`, `error`, `disabled`, `validate` for custom props.

<a id="function-declaration-style"></a>

### Function Declaration Style

Prefer plain function declarations over arrow function assignments for components, event handlers, and local callbacks:

```tsx
// ❌ Avoid: arrow function assignment
const handleClick = () => { doSomething(); };

export const MyComponent = ({ value }: MyComponentProps): ReactElement => (
  <div>{value}</div>
);

// ✅ Preferred: plain function declaration
function handleClick(): void {
  doSomething();
}

export function MyComponent({ value }: MyComponentProps): ReactElement {
  return <div>{value}</div>;
}
```

Function declarations are hoisted, show up cleanly in stack traces, and are consistent with the project's hook and utility file style.

---

<a id="component-structure"></a>

## Component Structure

<a id="component-size-and-focus"></a>

### Component Size and Focus

Keep components small and focused on a single responsibility. Extract reusable logic into custom hooks and pure utilities into shared files:

```tsx
// ❌ Avoid: one component doing too much
export function SongDashboard(): ReactElement {
  // fetches songs, manages form state, handles auth, renders profile + settings + list
  // 500+ lines
}

// ✅ Preferred: split into focused components
export function SongDashboard(): ReactElement {
  return (
    <div>
      <SongList />
      <SongForm />
      <UserSettings />
    </div>
  );
}
```

Keep presentation logic in components and pure utilities in shared files. Prefer explicit feature flags/props instead of toggling behavior through many optional callbacks.

<a id="split-hooks-over-prop-spreading"></a>

### Split Hooks Over Prop Spreading

When a parent has shell concerns (routing, loading, errors, permissions) and a child has body
concerns (data fetching, mutations), use two hooks — one per level. Pass only the minimal input
the child needs; let the child call its own hook.

```tsx
// ❌ Wrong: parent fetches everything and spreads it to the child
function CommunityManageView(): ReactElement {
  const hook = useCommunityManageView();
  return <CommunityManageBody {...hook} />;
}

// ✅ Correct: shell resolves shell concerns; body fetches its own data
function CommunityManageView(): ReactElement {
  const { currentCommunity, isCommunityLoading, communityError, canManage, onBackClick } =
    useCommunityManageView();
  if (isCommunityLoading || communityError !== null || !canManage || currentCommunity === undefined) {
    return <LoadingOrErrorOrDenied />;
  }
  return <CommunityManageBody currentCommunity={currentCommunity} />;
}

function CommunityManageBody({ currentCommunity }: { currentCommunity: CommunityEntry }): ReactElement {
  const body = useCommunityManageBody(currentCommunity);
  return (/* body.members, body.events, body.onInviteClick, etc. */);
}
```

| Prop spreading                                              | Split hooks                                              |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| Parent fetches and passes 15+ values to the child           | Child fetches its own data via its hook                  |
| Child's required input is implicit                          | Child's required input is explicit (`currentCommunity`)  |
| Parent tests must mock all body concerns                    | Shell tests stay narrow; body tests focus on body        |
| Easy to accidentally pass through or overwrite keys         | No prop spread; each prop is intentional                 |

The shell hook owns routing, loading, errors, and permissions. The body hook owns data fetching,
subscriptions, and mutations. Each hook has one focused responsibility.

<a id="composition-over-inheritance"></a>

### Composition Over Inheritance

Prefer composition with props over class inheritance:

```tsx
// ❌ Avoid: class inheritance (legacy)
class PrimaryButton extends BaseButton { ... }

// ✅ Preferred: composition with variant prop
type ButtonProps = {
  variant: "primary" | "secondary" | "danger";
  children: ReactNode;
  onClick: () => void;
};

export function Button({ variant, children, onClick }: ButtonProps): ReactElement {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}

// ✅ Preferred: wrapper component for fixed variants
type ButtonBaseProps = Omit<ButtonProps, "variant">;

export function PrimaryButton(props: ButtonBaseProps): ReactElement {
  return <Button {...props} variant="primary" />;
}
```

Prefer hooks over higher-order components for sharing behavior between components.

<a id="avoid-react-fc"></a>

### Avoid React.FC

Do not use `React.FC` or `React.FunctionComponent` to type components. Use an explicit prop type and return type annotation instead:

```tsx
// ❌ Avoid
const MyComponent: React.FC<MyComponentProps> = ({ value }) => (
  <div>{value}</div>
);

// ✅ Preferred
export function MyComponent({ value }: MyComponentProps): ReactElement {
  return <div>{value}</div>;
}
```

`React.FC` implicitly widens the return type and historically added implicit `children` to all components. Explicit types make the contract clear and consistent with the rest of the codebase.

<a id="useid"></a>

### useId for Accessible Form Labels

Use `useId` to generate a stable, unique ID that links a `<label>` to its `<input>`. This avoids hand-crafted IDs that can collide when a component renders multiple times:

```tsx
import { useId } from "react";

export function PasswordInput(): ReactElement {
  const id = useId(); // unique per component instance, stable across renders

  return (
    <>
      <label htmlFor={id}>Password</label>
      <input id={id} type="password" />
    </>
  );
}
```

Do not use `useId` to generate keys for list items — use the data's own stable identifier instead.

<a id="useeffect-rules"></a>

### useEffect Rules

**Always add a comment on the line directly above `useEffect` explaining why the effect exists:**

```tsx
// ❌ No comment — unclear why this effect runs
useEffect(() => {
  document.title = `Song: ${title}`;
}, [title]);

// ✅ Comment explains the reason
// Sync the browser tab title whenever the active song title changes
useEffect(() => {
  document.title = `Song: ${title}`;
}, [title]);
```

**Keep dependency arrays complete — do not suppress the exhaustive-deps lint rule:**

```tsx
// ❌ Suppressed dep lint hides a real bug
useEffect(() => {
  fetchSong(songId);
  // oxlint-disable-next-line react/exhaustive-deps
}, []);

// ✅ Complete deps — effect re-runs correctly when songId changes
// Fetch song data whenever the active song ID changes
useEffect(() => {
  fetchSong(songId);
}, [songId]);
```

If exhaustive-deps flags a dep you genuinely don't want, restructure the code (move stable values
outside the component, or capture in a ref). When restructuring isn't feasible (e.g., a
store-provided function that is recreated on every render), omit it and document the intent:

```tsx
// Sync subscriptions when the active song changes.
// storeAction is excluded: it is recreated each render but is referentially stable in practice.
// oxlint-disable-next-line react/exhaustive-deps
useEffect(() => {
  storeAction(songId);
}, [songId]);
```

**When depending on a collection** (e.g., a list of IDs), include a primitive key — a
sorted-joined string — rather than the full array object. Array references change on every render
even when the contents are the same:

```tsx
const songIdKey = [...songIds].sort().join(",");

// Re-run only when the set of IDs actually changes
useEffect(() => {
  loadSongs(songIds);
  // oxlint-disable-next-line react/exhaustive-deps
}, [songIdKey]);
```

**Clean up async effects with an `isMounted` flag to prevent state updates after unmount:**

```tsx
// Fetch song data whenever the active song ID changes
useEffect(() => {
  let isMounted = true;

  async function load(): Promise<void> {
    const data = await fetchSong(songId);
    if (isMounted) {
      setSong(data);
    }
  }

  void load();

  return () => {
    isMounted = false;
  };
}, [songId]);
```

<a id="useeffect-effect-scope"></a>

### useEffect Effect Scope

Side-effectful initialization — fetch and subscribe calls — must run at the page or top-level
hook level, not inside each list item. Calling a fetch/subscribe hook in every child multiplies
effects by the item count and can cause feedback loops that pin CPU.

```tsx
// ❌ Wrong: fetch/subscribe hook called in every list item
function UserLibraryCard(): ReactElement {
  const { removeFromSongLibrary } = useSongLibrary(); // triggers fetch + subscribe per card
  return <button onClick={removeFromSongLibrary}>Remove</button>;
}

// ✅ Correct: fetch/subscribe runs once at page level; card only calls actions
function UserLibraryPage(): ReactElement {
  useUserLibrary(); // fetch + subscribe once per mount
  return <>{entries.map((e) => <UserLibraryCard key={e.id} entry={e} />)}</>;
}

function UserLibraryCard({ entry }: { entry: LibraryEntry }): ReactElement {
  const removeFromSong = useAppStore((s) => s.removeSongFromSongLibrary);
  return <button onClick={() => removeFromSong({ songId: entry.id })}>Remove</button>;
}
```

If a child component needs to call a store action, select the action directly via `useAppStore`
rather than invoking the feature hook.

<a id="one-time-initialization"></a>

### One-Time Initialization

Use a `useRef` flag to ensure an effect body runs once per mount. React Strict Mode replays
effects in development; a ref guard prevents double-initialization:

```tsx
const initializedRef = useRef(false);

// Fetch data and start subscriptions once per mount
useEffect(() => {
  if (initializedRef.current) return;
  initializedRef.current = true;
  // run fetch and start subscriptions
}, [location.pathname]);
```

Use this when an effect must not re-run even if React replays it or child renders trigger it.

<a id="conditional-rendering"></a>

### Conditional Rendering

**Use `&&` for simple conditionals — but guard against falsy numbers:**

```tsx
// ❌ Renders "0" when count is 0
{count && <span>Count: {count}</span>}

// ✅ Explicit boolean check
{count > 0 && <span>Count: {count}</span>}
```

**Use ternary for if-else:**

```tsx
{isLoading ? <Spinner /> : <Content />}
```

**Handle null/undefined with nullish coalescing:**

```tsx
{name ?? "Guest"}
{url ? <img src={url} alt="Avatar" /> : <DefaultAvatar />}
```

**Extract complex conditions to a variable or function:**

```tsx
// ❌ Complex inline condition
{user.role === "admin" || (user.role === "editor" && song.status === "draft") ? <EditButton /> : null}

// ✅ Extract to variable
const canEdit = user.role === "admin" || (user.role === "editor" && song.status === "draft");
{canEdit && <EditButton />}
```

<a id="refactor-and-extraction-symmetry"></a>

### Refactor and Extraction Symmetry

When extracting or refactoring components, preserve behavioral parity for consumers:

- Keep the same public prop API — consumers should not need code changes.
- Preserve `key` placement and wrapper elements unless there is a documented reason to change them.
- Semantic HTML improvements (e.g., `div` → `button`) and accessibility fixes are encouraged — note them in the PR.
- Tests demonstrating equivalence are valuable.

```tsx
// ❌ Breaking change — consumers must update
export function UserCard({ userName, editHandler }: { userName: string; editHandler: () => void }) { ... }

// ✅ Same public API, refactored internals
export function UserCard({ user, onEdit }: { user: User; onEdit: () => void }): ReactElement {
  return (
    <Card className="user-card">
      <UserName name={user.name} />
      <EditButton onClick={onEdit} />
    </Card>
  );
}
```

---

<a id="file-and-import-conventions"></a>

## File and Import Conventions

**One component per file.** Keep one primary exported component per file and colocate its tests in the same directory:

```
song-form/
  SongForm.tsx
  SongForm.test.tsx
  use-song-form/
    useSongForm.ts
    useSongForm.test.tsx
```

Small sub-components used only by the primary component may live in the same file.

**Direct imports — no barrel re-exports.** Import directly from source files; do not create `index.ts` re-export files:

```tsx
// ❌ Avoid: barrel import hides the real source
import { useSongForm } from "@/song/song-form";

// ✅ Preferred: direct import
import useSongForm from "@/song/song-form/use-song-form/useSongForm";
```

Direct imports make the dependency graph explicit and prevent circular import issues.

---

<a id="react-compiler"></a>

## React Compiler

This project uses the React Compiler, which automatically optimizes components. Do not add manual memoization:

```tsx
// ❌ Avoid — compiler handles this
const handleClick = useCallback(() => { doSomething(value); }, [value]);
const expensiveValue = useMemo(() => computeExpensiveValue(data), [data]);
export const MyComponent = memo(({ prop }) => { ... });

// ✅ Preferred — let the compiler optimize
function handleClick(): void { doSomething(value); }
const expensiveValue = computeExpensiveValue(data);
export function MyComponent({ prop }: MyComponentProps): ReactElement { ... }
```

**Rare exceptions:** confirmed and measured performance issues the compiler doesn't optimize; stable references required by third-party libraries; interfacing with non-React code. When adding manual memoization for an exception, include a comment explaining why and link to the performance trace or issue.

---

See also: [docs/typescript-best-practices.md](typescript-best-practices.md)
