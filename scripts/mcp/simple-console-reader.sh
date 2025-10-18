#!/bin/bash

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

CHROME_DEBUG_PORT=9222

echo -e "${BLUE}📋 Simple Console Log Reader${NC}"

if ! curl -s "http://localhost:$CHROME_DEBUG_PORT/json/version" > /dev/null; then
    echo -e "${RED}❌ Chrome debug port not accessible${NC}"
    echo -e "${YELLOW}Run: npm run chrome:debug${NC}"
    exit 1
fi

TABS=$(curl -s "http://localhost:$CHROME_DEBUG_PORT/json")
TAB_ID=$(echo "$TABS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TAB_ID" ]; then
    echo -e "${RED}❌ No tabs found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Connected to tab: $TAB_ID${NC}"

INTERCEPTOR_JS='(function(){if(window.mcpConsoleInterceptor)return;window.mcpConsoleInterceptor={logs:[],maxLogs:100};const original={log:console.log,error:console.error,warn:console.warn,info:console.info};function interceptConsole(type,originalFn){return function(...args){const timestamp=new Date().toISOString();const message=args.map(arg=>typeof arg==="object"?JSON.stringify(arg):String(arg)).join(" ");window.mcpConsoleInterceptor.logs.push({type,message,timestamp});if(window.mcpConsoleInterceptor.logs.length>window.mcpConsoleInterceptor.maxLogs){window.mcpConsoleInterceptor.logs.shift()}originalFn.apply(console,args)}}console.log=interceptConsole("log",original.log);console.error=interceptConsole("error",original.error);console.warn=interceptConsole("warn",original.warn);console.info=interceptConsole("info",original.info);console.log("🎯 MCP Console interceptor active");return "Console interceptor installed"})();'

ESCAPED_JS=$(echo "$INTERCEPTOR_JS" | sed 's/"/\\"/g' | tr -d '\n')
curl -s -X POST -H "Content-Type: application/json" -d "{\"method\":\"Runtime.evaluate\",\"params\":{\"expression\":\"$ESCAPED_JS\"}}" "http://localhost:$CHROME_DEBUG_PORT/json/runtime/evaluate" > /dev/null

echo -e "${GREEN}✓ Console interceptor installed${NC}"
echo -e "${BLUE}📡 Monitoring console logs... (Press Ctrl+C to stop)${NC}"

LAST_COUNT=0
while true; do
    LOGS_JS='JSON.stringify(window.mcpConsoleInterceptor ? window.mcpConsoleInterceptor.logs : [])'
    LOGS_JSON=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"method\":\"Runtime.evaluate\",\"params\":{\"expression\":\"$LOGS_JS\",\"returnByValue\":true}}" "http://localhost:$CHROME_DEBUG_PORT/json/runtime/evaluate" | grep -o '"value":\[.*\]' | cut -d':' -f2)
    if [ "$LOGS_JSON" != "[]" ] && [ "$LOGS_JSON" != "" ]; then
        CURRENT_COUNT=$(echo "$LOGS_JSON" | grep -o '"type"' | wc -l)
        if [ "$CURRENT_COUNT" -gt "$LAST_COUNT" ]; then
            echo "$LOGS_JSON" | sed 's/},{/}\n{/g' | tail -n +$((LAST_COUNT + 1)) | while IFS= read -r log_entry; do
                TYPE=$(echo "$log_entry" | grep -o '"type":"[^"]*"' | cut -d'"' -f4)
                MESSAGE=$(echo "$log_entry" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
                TIMESTAMP=$(echo "$log_entry" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4)
                case "$TYPE" in
                    "error") COLOR='\033[0;31m' ;;
                    "warn")  COLOR='\033[0;33m' ;;
                    "info")  COLOR='\033[0;34m' ;;
                    *)       COLOR='\033[0;36m' ;;
                esac
                TIME=$(echo "$TIMESTAMP" | cut -dT -f2 | cut -d. -f1)
                echo -e "${COLOR}[${TIME}] ${TYPE^^}: ${MESSAGE}${NC}"
            done
            LAST_COUNT=$CURRENT_COUNT
        fi
    fi
    sleep 1
done
