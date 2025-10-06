# Chrome DevTools MCP Security Guide

## 🔒 **Security Overview**

Chrome DevTools MCP provides powerful debugging capabilities but requires careful security considerations. This guide outlines risks, mitigations, and best practices.

## ⚡ **Risk Assessment**

### **HIGH RISK** ❌

- **Production Use**: NEVER use debug mode in production
- **Public Networks**: Debug port accessible on public networks
- **Shared Machines**: Multiple users with access to debug port
- **Sensitive Data**: Production credentials, API keys, user data

### **MEDIUM RISK** ⚠️

- **Development Networks**: Debug port on corporate/shared networks
- **Long-running Sessions**: Chrome debug running for extended periods
- **Multiple Applications**: Other apps accessing the same debug port
- **Unsecured Storage**: Debug profile with sensitive test data

### **LOW RISK** ✅

- **Local Development**: Isolated development machine
- **Localhost Only**: Debug port bound to 127.0.0.1
- **Temporary Sessions**: Short debugging sessions
- **Test Data Only**: No real user data or credentials

## 🛡️ **Security Configurations**

### **Strict Security Mode** (Recommended)

```bash
# Use the secure script
./scripts/start-chrome-debug-secure.sh

# Or set environment variable
export CHROME_MCP_SECURITY=strict
npm run chrome:debug
```

**Features:**

- ✅ Binds to 127.0.0.1 only (not 0.0.0.0)
- ✅ Removes `--disable-web-security` flag
- ✅ Restricted file permissions on profile directory
- ✅ Production environment detection
- ✅ Network interface validation

### **Development Mode** (Less Secure)

```bash
export CHROME_MCP_SECURITY=dev
./scripts/start-chrome-debug-secure.sh
```

**Features:**

- ⚠️ Includes `--disable-web-security` for CORS testing
- ⚠️ More permissive for development workflows
- ✅ Still binds to localhost only

## 🔍 **What Chrome DevTools MCP Can Access**

### **Browser Content**

- ✅ All HTML, CSS, JavaScript on the page
- ✅ DOM structure and element properties
- ✅ Console messages and JavaScript errors
- ✅ Network requests and responses
- ✅ Local storage, session storage, cookies
- ✅ IndexedDB and Web SQL data

### **System Interaction**

- ✅ Execute JavaScript in browser context
- ✅ Navigate to different URLs
- ✅ Take screenshots and record videos
- ✅ Modify page content and styles
- ✅ Simulate user interactions (clicks, typing)

### **What It CANNOT Access**

- ❌ Files outside the browser sandbox
- ❌ System processes or other applications
- ❌ Network traffic from other applications
- ❌ Operating system functions
- ❌ Other browser profiles or instances

## 🚨 **Security Threats & Mitigations**

### **Threat: Unauthorized Access**

```bash
# Problem: Debug port accessible to malicious processes
curl http://localhost:9222/json

# Mitigation: Use localhost-only binding
--remote-debugging-address=127.0.0.1  # Not 0.0.0.0
```

### **Threat: Data Exposure**

```javascript
// Problem: Sensitive data visible in console/storage
localStorage.setItem('api-key', 'secret-key');

// Mitigation: Use separate debug profile
--user-data-dir="$HOME/.chrome-debug-profile-secure"
```

### **Threat: Cross-Site Attacks**

```bash
# Problem: Disabled web security
--disable-web-security

# Mitigation: Enable web security in strict mode
# Remove the flag for production-like testing
```

### **Threat: Process Hijacking**

```bash
# Problem: Long-running debug process
chrome --remote-debugging-port=9222 &

# Mitigation: Proper cleanup and timeouts
trap 'kill $CHROME_PID' EXIT
```

## 🔐 **Best Practices**

### **Environment Separation**

```bash
# ✅ DO: Use separate profiles for debug
CHROME_USER_DATA_DIR="$HOME/.chrome-debug-profile"

# ❌ DON'T: Use your main Chrome profile
CHROME_USER_DATA_DIR="$HOME/.config/google-chrome"
```

### **Network Security**

```bash
# ✅ DO: Bind to localhost only
--remote-debugging-address=127.0.0.1

# ❌ DON'T: Expose to all interfaces
--remote-debugging-address=0.0.0.0
```

### **Data Handling**

```javascript
// ✅ DO: Use test data only
const testUser = { id: "test-123", email: "test@example.com" };

// ❌ DON'T: Use real production data
const realUser = { id: "user-456", email: "john@company.com" };
```

### **Session Management**

```bash
# ✅ DO: Close debug sessions when done
pkill -f "chrome.*remote-debugging"

# ✅ DO: Use timeouts for automated sessions
timeout 3600 ./scripts/start-chrome-debug-secure.sh
```

## 🚀 **Secure Development Workflow**

### **1. Start Secure Debug Session**

```bash
# Use the secure script
./scripts/start-chrome-debug-secure.sh

# Verify localhost binding
netstat -an | grep :9222
```

### **2. Connect MCP Safely**

```javascript
// Only connect to localhost endpoints
const endpoint = "ws://127.0.0.1:9222";

// Validate connection before use
if (endpoint.includes("127.0.0.1") || endpoint.includes("localhost")) {
	// Safe to connect
}
```

### **3. Monitor and Log Access**

```bash
# Log debug connections
tail -f ~/.chrome-debug-profile-secure/chrome_debug.log

# Monitor network connections
lsof -i :9222
```

### **4. Clean Up After Use**

```bash
# Kill Chrome debug process
pkill -f "chrome.*remote-debugging"

# Clear debug profile if needed
rm -rf ~/.chrome-debug-profile-secure
```

## 📋 **Security Checklist**

### **Before Starting Debug Session**

- [ ] Confirm development environment only
- [ ] Check no production data is accessible
- [ ] Verify network isolation
- [ ] Ensure proper cleanup procedures

### **During Debug Session**

- [ ] Monitor for unauthorized access attempts
- [ ] Keep session time minimal
- [ ] Avoid handling sensitive data
- [ ] Log important security events

### **After Debug Session**

- [ ] Kill Chrome debug process
- [ ] Clear temporary debug data
- [ ] Verify no persistent exposure
- [ ] Review logs for issues

## 🔧 **Environment Variables**

```bash
# Security mode (strict|dev)
export CHROME_MCP_SECURITY=strict

# Custom debug port
export CHROME_DEBUG_PORT=9223

# Custom profile directory
export CHROME_DEBUG_PROFILE="$HOME/.secure-debug"

# Enable additional logging
export CHROME_DEBUG_LOG=true
```

## 🚨 **Emergency Procedures**

### **Suspected Compromise**

```bash
# 1. Immediately kill all Chrome debug processes
pkill -f "chrome.*remote-debugging"

# 2. Check for suspicious connections
netstat -an | grep :9222
lsof -i :9222

# 3. Clear debug profile
rm -rf ~/.chrome-debug-profile*

# 4. Restart with clean profile
./scripts/start-chrome-debug-secure.sh
```

### **Production Exposure**

```bash
# 1. IMMEDIATELY stop debug mode
pkill -f "chrome.*remote-debugging"

# 2. Check production systems
curl -s http://production-server:9222/json || echo "Safe"

# 3. Review logs for access
grep "9222" /var/log/nginx/access.log
```

## 📚 **Additional Resources**

- [Chrome DevTools Protocol Security](https://chromedevtools.github.io/devtools-protocol/#security)
- [Browser Security Best Practices](https://owasp.org/www-project-web-security-testing-guide/)
- [Development Environment Security](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_Practices_Cheat_Sheet.html)

---

**Remember: Chrome DevTools MCP is a powerful development tool. Use it responsibly and securely! 🔒**
