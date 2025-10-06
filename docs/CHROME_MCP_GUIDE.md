# Chrome Dev Tools MCP Setup Guide

## 🎯 **Overview**

This guide shows you how to use Chrome Dev Tools MCP with your songshare-effect project in a WSL2 + GitHub Copilot environment.

## 🚀 **Quick Start**

### 1. Start Chrome with Debug Mode

```bash
# From your project root
./scripts/start-chrome-debug.sh
```

This script:

- ✅ Detects WSL2/Linux environment
- ✅ Finds Chrome (Windows or Linux)
- ✅ Starts Chrome with remote debugging enabled
- ✅ Opens your app at http://localhost:5173
- ✅ Provides debug endpoint at http://localhost:9222

### 2. Start Your Development Servers

```bash
# Start both frontend and API servers
npm run dev:all
```

### 3. Connect MCP to Chrome

Your MCP client can now connect to:

- **Debug Endpoint**: `http://localhost:9222`
- **WebSocket**: `ws://localhost:9222`

## 🔧 **MCP Integration with GitHub Copilot**

### Using in Claude Desktop (if you have MCP setup)

Add this to your MCP configuration:

```json
{
	"mcpServers": {
		"chrome-devtools": {
			"command": "chrome-devtools-mcp",
			"args": ["--port", "9222"]
		}
	}
}
```

### Manual MCP Commands

You can interact with Chrome programmatically through the debug protocol:

```bash
# Get list of open tabs
curl http://localhost:9222/json

# Get Chrome version info
curl http://localhost:9222/json/version

# Connect to a specific tab via WebSocket
# (Use the webSocketDebuggerUrl from the tabs list)
```

## 🎯 **Common Use Cases for Your Project**

### 1. **Authentication Flow Testing**

```javascript
// Execute in Chrome console via MCP
console.log("Current auth state:", localStorage.getItem("auth-token"));

// Monitor auth API calls
// MCP can watch network tab for /api/auth/* requests
```

### 2. **API Debugging**

```javascript
// Test your Hono API endpoints
fetch("http://localhost:8787/api/songs")
	.then((r) => r.json())
	.then(console.log);

// Check CORS headers
fetch("http://localhost:8787/api/health", {
	method: "OPTIONS",
}).then((r) => console.log([...r.headers]));
```

### 3. **React Component Testing**

```javascript
// Access React DevTools data
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.forEach((renderer) => {
	console.log("React version:", renderer.version);
});

// Test language switching
window.dispatchEvent(
	new CustomEvent("languageChange", {
		detail: { language: "es" },
	}),
);
```

### 4. **Performance Analysis**

```javascript
// Start performance recording
performance.mark("app-start");

// Later...
performance.mark("app-loaded");
performance.measure("app-load-time", "app-start", "app-loaded");
console.log(performance.getEntriesByType("measure"));
```

## 🔍 **WSL2-Specific Setup**

### Port Forwarding

WSL2 automatically forwards `localhost` ports to Windows, so:

- Your React app on `localhost:5173` is accessible from Windows
- Chrome debug port `localhost:9222` works from both WSL2 and Windows

### Chrome Location Detection

The script automatically detects Chrome in these locations:

- Windows: `/mnt/c/Program Files/Google/Chrome/Application/chrome.exe`
- Windows (user): `/mnt/c/Users/$USER/AppData/Local/Google/Chrome/Application/chrome.exe`
- Linux: `google-chrome` or `chromium-browser`

### X11 Display (if using Linux Chrome in WSL2)

If you want to run Chrome directly in WSL2:

```bash
# Install Chrome in WSL2
sudo apt update
sudo apt install google-chrome-stable

# Set up X11 forwarding (if needed)
export DISPLAY=:0
```

## 🛠 **Troubleshooting**

### Chrome Won't Start

```bash
# Kill any existing Chrome processes
pkill -f chrome

# Clear user data directory
rm -rf ~/.chrome-debug-profile

# Try starting again
./scripts/start-chrome-debug.sh
```

### Debug Port Not Accessible

```bash
# Check if port is in use
lsof -i :9222

# Test connection
curl http://localhost:9222/json/version
```

### CORS Issues

The script starts Chrome with `--disable-web-security` to avoid CORS issues during development.

## 📊 **Example MCP Workflows**

### 1. **Monitor Authentication**

```bash
# Start Chrome with debug
./scripts/start-chrome-debug.sh

# In another terminal, start your servers
npm run dev:all

# MCP can now monitor:
# - Login/logout flows
# - Token refresh cycles
# - API authentication headers
```

### 2. **Test Language Switching**

```javascript
// MCP can execute this in Chrome console
const testLanguages = ["en", "es", "zh"];
testLanguages.forEach((lang) => {
	localStorage.setItem("language", lang);
	location.reload();
	setTimeout(() => {
		console.log(`${lang}: ${document.title}`);
	}, 1000);
});
```

### 3. **Performance Monitoring**

```javascript
// MCP can monitor Core Web Vitals
new PerformanceObserver((list) => {
	for (const entry of list.getEntries()) {
		console.log(`${entry.name}: ${entry.value}`);
	}
}).observe({ entryTypes: ["measure", "navigation", "paint"] });
```

## 🎮 **Integration with Your Development Workflow**

### VS Code Tasks Integration

Add this to your `.vscode/tasks.json`:

```json
{
	"label": "Start Chrome Debug",
	"type": "shell",
	"command": "./scripts/start-chrome-debug.sh",
	"group": "build",
	"isBackground": true,
	"problemMatcher": []
}
```

### Package.json Scripts

Add these to your `package.json`:

```json
{
	"scripts": {
		"chrome:debug": "./scripts/start-chrome-debug.sh",
		"dev:debug": "concurrently \"npm run dev:all\" \"npm run chrome:debug\""
	}
}
```

## 🔗 **Next Steps**

1. **Install MCP Client**: Set up Claude Desktop or another MCP client
2. **Create Test Scenarios**: Write specific test cases for your auth system
3. **Automate Workflows**: Use MCP to automate repetitive testing tasks
4. **Performance Monitoring**: Set up continuous performance monitoring

## 📚 **Resources**

- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [WSL2 Networking](https://docs.microsoft.com/en-us/windows/wsl/networking)

---

**Happy debugging with Chrome Dev Tools MCP! 🎯**
