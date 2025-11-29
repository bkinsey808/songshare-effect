---
description: Update database schema and regenerate types
---

# Update Database Schema

This workflow guides you through updating the database schema and regenerating TypeScript types.

## Steps

### 1. Create Migration File

Create a new migration file in `supabase/migrations/`:

```bash
# Create migration file with timestamp
# Format: YYYYMMDDHHMMSS_description.sql
# Example: 20240115120000_add_artist_table.sql

touch supabase/migrations/$(date +%Y%m%d%H%M%S)_your_description.sql
```

### 2. Write Migration SQL

Edit the migration file with your schema changes:

**Example - Add new table:**

```sql
-- Create artist table
CREATE TABLE IF NOT EXISTS public.artist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS (Row Level Security)
ALTER TABLE public.artist ENABLE ROW LEVEL SECURITY;

-- Create policy for visitor access (read-only)
CREATE POLICY "Anyone can view artists"
  ON public.artist
  FOR SELECT
  USING (true);

-- Create policy for authenticated users (full access)
CREATE POLICY "Authenticated users can manage artists"
  ON public.artist
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Add indexes
CREATE INDEX idx_artist_name ON public.artist(name);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.artist
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

**Example - Add column to existing table:**

```sql
-- Add artist_id to songs table
ALTER TABLE public.song
ADD COLUMN artist_id UUID REFERENCES public.artist(id);

-- Create index
CREATE INDEX idx_song_artist_id ON public.song(artist_id);
```

**Example - Modify column:**

```sql
-- Make title required
ALTER TABLE public.song
ALTER COLUMN title SET NOT NULL;
```

### 3. Run Migration Locally (Dry Run)

Test the migration against your local database first:

```bash
# Check what migrations will run
npm run supabase:migrate
```

Review the output carefully before proceeding.

### 4. Apply Migration

Apply the migration to your database:

```bash
npm run supabase:migrate
```

**If migration fails:**

1. Check the error message
2. Fix the SQL in the migration file
3. Rollback if needed (manually or create a new migration)
4. Run migration again

### 5. Export Updated Schema

Export the updated schema from the database:

// turbo

```bash
npm run supabase:export
```

This creates/updates `shared/src/generated/schema.sql`.

### 6. Generate TypeScript Types

Generate TypeScript types and Effect schemas from the updated schema:

// turbo

```bash
npm run supabase:generate
```

This updates:

- `shared/src/generated/database.types.ts` - TypeScript types
- `shared/src/generated/supabaseSchema.ts` - Effect schemas

### 7. Verify Generated Types

Check the generated files to ensure types are correct:

```bash
# View generated types
cat shared/src/generated/database.types.ts | grep -A 10 "export interface"

# Check Effect schemas
cat shared/src/generated/supabaseSchema.ts | grep -A 5 "export const"
```

### 8. Update Code to Use New Types

Update your code to use the new types:

```typescript
// Import the new type
import { type Artist } from "@/shared/generated/database.types";

// Use in your component or API
interface ArtistCardProps {
	artist: Artist;
}
```

### 9. Test Locally

// turbo

```bash
# Start dev servers
npm run dev

# Run tests
npm run test:unit
```

Test the changes in your application:

1. Check that queries work with new schema
2. Verify types are correct
3. Test RLS policies

### 10. Commit Changes

Commit the migration and generated files:

```bash
git add supabase/migrations/
git add shared/src/generated/
git commit -m "feat: add artist table and relationship"
```

## Common Migration Patterns

### Add Table with Relationships

```sql
CREATE TABLE public.album (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist_id UUID REFERENCES public.artist(id) ON DELETE CASCADE,
  release_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.album ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view albums"
  ON public.album FOR SELECT USING (true);
```

### Add Enum Type

```sql
-- Create enum type
CREATE TYPE public.song_status AS ENUM ('draft', 'published', 'archived');

-- Add column using enum
ALTER TABLE public.song
ADD COLUMN status public.song_status DEFAULT 'draft';
```

### Add Composite Index

```sql
CREATE INDEX idx_song_artist_status
ON public.song(artist_id, status)
WHERE status = 'published';
```

### Add Full Text Search

```sql
-- Add tsvector column
ALTER TABLE public.song
ADD COLUMN search_vector tsvector;

-- Create trigger to update search vector
CREATE TRIGGER song_search_vector_update
  BEFORE INSERT OR UPDATE ON public.song
  FOR EACH ROW
  EXECUTE FUNCTION
    tsvector_update_trigger(search_vector, 'pg_catalog.english', title, artist);

-- Create index
CREATE INDEX idx_song_search ON public.song USING GIN(search_vector);
```

### Add Trigger for Updated At

```sql
-- Create function (if not exists)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to table
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.artist
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

## Rollback Migration

If you need to rollback a migration, create a new migration that reverses the changes:

```sql
-- Rollback: Remove artist table
DROP TABLE IF EXISTS public.artist CASCADE;
```

**Important**: Never edit or delete existing migration files. Always create a new migration to make changes.

## Production Deployment

### Before Deploying:

1. ✅ Test migration locally
2. ✅ Review migration SQL carefully
3. ✅ Backup production database
4. ✅ Test rollback migration
5. ✅ Verify generated types are committed

### Deploy Migration:

```bash
# Run migration on production database
# (Usually done through Supabase dashboard or CI/CD)
```

### After Deploying:

1. ✅ Verify tables/columns exist
2. ✅ Test RLS policies
3. ✅ Check indexes are created
4. ✅ Monitor for errors

## Troubleshooting

### Migration Fails

```bash
# Check migration syntax
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f supabase/migrations/your_migration.sql

# View migration history
# (Check Supabase dashboard)
```

### Schema Export Fails

```bash
# Ensure pg_dump is installed
which pg_dump

# Check database connection
npm run supabase:keep-alive

# Try export again
npm run supabase:export
```

### Type Generation Fails

```bash
# Ensure schema.sql exists
ls -la shared/src/generated/schema.sql

# Re-export schema
npm run supabase:export

# Generate types
npm run supabase:generate
```

## References

- [Database Migrations Workflow](file:///home/bkinsey/bkinsey808/songshare-effect/.agent/workflows/database-migrations.md)
- [Supabase Migration Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
