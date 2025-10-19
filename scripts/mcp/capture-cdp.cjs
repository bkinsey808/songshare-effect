#!/usr/bin/env node
const WebSocket = require('ws');
const argv = process.argv.slice(2);
const wsUrl = argv[0];
// Parse optional arguments robustly: a numeric duration (ms) and an optional
// --json flag. Previously the script used argv[1] directly which could be
// '--json' and produced NaN for the duration. This fixes that parsing.
let durationMs = 15000;
let jsonMode = process.env.JSON_OUTPUT === '1';
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--json') jsonMode = true;
  else if (!isNaN(Number(a))) durationMs = Number(a);
}
// support a '--no-timeout' flag which means "run until manually stopped".
const noTimeout = argv.includes('--no-timeout');
// jsonMode: when true, the script will emit a JSON array of raw CDP messages
// to stdout (machine-friendly). Any human-readable logs will be written to
// stderr so the JSON output is clean and parseable.

if (!wsUrl) {
  console.error('Usage: node capture-cdp.cjs <webSocketDebuggerUrl> [durationMs] [--json]');
  process.exit(1);
}

if (jsonMode) {
  // Avoid polluting stdout in json mode — route console.log to stderr so
  // the resulting capture file contains only the JSON array we emit below.
  console.log = (...args) => console.error(...args);
}

console.log('🔗 Connecting to', wsUrl);
const ws = new WebSocket(wsUrl);
let id = 1;
const consoles = [];
const requests = new Map();
const responses = [];

// If jsonMode is enabled we collect the raw parsed CDP messages here so we
// can stringify them as a single JSON array at the end of the capture.
const parsedMessages = jsonMode ? [] : null;

// sessionId -> targetId
const sessions = new Map();

function send(method, params = {}, sessionId) {
  const msg = { id: id++, method };
  if (params && Object.keys(params).length) msg.params = params;
  if (sessionId) msg.sessionId = sessionId;
  ws.send(JSON.stringify(msg));
  return msg.id;
}

function enableDomains(sessionId) {
  // Enable domains for a given session (or the top-level if no sessionId)
  send('Runtime.enable', {}, sessionId);
  send('Console.enable', {}, sessionId);
  send('Network.enable', {}, sessionId);
  send('Page.enable', {}, sessionId);
}

function attachToTarget(targetId) {
  // attachToTarget will either return a result with sessionId or emit a Target.attachedToTarget event
  send('Target.attachToTarget', { targetId, flatten: true });
}

ws.on('open', () => {
  console.log('✅ Connected to DevTools');
  // If connected to the browser websocket, discover and attach to page targets (this also picks up popups)
  send('Target.setDiscoverTargets', { discover: true });
  // request current targets and attach to existing page targets
  send('Target.getTargets');
  console.log('📡 Discovering and attaching to page targets. Listening for Console and Network events for', durationMs, 'ms');
  // Summary after duration, unless the user requested no timeout.
  if (!noTimeout) {
    setTimeout(() => {
      if (jsonMode && parsedMessages) {
        // Emit the collected raw CDP messages as a JSON array to stdout.
        process.stdout.write(JSON.stringify(parsedMessages, null, 2));
        ws.close();
        process.exit(0);
      }

      console.log('\n📋 Summary:');
      console.log('  • Console messages captured:', consoles.length);
      consoles.forEach((c, i) => console.log(`   ${i + 1}. [${c.level}] ${c.text}`));
      console.log('\n  • Network requests captured:', responses.length);
      responses.forEach((r, i) => console.log(`   ${i + 1}. [${r.method}] ${r.url} -> ${r.status || 'N/A'}`));
      ws.close();
      process.exit(0);
    }, durationMs);
  } else {
    console.log('⏳ No-timeout mode enabled — the capture will run until you stop it (SIGINT/SIGTERM).');
  }
});

// When running in jsonMode without a timeout we should flush the collected
// CDP messages on SIGINT/SIGTERM so the output file is valid JSON.
function flushAndExit(code = 0) {
  try {
    if (jsonMode && parsedMessages) {
      process.stdout.write(JSON.stringify(parsedMessages, null, 2));
    }
  } catch (e) {
    // ignore
  }
  try { ws.close(); } catch (e) {}
  process.exit(code);
}

process.on('SIGINT', () => {
  console.error('\n✋ Caught SIGINT — flushing capture and exiting');
  flushAndExit(0);
});
process.on('SIGTERM', () => {
  console.error('\n✋ Caught SIGTERM — flushing capture and exiting');
  flushAndExit(0);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data);
    if (jsonMode && parsedMessages) {
      parsedMessages.push(msg);
    }

    // handle responses that include result for Target.getTargets or attach responses
    if (msg.id && msg.result) {
      if (msg.result.targetInfos) {
        // result of Target.getTargets
        msg.result.targetInfos.forEach(t => {
          if (t.type === 'page' || t.type === 'iframe' || t.type === 'webview') {
            attachToTarget(t.targetId);
          }
        });
      }
      if (msg.result.sessionId) {
        const sessionId = msg.result.sessionId;
        // store a session placeholder (targetId unknown here)
        sessions.set(sessionId, { targetId: msg.result.targetId || null });
        enableDomains(sessionId);
      }
    }

    // events may come with a sessionId (when attached to a target) or top-level events
    const sessionId = msg.sessionId;

    // Target events: listen for new targets and attachments
    if (msg.method === 'Target.targetCreated' && msg.params && msg.params.targetInfo) {
      const t = msg.params.targetInfo;
      if (t.type === 'page' || t.type === 'iframe' || t.type === 'webview') {
        attachToTarget(t.targetId);
      }
    }

    if (msg.method === 'Target.attachedToTarget' && msg.params) {
      const sId = msg.params.sessionId || (msg.result && msg.result.sessionId);
      if (sId) {
        sessions.set(sId, { targetId: msg.params.targetInfo && msg.params.targetInfo.targetId });
        enableDomains(sId);
      }
    }

    // Normalize event processing so both session-scoped and top-level messages are handled
    const method = msg.method;
    const params = msg.params || msg.result || {};

    function handleConsoleEvent(m, p) {
      if (m === 'Runtime.consoleAPICalled') {
        const level = p.type;
        const args = p.args || [];
        const text = args.map(a => a.value || a.description || '[Object]').join(' ');
        consoles.push({ level, text, ts: Date.now(), sessionId });
        console.log(`📝 Console [${level.toUpperCase()}]: ${text}`);
      }
      if (m === 'Console.messageAdded') {
        const level = p.message && p.message.level;
        const text = p.message && p.message.text;
        consoles.push({ level, text, ts: Date.now(), sessionId });
        console.log(`📝 Console [${level.toUpperCase()}]: ${text}`);
      }
    }

    function handleNetworkEvent(m, p) {
      if (m === 'Network.requestWillBeSent') {
        const r = p;
        requests.set(r.requestId, { url: r.request.url, method: r.request.method, ts: Date.now(), sessionId });
        console.log(`⬆️  Request: ${r.request.method} ${r.request.url}`);
      }
      if (m === 'Network.responseReceived') {
        const r = p;
        const req = requests.get(r.requestId) || {};
        const entry = { requestId: r.requestId, url: r.response.url, status: r.response.status, method: req.method || 'GET', mimeType: r.response.mimeType, sessionId };
        responses.push(entry);
        console.log(`⬇️  Response: ${entry.method} ${entry.url} -> ${entry.status} (${entry.mimeType})`);
      }
      if (m === 'Network.loadingFailed') {
        const r = p;
        console.log(`❌ Network failed: ${r.requestId} (${r.errorText})`);
      }
    }

    // run handlers for both top-level and session messages
    if (method) {
      handleConsoleEvent(method, params);
      handleNetworkEvent(method, params);
    }
  } catch (err) {
    // ignore parse errors
  }
});

ws.on('close', () => console.log('🔌 WebSocket closed'));
ws.on('error', (err) => { console.error('WebSocket error', err && err.message); process.exit(1); });
