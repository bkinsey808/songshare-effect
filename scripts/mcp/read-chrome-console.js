#!/usr/bin/env node
import fs from "fs";
import WebSocket from "ws";

const DEFAULT_PORT = process.env.DEV_SERVER_PORT || "5173";
const DEFAULT_URL =
	process.env.DEV_SERVER_URL || `http://localhost:${DEFAULT_PORT}`;
const APP_URL = process.argv[2] || DEFAULT_URL;
const DEBUG_ENDPOINT =
	process.argv[3] ||
	process.env.CHROME_DEBUG_ENDPOINT ||
	"http://localhost:9222";

let msgId = 1;

function sendRaw(ws, method, params) {
	const payload = { id: msgId++, method };
	if (params) payload.params = params;
	ws.send(JSON.stringify(payload));
}

function sendToSession(ws, sessionId, method, params) {
	const inner = { id: msgId++, method };
	if (params) inner.params = params;
	const message = JSON.stringify(inner);
	sendRaw(ws, "Target.sendMessageToTarget", { sessionId, message });
}

async function attachViaHttp() {
	const newUrl = `${DEBUG_ENDPOINT.replace(/\/$/, "")}/json/new?${encodeURIComponent(APP_URL)}`;
	const res = await fetch(newUrl);
	const info = await res.json();
	const wsUrl =
		info.webSocketDebuggerUrl || info.webSocketUrl || info.webSocketDebuggerUrl;
	if (!wsUrl) {
		throw new Error(
			"Could not open target or obtain websocketDebuggerUrl: " +
				JSON.stringify(info),
		);
	}

	console.log("Opened target, attaching to", wsUrl);
	const ws = new WebSocket(wsUrl);

	ws.on("open", () => {
		console.log("WebSocket connected — enabling Runtime and Log domains");
		sendRaw(ws, "Runtime.enable");
		sendRaw(ws, "Log.enable");
		sendRaw(ws, "Console.enable");
	});

	ws.on("message", (data) => {
		handleMessage(data.toString());
	});

	ws.on("close", () => {
		console.log("WebSocket closed");
		process.exit(0);
	});

	ws.on("error", (err) => {
		console.error("WebSocket error", err);
		process.exit(1);
	});
}

async function attachViaBrowserWebSocket() {
	const logPath = "/tmp/chrome-debug.log";
	let content = "";
	try {
		content = fs.readFileSync(logPath, "utf8");
	} catch (e) {
		// ignore
	}

	const m = content.match(/DevTools listening on (ws:\/\/[^\s]+)/i);
	const browserWs = m ? m[1] : null;
	if (!browserWs) {
		throw new Error("Cannot find browser WebSocket URL in " + logPath);
	}

	console.log("Attaching to browser-level websocket", browserWs);
	const ws = new WebSocket(browserWs);

	const pending = new Map();

	ws.on("open", () => {
		console.log("Browser websocket connected");
		const id = msgId++;
		const payload = {
			id,
			method: "Target.createTarget",
			params: { url: APP_URL },
		};
		ws.send(JSON.stringify(payload));
		pending.set(id, { type: "createTarget" });
	});

	ws.on("message", (data) => {
		let msg;
		try {
			msg = JSON.parse(data.toString());
		} catch (e) {
			console.log("[raw]", data.toString());
			return;
		}

		if (msg.id && pending.has(msg.id)) {
			const entry = pending.get(msg.id);
			pending.delete(msg.id);
			if (entry.type === "createTarget") {
				const targetId = msg.result && msg.result.targetId;
				if (!targetId) {
					console.error("createTarget failed", msg);
					process.exit(1);
				}
				console.log("Created target", targetId, "— attaching");
				const attachId = msgId++;
				const attachPayload = {
					id: attachId,
					method: "Target.attachToTarget",
					params: { targetId, flatten: true },
				};
				ws.send(JSON.stringify(attachPayload));
				pending.set(attachId, { type: "attach" });
			} else if (entry.type === "attach") {
				const sessionId = msg.result && msg.result.sessionId;
				if (!sessionId) {
					console.error("attachToTarget failed", msg);
					process.exit(1);
				}
				console.log("Attached to target session", sessionId);
				sendToSession(ws, sessionId, "Runtime.enable");
				sendToSession(ws, sessionId, "Log.enable");
				sendToSession(ws, sessionId, "Console.enable");
				ws.__sessionId = sessionId;
			}
			return;
		}

		if (
			msg.method === "Target.receivedMessageFromTarget" &&
			msg.params &&
			msg.params.message
		) {
			let inner;
			try {
				inner = JSON.parse(msg.params.message);
			} catch (e) {
				return;
			}
			handleMessage(JSON.stringify(inner));
			return;
		}

		if (msg.method) {
			handleMessage(JSON.stringify(msg));
		}
	});

	ws.on("close", () => {
		console.log("Browser websocket closed");
		process.exit(1);
	});

	ws.on("error", (err) => {
		console.error("Browser websocket error", err);
		process.exit(1);
	});
}

function handleMessage(raw) {
	let msg;
	try {
		msg = JSON.parse(raw);
	} catch (e) {
		return;
	}

	if (msg.method === "Runtime.consoleAPICalled") {
		const { type, args } = msg.params || {};
		const values = (args || [])
			.map((a) => a.value ?? a.description ?? JSON.stringify(a))
			.join(" ");
		console.log(`[console.${type}] ${values}`);
	} else if (msg.method === "Runtime.exceptionThrown") {
		const ex = msg.params && msg.params.exceptionDetails;
		const text =
			ex && ex.exception
				? ex.exception.description || JSON.stringify(ex.exception)
				: ex && ex.text;
		console.error(`[exception] ${text}`);
	} else if (msg.method === "Log.entryAdded") {
		const entry = msg.params && msg.params.entry;
		console.log(
			`[log] ${entry && entry.source}:${entry && entry.level} ${entry && entry.text}`,
		);
	}
}

async function openTargetAndAttach() {
	try {
		try {
			await attachViaHttp();
			return;
		} catch (e) {
			console.warn(
				"HTTP attach failed, falling back to browser websocket method:",
				e.message,
			);
		}

		await attachViaBrowserWebSocket();
	} catch (err) {
		console.error("Error attaching to Chrome DevTools endpoint:", err);
		process.exit(1);
	}
}

openTargetAndAttach();
