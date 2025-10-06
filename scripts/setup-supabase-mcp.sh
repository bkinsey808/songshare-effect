#!/bin/bash

# Setup script for Supabase MCP Server
# This script helps configure the Supabase MCP server as a standalone development tool

echo "🚀 Setting up Supabase MCP Server for songshare-effect project"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create one with your Supabase credentials"
    echo "Required environment variables:"
    echo "  SUPABASE_URL=your_supabase_url"
    echo "  SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo "  SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key (optional, for admin operations)"
    exit 1
fi

# Install the Supabase MCP server as a project dependency
echo "📦 Installing Supabase MCP Server..."
npm install --save-dev @supabase-community/supabase-mcp

# Load environment variables
if [ -f ".env" ]; then
    source .env
fi

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please ensure your .env file contains:"
    echo "  SUPABASE_URL=your_supabase_url"
    echo "  SUPABASE_ANON_KEY=your_supabase_anon_key"
    exit 1
fi

# Create a configuration file for the MCP server
echo "⚙️  Creating MCP server configuration..."

cat > "mcp-supabase-config.json" << EOF
{
  "name": "supabase-mcp-server",
  "description": "Supabase MCP server for songshare-effect project",
  "version": "1.0.0",
  "server": {
    "command": "npx",
    "args": ["@supabase-community/supabase-mcp"],
    "env": {
      "SUPABASE_URL": "$SUPABASE_URL",
      "SUPABASE_ANON_KEY": "$SUPABASE_ANON_KEY"$([ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && echo ",
      \"SUPABASE_SERVICE_ROLE_KEY\": \"$SUPABASE_SERVICE_ROLE_KEY\"")
    }
  },
  "capabilities": [
    "Database schema management",
    "Table creation and modification",
    "Data querying and manipulation",
    "Edge Functions deployment",
    "Real-time subscriptions"
  ]
}
EOF

echo "✅ Supabase MCP Server setup complete!"
echo ""
echo "📝 Configuration created: mcp-supabase-config.json"
echo ""
echo "🔧 Usage options:"
echo ""
echo "1. 🏃 Run as standalone server:"
echo "   npm run supabase:mcp"
echo ""
echo "2. 🔗 Connect with VS Code extensions that support MCP"
echo "3. 🛠️  Use with other MCP-compatible development tools"
echo "4. 🌐 Run as HTTP server for web-based MCP clients"
echo ""
echo "🚀 Available Supabase MCP capabilities:"
echo "   • Create and manage database tables"
echo "   • Query data with natural language"
echo "   • Deploy and manage Edge Functions"
echo "   • Schema management and migrations"
echo "   • Real-time database subscriptions"
echo ""
echo "💡 Since you're using GitHub Copilot, you can:"
echo "   • Use the MCP server to programmatically manage your Supabase database"
echo "   • Integrate it with VS Code workflows"
echo "   • Build custom tooling that leverages the MCP interface"
echo "   • Use it for database operations in your development scripts"
echo ""
echo "🎯 Try running: npm run supabase:mcp"