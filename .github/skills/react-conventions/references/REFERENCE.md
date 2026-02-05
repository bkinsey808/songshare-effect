# React Conventions Reference

Technical reference for React Compiler patterns, hooks, state management, styling, and component composition.

## React Compiler Behavior

### What React Compiler Optimizes

The React Compiler automatically memoizes:

- **Function definitions** - Functions are cached unless inputs change
- **Object literals** - Objects with same shape/values are identity-equal
- **Dependency arrays** - Component properly skips re-renders when dependencies don't change
- **Conditional branches** - Only necessary branches re-execute

### Anti-Patterns (Performance Regressions)

```typescript
// ❌ BAD: Compiler can't optimize through manual memo
const Component = memo(() => {
  return <div>content</div>;
});

// ✅ GOOD: Plain function - compiler optimizes automatically
function Component() {
  return <div>content</div>;
}
```

```typescript
// ❌ BAD: useCallback defeats compiler optimization
const handleClick = useCallback(() => {
  console.log("clicked");
}, []);

// ✅ GOOD: Plain function - compiler memoizes it
function handleClick() {
  console.log("clicked");
}
```

```typescript
// ❌ BAD: useMemo adds unnecessary abstraction
const computedValue = useMemo(() => {
  return expensive(input);
}, [input]);

// ✅ GOOD: Direct call - compiler optimizes the computation
const computedValue = expensive(input);
```

### When Breaking the Rule Is Justified

Only if **profiling proves** performance regression:

```typescript
// Document the regression and include profiling evidence
// GitHub issue #123: Component re-renders 5x without memoization
const MemoizedComponent = memo(ExpensiveComponent);
```

## Hook Patterns Reference

### useState - Component Local State

```typescript
function LoginForm(): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await loginAPI(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button disabled={isLoading}>{isLoading ? "Loading..." : "Sign In"}</button>
    </form>
  );
}
```

### useEffect - Side Effects & Subscriptions

```typescript
// Data fetching
useEffect(() => {
  let isMounted = true;

  const loadData = async () => {
    const data = await fetchSongs(userId);
    if (isMounted) {
      setData(data);
    }
  };

  loadData();

  return () => {
    isMounted = false; // Cleanup prevents state updates after unmount
  };
}, [userId]); // Re-run when userId changes
```

```typescript
// Event listener subscription
useEffect(() => {
  const handleResize = () => {
    setWidth(window.innerWidth);
  };

  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize); // Always clean up
  };
}, []); // Run once on mount
```

```typescript
// Realtime subscription
useEffect(() => {
  const channel = supabaseClient
    .channel("song_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "song" }, (payload) => {
      setData((prev) => [...prev, payload.new]);
    })
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, [supabaseClient]);
```

### useContext - Share State Without Drilling

```typescript
// Create context
const ThemeContext = createContext<"light" | "dark">("light");

// Provider component
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

// Consume context
function Button(): JSX.Element {
  const theme = useContext(ThemeContext);
  return (
    <button className={`btn-${theme}`}>
      Click me
    </button>
  );
}
```

### useRef - Mutable Values

```typescript
// Form validation without re-render
function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    inputRef.current?.focus();
  };

  return (
    <>
      <input ref={inputRef} />
      <button onClick={handleFocus}>Focus input</button>
    </>
  );
}
```

```typescript
// Timer management
function Stopwatch() {
  const timerRef = useRef<number | null>(null);
  const [seconds, setSeconds] = useState(0);

  const start = () => {
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  };

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div>
      <p>{seconds}s</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}
```

### useId - Unique Identifiers

```typescript
function PasswordInput() {
  const id = useId(); // Unique per component instance

  return (
    <>
      <label htmlFor={id}>Password</label>
      <input id={id} type="password" />
    </>
  );
}
```

### Custom Hooks

```typescript
// Reusable hook for data fetching
function useSongLibrary(userId: string | undefined): { songs: Song[]; loading: boolean; error: Error | null } {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);

    fetchSongs(userId)
      .then((data) => {
        setSongs(data);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setSongs([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [userId]);

  return { songs, isLoading, error };
}

// Usage in component
function LibraryPage() {
  const userId = useAppStore((state) => state.user?.id);
  const { songs, isLoading, error } = useSongLibrary(userId);

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {songs.map((song) => (
        <SongCard key={song.id} song={song} />
      ))}
    </div>
  );
}
```

## State Management with Zustand

### Create a Store

```typescript
import { create } from "zustand";

type AuthState = {
  isSignedIn: boolean;
  user: User | null;
  setIsSignedIn: (value: boolean) => void;
  setUser: (user: User | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isSignedIn: false,
  user: null,
  setIsSignedIn: (isSignedIn) => set({ isSignedIn }),
  setUser: (user) => set({ user }),
  clear: () => set({ isSignedIn: false, user: null }),
}));
```

### Use in Components

```typescript
function UserMenu() {
  const { isSignedIn, user, setIsSignedIn } = useAuthStore();

  const handleSignOut = async () => {
    await signOutAPI();
    setIsSignedIn(false);
  };

  if (!isSignedIn) {
    return <SignInButton />;
  }

  return (
    <menu>
      <span>{user?.email}</span>
      <button onClick={handleSignOut}>Sign Out</button>
    </menu>
  );
}
```

### Selector Pattern (Avoid Unnecessary Re-renders)

```typescript
// ❌ BAD: Whole store causes re-render
const user = useAuthStore(); // Re-renders on any state change

// ✅ GOOD: Select only needed value
const isSignedIn = useAuthStore((state) => state.isSignedIn);
const user = useAuthStore((state) => state.user);
```

## Styling with Tailwind CSS

### Utility Classes

```typescript
// Standard pattern: responsive prefixes, state variants
function Card({ title, children }: CardProps): JSX.Element {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="mt-4 text-gray-600">{children}</div>
    </div>
  );
}
```

### Dynamic Styling with clsx

```typescript
import { clsx } from "clsx";

function Badge({ variant, children }: BadgeProps) {
  const variantStyles = {
    primary: "bg-blue-500 text-white",
    secondary: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={clsx(
        "inline-block px-3 py-1 rounded-full text-sm font-medium",
        variantStyles[variant]
      )}
    >
      {children}
    </span>
  );
}
```

### Responsive Breakpoints

```typescript
function ResponsiveGrid({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

// Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
```

## Component Composition Patterns

### Compound Components

```typescript
// Parent manages state, children render UI
function Accordion({ items }: AccordionProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          id={item.id}
          title={item.title}
          isActive={activeId === item.id}
          onToggle={() => setActiveId(activeId === item.id ? null : item.id)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}

function AccordionItem({
  id,
  title,
  isActive,
  onToggle,
  children,
}: AccordionItemProps) {
  return (
    <div className="border border-gray-200 rounded">
      <button
        onClick={onToggle}
        className="w-full p-4 font-semibold text-left hover:bg-gray-50"
      >
        {title}
      </button>
      {isActive && <div className="p-4 border-t border-gray-200">{children}</div>}
    </div>
  );
}
```

### Render Props Pattern

```typescript
type ListProps<T> = {
  items: T[];
  render: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
};

function List<T>({ items, render, keyExtractor }: ListProps<T>) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={keyExtractor(item)}>{render(item)}</li>
      ))}
    </ul>
  );
}

// Usage
function SongLibrary({ songs }: { songs: Song[] }) {
  return (
    <List
      items={songs}
      keyExtractor={(song) => song.id}
      render={(song) => (
        <div className="p-4 border rounded">
          <h3>{song.title}</h3>
          <p>{song.artist}</p>
        </div>
      )}
    />
  );
}
```

### Higher-Order Component (Rare, for Cross-Cutting Concerns)

```typescript
// Only use when absolutely necessary (e.g., class component wrapping)
function withAuth<P extends object>(Component: ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    const isSignedIn = useAuthStore((state) => state.isSignedIn);

    if (!isSignedIn) {
      return <SignInPrompt />;
    }

    return <Component {...props} />;
  };
}

// Usage (rarely needed with hooks)
export default withAuth(UserDashboard);
```

## Performance Patterns

### Code Splitting with lazy & Suspense

```typescript
const HeavyDashboard = lazy(() => import("./pages/Dashboard"));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyDashboard />
    </Suspense>
  );
}
```

### Virtual Scrolling for Long Lists

```typescript
import { FixedSizeList } from "react-window";

function VirtualizedSongList({ songs }: { songs: Song[] }) {
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style} className="p-2 border-b">
      {songs[index]?.title}
    </div>
  );

  return <FixedSizeList height={600} itemCount={songs.length} itemSize={50}>{Row}</FixedSizeList>;
}
```

## References

- [React Compiler Documentation](https://react.dev/blog/2024/10/21/react-compiler-beta)
- [React Hooks API Reference](https://react.dev/reference/react/hooks)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tailwind CSS Utilities](https://tailwindcss.com/docs/utility-first)
