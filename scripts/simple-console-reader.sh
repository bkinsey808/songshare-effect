#!/bin/bash

# Simple Console Log Reader using Chrome DevTools Protocol HTTP API
# This version works without Node.js by injecting JavaScript and polling for results

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

CHROME_DEBUG_PORT=9222

echo -e "${BLUE}📋 Simple Console Log Reader${NC}"
echo -e "${BLUE}=============================${NC}"

# Check if Chrome debug is running
if ! curl -s "http://localhost:$CHROME_DEBUG_PORT/json/version" > /dev/null; then
    echo -e "${RED}❌ Chrome debug port not accessible${NC}"
    echo -e "${YELLOW}Run: npm run chrome:debug${NC}"
    exit 1
fi

# Get the first tab
TABS=$(curl -s "http://localhost:$CHROME_DEBUG_PORT/json")
TAB_ID=$(echo "$TABS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TAB_ID" ]; then
    echo -e "${RED}❌ No tabs found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Connected to tab: $TAB_ID${NC}"

# Function to execute JavaScript in the browser
execute_js() {
    local js_code="$1"
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"method\":\"Runtime.evaluate\",\"params\":{\"expression\":\"$js_code\",\"returnByValue\":true}}" \
        "http://localhost:$CHROME_DEBUG_PORT/json/runtime/evaluate" | \
        grep -o '"value":"[^"]*"' | cut -d'"' -f4
}

# Inject console interceptor
echo -e "${CYAN}🔧 Injecting console interceptor...${NC}"

INTERCEPTOR_JS='
(function() {
    if (window.mcpConsoleInterceptor) return;
    
    window.mcpConsoleInterceptor = {
        logs: [],
        maxLogs: 100
    };
    
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
    };
    
    function interceptConsole(type, originalFn) {
        return function(...args) {
            const timestamp = new Date().toISOString();
            const message = args.map(arg => 
                typeof arg === "object" ? JSON.stringify(arg) : String(arg)
            ).join(" ");
            
            window.mcpConsoleInterceptor.logs.push({
                type,
                message,
                timestamp
            });
            
            // Keep only recent logs
            if (window.mcpConsoleInterceptor.logs.length > window.mcpConsoleInterceptor.maxLogs) {
                window.mcpConsoleInterceptor.logs.shift();
            }
            
            originalFn.apply(console, args);
        };
    }
    
    console.log = interceptConsole("log", originalConsole.log);
    console.error = interceptConsole("error", originalConsole.error);
    console.warn = interceptConsole("warn", originalConsole.warn);
    console.info = interceptConsole("info", originalConsole.info);
    
    console.log("🎯 MCP Console interceptor active");
    
    return "Console interceptor installed";
})();'

# Install interceptor (escape quotes for curl)
ESCAPED_JS=$(echo "$INTERCEPTOR_JS" | sed 's/"/\\"/g' | tr -d '\n')
curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"method\":\"Runtime.evaluate\",\"params\":{\"expression\":\"$ESCAPED_JS\"}}" \
    "http://localhost:$CHROME_DEBUG_PORT/json/runtime/evaluate" > /dev/null

echo -e "${GREEN}✓ Console interceptor installed${NC}"
echo -e "${BLUE}📡 Monitoring console logs... (Press Ctrl+C to stop)${NC}"
echo -e "${YELLOW}Interact with your app at http://localhost:5173${NC}"
echo ""

# Monitor loop
LAST_COUNT=0
while true; do
    # Get current logs
    LOGS_JS='JSON.stringify(window.mcpConsoleInterceptor ? window.mcpConsoleInterceptor.logs : [])'
    LOGS_JSON=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"method\":\"Runtime.evaluate\",\"params\":{\"expression\":\"$LOGS_JS\",\"returnByValue\":true}}" \
        "http://localhost:$CHROME_DEBUG_PORT/json/runtime/evaluate" | \
        grep -o '"value":\[.*\]' | cut -d':' -f2)
    
    if [ "$LOGS_JSON" != "[]" ] && [ "$LOGS_JSON" != "" ]; then
        # Count current logs
        CURRENT_COUNT=$(echo "$LOGS_JSON" | grep -o '"type"' | wc -l)
        
        # Show new logs
        if [ "$CURRENT_COUNT" -gt "$LAST_COUNT" ]; then
            # Parse and display new logs (simple approach)
            echo "$LOGS_JSON" | sed 's/},{/}\n{/g' | tail -n +$((LAST_COUNT + 1)) | while IFS= read -r log_entry; do
                TYPE=$(echo "$log_entry" | grep -o '"type":"[^"]*"' | cut -d'"' -f4)
                MESSAGE=$(echo "$log_entry" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
                TIMESTAMP=$(echo "$log_entry" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4)
                
                # Color code by type
                case "$TYPE" in
                    "error") COLOR='\033[0;31m' ;;  # Red
                    "warn")  COLOR='\033[0;33m' ;;  # Yellow
                    "info")  COLOR='\033[0;34m' ;;  # Blue
                    *)       COLOR='\033[0;36m' ;;  # Cyan
                esac
                
                TIME=$(echo "$TIMESTAMP" | cut -dT -f2 | cut -d. -f1)
                echo -e "${COLOR}[${TIME}] ${TYPE^^}: ${MESSAGE}${NC}"
            done
            
            LAST_COUNT=$CURRENT_COUNT
        fi
    fi
    
    sleep 1
done