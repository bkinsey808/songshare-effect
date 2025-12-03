import { EXIT_SUCCESS } from "./constants";
import spawnSyncInternal from "./spawnSyncInternal";

export default function whichExists(name: string): boolean {
	try {
		return spawnSyncInternal(`command -v ${name}`) === EXIT_SUCCESS;
	} catch {
		return false;
	}
}
