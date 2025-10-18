#!/usr/bin/env node
const WebSocket = require('ws');
const argv = process.argv.slice(2);
const wsUrl = argv[0];
const durationMs = Number(argv[1] || 15000);
if (!wsUrl) {
  console.error('Usage: node capture-cdp.cjs <webSocketDebuggerUrl> [durationMs]');
  process.exit(1);
}
console.log('🔗 Connecting to', wsUrl);
const ws = new WebSocket(wsUrl);
let id = 1;
const consoles = [];
const requests = new Map();
const responses = [];
ws.on('open', () => {
  console.log('✅ Connected to DevTools');
  ws.send(JSON.stringify({ id: id++, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: id++, method: 'Console.enable' }));
  ws.send(JSON.stringify({ id: id++, method: 'Network.enable' }));
  ws.send(JSON.stringify({ id: id++, method: 'Page.enable' }));
  console.log('📡 Listening for Console and Network events for', durationMs, 'ms');
  setTimeout(() => {
    console.log('\n📋 Summary:');
    console.log('  • Console messages captured:', consoles.length);
    consoles.forEach((c, i) => console.log(`   ${i + 1}. [${c.level}] ${c.text}`));
    console.log('\n  • Network requests captured:', responses.length);
    responses.forEach((r, i) => console.log(`   ${i + 1}. [${r.method}] ${r.url} -> ${r.status || 'N/A'}`));
    ws.close();
    process.exit(0);
  }, durationMs);
});
ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const level = msg.params.type;
      const args = msg.params.args || [];
      const text = args.map(a => a.value || a.description || '[Object]').join(' ');
      consoles.push({ level, text, ts: Date.now() });
      console.log(`📝 Console [${level.toUpperCase()}]: ${text}`);
    }
    if (msg.method === 'Console.messageAdded') {
      const level = msg.params.message.level;
      const text = msg.params.message.text;
      consoles.push({ level, text, ts: Date.now() });
      console.log(`📝 Console [${level.toUpperCase()}]: ${text}`);
    }
    if (msg.method === 'Network.requestWillBeSent') {
      const r = msg.params;
      requests.set(r.requestId, { url: r.request.url, method: r.request.method, ts: Date.now() });
      console.log(`⬆️  Request: ${r.request.method} ${r.request.url}`);
    }
    if (msg.method === 'Network.responseReceived') {
      const r = msg.params;
      const req = requests.get(r.requestId) || {};
      const entry = { requestId: r.requestId, url: r.response.url, status: r.response.status, method: req.method || 'GET', mimeType: r.response.mimeType };
      responses.push(entry);
      console.log(`⬇️  Response: ${entry.method} ${entry.url} -> ${entry.status} (${entry.mimeType})`);
    }
    if (msg.method === 'Network.loadingFailed') {
      const r = msg.params;
      console.log(`❌ Network failed: ${r.requestId} (${r.errorText})`);
    }
  } catch (err) {
    // ignore
  }
});
ws.on('close', () => console.log('🔌 WebSocket closed'));
ws.on('error', (err) => { console.error('WebSocket error', err && err.message); process.exit(1); });
