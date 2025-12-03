import { execSync } from "node:child_process";
import os from "node:os";

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
