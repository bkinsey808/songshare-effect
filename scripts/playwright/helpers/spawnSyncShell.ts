import { EXIT_FAILURE } from "./constants";
import spawnSyncInternal from "./spawnSyncInternal";

export default function spawnSyncShell(cmd: string): number {
	const result = spawnSyncInternal(cmd);
	return typeof result === "number" ? result : EXIT_FAILURE;
}
