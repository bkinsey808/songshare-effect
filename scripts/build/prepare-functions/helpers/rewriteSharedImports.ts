import { readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";

import { walkFiles } from "./walkFiles";

export async function rewriteSharedImports(destShared: string): Promise<void> {
	let replacements = 0;
	await walkFiles(destShared, async (filePath) => {
		const content = await readFile(filePath, "utf8");
		const importPattern = /@\/shared\/([\w@/. -]+)/g;
		let nextContent = content;
		let match: RegExpExecArray | null = importPattern.exec(content);
		while (match !== null) {
			const targetSubpath = match[1];
			if (targetSubpath === undefined) {
				match = importPattern.exec(content);
				continue;
			}
			const fileDir = path.dirname(filePath);
			const targetAbs = path.join(destShared, targetSubpath);
			let relPath = path.relative(fileDir, targetAbs).split(path.sep).join("/");
			if (!relPath.startsWith(".")) {
				relPath = `./${relPath}`;
			}

			nextContent = nextContent.replaceAll(match[0], relPath);
			replacements++;
			match = importPattern.exec(content);
		}

		if (replacements > 0 && nextContent !== content) {
			await writeFile(filePath, nextContent, "utf8");
		}
	});

	console.warn(
		`Rewrote ${replacements} '@/shared/*' imports inside ${destShared}`,
	);
}
