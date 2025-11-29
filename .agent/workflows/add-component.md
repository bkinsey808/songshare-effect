---
description: Add a new React component
---

# Add a New React Component

This workflow guides you through creating a new React component following project conventions.

## Steps

### 1. Determine Component Location

Choose the appropriate directory based on component purpose:

- **Page component**: `react/src/pages/[ComponentName].tsx`
- **Song-related**: `react/src/song/[ComponentName].tsx`
- **Form component**: `react/src/form/[ComponentName].tsx`
- **Design system**: `react/src/design-system/[ComponentName].tsx`
- **Auth component**: `react/src/auth/[ComponentName].tsx`
- **Reusable utility**: `react/src/components/[ComponentName].tsx` (create if needed)

### 2. Create Component File

Create the component file with proper naming:

- Use PascalCase for file names (e.g., `SongCard.tsx`, `LoginForm.tsx`)
- One main component per file

### 3. Component Structure

Follow this template:

```typescript
// React imports
import { useState, useEffect, useId } from 'react';

// Third-party imports
import { useNavigate } from 'react-router-dom';

// Internal imports (use path aliases)
import { type Song } from '@/shared/generated/database.types';
import { apiSongPath } from '@/shared/paths';

// Component props interface
export interface SongCardProps {
  song: Song;
  onEdit?: (song: Song) => void;
  className?: string;
}

// Main component
export function SongCard({ song, onEdit, className }: SongCardProps) {
  // 1. Hooks at the top
  const id = useId();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  // 2. Effects
  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    };
  }, [/* dependencies */]);

  // 3. Event handlers
  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  // 4. Render
  return (
    <div className={className}>
      {/* Component JSX */}
    </div>
  );
}
```

### 4. Follow Project Conventions

#### ✅ DO:

- Use TypeScript with proper typing
- Export named exports (not default)
- Use React hooks (useState, useEffect, useId, etc.)
- Import types with `type` keyword: `import { type Song } from '...'`
- Use path aliases: `@/shared/`, `@/react/`, `@/api/`
- Import directly from source files (no barrel files)
- Use Tailwind CSS for styling
- Add proper TypeScript interfaces for props

#### ❌ DON'T:

- Don't use `useCallback`, `useMemo`, or `memo` (React Compiler handles optimization)
- Don't create barrel files (`index.ts` re-exports)
- Don't use `any` types
- Don't use default exports
- Don't add JSDoc type annotations in `.tsx` files

### 5. Add Unit Tests (Optional but Recommended)

Create test file next to component:

```bash
# If component is at:
react/src/song/SongCard.tsx

# Create test at:
react/src/song/SongCard.test.tsx
```

Test template:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SongCard, type SongCardProps } from './SongCard';

describe('SongCard', () => {
  const mockSong: Song = {
    id: '1',
    title: 'Test Song',
    // ... other required fields
  };

  const defaultProps: SongCardProps = {
    song: mockSong,
  };

  it('renders song title', () => {
    render(<SongCard {...defaultProps} />);
    expect(screen.getByText('Test Song')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<SongCard {...defaultProps} onEdit={onEdit} />);

    // Test interaction
    const editButton = screen.getByRole('button', { name: /edit/i });
    editButton.click();

    expect(onEdit).toHaveBeenCalledWith(mockSong);
  });
});
```

### 6. Run Tests

// turbo

```bash
npm run test:unit
```

### 7. Lint and Format

// turbo

```bash
npm run lint:fix
npm run format
```

### 8. Use the Component

Import and use in other components:

```typescript
// ✅ Correct - Direct import
import { SongCard } from '@/react/song/SongCard';

function SongList() {
  return (
    <div>
      <SongCard song={song} />
    </div>
  );
}
```

## Example: Complete Component

Here's a complete example following all conventions:

```typescript
import { useState } from 'react';
import { type Song } from '@/shared/generated/database.types';

export interface SongCardProps {
  song: Song;
  onPlay?: (songId: string) => void;
  className?: string;
}

export function SongCard({ song, onPlay, className = '' }: SongCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = () => {
    setIsPlaying(!isPlaying);
    onPlay?.(song.id);
  };

  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <h3 className="text-lg font-semibold">{song.title}</h3>
      {song.artist && (
        <p className="text-sm text-gray-600">{song.artist}</p>
      )}
      <button
        onClick={handlePlayClick}
        className="mt-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        type="button"
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}
```

## Common Patterns

### With Form State

```typescript
import { useState } from 'react';

export function FormComponent() {
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (/* form JSX */);
}
```

### With API Calls

```typescript
import { useEffect, useState } from 'react';
import { type Song } from '@/shared/generated/database.types';

export function SongList() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSongs() {
      try {
        const response = await fetch('/api/songs');
        const data = await response.json();
        setSongs(data);
      } catch (error) {
        console.error('Failed to fetch songs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSongs();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (/* render songs */);
}
```

### With Routing

```typescript
import { useNavigate, useParams } from 'react-router-dom';

export function SongDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/songs');
  };

  return (/* component JSX */);
}
```

## References

- [Component Documentation](file:///home/bkinsey/bkinsey808/songshare-effect/docs/component-patterns.md)
- [Project Rules](file:///home/bkinsey/bkinsey808/songshare-effect/.agent/rules.md)
- [React Documentation](https://react.dev/)
