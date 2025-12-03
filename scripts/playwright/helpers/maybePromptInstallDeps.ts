import { spawnSync } from "node:child_process";
import readlinePromises from "node:readline/promises";

import { warn as sWarn, error as sError } from "../../utils/scriptLogger";
import { ZERO } from "./constants";

export default async function maybePromptInstallDeps(
	isCI: boolean,
	exePath: string,
): Promise<void> {
	const interactive = process.stdin.isTTY && process.stdout.isTTY;
	if (!interactive || isCI) {
		sWarn(
			"Non-interactive postinstall: please run 'sudo npx playwright install-deps' to install system dependencies if needed.",
		);
		return;
	}

	try {
		const rl = readlinePromises.createInterface({ input: process.stdin, output: process.stdout });
		const raw = await rl.question(
			`Some system libraries required by Playwright are missing for ${exePath}. Install them now (this requires sudo)? (y/N): `,
		);
		const answer = raw.trim().toLowerCase();
		rl.close();
		if (answer === "y" || answer === "yes") {
			const depsCmd = spawnSync("sudo", ["npx", "playwright", "install-deps"], {
				shell: true,
				stdio: "inherit",
			});
			if (depsCmd.status !== ZERO) {
				sError(
					"Failed to install system deps with sudo. You may need to run: sudo npx playwright install-deps",
				);
			}
		} else {
			sWarn("Skipping install-deps. You may see runtime errors if system libraries are missing.");
		}
	} catch {
		sWarn(
			"Could not prompt for install-deps — run 'sudo npx playwright install-deps' if you want to add missing system packages.",
		);
	}
}
