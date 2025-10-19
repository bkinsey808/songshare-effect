#!/bin/bash

# Script to generate Effect-TS schemas from Supabase database
# This script combines Supabase type generation with Effect schema generation

set -e

echo "🚀 Generating Effect-TS schemas from Supabase..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with SUPABASE_PROJECT_REF"
    exit 1
fi

# Check if required packages are installed
if ! [ -f node_modules/.bin/supabase ]; then
    echo "❌ Supabase CLI not found. Install it with: npm install -D supabase"
    exit 1
fi

if ! [ -f node_modules/.bin/dotenv ]; then
    echo "❌ dotenv-cli not found. Install it with: npm install -D dotenv-cli"
    exit 1
fi

echo "📥 Generating Supabase TypeScript types..."
if npx dotenv -e .env -- sh -c 'npx supabase gen types typescript --project-id $SUPABASE_PROJECT_REF --schema public > temp-supabase-types.ts'; then
    echo "✅ Successfully generated Supabase types"
else
    echo "⚠️  Failed to generate Supabase types from remote database"
    echo "This could be due to:"
    echo "  • Temporary Supabase API issues"
    echo "  • Project not found or no public schema"
    echo "  • Network connectivity issues"
    echo ""
    echo "🔧 Falling back to example schemas..."
    rm -f temp-supabase-types.ts
fi

echo "⚡ Converting to Effect-TS schemas..."
bun run scripts/generateEffectSchemas.ts

if [ -f temp-supabase-types.ts ]; then
    echo "📁 Moving Supabase types to shared/generated directory..."
    # ensure the src/generated path exists under shared so tools that expect shared/src/generated can find it
    mkdir -p shared/src/generated
    mv temp-supabase-types.ts shared/src/generated/supabaseTypes.ts

    echo "🔧 Running ESLint fix on generated types (shared/src/generated)..."
    npx eslint shared/src/generated/supabaseTypes.ts --fix || true

    echo "  • shared/src/generated/supabaseTypes.ts (Raw Supabase types)"
    
    # Format generated files with Prettier to ensure consistent styling (non-fatal)
    if command -v npx >/dev/null 2>&1; then
        echo "🔧 Running Prettier on generated files..."
        # ensure final destination exists and move schemas into the same src/generated dir
        mkdir -p shared/src/generated
        if [ -f shared/generated/supabaseSchemas.ts ]; then
            mv shared/generated/supabaseSchemas.ts shared/src/generated/supabaseSchemas.ts
        fi

        npx prettier --write shared/src/generated/supabaseSchemas.ts shared/src/generated/supabaseTypes.ts || true
    fi
else
    echo "📁 No types file to move (using fallback schemas)"
fi

echo "✅ Effect-TS schemas generated successfully!"
echo "📁 Generated files:"
echo "  • shared/src/generated/supabaseSchemas.ts (Effect schemas)"
echo ""
echo "Next steps:"
echo "  1. Review and adjust the generated schemas"
echo "  2. Import them in your API and frontend code"
echo "  3. Replace manual schema definitions where appropriate"