import { existsSync } from "node:fs";

import { error as sError } from "@/scripts/utils/scriptLogger";

export default function assertPathExists(
	params: Readonly<{ path: string; errorMessage: string }>,
): void {
	if (!existsSync(params.path)) {
		sError(params.errorMessage);
		// Throw an error instead of exiting the process so callers can handle failures.
		throw new Error(params.errorMessage);
	}
}
