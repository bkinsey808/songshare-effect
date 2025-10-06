#!/bin/bash

# Chrome Dev Tools MCP Console Log Reader
# This script demonstrates how to read browser console logs via Chrome DevTools Protocol

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

CHROME_DEBUG_PORT=9222

echo -e "${BLUE}📋 Chrome Console Log Reader${NC}"
echo -e "${BLUE}=============================${NC}"

# Check if Chrome debug is running
if ! curl -s "http://localhost:$CHROME_DEBUG_PORT/json/version" > /dev/null; then
    echo -e "${RED}❌ Chrome debug port not accessible${NC}"
    echo -e "${YELLOW}Run: npm run chrome:debug${NC}"
    exit 1
fi

# Get the first tab
TAB_INFO=$(curl -s "http://localhost:$CHROME_DEBUG_PORT/json" | head -1)
TAB_ID=$(echo "$TAB_INFO" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
WS_URL=$(echo "$TAB_INFO" | grep -o '"webSocketDebuggerUrl":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TAB_ID" ]; then
    echo -e "${RED}❌ No tabs found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Connected to tab: $TAB_ID${NC}"

# Create a Node.js script to read console logs
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
    
    // Enable Runtime domain to receive console messages
    ws.send(JSON.stringify({
        id: messageId++,
        method: 'Runtime.enable'
    }));
    
    // Enable Log domain for additional logging
    ws.send(JSON.stringify({
        id: messageId++,
        method: 'Log.enable'
    }));
    
    console.log('📡 Listening for console messages...');
    console.log('───────────────────────────────────────');
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        
        // Handle console messages
        if (message.method === 'Runtime.consoleAPICalled') {
            const { type, args, timestamp } = message.params;
            const time = new Date(timestamp).toLocaleTimeString();
            
            // Extract the actual values from the arguments
            const values = args.map(arg => {
                if (arg.type === 'string') return arg.value;
                if (arg.type === 'number') return arg.value;
                if (arg.type === 'boolean') return arg.value;
                if (arg.type === 'object') return arg.description || '[Object]';
                return arg.description || arg.value;
            }).join(' ');
            
            // Color code by message type
            const colors = {
                log: '\x1b[36m',      // Cyan
                warn: '\x1b[33m',     // Yellow
                error: '\x1b[31m',    // Red
                info: '\x1b[34m',     // Blue
                debug: '\x1b[90m'     // Gray
            };
            
            const color = colors[type] || '\x1b[0m';
            const reset = '\x1b[0m';
            
            console.log(`${color}[${time}] ${type.toUpperCase()}: ${values}${reset}`);
        }
        
        // Handle JavaScript exceptions
        if (message.method === 'Runtime.exceptionThrown') {
            const { exceptionDetails } = message.params;
            const time = new Date().toLocaleTimeString();
            console.log(`\x1b[31m[${time}] EXCEPTION: ${exceptionDetails.text}\x1b[0m`);
            if (exceptionDetails.stackTrace) {
                console.log(`\x1b[31mStack trace: ${JSON.stringify(exceptionDetails.stackTrace, null, 2)}\x1b[0m`);
            }
        }
        
        // Handle Log domain messages
        if (message.method === 'Log.entryAdded') {
            const { entry } = message.params;
            const time = new Date(entry.timestamp).toLocaleTimeString();
            console.log(`\x1b[35m[${time}] LOG: ${entry.text}\x1b[0m`);
        }
        
    } catch (error) {
        // Ignore parsing errors for non-JSON messages
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
    console.log('🔌 Connection closed');
    process.exit(0);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n👋 Stopping console reader...');
    ws.close();
});
EOF

echo -e "${CYAN}🚀 Starting console log reader...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo -e "${BLUE}Now interact with your app at http://localhost:5173${NC}"
echo ""

# Check if Node.js is available
if command -v node &> /dev/null; then
    node /tmp/console-reader.js "$WS_URL"
else
    echo -e "${RED}❌ Node.js is required for console reading${NC}"
    echo -e "${YELLOW}Install Node.js or use the HTTP API method instead${NC}"
    
    # Fallback: Show how to get console logs via HTTP API
    echo -e "${BLUE}Alternative: Execute this JavaScript in your browser console:${NC}"
    echo -e "${CYAN}console.log('Test message from browser');${NC}"
    echo -e "${CYAN}console.error('Test error message');${NC}"
    echo -e "${CYAN}console.warn('Test warning message');${NC}"
fi

# Cleanup
rm -f /tmp/console-reader.js