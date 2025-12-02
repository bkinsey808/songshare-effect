/* oxlint-disable sonarjs/slow-regex */
/**
 * Rewrites relative imports inside the API package to use the `@/api` alias.
 * @param filePath - Absolute or relative path to the file being transformed.
 * @param content - File contents prior to transformation.
 * @returns Updated file contents with API aliases applied.
 */
// Note: Avoid ambient `declare global` here. We provide a local helper
// below to perform global-regex replacements safely so we don't need to
// change tsconfig/lib or add global augmentations.

// Helper moved to module scope to avoid re-creating it on every call.
function replaceAllWithCallback(
	input: string,
	regex: RegExp,
	replacer: (...args: unknown[]) => string,
): string {
	if (!regex.global) {
		return input.replace(regex, (...args) => replacer(...args));
	}

	const INITIAL_INDEX = 0;

	let out = "";
	let lastIndex = INITIAL_INDEX;
	regex.lastIndex = INITIAL_INDEX;

	let match = regex.exec(input);
	while (match) {
		const start = match.index;
		out += input.slice(lastIndex, start);

		const [fullMatch, ...groups] = match;
		out += replacer(fullMatch, ...groups, match.index, match.input);

		const { lastIndex: rxLastIndex } = regex;
		lastIndex = rxLastIndex;

		if (fullMatch.length === INITIAL_INDEX) {
			regex.lastIndex += 1;
		}

		match = regex.exec(input);
	}

	out += input.slice(lastIndex);
	return out;
}

export default function convertApiImports(filePath: string, content: string): string {
	if (!filePath.includes("api/src/")) {
		return content;
	}

	// Convert relative imports within API to use @/api alias
	let updatedContent = content;

	// Use the module-level replaceAllWithCallback helper above. It avoids
	// requiring any global TypeScript augmentation while keeping this
	// function focused on converting API import paths.

	// Pattern for ../something -> @/api/something
	updatedContent = replaceAllWithCallback(updatedContent,
		/import\s+([^'"]*)\s+from\s+["']\.\.\/([^'"]*?)["'];?/g,
		(fullMatch, maybeImportPart, maybeRelativePath) => {
			const match = typeof fullMatch === "string" ? fullMatch : "";
			const importPart = typeof maybeImportPart === "string" ? maybeImportPart : "";
			const relativePath = typeof maybeRelativePath === "string" ? maybeRelativePath : "";
			// Don't convert if it's already an alias or going to shared
			if (
				relativePath.includes("shared/src") ||
				relativePath.startsWith("@/")
			) {
				return match;
			}
			return `import ${importPart} from "@/api/${relativePath}";`;
		},
	);

	// Pattern for ./something -> @/api/currentDir/something
	const marker = "api/src/";
	const NOT_FOUND = -1;
	const markerIndex = filePath.indexOf(marker);
	const afterApi =
		markerIndex === NOT_FOUND
			? ""
			: filePath.slice(markerIndex + marker.length);
	const parts = afterApi.split("/");
	// remove the file name segment
	parts.pop();
	const currentDir = parts.filter(Boolean).join("/") ?? "";
	if (currentDir !== "") {
		updatedContent = replaceAllWithCallback(updatedContent,
			/import\s+([^'"]*)\s+from\s+["']\.\/([^'"]*?)["'];?/g,
			(fullMatch, maybeImportPart, maybeRelativePath) => {
				const match = typeof fullMatch === "string" ? fullMatch : "";
				const importPart = typeof maybeImportPart === "string" ? maybeImportPart : "";
				const relativePath = typeof maybeRelativePath === "string" ? maybeRelativePath : "";
				if (relativePath.startsWith("@/")) {
					return match;
				}
				return `import ${importPart} from "@/api/${currentDir}/${relativePath}";`;
			},
		);
	}

	return updatedContent;
}
