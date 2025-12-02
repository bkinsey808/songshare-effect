# Component Patterns

Best practices and patterns for building React components in the SongShare Effect project.

## Core Principles

1. **React Compiler Ready** - No manual memoization
2. **TypeScript First** - Strong typing with proper interfaces
3. **Direct Imports** - No barrel files
4. **Colocation** - Keep related code together
5. **Accessibility** - Follow WCAG guidelines

## Basic Component Structure

### Minimal Component

```typescript
import { type ReactNode } from 'react';

export interface CardProps {
  title: string;
  children?: ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}
```

### With State

```typescript
import { useState } from 'react';

export interface ToggleProps {
  initialValue?: boolean;
  onChange?: (value: boolean) => void;
}

export function Toggle({ initialValue = false, onChange }: ToggleProps) {
  const [isOn, setIsOn] = useState(initialValue);

  const handleToggle = () => {
    const newValue = !isOn;
    setIsOn(newValue);
    onChange?.(newValue);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`rounded px-4 py-2 ${isOn ? 'bg-blue-500' : 'bg-gray-300'}`}
    >
      {isOn ? 'ON' : 'OFF'}
    </button>
  );
}
```

## Common Patterns

### Form Component

```typescript
import { useState } from 'react';
import { type Song } from '@/shared/generated/database.types';

export interface SongFormProps {
  initialData?: Partial<Song>;
  onSubmit: (data: SongFormData) => void;
  onCancel?: () => void;
}

export interface SongFormData {
  title: string;
  artist: string;
  lyrics: string;
}

export function SongForm({ initialData, onSubmit, onCancel }: SongFormProps) {
  const [formData, setFormData] = useState<SongFormData>({
    title: initialData?.title ?? '',
    artist: initialData?.artist ?? '',
    lyrics: initialData?.lyrics ?? '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded border p-2"
        />
      </div>

      <div>
        <label htmlFor="artist" className="block text-sm font-medium">
          Artist
        </label>
        <input
          type="text"
          id="artist"
          name="artist"
          value={formData.artist}
          onChange={handleChange}
          className="mt-1 block w-full rounded border p-2"
        />
      </div>

      <div>
        <label htmlFor="lyrics" className="block text-sm font-medium">
          Lyrics
        </label>
        <textarea
          id="lyrics"
          name="lyrics"
          value={formData.lyrics}
          onChange={handleChange}
          rows={10}
          className="mt-1 block w-full rounded border p-2"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Save
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
```

### Data Fetching Component

```typescript
import { useEffect, useState } from 'react';
import { type Song } from '@/shared/generated/database.types';

export interface SongListProps {
  userId?: string;
}

export function SongList({ userId }: SongListProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchSongs() {
      try {
        setLoading(true);
        const url = userId
          ? `/api/songs?userId=${userId}`
          : '/api/songs';

        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error('Failed to fetch songs');
        }

        const data = await response.json();
        setSongs(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchSongs();

    // Cleanup: abort any in-flight fetch when component unmounts
    return () => controller.abort();
  }, [userId]);

  if (loading) {
    return <div className="p-4">Loading songs...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading songs: {error}
      </div>
    );
  }

  if (songs.length === 0) {
    return <div className="p-4">No songs found.</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {songs.map((song) => (
        <SongCard key={song.id} song={song} />
      ))}
    </div>
  );
}
```

### Component with Refs

```typescript
import { useRef, useEffect } from 'react';

export interface AutoFocusInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AutoFocusInput({
  value,
  onChange,
  placeholder
}: AutoFocusInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="rounded border p-2"
    />
  );
}
```

### Component with useId

```typescript
import { useId } from 'react';

export interface LabeledInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password';
}

export function LabeledInput({
  label,
  value,
  onChange,
  type = 'text'
}: LabeledInputProps) {
  const id = useId();

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded border p-2"
      />
    </div>
  );
}
```

### Compound Component Pattern

```typescript
import { type ReactNode, createContext, useContext, useState } from 'react';

// Context for sharing state between compound components
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within Tabs');
  }
  return context;
}

// Main Tabs component
export interface TabsProps {
  defaultTab: string;
  children: ReactNode;
}

export function Tabs({ defaultTab, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="rounded border">
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// Tab List component
export interface TabListProps {
  children: ReactNode;
}

export function TabList({ children }: TabListProps) {
  return (
    <div className="flex border-b">
      {children}
    </div>
  );
}

// Tab component
export interface TabProps {
  value: string;
  children: ReactNode;
}

export function Tab({ value, children }: TabProps) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 ${
        isActive
          ? 'border-b-2 border-blue-500 font-semibold'
          : 'text-gray-600'
      }`}
    >
      {children}
    </button>
  );
}

// Tab Panel component
export interface TabPanelProps {
  value: string;
  children: ReactNode;
}

export function TabPanel({ value, children }: TabPanelProps) {
  const { activeTab } = useTabs();

  if (activeTab !== value) {
    return null;
  }

  return <div className="p-4">{children}</div>;
}

// Usage:
function MyTabs() {
  return (
    <Tabs defaultTab="songs">
      <TabList>
        <Tab value="songs">Songs</Tab>
        <Tab value="artists">Artists</Tab>
        <Tab value="albums">Albums</Tab>
      </TabList>
      <TabPanel value="songs">
        <SongList />
      </TabPanel>
      <TabPanel value="artists">
        <ArtistList />
      </TabPanel>
      <TabPanel value="albums">
        <AlbumList />
      </TabPanel>
    </Tabs>
  );
}
```

## Styling Patterns

### Using Tailwind CSS

```typescript
// Basic classes
<div className="rounded-lg border p-4 shadow-md">

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Conditional classes
<button
  className={`px-4 py-2 ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`}
>

// Dark mode support
<div className="bg-white text-black dark:bg-gray-900 dark:text-white">
```

### Dynamic Classes with clsx

```typescript
import clsx from 'clsx';

export function Button({ variant, size, className }) {
  return (
    <button
      className={clsx(
        'rounded font-medium',
        {
          'bg-blue-500 text-white': variant === 'primary',
          'bg-gray-300 text-black': variant === 'secondary',
          'px-2 py-1 text-sm': size === 'small',
          'px-4 py-2': size === 'medium',
          'px-6 py-3 text-lg': size === 'large',
        },
        className
      )}
    >
      Click me
    </button>
  );
}
```

## Accessibility Patterns

### Keyboard Navigation

```typescript
export function Dialog({ isOpen, onClose, children }) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      {children}
    </div>
  );
}
```

### ARIA Labels

```typescript
export function IconButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded p-2 hover:bg-gray-100"
    >
      {icon}
    </button>
  );
}
```

## Testing Patterns

See [Add Component Workflow](file:///home/bkinsey/bkinsey808/songshare-effect/.agent/workflows/add-component.md) for testing examples.

## Anti-Patterns to Avoid

### ❌ Don't Use Manual Memoization

```typescript
// ❌ Wrong - React Compiler handles this
import { useCallback, useMemo, memo } from "react";

const MemoizedComponent = memo(Component);

const handleClick = useCallback(() => {
	// ...
}, [deps]);

const value = useMemo(() => expensiveCalculation(), [deps]);
```

```typescript
// ✅ Correct - Let React Compiler optimize
function Component({ onClick }) {
	const handleClick = () => {
		// ...
	};

	const value = expensiveCalculation();

	// React Compiler will optimize automatically
}
```

#### When manual memoization is OK

Although the project prefers to let the React Compiler handle memoization, there are valid exceptions:
- When profiling shows a clear bottleneck and memoization reduces rendering work in a measurable way.
- When integrating with third-party libraries that rely on stable callback references (but prefer alternatives like stable handlers in the library API first).
- In isolated demo pages or performance experiments where the cost/benefit is explicit.

If you add manual memoization (useMemo/useCallback/memo), include a short comment explaining why this is necessary and link to the performance trace or test.

### ❌ Don't Use Barrel Files

```typescript
// ❌ Wrong - No index.ts re-exports
// components/index.ts
export { Button } from "./Button";
export { Card } from "./Card";
```

```typescript
// ✅ Correct - Direct imports
import { Button } from "@/react/components/Button";
import { Card } from "@/react/components/Card";
```

### ❌ Don't Use any Types

```typescript
// ❌ Wrong
function handleData(data: any) {
	// ...
}
```

```typescript
// ✅ Correct
import { type Song } from "@/shared/generated/database.types";

function handleData(data: Song) {
	// ...
}
```

#### Allowed `any` exceptions

The repo tries to avoid `any`, but there are a few legitimate cases where constrained use is acceptable:
- Interacting with poorly typed third-party libraries (localize casts; keep them tiny and contained).
- Complex runtime decoding paths or schema-handling utilities where narrowing to `unknown` then validating is preferable; when `any` is unavoidable, contain it inside a small utility and add a comment describing the narrowing strategy.

Prefer `unknown` and runtime checks over `any` where possible.

## References

- [Project Rules](file:///home/bkinsey/bkinsey808/songshare-effect/.agent/rules.md)
- [Add Component Workflow](file:///home/bkinsey/bkinsey808/songshare-effect/.agent/workflows/add-component.md)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
