import { readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";

import { warn as sWarn } from "../../../utils/scriptLogger";
import { walkFiles } from "./walkFiles";

export async function rewriteSharedImports(destShared: string): Promise<void> {
	const NO_REPLACEMENTS = 0;
	const REPLACEMENT_INCREMENT = 1;
	let replacements = NO_REPLACEMENTS;
	await walkFiles(destShared, async (filePath) => {
		const content = await readFile(filePath, "utf8");
		const importPattern = /@\/shared\/([\w@/. -]+)/g;
		let nextContent = content;
		let match: RegExpExecArray | null = importPattern.exec(content);
		while (match !== null) {
			const [fullMatch, targetSubpath] = match;
			if (targetSubpath !== undefined) {
				const fileDir = path.dirname(filePath);
				const targetAbs = path.join(destShared, targetSubpath);
				let relPath = path
					.relative(fileDir, targetAbs)
					.split(path.sep)
					.join("/");
				if (!relPath.startsWith(".")) {
					relPath = `./${relPath}`;
				}

				nextContent = nextContent.replaceAll(fullMatch, relPath);
				replacements += REPLACEMENT_INCREMENT;
				match = importPattern.exec(content);
			} else {
				match = importPattern.exec(content);
			}
		}

		if (replacements !== NO_REPLACEMENTS && nextContent !== content) {
			await writeFile(filePath, nextContent, "utf8");
		}
	});

	sWarn(`Rewrote ${replacements} '@/shared/*' imports inside ${destShared}`);
}
