# Hydration in SongShare Effect

## What is Hydration?

**Hydration** is the process of restoring app state from persistent storage (`localStorage`) into the Zustand store when the app initializes.

The app store uses Zustand's `persist` middleware, which automatically synchronizes state to `localStorage`. On app startup, this persisted state needs to be **reloaded** (hydrated) before components can safely use it. This is an **async operation** because it reads from the browser's storage.

---

## Why Hydration Matters

1. **Consistency** — Components mounted before hydration reads incomplete state, causing React rendering mismatches
2. **Race conditions** — Auth flows, redirects, and effects that run during hydration can capture stale state
3. **Avoiding early redirects** — OAuth flows and login checks must wait for hydration to know the user's auth state
4. **Hook ordering** — Components must render consistently; if hydration affects state mid-render, hooks may run in different orders

**Example of a problem:**

```tsx
// ❌ Risky: assumes state exists, but hydration hasn't completed
const { isSignedIn } = useAppStore();
if (!isSignedIn) return <Redirect to="login" />;  // May redirect to login even though user IS signed in
```

**Better:**

```tsx
// ✅ Safe: waits for hydration before checking auth
const { isHydrated } = useHydration();
if (!isHydrated) return <div />;  // Wait for state to load

const { isSignedIn } = useAppStore();
if (!isSignedIn) return <Redirect to="login" />;
```

---

## How Hydration Works in This App

### Architecture

```
Browser Storage (localStorage)
        ↓ (async restore)
  Zustand Store (persist middleware)
        ↓ (notifies)
  useAppStoreHydrated() hook
        ↓ (consumed by)
  useHydration() hook
        ↓ (used by)
  Components (DashboardPage, etc.)
```

### Components

- **`useAppStore`** — Main Zustand store with `persist` middleware that saves/restores state
- **`useAppStoreHydrated()`** — Internal hook; returns `{ isHydrated: boolean }` to track when rehydration completes
- **`awaitAppStoreHydration`** — Internal async function; can be awaited to block until hydration finishes
- **`useHydration()`** — Public API; wrapper that exposes both `isHydrated` and `awaitHydration`
- **`AppHydrationBoundary`** — Suspense boundary at app root; renders `AppLoadingFallback` until initial hydration is done

---

## Using Hydration

### Basic: Conditional Rendering

Wait for hydration before rendering component logic:

```tsx
import useHydration from "@/react/app/useHydration";

export function MyComponent() {
  const { isHydrated } = useHydration();

  // Return placeholder until hydration finishes
  if (!isHydrated) {
    return <div />;
  }

  // Safe to use store state now
  const user = useAppStore((state) => state.user);
  return <div>Hello {user?.name}</div>;
}
```

### Advanced: Awaiting Hydration in Effects

For code that must run after hydration (e.g., analytics, prefetch):

```tsx
import useHydration from "@/react/app/useHydration";

export function MyComponent() {
  const { awaitHydration } = useHydration();

  useEffect(() => {
    (async () => {
      // Block until store is hydrated
      await awaitHydration();

      // Safe to use store state here
      const user = useAppStore((state) => state.user);
      logAnalytics({ userId: user?.id });
    })();
  }, [awaitHydration]);

  return <div>Tracking events...</div>;
}
```

### Protected Routes Example

In auth-protected layouts, always check hydration first:

```tsx
import useHydration from "@/react/app/useHydration";

export function RequireAuthBoundary({ children }) {
  const { isHydrated } = useHydration();
  const isSignedIn = useAppStore((state) => state.isSignedIn);

  if (!isHydrated) {
    return <AppLoadingFallback />;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" />;
  }

  return children;
}
```

---

## API Reference

### `useHydration()`

```tsx
function useHydration(): {
  isHydrated: boolean;
  awaitHydration: () => Promise<void>;
}
```

**Returns:**

- **`isHydrated`** — `true` when store has finished rehydrating from `localStorage`
- **`awaitHydration`** — Async function; resolves when hydration completes. Safe to call anywhere (component body, effects, event handlers, etc.)

**Import:**

```tsx
import useHydration from "@/react/app/useHydration";
```

**Usage locations:**

- ✅ Component render body
- ✅ Effects (`useEffect`)
- ✅ Event handlers
- ✅ Protected route guards

---

## Implementation Details

### File Locations

- **[react/src/app/useHydration.ts](../react/src/app/useHydration.ts)** — Main public hook
  - Default export: `useHydration()`
  - JSDoc with examples
  - Wraps `useAppStoreHydrated()` and `awaitAppStoreHydration`

- **[react/src/app/useHydration.test.tsx](../react/src/app/useHydration.test.tsx)** — Unit tests
  - Tests hook behavior and return shape
  - Verifies store dependency is called
  - Validates function reference stability across renders

- **[react/src/zustand/useAppStore.ts](../react/src/zustand/useAppStore.ts)** — Store definition
  - Exports: `useAppStoreHydrated` (hook), `awaitAppStoreHydration` (async function), `resetAllSlices`, etc.
  - `persist` middleware handles localStorage sync
  - `persist` middleware calls `onRehydrateStorage` to signal completion

- **[react/src/app/AppHydrationBoundary.tsx](../react/src/app/AppHydrationBoundary.tsx)** — Suspense wrapper
  - Renders at app root level
  - Shows loading fallback until store hydrates
  - Works alongside `useHydration()` for fine-grained control

### How Hydration Completes

1. App mounts → `AppHydrationBoundary` renders
2. Zustand `persist` middleware initializes
3. Middleware reads `localStorage` (async) and restores state
4. `onRehydrateStorage` callback is invoked, setting `isHydrated = true`
5. `useAppStoreHydrated()` hook subscribers are notified
6. `awaitAppStoreHydration` promise resolves
7. Components using `useHydration()` see `isHydrated = true` and render real content

---

## Common Patterns

### Pattern 1: Conditional Render (Simple)

```tsx
const { isHydrated } = useHydration();
return isHydrated ? <RealContent /> : <Fallback />;
```

### Pattern 2: Guard Auth State

```tsx
const { isHydrated } = useHydration();
const { isSignedIn } = useAppStore();

if (!isHydrated) return <LoadingFallback />;
if (!isSignedIn) return <Navigate to="/login" />;
return <Dashboard />;
```

### Pattern 3: Initialize After Hydration

```tsx
useEffect(() => {
  const { awaitHydration } = useHydration();

  (async () => {
    await awaitHydration();
    // Guaranteed: store is now fully loaded
    initializeAnalytics();
  })();
}, []);
```

### Pattern 4: Conditional Effect

```tsx
const { isHydrated } = useHydration();

useEffect(() => {
  if (!isHydrated) return;

  // This effect only runs after hydration
  const user = useAppStore((state) => state.user);
  logLogin(user?.id);
}, [isHydrated]);
```

---

## Testing

### Mocking `useHydration` in Tests

```tsx
import { vi } from "vitest";
import useHydration from "@/react/app/useHydration";

// Mock the hook
vi.mock("@/react/app/useHydration", () => ({
  default: vi.fn(),
}));

// In your test:
it("renders content when hydrated", () => {
  vi.mocked(useHydration).mockReturnValue({
    isHydrated: true,
    awaitHydration: vi.fn(),
  });

  const { getByText } = render(<MyComponent />);
  expect(getByText("Real Content")).toBeInTheDocument();
});
```

### Testing with Real Hydration

If you need to test with actual store hydration (integration test):

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import useHydration from "@/react/app/useHydration";

it("hydration completes", async () => {
  const { result } = renderHook(() => useHydration());

  // Wait for hydration to complete
  await waitFor(() => {
    expect(result.current.isHydrated).toBe(true);
  });
});
```

---

## Debugging

### Check if Hydration Completed

```tsx
// In DevTools console
useAppStore.getState().isHydrated
```

### Force Rehydration

```tsx
// Reset store (for testing)
useAppStore.setState({ /* reset state */ });

// Or reset everything
await resetAllSlices();
```

### Browser Storage

Store state is saved to `localStorage` under key `app-store` (default for Zustand persist):

```tsx
// Check persisted state
JSON.parse(localStorage.getItem("app-store") || "{}");

// Clear persisted state
localStorage.removeItem("app-store");
// Then refresh browser to start fresh
```

---

## Best Practices

✅ **Do:**

- Use `useHydration()` in components that depend on store state
- Check `isHydrated` before running effects that need store data
- Use `awaitHydration()` to block initialization until store is ready
- Place `useHydration()` near the top of components that conditionally render

❌ **Don't:**

- Assume store state exists before hydration completes
- Skip hydration checks in auth-critical paths
- Use `isHydrated` as a dependency in effects without full understanding
- Manually manipulate hydration state (let Zustand handle it)

---

## Related Files

- [react/src/zustand/useAppStore.ts](../react/src/zustand/useAppStore.ts) — Store definition
- [react/src/app/AppHydrationBoundary.tsx](../react/src/app/AppHydrationBoundary.tsx) — Suspense boundary
- [react/src/pages/dashboard/DashboardPage.tsx](../react/src/pages/dashboard/DashboardPage.tsx) — Example consumer
- [authentication-system.md](./authentication-system.md) — Auth patterns that depend on hydration

---

## FAQ

**Q: Why do I need to check `isHydrated` if `AppHydrationBoundary` already waits?**  
A: `AppHydrationBoundary` handles initial app load, but components can still render before hydration finishes due to async state updates. Always check `isHydrated` in components that depend on store state.

**Q: Can I call `awaitHydration()` multiple times?**  
A: Yes, it's safe. Each call resolves immediately if hydration is already complete, or waits if it's still in progress.

**Q: What happens to `useHydration()` after the app is initialized?**  
A: `isHydrated` stays `true` (hydration completes once), and `awaitHydration()` resolves immediately on subsequent calls.

**Q: Should I use `useHydration()` in every component?**  
A: Only in components that directly depend on store state. If a component doesn't use store hooks, it doesn't need hydration checks.

**Q: Can hydration fail?**  
A: Very rarely. If `localStorage` is full or corrupted, Zustand falls back to initial state and continues normally.
