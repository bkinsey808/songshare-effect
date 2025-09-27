# Generating Effect-TS Schemas from Supabase

This guide shows you how to generate Effect-TS schemas from your Supabase database schema.

## Overview

The project includes scripts to automatically generate Effect-TS schemas from your Supabase database, providing:

- ✅ Type-safe database operations
- ✅ Automatic validation with Effect schemas
- ✅ Insert/Update variants for each table
- ✅ API response wrapper schemas
- ✅ Custom validation rules for common patterns

## Quick Start

### Method 1: Using the Shell Script (Recommended)

```bash
# Make sure you have SUPABASE_PROJECT_REF in your .env file
npm run generate:schemas
```

This will:

1. Generate TypeScript types from Supabase
2. Parse them into Effect schemas
3. Create `api/src/generated-schemas.ts`

### Method 2: Manual Steps

```bash
# 1. Generate Supabase types (requires .env with SUPABASE_PROJECT_REF)
dotenv -e .env -- sh -c 'npx supabase gen types typescript --project-id $SUPABASE_PROJECT_REF --schema public > temp-supabase-types.ts'

# 2. Generate Effect schemas
bun run scripts/generateEffectSchemas.ts

# 3. Clean up
rm temp-supabase-types.ts
```

## Generated Schema Structure

For each table, the script generates:

### 1. Base Schema

```typescript
export const UsersSchema = Schema.Struct({
	id: Schema.UUID,
	email: Schema.String.pipe(
		Schema.nonEmpty(),
		Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
	),
	name: Schema.optional(Schema.String.pipe(Schema.nonEmpty())),
	created_at: Schema.DateFromSelf,
	updated_at: Schema.DateFromSelf,
});

export type Users = Schema.Schema.Type<typeof UsersSchema>;
```

### 2. Insert Schema (excludes auto-generated fields)

```typescript
export const UsersInsertSchema = Schema.Struct({
	email: Schema.String.pipe(
		Schema.nonEmpty(),
		Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
	),
	name: Schema.optional(Schema.String.pipe(Schema.nonEmpty())),
});

export type UsersInsert = Schema.Schema.Type<typeof UsersInsertSchema>;
```

### 3. Update Schema (all fields optional except ID)

```typescript
export const UsersUpdateSchema = Schema.Struct({
	id: Schema.UUID,
	email: Schema.optional(
		Schema.String.pipe(
			Schema.nonEmpty(),
			Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
		),
	),
	name: Schema.optional(Schema.String.pipe(Schema.nonEmpty())),
});

export type UsersUpdate = Schema.Schema.Type<typeof UsersUpdateSchema>;
```

## Using Generated Schemas in Your API

```typescript
import { Schema } from "@effect/schema";

import { SongsSchema, UsersInsertSchema } from "./generated-schemas.js";

// Validate request data
const validateUserData = (data: unknown) =>
	Schema.decodeUnknownSync(UsersInsertSchema)(data);

// Use in Hono handlers
app.post("/users", async (c) => {
	const body = await c.req.json();

	// This will throw if validation fails
	const validUser = validateUserData(body);

	// Now you can safely use validUser with full type safety
	const newUser = await createUser(validUser);

	return c.json({ success: true, data: newUser });
});
```

## Customization

### Adding Custom Validation

After generation, you can enhance schemas with custom validation:

```typescript
// Add to generated-schemas.ts
export const EnhancedSongSchema = SongSchema.pipe(
	Schema.filter(
		(song) => {
			return song.duration > 0 && song.duration < 3600; // Max 1 hour
		},
		{ message: () => "Song duration must be between 0 and 3600 seconds" },
	),
);
```

### Handling Enums

If your database has enums, you might want to manually update them:

```typescript
// Replace generated string fields with proper enums
export const GenreSchema = Schema.Literal("rock", "pop", "jazz", "classical");

export const SongSchema = Schema.Struct({
	// ... other fields
	genre: Schema.optional(GenreSchema), // Instead of generic string
});
```

## Advanced Features

### JSON Column Handling

The script automatically handles JSON columns:

```typescript
// For a 'tags' JSON column, it generates:
tags: Schema.optional(Schema.Array(Schema.String));

// For other JSON columns:
metadata: Schema.optional(Schema.Unknown); // You can refine this
```

### Foreign Key Relationships

Foreign keys are detected and use UUID schemas:

```typescript
export const SongsSchema = Schema.Struct({
	id: Schema.UUID,
	user_id: Schema.UUID, // Detected as FK to users table
	// ...
});
```

## Configuration

### Environment Variables

Create a `.env` file with:

```env
SUPABASE_PROJECT_REF=your-project-ref-here
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Dependencies

The script requires:

- `supabase` CLI
- `dotenv-cli`
- `bun` runtime

Install missing dependencies:

```bash
npm install -g supabase dotenv-cli
```

## Troubleshooting

### "No tables found"

- Check your `.env` file has correct `SUPABASE_PROJECT_REF`
- Ensure your database has tables in the `public` schema
- Verify supabase CLI authentication: `supabase auth status`

### "Permission denied"

- Make the script executable: `chmod +x scripts/generate-effect-schemas.sh`

### Custom Types Not Recognized

- The script uses example schemas if it can't parse your Supabase types
- You may need to manually adjust complex types after generation

## Integration with Existing Code

You can gradually migrate from manual schemas to generated ones:

```typescript
// Before (manual schema)
export const CreateSongRequestSchema = Schema.Struct({
  title: Schema.NonEmptyString.pipe(Schema.trimmed()),
  artist: Schema.NonEmptyString.pipe(Schema.trimmed()),
  duration: Schema.Number.pipe(Schema.positive()),
});

// After (using generated schema)
import { SongsInsertSchema } from './generated-schemas.js';

// Use directly or extend as needed
export const CreateSongRequestSchema = SongsInsertSchema;
```

This workflow allows you to maintain type safety between your database, API validation, and client-side code while leveraging Effect's powerful schema system.
