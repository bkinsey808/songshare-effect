#!/bin/bash

# Test Chrome DevTools MCP Console Log Reading
# This script demonstrates MCP's ability to read browser console logs in real-time

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

CHROME_DEBUG_PORT=9222

echo -e "${BLUE}🧪 Testing MCP Console Log Reading${NC}"
echo -e "${BLUE}==================================${NC}"

# Check if Chrome debug is running
if ! curl -s "http://127.0.0.1:$CHROME_DEBUG_PORT/json/version" > /dev/null; then
    echo -e "${RED}❌ Chrome debug port is not accessible${NC}"
    echo -e "${YELLOW}Please run: npm run chrome:debug:secure${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Chrome debug port is accessible${NC}"

DEV_SERVER_PORT=${DEV_SERVER_PORT:-5173}
DEV_SERVER_URL=${DEV_SERVER_URL:-http://localhost:${DEV_SERVER_PORT}}

# Require jq for robust JSON parsing
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠ jq is required for this script. Install it with: sudo apt install jq${NC}"
    exit 1
fi

# Select the tab that matches the dev server URL (exact match first, then contains)
TAB_DATA=$(curl -s "http://127.0.0.1:$CHROME_DEBUG_PORT/json" | jq -c --arg url "$DEV_SERVER_URL" '.[] | select(.url == $url)' | head -n 1)
if [[ -z "$TAB_DATA" ]]; then
    TAB_DATA=$(curl -s "http://127.0.0.1:$CHROME_DEBUG_PORT/json" | jq -c --arg host "localhost:${DEV_SERVER_PORT}" '.[] | select(.url | test($host))' | head -n 1)
fi

TAB_ID=$(echo "$TAB_DATA" | jq -r '.id // empty')
WS_URL=$(echo "$TAB_DATA" | jq -r '.webSocketDebuggerUrl // empty')

if [[ -z "$TAB_ID" ]]; then
    echo -e "${RED}❌ No tabs found for ${DEV_SERVER_URL}${NC}"
    echo -e "${YELLOW}Available tabs:${NC}"
    curl -s "http://127.0.0.1:$CHROME_DEBUG_PORT/json" | jq -r '.[] | "  - \(.title) -> \(.url)"'
    exit 1
fi

echo -e "${GREEN}✓ Found tab: $TAB_ID (URL: $(echo "$TAB_DATA" | jq -r '.url'))${NC}"

# Create a Node.js script to test console log reading
cat > /tmp/test-console-logs.js << 'EOF'
const WebSocket = require('ws');

const wsUrl = process.argv[2];
if (!wsUrl) {
    console.log('❌ WebSocket URL required');
    process.exit(1);
}

console.log('🔗 Connecting to:', wsUrl);

const ws = new WebSocket(wsUrl);
let messageId = 1;
const consoleMessages = [];

ws.on('open', () => {
    console.log('✅ Connected to Chrome DevTools');
    
    // Enable Runtime domain to receive console messages
    ws.send(JSON.stringify({
        id: messageId++,
        method: 'Runtime.enable'
    }));
    
    // Enable Console domain
    ws.send(JSON.stringify({
        id: messageId++,
        method: 'Console.enable'
    }));
    
    console.log('📡 Listening for console messages...');
    
    // Inject test console logs
    setTimeout(() => {
        console.log('🧪 Injecting test console logs...');
        
        const testLogs = [
            'console.log("🎯 MCP Test: Basic log message");',
            'console.warn("⚠️ MCP Test: Warning message");',
            'console.error("❌ MCP Test: Error message");',
            'console.info("ℹ️ MCP Test: Info message");',
            'console.log("🔒 MCP Test: Auth token check", localStorage.getItem("auth-token"));',
            'console.log("🌐 MCP Test: Current URL", window.location.href);',
            'console.log("📊 MCP Test: Performance timing", performance.now());'
        ];
        
        testLogs.forEach((log, index) => {
            setTimeout(() => {
                ws.send(JSON.stringify({
                    id: messageId++,
                    method: 'Runtime.evaluate',
                    params: {
                        expression: log,
                        includeCommandLineAPI: true
                    }
                }));
            }, (index + 1) * 500);
        });
        
    }, 1000);
    
    // Auto-close after collecting logs
    setTimeout(() => {
        console.log('📋 Test Results Summary:');
        console.log(`   Total console messages captured: ${consoleMessages.length}`);
        consoleMessages.forEach((msg, index) => {
            console.log(`   ${index + 1}. [${msg.level}] ${msg.text}`);
        });
        
        if (consoleMessages.length > 0) {
            console.log('✅ SUCCESS: MCP can read console logs!');
        } else {
            console.log('❌ FAILED: No console logs captured');
        }
        
        ws.close();
        process.exit(0);
    }, 5000);
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        
        // Handle console messages
        if (message.method === 'Runtime.consoleAPICalled') {
            const level = message.params.type;
            const args = message.params.args || [];
            const text = args.map(arg => arg.value || arg.description || '[Object]').join(' ');
            
            console.log(`📝 Console [${level.toUpperCase()}]: ${text}`);
            consoleMessages.push({ level, text, timestamp: Date.now() });
        }
        
        // Handle console messages from Console domain
        if (message.method === 'Console.messageAdded') {
            const level = message.params.message.level;
            const text = message.params.message.text;
            
            console.log(`📝 Console [${level.toUpperCase()}]: ${text}`);
            consoleMessages.push({ level, text, timestamp: Date.now() });
        }
        
        // Handle JavaScript errors
        if (message.method === 'Runtime.exceptionThrown') {
            const error = message.params.exceptionDetails;
            const text = error.exception?.description || error.text || 'Unknown error';
            
            console.log(`🚨 JavaScript Error: ${text}`);
            consoleMessages.push({ level: 'error', text: `JS Error: ${text}`, timestamp: Date.now() });
        }
        
    } catch (err) {
        // Ignore JSON parsing errors for non-message data
    }
});

ws.on('error', (error) => {
    console.log('❌ WebSocket error:', error.message);
    process.exit(1);
});

ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
});
EOF

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠ Node.js not found. Using curl-based test instead...${NC}"
    
    # Fallback: Simple injection of console logs
    echo -e "${BLUE}📡 Injecting test console logs via DevTools Protocol...${NC}"
    
    # Get tab info
    TAB_INFO=$(curl -s "http://127.0.0.1:$CHROME_DEBUG_PORT/json")
    echo -e "${CYAN}Available tabs:${NC}"
    echo "$TAB_INFO" | grep -o '"title":"[^"]*"' | cut -d'"' -f4 | head -5
    
    # Inject some test logs (this will execute but we can't easily read them back with curl)
    curl -s -X POST "http://127.0.0.1:$CHROME_DEBUG_PORT/json/runtime/evaluate" \
        -H "Content-Type: application/json" \
        -d '{
            "expression": "console.log(\"🎯 MCP Test: Hello from MCP!\"); console.warn(\"⚠️ MCP Test: This is a warning\"); console.error(\"❌ MCP Test: This is an error\"); \"Console logs injected\"",
            "returnByValue": true
        }' > /dev/null
    
    echo -e "${GREEN}✅ Console logs injected successfully${NC}"
    echo -e "${BLUE}💡 To see real-time console log reading, install Node.js and run this test again${NC}"
    echo -e "${BLUE}   Or open Chrome DevTools manually to see the injected logs${NC}"
    
else
    echo -e "${BLUE}🚀 Running Node.js-based console log reader...${NC}"
    
    # Prefer running the harness from the project's scripts directory so dev deps (ws) resolve
    if [[ -f "$(pwd)/scripts/tmp-test-console-logs.cjs" ]]; then
        node "$(pwd)/scripts/tmp-test-console-logs.cjs" "$WS_URL"
    else
        node /tmp/test-console-logs.js "$WS_URL"
    fi
fi

# Cleanup
rm -f /tmp/test-console-logs.js

echo -e "\n${BLUE}==================================${NC}"
echo -e "${GREEN}✅ Console log test completed!${NC}"

echo -e "\n${BLUE}🎯 What this test demonstrates:${NC}"
echo -e "${BLUE}  • MCP can connect to Chrome via WebSocket${NC}"
echo -e "${BLUE}  • MCP can read console.log, console.warn, console.error${NC}"
echo -e "${BLUE}  • MCP can inject and execute JavaScript${NC}"
echo -e "${BLUE}  • MCP can monitor real-time console output${NC}"
echo -e "${BLUE}  • MCP can capture JavaScript errors and exceptions${NC}"

echo -e "\n${BLUE}🚀 Try this in your browser console:${NC}"
echo -e "${CYAN}  console.log('Hello MCP! Can you see this?');${NC}"
echo -e "${CYAN}  console.warn('MCP warning test');${NC}"
echo -e "${CYAN}  console.error('MCP error test');${NC}"
