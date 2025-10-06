#!/bin/bash

# Start Supabase MCP Server for Development
# This script starts the Supabase MCP server with your project's environment

echo "🚀 Starting Supabase MCP Server for songshare-effect"
echo "================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Load environment variables
if [ -f ".env" ]; then
    echo "📋 Loading environment variables from .env"
    source .env
else
    echo "⚠️  Warning: .env file not found. Using system environment variables."
fi

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please ensure your .env file or environment contains:"
    echo "  SUPABASE_URL=your_supabase_url"
    echo "  SUPABASE_ANON_KEY=your_supabase_anon_key"
    exit 1
fi

echo "🔗 Supabase URL: $SUPABASE_URL"
echo "🔑 Using provided authentication keys"
echo "🌟 Starting MCP server..."
echo ""
echo "💡 The server will provide tools for:"
echo "   • Database schema management"
echo "   • Table operations (CRUD)"
echo "   • Edge Functions deployment"
echo "   • Real-time subscriptions"
echo ""
echo "Press Ctrl+C to stop the server"
echo "================================================="

# Start the MCP server with environment variables
export SUPABASE_URL="$SUPABASE_URL"
export SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    export SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
fi

# Run the MCP server
npx @supabase-community/supabase-mcp