import { EXIT_SUCCESS } from "./constants";
import spawnSyncShell from "./spawnSyncShell";

/**
 * Probe a URL with a lightweight HEAD request.
 *
 * @param url - Absolute URL to request with curl.
 * @returns Whether curl exited successfully for the probe request.
 */
export default function probeUrl(url: string): boolean {
	try {
		const args = `-sS --max-time 2 -I ${url}${url.startsWith("https:") ? " --insecure" : ""}`;
		const code = spawnSyncShell(`curl ${args}`);
		return code === EXIT_SUCCESS;
	} catch {
		return false;
	}
}
