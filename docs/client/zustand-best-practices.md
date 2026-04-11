# Zustand Best Practices

Patterns for Zustand state management in this project: store creation, selectors, middleware, async operations, and testing.

<a id="toc"></a>

## Table of Contents

- [Store Creation](#store-creation)
  - [Basic Store Pattern](#basic-store-pattern)
  - [Immer Middleware](#immer-middleware)
- [Selectors and Performance](#selectors-and-performance)
  - [Basic Selector Pattern](#basic-selector-pattern)
  - [Memoized Selectors](#memoized-selectors)
  - [Selector Factory Pattern](#selector-factory-pattern)
- [Store Organization](#store-organization)
  - [Store Composition](#store-composition)
  - [Store Slicing](#store-slicing)
- [Async Operations](#async-operations)
  - [Async Actions with Loading States](#async-actions-with-loading-states)
  - [Optimistic Updates](#optimistic-updates)
- [Middleware](#middleware)
  - [DevTools](#devtools)
  - [Persist Middleware](#persist-middleware)
  - [Combining Middleware](#combining-middleware)
- [Real-World Example](#real-world-example)
- [Testing](#testing)
  - [Unit Testing](#unit-testing)
  - [Component Integration Testing](#component-integration-testing)
- [Quick Checklist](#quick-checklist)

---

<a id="store-creation"></a>

## Store Creation

<a id="basic-store-pattern"></a>

### Basic Store Pattern

```typescript
import { create } from "zustand";

type CounterState = {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
};

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
```

<a id="immer-middleware"></a>

### Immer Middleware (Mutable Updates)

Use Immer when updates involve deeply nested state — it lets you write mutable-looking syntax that produces immutable updates:

```typescript
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type TodoState = {
  todos: Array<{ id: string; title: string; done: boolean }>;
  addTodo: (title: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
};

export const useTodoStore = create<TodoState>()(
  immer((set) => ({
    todos: [],
    addTodo: (title) =>
      set((state) => {
        state.todos.push({ id: crypto.randomUUID(), title, done: false });
      }),
    toggleTodo: (id) =>
      set((state) => {
        const todo = state.todos.find((t) => t.id === id);
        if (todo) todo.done = !todo.done;
      }),
    removeTodo: (id) =>
      set((state) => {
        state.todos = state.todos.filter((t) => t.id !== id);
      }),
  })),
);
```

---

<a id="selectors-and-performance"></a>

## Selectors and Performance

<a id="basic-selector-pattern"></a>

### Basic Selector Pattern

Always select only the fields you need. Selecting the whole store causes a re-render whenever **any** field changes:

```typescript
// ❌ Whole store — re-renders on any state change
const state = useCounterStore();

// ✅ Select only what you need
const count = useCounterStore((state) => state.count);
const increment = useCounterStore((state) => state.increment);
```

<a id="memoized-selectors"></a>

### Memoized Selectors

For selectors that derive new arrays or objects, use `useShallow` to prevent unnecessary re-renders:

```typescript
import { useShallow } from "zustand/react/shallow";

// Without useShallow: new array reference on every render even if contents are equal
const titles = useTodoStore((state) => state.todos.map((t) => t.title));

// With useShallow: only re-renders when the derived array contents change
const titles = useTodoStore(
  useShallow((state) => state.todos.map((t) => t.title)),
);
```

<a id="selector-factory-pattern"></a>

### Selector Factory Pattern

Define selectors as named constants outside components to keep them reusable and stable:

```typescript
const todoSelectors = {
  selectAll: (state: TodoState) => state.todos,
  selectDone: (state: TodoState) => state.todos.filter((t) => t.done),
  selectPending: (state: TodoState) => state.todos.filter((t) => !t.done),
  selectCount: (state: TodoState) => state.todos.length,
  selectByStatus: (done: boolean) => (state: TodoState) =>
    state.todos.filter((t) => t.done === done),
};

// Usage
const allTodos = useTodoStore(todoSelectors.selectAll);
const doneTodos = useTodoStore(todoSelectors.selectDone);
const pendingTodos = useTodoStore(todoSelectors.selectByStatus(false));
```

---

<a id="store-organization"></a>

## Store Organization

<a id="store-composition"></a>

### Store Composition (Multiple Stores)

Keep one store per domain. Components can subscribe to multiple stores:

```typescript
export const useAuthStore = create<AuthState>((set) => ({
  isSignedIn: false,
  user: null,
  signOut: () => set({ isSignedIn: false, user: null }),
}));

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "light",
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
}));

// Usage — subscribe to each independently
function Header(): ReactElement {
  const isSignedIn = useAuthStore((state) => state.isSignedIn);
  const theme = useThemeStore((state) => state.theme);
  return <header className={theme}>{isSignedIn ? "Welcome" : "Sign In"}</header>;
}
```

<a id="store-slicing"></a>

### Store Slicing (Large Stores)

For a single large store, group related fields with comments. For stores with 50+ fields, prefer splitting into multiple stores instead:

```typescript
type AppState = {
  // Auth
  isSignedIn: boolean;
  user: User | null;

  // UI
  sidebarOpen: boolean;

  // Data
  songs: Song[];

  // Actions
  toggleSidebar: () => void;
  setSongs: (songs: Song[]) => void;
};
```

---

<a id="async-operations"></a>

## Async Operations

<a id="async-actions-with-loading-states"></a>

### Async Actions with Loading States

Track `isLoading` and `error` alongside data for every async action:

```typescript
type SongLibraryState = {
  songs: Song[];
  isLoading: boolean;
  error: Error | null;
  fetchSongs: (userId: string) => Promise<void>;
  clearError: () => void;
};

export const useSongLibraryStore = create<SongLibraryState>((set) => ({
  songs: [],
  isLoading: false,
  error: null,

  fetchSongs: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const songs = await songAPI.list(userId);
      set({ songs, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error("Unknown error"),
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
```

<a id="optimistic-updates"></a>

### Optimistic Updates

Apply state immediately, then reconcile or revert based on the API response:

```typescript
addSong: async (title) => {
  const tempId = crypto.randomUUID();

  // Optimistically add
  set((state) => ({
    songs: [...state.songs, { id: tempId, title }],
  }));

  try {
    const newSong = await songAPI.create(title);
    // Replace temp item with server-confirmed item
    set((state) => ({
      songs: state.songs.map((s) => (s.id === tempId ? newSong : s)),
    }));
  } catch (error) {
    // Revert on failure
    set((state) => ({
      songs: state.songs.filter((s) => s.id !== tempId),
    }));
    throw error;
  }
},
```

---

<a id="middleware"></a>

## Middleware

<a id="devtools"></a>

### DevTools

Wrap the store with `devtools` to get action history and time-travel debugging in the Redux DevTools browser extension:

```typescript
import { devtools } from "zustand/middleware";

export const useCounterStore = create<CounterState>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    { name: "counter-store" },
  ),
);
```

<a id="persist-middleware"></a>

### Persist Middleware

Use `persist` to automatically save state to `localStorage` and restore it on page reload. Use `partialize` to persist only specific fields:

```typescript
import { persist } from "zustand/middleware";

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
    }),
    {
      name: "theme-storage",          // localStorage key
      partialize: (state) => ({ theme: state.theme }), // only persist theme
    },
  ),
);
```

<a id="combining-middleware"></a>

### Combining Middleware

Apply middleware inside-out: innermost is applied first, outermost last:

```typescript
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set) => ({
        // store definition
      })),
      { name: "app-storage" },
    ),
    { name: "app-store" },
  ),
);
// Order: immer → persist → devtools
```

---

<a id="real-world-example"></a>

## Real-World Example

Auth store with devtools, loading state, and error handling:

```typescript
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type AuthState = {
  isSignedIn: boolean;
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signOut: () => void;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      isSignedIn: false,
      user: null,
      isLoading: false,
      error: null,

      signIn: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/auth/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
          });
          if (!response.ok) throw new Error("Sign in failed");
          const user: unknown = await response.json();
          set({ isSignedIn: true, user: user as User, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error : new Error("Unknown error"),
            isLoading: false,
          });
          throw error;
        }
      },

      signOut: () => set({ isSignedIn: false, user: null }),
      clearError: () => set({ error: null }),
    }),
    { name: "auth-store" },
  ),
);
```

---

<a id="testing"></a>

## Testing

<a id="unit-testing"></a>

### Unit Testing

Reset store state before each test with `setState`:

```typescript
import { act, renderHook } from "@testing-library/react";
import { useCounterStore } from "./counterStore";

describe("useCounterStore", () => {
  beforeEach(() => {
    // Reset to initial state before each test
    useCounterStore.setState({ count: 0 });
  });

  it("increments count", () => {
    // Arrange
    const { result } = renderHook(() => useCounterStore());

    // Act
    act(() => { result.current.increment(); });

    // Assert
    expect(result.current.count).toBe(1);
  });

  it("decrements count", () => {
    // Arrange
    useCounterStore.setState({ count: 2 });
    const { result } = renderHook(() => useCounterStore());

    // Act
    act(() => { result.current.decrement(); });

    // Assert
    expect(result.current.count).toBe(1);
  });
});
```

<a id="component-integration-testing"></a>

### Component Integration Testing

Reset store state in `beforeEach` — do not mock the store:

```typescript
import { act, render, screen } from "@testing-library/react";
import { useCounterStore } from "./counterStore";

function Counter(): ReactElement {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}

describe("Counter", () => {
  beforeEach(() => {
    useCounterStore.setState({ count: 0 });
  });

  it("displays count and increments on click", () => {
    // Arrange
    render(<Counter />);
    expect(screen.getByText("Count: 0")).toBeInTheDocument();

    // Act
    act(() => { screen.getByRole("button", { name: "Increment" }).click(); });

    // Assert
    expect(screen.getByText("Count: 1")).toBeInTheDocument();
  });
});
```

---

<a id="quick-checklist"></a>

## Quick Checklist

- [ ] Use selectors — never subscribe to the whole store
- [ ] Use `useShallow` for selectors that return new arrays or objects
- [ ] Define selectors as named constants outside components
- [ ] One store per domain; split large stores rather than growing one monolith
- [ ] Track `isLoading` and `error` for every async action
- [ ] Use Immer for deeply nested state updates
- [ ] Wrap with `devtools` in development; use `partialize` with `persist`
- [ ] Never mutate state directly (without Immer)
- [ ] Reset store state in `beforeEach` in tests — do not mock the store

---

See also: [docs/client/react-best-practices.md](/docs/client/react-best-practices.md)
