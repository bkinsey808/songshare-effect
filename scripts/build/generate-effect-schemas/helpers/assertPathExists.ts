import { existsSync } from "fs";

export function assertPathExists(params: Readonly<{ path: string; errorMessage: string }>): void {
	if (!existsSync(params.path)) {
		console.error(params.errorMessage);
		process.exit(1);
	}
}
