#!/usr/bin/env node
// Minimal CDP helper: connect to DevTools websocket for the dev tab and
// listen for the network response for the OAuth callback, then print its
// response.headers (including Set-Cookie) and exit.

const ws = require('ws');
const http = require('http');

const CDP_HOST = process.env.CHROME_DEBUG_HOST || '127.0.0.1';
const CDP_PORT = process.env.CHROME_DEBUG_PORT || 9222;
const DEV_SERVER_PORT = process.env.DEV_SERVER_PORT || 5173;
const MATCH_URL_PART = '/api/oauth/callback';
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || '30000', 10);

async function getWsUrl() {
  const url = `http://${CDP_HOST}:${CDP_PORT}/json`;
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          const arr = JSON.parse(data);
          // prefer a page whose url includes localhost:DEV_SERVER_PORT
          const hostMatcher = `localhost:${DEV_SERVER_PORT}`;
          const page = arr.find(p => p.url && p.url.includes(hostMatcher)) || arr[0];
          if (!page) return reject(new Error('no page targets found'));
          if (!page.webSocketDebuggerUrl) return reject(new Error('no webSocketDebuggerUrl on page'));
          resolve(page.webSocketDebuggerUrl);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

(async function main() {
  try {
    const wsUrl = await getWsUrl();
    console.error('Attaching to', wsUrl);
    const socket = new ws(wsUrl);
    let id = 1;
    const send = (msg) => { socket.send(JSON.stringify({ id: id++, ...msg })); };

    const timer = setTimeout(() => {
      console.error('Timed out waiting for callback response');
      process.exit(2);
    }, TIMEOUT_MS);

    socket.on('open', () => {
      // enable Network domain
      send({ method: 'Network.enable', params: {} });
      // optionally enable extra headers if needed
    });

    socket.on('message', (raw) => {
      try {
        const obj = JSON.parse(raw.toString());
        if (obj.method === 'Network.responseReceived' && obj.params && obj.params.response && obj.params.response.url) {
          const url = obj.params.response.url;
          if (url.includes(MATCH_URL_PART)) {
            clearTimeout(timer);
            console.error('Found response for', url);
            const headers = obj.params.response.headers || {};
            console.log('--- response headers for', url, '---');
            console.log(JSON.stringify(headers, null, 2));
            // print any Set-Cookie keys with case-insensitive match
            const setCookie = Object.entries(headers).filter(([k]) => k.toLowerCase() === 'set-cookie');
            if (setCookie.length) {
              console.log('\nSet-Cookie entries:');
              for (const [k, v] of setCookie) console.log(k + ': ' + v);
            } else {
              console.log('\nNo Set-Cookie header found in this response.');
            }
            process.exit(0);
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    });

    socket.on('error', (err) => {
      console.error('WebSocket error', err);
      process.exit(3);
    });
  } catch (err) {
    console.error('Error:', err && err.stack ? err.stack : err);
    process.exit(4);
  }
})();
