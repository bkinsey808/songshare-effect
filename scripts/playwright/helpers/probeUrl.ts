import { EXIT_SUCCESS } from "./constants";
import spawnSyncShell from "./spawnSyncShell";

export default function probeUrl(url: string): boolean {
	try {
		const args = `-sS --max-time 2 -I ${url}${url.startsWith("https:") ? " --insecure" : ""}`;
		const code = spawnSyncShell(`curl ${args}`);
		return code === EXIT_SUCCESS;
	} catch {
		return false;
	}
}
