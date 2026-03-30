import { EXIT_SUCCESS } from "./constants";
import spawnSyncInternal from "./spawnSyncInternal";

/**
 * Check whether a shell command is available on the current PATH.
 *
 * @param name - Executable name to resolve.
 * @returns Whether `command -v` found the executable.
 */
export default function whichExists(name: string): boolean {
	try {
		return spawnSyncInternal(`command -v ${name}`) === EXIT_SUCCESS;
	} catch {
		return false;
	}
}
