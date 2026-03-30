import { EXIT_FAILURE } from "./constants";
import spawnSyncInternal from "./spawnSyncInternal";

/**
 * Run a shell command synchronously and normalize missing status codes.
 *
 * @param cmd - Shell command string to execute.
 * @returns The process exit status, or `EXIT_FAILURE` when no status is available.
 */
export default function spawnSyncShell(cmd: string): number {
	const result = spawnSyncInternal(cmd);
	return typeof result === "number" ? result : EXIT_FAILURE;
}
