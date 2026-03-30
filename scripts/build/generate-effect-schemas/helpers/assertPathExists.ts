import { existsSync } from "node:fs";

import { error as sError } from "@/scripts/utils/scriptLogger";

/**
 * Throws when a required filesystem path is missing.
 *
 * @param params - Path and message used for validation and reporting.
 * @returns void
 */
export default function assertPathExists(
	params: Readonly<{ path: string; errorMessage: string }>,
): void {
	if (!existsSync(params.path)) {
		sError(params.errorMessage);
		// Throw an error instead of exiting the process so callers can handle failures.
		throw new Error(params.errorMessage);
	}
}
