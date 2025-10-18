#!/bin/bash

echo "🎯 MCP Console Log Reading Demonstration"
echo "========================================"
echo ""
echo "This simulates what MCP sees when connected to Chrome DevTools Protocol:" 
echo ""
echo "🔗 Connecting to Chrome DevTools..."
echo "   WebSocket URL: ws://127.0.0.1:9222/devtools/page/xyz123"
echo "   ✅ Connected successfully"
echo ""
echo "📡 Enabling console message capture..."
echo "   ✅ Runtime.enable sent"
echo "   ✅ Console.enable sent"
echo ""
echo "🎯 Live Console Messages (as MCP would see them):"
echo "================================================="

messages=(
    "📝 Console [LOG]: 🎯 MCP Test: Basic log message"
    "📝 Console [LOG]: 🔒 MCP Test: Auth token check null"
    "📝 Console [WARN]: ⚠️ MCP Test: Warning message"
    "📝 Console [ERROR]: ❌ MCP Test: Error message"
)

for message in "${messages[@]}"; do
    echo "$(date '+%H:%M:%S.%3N') $message"
    sleep 0.8
done
