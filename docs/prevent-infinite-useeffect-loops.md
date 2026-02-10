# Preventing Infinite useEffect Loops 🔁⚠️

This document explains the pattern we use in SongShare Effect to avoid infinite render/effect loops caused by running fetch/subscribe effects inside components that are rendered many times (e.g., list items / cards). It includes the root cause, a clear rule set, bad/good examples, and a quick verification checklist.

---

## Root cause

- Calling hooks that run side-effectful initialization (fetch, subscribe) inside a component that is rendered repeatedly can multiply those effects and cause a feedback loop that pins CPU and never settles.
- Common triggers are:
  - A list of N items rendering a child component that calls a page-level hook which itself does `useEffect` for fetching/subscribing.
  - `useEffect` dependency arrays that include non-stable function references which are recreated every render (causing the effect to re-run).

---

## Core rule (short)

- Side-effectful fetch or subscription hooks must be invoked once per _page_ or _mount_, not once per child item. Child components should only read state or call stable action functions via selectors or props.

---

## Do / Don't ✅ / ❌

- ✅ Do keep fetch/subscribe effects at the page or top-level hook (e.g., `useSongLibrary`, `useUserLibrary`).
- ✅ Do use `useRef` flags for “run once per mount” initialization when needed.
- ✅ Do use stable selectors (Zustand selectors) or pass down _data_ via props to child components.
- ✅ Do read action functions from the store with `useAppStore((s) => s.someAction)` in child components if child only needs to call an action (this avoids running init effects).
- ✅ Do document intentional dependency omissions with `// oxlint-disable-next-line react/exhaustive-deps` and a short explanation.

- ❌ Don’t call a hook that fetches/subscribes inside every list item (e.g., calling `useSongLibrary()` inside `UserLibraryCard`).
- ❌ Don’t include unstable function references (created by other hooks or inline closures) in `useEffect` dependency arrays unless they are truly stable.

---

## Bad example (causes multiplication)

```ts
// BAD: Every card calls the page-level hook that performs fetch & subscribes
function UserLibraryCard(){
  // Triggers fetch and subscriptions per card -> multiplies effects
  const { removeFromSongLibrary } = useSongLibrary();
  // ...render UI
}
```

## Good example (single init + lightweight card)

```ts
// GOOD: Page init hook runs once and stores entries + subscriptions
function UserLibraryPage(){
  useUserLibrary(); // fetch + subscribe once per mount
  return entries.map(e => <UserLibraryCard key={e.id} entry={e} />);
}

function UserLibraryCard({entry}){
  // child only needs to call actions — use selectors directly or accept actions via props
  const removeFromSong = useAppStore((s) => s.removeSongFromSongLibrary);
  return <button onClick={() => removeFromSong({songId: entry.id})}>Remove</button>;
}
```

---

## Handling dependencies safely

- If an effect depends on derived values (e.g., list of IDs), include only the _primitive_ key (sorted-joined string) in the dependency array — not the full object.
- If a store-provided function is recreated and you intentionally do not want the effect to retrigger, omit it from the dependency list and add an explanatory `oxlint-disable-next-line react/exhaustive-deps` comment.
- Keep `useEffect` bodies small and ensure they are idempotent.

---

## One-time initialization pattern

Use a mounted flag with `useRef` to ensure the initialization runs once per mount:

```ts
const initializedRef = useRef(false);
useEffect(() => {
  if (initializedRef.current) return;
  initializedRef.current = true;
  // run fetch and start subscriptions
}, [location.pathname]);
```

This prevents re-initialization when React replays effects in Strict Mode or when child renders change.

---

## Verification checklist ✅

1. Add unit tests for the hook (verify `fetch` and `subscribe` are called once on mount).
2. Run `npm run lint` and `npm run test:unit`.
3. In browser devtools, verify console shows one initialization and one subscription per mount when navigating to the page.
4. If CPU is high or spinner persists, search logs for repeated initialization messages (e.g., "Initializing, isLoading:").

---

## Real-world reference

We applied this pattern in the fix for user library:

- Removed page-level hook calls from `react/src/user-library/card/useUserLibraryCard.ts`
- Kept fetch/subscribe in `react/src/user-library/useUserLibrary.ts`
- Removed function references from `useEffect` dependency arrays in `useSongLibrary` and `usePlaylistLibrary` and documented the intentional omissions with `oxlint-disable-next-line react/exhaustive-deps`.

---

## TL;DR 💡

Keep effects at the right level (page/top-level hook), keep children lightweight, avoid unstable function dependencies in `useEffect`, and add tests + linter checks to prevent regressions.

If you'd like, I can add a short unit test template that asserts the initialization happens once for a page hook and fails if called N times.
