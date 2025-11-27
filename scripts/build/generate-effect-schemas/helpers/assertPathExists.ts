import { existsSync } from "fs";

export function assertPathExists(
	params: Readonly<{ path: string; errorMessage: string }>,
): void {
	if (!existsSync(params.path)) {
		console.error(params.errorMessage);
		const EXIT_FAILURE = 1;
		process.exit(EXIT_FAILURE);
	}
}
