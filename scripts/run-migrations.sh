#!/bin/bash
# Script to run pending migrations algorithmically

set -e

echo "🚀 Running SongShare migrations..."

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "❌ .env file not found"
    exit 1
fi

# Check for required environment variables
if [ -z "$PGHOST" ] || [ -z "$PGUSER" ] || [ -z "$PGPASSWORD" ] || [ -z "$PGDATABASE" ]; then
    echo "❌ Missing required PostgreSQL environment variables"
    echo "Required: PGHOST, PGUSER, PGPASSWORD, PGDATABASE"
    exit 1
fi

# Function to run a single migration file
run_migration() {
    local migration_file="$1"
    echo "📄 Running migration: $(basename "$migration_file")"
    
    if PGPASSWORD="$PGPASSWORD" psql \
        -h "$PGHOST" \
        -U "$PGUSER" \
        -d "$PGDATABASE" \
        -f "$migration_file"; then
        echo "✅ Migration successful: $(basename "$migration_file")"
    else
        echo "❌ Migration failed: $(basename "$migration_file")"
        exit 1
    fi
}

# Get all migration files in chronological order
migration_dir="supabase/migrations"
if [ ! -d "$migration_dir" ]; then
    echo "❌ Migration directory not found: $migration_dir"
    exit 1
fi

# Find all .sql files and sort them
migration_files=$(find "$migration_dir" -name "*.sql" -type f | sort)

if [ -z "$migration_files" ]; then
    echo "ℹ️  No migration files found in $migration_dir"
    exit 0
fi

echo "📋 Found migrations:"
echo "$migration_files" | while read -r file; do
    echo "  - $(basename "$file")"
done

echo ""

# Run each migration
echo "$migration_files" | while read -r migration_file; do
    run_migration "$migration_file"
done

echo ""
echo "🎉 All migrations completed successfully!"

# Regenerate schemas after migration
echo "🔄 Regenerating TypeScript schemas..."
if command -v npm > /dev/null 2>&1; then
    npm run supabase:generate || echo "⚠️  Schema generation failed (continuing anyway)"
else
    echo "⚠️  npm not found, skipping schema generation"
fi

echo "✅ Migration process complete!"