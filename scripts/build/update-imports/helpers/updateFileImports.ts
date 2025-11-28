import { readFileSync, writeFileSync } from "fs";

import { warn as sWarn, error as sError } from "../../../utils/scriptLogger";
import { convertApiImports } from "./convertApiImports";
import { convertReactImports } from "./convertReactImports";
import { convertSharedImports } from "./convertSharedImports";

/**
 * Applies import transformations for a single file and writes changes to disk.
 * @param filePath - Path to the file that should be updated.
 * @returns Whether the file required modifications.
 */
export function updateFileImports(filePath: string): boolean {
	try {
		const content = readFileSync(filePath, "utf8");
		let updatedContent = content;

		// Apply conversions
		updatedContent = convertApiImports(filePath, updatedContent);
		updatedContent = convertReactImports(filePath, updatedContent);
		updatedContent = convertSharedImports(updatedContent);

		// Only write if content changed
		if (updatedContent !== content) {
			writeFileSync(filePath, updatedContent, "utf8");
			sWarn(`✅ Updated: ${filePath}`);
			return true;
		}

		return false;
	} catch (_error) {
		sError(`❌ Error updating ${filePath}:`, _error);
		return false;
	}
}
