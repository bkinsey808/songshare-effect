# Zustand Reference

Comprehensive patterns for Zustand state management, including store creation, selectors, middleware, async operations, and testing.

## Store Creation

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

### With Immer Middleware (Mutable Updates)

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
        state.todos.push({ id: Math.random().toString(), title, done: false });
      }),
    toggleTodo: (id) =>
      set((state) => {
        const todo = state.todos.find((t) => t.id === id);
        if (todo) {
          todo.done = !todo.done;
        }
      }),
    removeTodo: (id) =>
      set((state) => {
        state.todos = state.todos.filter((t) => t.id !== id);
      }),
  }))
);
```

**Benefit:** Write immutable updates with mutable-looking syntax, more intuitive for complex nested updates.

## Selectors & Performance

### Basic Selector Pattern

```typescript
// ❌ BAD: Whole store causes re-render on any change
const state = useCounterStore(); // Re-renders if ANY field changes
console.log(state.count);

// ✅ GOOD: Select only needed value
const count = useCounterStore((state) => state.count);
const increment = useCounterStore((state) => state.increment);
```

### Memoized Selectors

```typescript
// ✅ GOOD: Selector that computes derived state
const selectDoubledCount = (state: CounterState) => state.count * 2;
const doubledCount = useCounterStore(selectDoubledCount);

// Better: Memoize complex selectors with shallow comparison
import shallow from "zustand/react/shallow";

const selectTodoTitles = (state: TodoState) => state.todos.map((t) => t.title);
const titles = useTodoStore(selectTodoTitles, shallow);
```

### Selector Factory Pattern

```typescript
// Create reusable selectors
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
const urgentTodos = useTodoStore(todoSelectors.selectByStatus(false));
```

## Advanced Store Patterns

### Store Composition (Multiple Stores)

```typescript
// Separate stores for different domains
type AuthState = {
  isSignedIn: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isSignedIn: false,
  user: null,
  signIn: async (email, password) => {
    const user = await authAPI.login(email, password);
    set({ isSignedIn: true, user });
  },
  signOut: () => set({ isSignedIn: false, user: null }),
}));

type ThemeState = {
  theme: "light" | "dark";
  toggleTheme: () => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "light",
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
}));

// Usage across components
function Header() {
  const isSignedIn = useAuthStore((state) => state.isSignedIn);
  const theme = useThemeStore((state) => state.theme);

  return <header className={theme}>{isSignedIn ? "Welcome" : "Sign In"}</header>;
}
```

### Store Slicing (Organize Large Stores)

```typescript
// For very large stores, split into slices
type AppState = {
  // Auth slice
  isSignedIn: boolean;
  user: User | null;

  // UI slice
  sidebarOpen: boolean;
  theme: "light" | "dark";

  // Data slice
  songs: Song[];
  playlists: Playlist[];

  // Actions
  signIn: (credentials: Credentials) => Promise<void>;
  toggleSidebar: () => void;
  setSongs: (songs: Song[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  isSignedIn: false,
  user: null,

  // UI
  sidebarOpen: true,
  theme: "light",

  // Data
  songs: [],
  playlists: [],

  // Auth actions
  signIn: async (credentials) => {
    const user = await authAPI.login(credentials);
    set({ isSignedIn: true, user });
  },

  // UI actions
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Data actions
  setSongs: (songs) => set({ songs }),
}));
```

**Note:** For very large stores (50+ fields), consider multiple stores instead.

## Async Operations

### Async Actions with Loading States

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

// Usage
function SongLibrary(): JSX.Element {
  const songs = useSongLibraryStore((state) => state.songs);
  const isLoading = useSongLibraryStore((state) => state.isLoading);
  const error = useSongLibraryStore((state) => state.error);
  const fetchSongs = useSongLibraryStore((state) => state.fetchSongs);

  useEffect(() => {
    fetchSongs(userId);
  }, [userId, fetchSongs]);

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return <SongList songs={songs} />;
}
```

### Optimistic Updates

```typescript
type PlaylistState = {
  playlists: Playlist[];
  addPlaylist: (name: string) => Promise<void>;
};

export const usePlaylistStore = create<PlaylistState>((set) => ({
  playlists: [],

  addPlaylist: async (name) => {
    // Optimistically update local state
    const tempId = Math.random().toString();
    set((state) => ({
      playlists: [...state.playlists, { id: tempId, name, songs: [] }],
    }));

    try {
      const newPlaylist = await playlistAPI.create(name);

      // Replace temp item with real one
      set((state) => ({
        playlists: state.playlists.map((p) =>
          p.id === tempId ? newPlaylist : p
        ),
      }));
    } catch (error) {
      // Revert on error
      set((state) => ({
        playlists: state.playlists.filter((p) => p.id !== tempId),
      }));

      throw error;
    }
  },
}));
```

## Middleware & Advanced Features

### DevTools Integration

```typescript
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const useCounterStore = create<CounterState>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
    }),
    { name: "counter-store" } // Name for DevTools
  )
);
```

**Benefit:** Debug state changes in browser DevTools with action history and time-travel debugging.

### Persist Middleware

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeState = {
  theme: "light" | "dark";
  toggleTheme: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
    }),
    {
      name: "theme-storage", // localStorage key
      partialize: (state) => ({ theme: state.theme }), // Only persist theme
    }
  )
);
```

**Benefit:** Automatically save state to localStorage, restore on page reload.

### Combine Middleware

```typescript
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { persist } from "zustand/middleware";

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set) => ({
        // ... store definition
      })),
      { name: "app-storage" }
    ),
    { name: "app-store" }
  )
);
```

**Order matters:** innermost to outermost: immer → persist → devtools.

## Real-World Pattern: Auth Store (SongShare)

```typescript
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type User = {
  id: string;
  email: string;
  name: string;
};

type AuthState = {
  // State
  isSignedIn: boolean;
  user: User | null;
  isLoading: boolean;
  error: Error | null;

  // Actions
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
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            throw new Error("Sign in failed");
          }

          const user = await response.json();
          set({ isSignedIn: true, user, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error : new Error("Unknown error"),
            isLoading: false,
          });
          throw error;
        }
      },

      signOut: () => {
        set({ isSignedIn: false, user: null });
        // Clear tokens, etc.
      },

      clearError: () => set({ error: null }),
    }),
    { name: "auth-store" }
  )
);
```

## Testing Zustand Stores

### Unit Testing

```typescript
import { renderHook, act } from "@testing-library/react";
import { useCounterStore } from "./counterStore";

describe("Counter Store", () => {
  beforeEach(() => {
    // Reset store before each test
    useCounterStore.setState({ count: 0 });
  });

  it("increments counter", () => {
    const { result } = renderHook(() => useCounterStore());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it("decrements counter", () => {
    const { result } = renderHook(() => useCounterStore());

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.decrement();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### Component Integration Testing

```typescript
import { render, screen } from "@testing-library/react";
import { useCounterStore } from "./counterStore";

function Counter() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}

describe("Counter Component", () => {
  beforeEach(() => {
    useCounterStore.setState({ count: 0 });
  });

  it("displays count and increments on button click", () => {
    render(<Counter />);

    expect(screen.getByText("Count: 0")).toBeInTheDocument();

    act(() => {
      screen.getByRole("button", { name: "Increment" }).click();
    });

    expect(screen.getByText("Count: 1")).toBeInTheDocument();
  });
});
```

## Best Practices

### ✅ DO

- **Use selectors** to avoid unnecessary re-renders
- **Keep stores focused** - one domain per store
- **Handle async carefully** - always track loading and error states
- **Use TypeScript** for type safety
- **Test stores independently** before using in components
- **Combine middleware** for persistence + DevTools

### ❌ DON'T

- **Don't mutate state directly** (unless using Immer)
- **Don't create a new store for every component** - use context for component-local state
- **Don't forget error handling** in async actions
- **Don't select whole store** when you only need a field
- **Don't over-engineer** - simple stores are fine for simple needs

## References

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Zustand Middleware](https://github.com/pmndrs/zustand#middleware)
- [Immer Integration](https://github.com/pmndrs/zustand#immer-middleware)
- [DevTools Integration](https://github.com/pmndrs/zustand#devtools)
