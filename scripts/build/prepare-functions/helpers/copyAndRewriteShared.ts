import { warn as sWarn } from "../../../utils/scriptLogger";
import { copyDir } from "./copyDir";
import { rewriteSharedImports } from "./rewriteSharedImports";

/**
 * Copy shared sources into destination and attempt to rewrite imports there.
 * Errors are logged but non-fatal so the prepare script can continue.
 */
export async function copyAndRewriteShared(
	sourceDir: string,
	destDir: string,
): Promise<void> {
	try {
		await copyDir(sourceDir, destDir);
		sWarn("Copied shared/src ->", destDir);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		sWarn("Warning: could not copy shared/src:", message);
	}

	try {
		await rewriteSharedImports(destDir);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		sWarn(
			"Warning: could not rewrite imports in copied shared files:",
			message,
		);
	}
}
