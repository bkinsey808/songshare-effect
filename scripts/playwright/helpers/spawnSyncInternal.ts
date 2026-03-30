import { spawnSync } from "node:child_process";

/**
 * Run a shell command synchronously and expose its exit status.
 *
 * @param cmd - Shell command string to execute.
 * @returns The process exit status when available, otherwise `undefined`.
 */
export default function spawnSyncInternal(cmd: string): number | undefined {
	const proc = spawnSync(cmd, { shell: true, stdio: "ignore" });
	try {
		return proc.status ?? undefined;
	} catch {
		return undefined;
	}
}
