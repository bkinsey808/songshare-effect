#!/bin/bash

# Chrome Dev Tools MCP Setup Script for WSL2
# This script launches Chrome with remote debugging enabled for MCP integration

set -e

# Configuration
CHROME_DEBUG_PORT=9222
CHROME_USER_DATA_DIR="$HOME/.chrome-debug-profile"
DEV_SERVER_PORT="${DEV_SERVER_PORT:-5173}"
CHROME_FLAGS=(
    "--remote-debugging-port=$CHROME_DEBUG_PORT"
    "--remote-debugging-address=0.0.0.0"
    "--user-data-dir=$CHROME_USER_DATA_DIR"
    "--no-first-run"
    "--no-default-browser-check"
    "--disable-web-security"
    "--disable-features=VizDisplayCompositor"
    "--auto-open-devtools-for-tabs"
)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Chrome Dev Tools MCP Setup${NC}"
echo -e "${BLUE}================================${NC}"

if [[ -n "$WSL_DISTRO_NAME" ]]; then
    echo -e "${GREEN}✓ Detected WSL2 environment: $WSL_DISTRO_NAME${NC}"
    
    CHROME_WIN="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
    CHROME_WIN_LOCAL="/mnt/c/Users/$USER/AppData/Local/Google/Chrome/Application/chrome.exe"
    
    if [[ -f "$CHROME_WIN" ]]; then
        CHROME_PATH="$CHROME_WIN"
        echo -e "${GREEN}✓ Found Windows Chrome: $CHROME_PATH${NC}"
    elif [[ -f "$CHROME_WIN_LOCAL" ]]; then
        CHROME_PATH="$CHROME_WIN_LOCAL"
        echo -e "${GREEN}✓ Found Windows Chrome: $CHROME_PATH${NC}"
    else
        echo -e "${YELLOW}⚠ Windows Chrome not found, checking for Linux Chrome...${NC}"
        
        if command -v google-chrome &> /dev/null; then
            CHROME_PATH="google-chrome"
            echo -e "${GREEN}✓ Found Linux Chrome in WSL2${NC}"
        elif command -v chromium-browser &> /dev/null; then
            CHROME_PATH="chromium-browser"
            echo -e "${GREEN}✓ Found Chromium in WSL2${NC}"
        else
            echo -e "${RED}❌ Chrome not found. Please install Chrome or Chromium.${NC}"
            echo -e "${YELLOW}For Windows Chrome: Install from https://www.google.com/chrome/${NC}"
            echo -e "${YELLOW}For Linux Chrome in WSL2: sudo apt update && sudo apt install google-chrome-stable${NC}"
            exit 1
        fi
    fi
else
    echo -e "${GREEN}✓ Detected native Linux environment${NC}"
    
    if command -v google-chrome &> /dev/null; then
        CHROME_PATH="google-chrome"
    elif command -v chromium-browser &> /dev/null; then
        CHROME_PATH="chromium-browser"
    else
        echo -e "${RED}❌ Chrome not found. Please install Chrome or Chromium.${NC}"
        exit 1
    fi
fi

mkdir -p "$CHROME_USER_DATA_DIR"

# PID file for the chrome instance started by this script
PID_DIR="$HOME/.local/share/songshare-effect"
mkdir -p "$PID_DIR"
CHROME_PIDFILE="$PID_DIR/chrome.pid"
CHROME_LOGFILE="$PID_DIR/chrome.log"
touch "$CHROME_LOGFILE" || true
chmod 600 "$CHROME_LOGFILE" || true

if curl -s "http://localhost:$CHROME_DEBUG_PORT/json/version" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Chrome is already running with debug port $CHROME_DEBUG_PORT${NC}"
    echo -e "${BLUE}Debug endpoint: http://localhost:$CHROME_DEBUG_PORT${NC}"
    exit 0
fi

echo -e "${BLUE}🚀 Starting Chrome with debug flags...${NC}"
echo -e "${BLUE}Debug port: $CHROME_DEBUG_PORT${NC}"
echo -e "${BLUE}User data dir: $CHROME_USER_DATA_DIR${NC}"

if [[ "$CHROME_PATH" == *".exe" ]]; then
    "$CHROME_PATH" "${CHROME_FLAGS[@]}" "http://localhost:$DEV_SERVER_PORT" >> "$CHROME_LOGFILE" 2>&1 &
else
    "$CHROME_PATH" "${CHROME_FLAGS[@]}" "http://localhost:$DEV_SERVER_PORT" >> "$CHROME_LOGFILE" 2>&1 &
fi

CHROME_PID=$!
echo "$CHROME_PID" > "$CHROME_PIDFILE"

DEV_SERVER_URL=${DEV_SERVER_URL:-http://localhost:${DEV_SERVER_PORT}}
echo -e "${GREEN}✓ Chrome started with PID: $CHROME_PID${NC}"
echo -e "${BLUE}Debug endpoint: http://localhost:$CHROME_DEBUG_PORT${NC}"
echo -e "${BLUE}Your app will open at: ${DEV_SERVER_URL}${NC}"

sleep 3

if curl -s "http://localhost:$CHROME_DEBUG_PORT/json/version" > /dev/null; then
    echo -e "${GREEN}✓ Chrome debug interface is accessible${NC}"
    echo -e "${BLUE}🔗 MCP can now connect to: ws://localhost:$CHROME_DEBUG_PORT${NC}"
else
    echo -e "${YELLOW}⚠ Debug interface not yet ready. It may take a few more seconds.${NC}"
fi

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}✅ Chrome Dev Tools MCP is ready!${NC}"
echo -e "${BLUE}Use Ctrl+C to stop this script and close Chrome${NC}"

trap 'echo -e "\n${YELLOW}🛑 Stopping Chrome...${NC}"; kill $CHROME_PID 2>/dev/null || true; exit 0' INT TERM
trap 'echo -e "\n${YELLOW}🛑 Stopping Chrome...${NC}"; kill $CHROME_PID 2>/dev/null || true; rm -f "$CHROME_PIDFILE" || true; exit 0' INT TERM

# When script exits, ensure pidfile is removed
cleanup() {
    rm -f "$CHROME_PIDFILE" || true
}
trap cleanup EXIT
wait $CHROME_PID 2>/dev/null || true
