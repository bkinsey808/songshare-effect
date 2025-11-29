---
description: Run database migrations and schema operations
---

# Database Migrations and Schema

This workflow covers Supabase database migrations and schema generation.

## Run All Migrations

1. Execute all pending migrations:

```bash
npm run supabase:migrate
```

This runs the shell script `./scripts/run-migrations.sh`.

## Run Single Migration

2. Run a specific migration file:

```bash
npm run supabase:migrate:single path/to/migration.sql
```

## TypeScript Migrations

3. Run migrations using TypeScript:

```bash
npm run supabase:migrate:ts
```

## Generate Effect Schemas

4. Generate TypeScript Effect schemas from the database:

```bash
npm run supabase:generate
```

This runs `scripts/build/generate-effect-schemas/generate-effect-schemas.ts` to create type-safe schemas.

## Export Database Schema

5. Export the current database schema to SQL:

```bash
npm run supabase:export
```

This exports the schema to `shared/src/generated/schema.sql`.

## Keep Database Connection Alive

6. Keep the Supabase database connection alive (for development):

```bash
npm run supabase:keep-alive
```

## Environment Variables

Make sure your `.env` file contains:

- `PGHOST` - Database host
- `PGUSER` - Database user
- `PGDATABASE` - Database name
- `PGPASSWORD` - Database password (if required)
