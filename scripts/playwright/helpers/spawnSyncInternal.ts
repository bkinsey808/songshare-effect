import { spawnSync } from "node:child_process";

export default function spawnSyncInternal(cmd: string): number | undefined {
	const proc = spawnSync(cmd, { shell: true, stdio: "ignore" });
	try {
		return proc.status ?? undefined;
	} catch {
		return undefined;
	}
}
