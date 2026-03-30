import { execSync } from "node:child_process";
import os from "node:os";

/**
 * Check whether a Linux executable is missing shared-library dependencies.
 *
 * @param exePath - Executable path to inspect with `ldd`.
 * @returns Whether the dependency check indicates missing shared libraries.
 */
export default function libsMissingForExecutable(exePath: string): boolean {
	if (os.platform() !== "linux") {
		return false;
	}
	try {
		const out = execSync(`ldd ${exePath}`, { encoding: "utf8" });
		return out.includes("not found");
	} catch {
		return true;
	}
}
