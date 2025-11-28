/* oxlint-disable sonarjs/slow-regex */
/**
 * Rewrites relative imports inside the API package to use the `@/api` alias.
 * @param filePath - Absolute or relative path to the file being transformed.
 * @param content - File contents prior to transformation.
 * @returns Updated file contents with API aliases applied.
 */
export function convertApiImports(filePath: string, content: string): string {
	if (!filePath.includes("api/src/")) {
		return content;
	}

	// Convert relative imports within API to use @/api alias
	let updatedContent = content;

	// Pattern for ../something -> @/api/something
	const MATCH_INDEX = 0;
	const IMPORT_PART_INDEX = 1;
	const RELATIVE_PATH_INDEX = 2;
	updatedContent = updatedContent.replace(
		/import\s+([^'"]*)\s+from\s+["']\.\.\/([^'"]*?)["'];?/g,
		(...args) => {
			const match = String(args[MATCH_INDEX] ?? "");
			const importPart = String(args[IMPORT_PART_INDEX] ?? "");
			const relativePath = String(args[RELATIVE_PATH_INDEX] ?? "");
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
		updatedContent = updatedContent.replace(
			/import\s+([^'"]*)\s+from\s+["']\.\/([^'"]*?)["'];?/g,
			(...args) => {
				const match = String(args[MATCH_INDEX] ?? "");
				const importPart = String(args[IMPORT_PART_INDEX] ?? "");
				const relativePath = String(args[RELATIVE_PATH_INDEX] ?? "");
				if (relativePath.startsWith("@/")) {
					return match;
				}
				return `import ${importPart} from "@/api/${currentDir}/${relativePath}";`;
			},
		);
	}

	return updatedContent;
}
