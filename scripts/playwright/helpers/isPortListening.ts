import { EXIT_SUCCESS, DEFAULT_PORT } from "./constants";
import spawnSyncShell from "./spawnSyncShell";

export default function isPortListening(port = DEFAULT_PORT): boolean {
	try {
		const ssOk = spawnSyncShell(`ss -ltn 2>/dev/null | grep -q ":${port}"`) === EXIT_SUCCESS;
		if (ssOk) {
			return true;
		}
	} catch {
		// ignore
	}
	try {
		const netstatOk =
			spawnSyncShell(`netstat -ltn 2>/dev/null | grep -q ":${port}"`) === EXIT_SUCCESS;
		if (netstatOk) {
			return true;
		}
	} catch {
		// ignore
	}
	try {
		const ncOk = spawnSyncShell(`nc -z localhost ${port} >/dev/null 2>&1`) === EXIT_SUCCESS;
		if (ncOk) {
			return true;
		}
	} catch {
		// ignore
	}
	return false;
}
