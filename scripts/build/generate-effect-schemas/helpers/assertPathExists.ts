import { existsSync } from "fs";

import { error as sError } from "../../../utils/scriptLogger";

export function assertPathExists(
	params: Readonly<{ path: string; errorMessage: string }>,
): void {
	if (!existsSync(params.path)) {
		sError(params.errorMessage);
		const EXIT_FAILURE = 1;
		process.exit(EXIT_FAILURE);
	}
}
