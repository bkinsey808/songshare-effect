import { EXIT_SUCCESS, DEFAULT_PORT } from "./constants";
import spawnSyncShell from "./spawnSyncShell";

/**
 * Check whether a local TCP port appears to be accepting connections.
 *
 * @param port - Port number to probe. Defaults to the Vite dev port.
 * @returns Whether any of the shell-based probes detected a listening service.
 */
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
