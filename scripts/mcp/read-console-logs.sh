#!/bin/bash

# Chrome Dev Tools MCP Console Log Reader
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

CHROME_DEBUG_PORT=9222

echo -e "${BLUE}📋 Chrome Console Log Reader${NC}"

if ! curl -s "http://localhost:$CHROME_DEBUG_PORT/json/version" > /dev/null; then
    echo -e "${RED}❌ Chrome debug port not accessible${NC}"
    echo -e "${YELLOW}Run: npm run chrome:debug${NC}"
    exit 1
fi

TAB_INFO=$(curl -s "http://localhost:$CHROME_DEBUG_PORT/json" | head -1)
TAB_ID=$(echo "$TAB_INFO" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
WS_URL=$(echo "$TAB_INFO" | grep -o '"webSocketDebuggerUrl":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TAB_ID" ]; then
    echo -e "${RED}❌ No tabs found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Connected to tab: $TAB_ID${NC}"

cat > /tmp/console-reader.js << 'EOF'
const WebSocket = require('ws');

const wsUrl = process.argv[2];
if (!wsUrl) {
    console.log('Usage: node console-reader.js <websocket-url>');
    process.exit(1);
}

console.log('🔗 Connecting to Chrome DevTools...');
const ws = new WebSocket(wsUrl);

let messageId = 1;

ws.on('open', () => {
    console.log('✅ Connected to Chrome DevTools Protocol');
    ws.send(JSON.stringify({ id: messageId++, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: messageId++, method: 'Log.enable' }));
    console.log('📡 Listening for console messages...');
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        if (message.method === 'Runtime.consoleAPICalled') {
            const { type, args } = message.params;
            const values = args.map(arg => arg.value || arg.description || '[Object]').join(' ');
            console.log(`[${type.toUpperCase()}] ${values}`);
        }
        if (message.method === 'Runtime.exceptionThrown') {
            const { exceptionDetails } = message.params;
            console.log(`[EXCEPTION] ${exceptionDetails.text}`);
        }
    } catch (error) {
        // ignore
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
    console.log('🔌 Connection closed');
    process.exit(0);
});
EOF

if command -v node &> /dev/null; then
    node /tmp/console-reader.js "$WS_URL"
else
    echo -e "${RED}❌ Node.js is required for console reading${NC}"
fi

rm -f /tmp/console-reader.js
