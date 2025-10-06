#!/bin/bash

# Test Chrome Dev Tools MCP Connection
# This script verifies that Chrome is running with debug mode and tests the connection

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CHROME_DEBUG_PORT=9222

echo -e "${BLUE}🧪 Testing Chrome Dev Tools MCP Connection${NC}"
echo -e "${BLUE}===========================================${NC}"

# Test 1: Check if debug port is accessible
echo -e "${BLUE}1. Testing debug port accessibility...${NC}"
if curl -s "http://localhost:$CHROME_DEBUG_PORT/json/version" > /dev/null; then
    echo -e "${GREEN}✓ Chrome debug port is accessible${NC}"
    
    # Get Chrome version
    VERSION=$(curl -s "http://localhost:$CHROME_DEBUG_PORT/json/version" | grep -o '"Browser":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}  Chrome version: $VERSION${NC}"
else
    echo -e "${RED}❌ Chrome debug port is not accessible${NC}"
    echo -e "${YELLOW}  Run: ./scripts/start-chrome-debug.sh${NC}"
    exit 1
fi

# Test 2: List open tabs
echo -e "\n${BLUE}2. Listing open tabs...${NC}"
TABS=$(curl -s "http://localhost:$CHROME_DEBUG_PORT/json")
TAB_COUNT=$(echo "$TABS" | grep -o '"id"' | wc -l)
echo -e "${GREEN}✓ Found $TAB_COUNT open tab(s)${NC}"

# Check if our app is open
if echo "$TABS" | grep -q "localhost:5173"; then
    echo -e "${GREEN}✓ songshare-effect app is open in Chrome${NC}"
else
    echo -e "${YELLOW}⚠ songshare-effect app not found in tabs${NC}"
    echo -e "${YELLOW}  Make sure your dev server is running: npm run dev:all${NC}"
fi

# Test 3: Test WebSocket connection capability
echo -e "\n${BLUE}3. Testing WebSocket endpoint...${NC}"
WS_URL=$(echo "$TABS" | grep -o '"webSocketDebuggerUrl":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$WS_URL" ]; then
    echo -e "${GREEN}✓ WebSocket endpoint available${NC}"
    echo -e "${GREEN}  URL: $WS_URL${NC}"
else
    echo -e "${RED}❌ No WebSocket endpoint found${NC}"
fi

# Test 4: Execute a simple command via CDP
echo -e "\n${BLUE}4. Testing Chrome DevTools Protocol...${NC}"
if command -v node &> /dev/null; then
    # Create a simple Node.js script to test CDP
    cat > /tmp/test-cdp.js << 'EOF'
const http = require('http');

// Get first tab
const req = http.get('http://localhost:9222/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const tabs = JSON.parse(data);
            if (tabs.length > 0) {
                console.log('✓ CDP communication successful');
                console.log(`  Tab title: ${tabs[0].title}`);
                console.log(`  Tab URL: ${tabs[0].url}`);
            } else {
                console.log('⚠ No tabs found');
            }
        } catch (err) {
            console.log('❌ CDP communication failed:', err.message);
        }
    });
});

req.on('error', (err) => {
    console.log('❌ CDP connection failed:', err.message);
});

req.setTimeout(5000, () => {
    console.log('❌ CDP connection timeout');
    req.destroy();
});
EOF

    node /tmp/test-cdp.js
    rm -f /tmp/test-cdp.js
else
    echo -e "${YELLOW}⚠ Node.js not available, skipping CDP test${NC}"
fi

echo -e "\n${BLUE}===========================================${NC}"
echo -e "${GREEN}✅ Chrome Dev Tools MCP connection test complete!${NC}"

# Show summary
echo -e "\n${BLUE}📋 Connection Summary:${NC}"
echo -e "${BLUE}  Debug Endpoint: http://localhost:$CHROME_DEBUG_PORT${NC}"
echo -e "${BLUE}  WebSocket: ws://localhost:$CHROME_DEBUG_PORT${NC}"
echo -e "${BLUE}  Your App: http://localhost:5173${NC}"

echo -e "\n${BLUE}🚀 Next Steps:${NC}"
echo -e "${BLUE}  1. Connect your MCP client to: ws://localhost:$CHROME_DEBUG_PORT${NC}"
echo -e "${BLUE}  2. Use GitHub Copilot with MCP commands${NC}"
echo -e "${BLUE}  3. Test authentication flows and API calls${NC}"
echo -e "${BLUE}  4. Monitor performance and debug issues${NC}"