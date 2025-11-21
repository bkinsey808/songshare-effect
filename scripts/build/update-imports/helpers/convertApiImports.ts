/* eslint-disable sonarjs/slow-regex */
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
	updatedContent = updatedContent.replace(
		/import\s+([^'"]*)\s+from\s+["']\.\.\/([^'"]*?)["'];?/g,
		(...args) => {
			const [match, importPart, relativePath] = args as [
				string,
				string,
				string,
			];
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
	const currentDir =
		filePath.split("api/src/")[1]?.split("/").slice(0, -1).join("/") ?? "";
	if (currentDir !== "") {
		updatedContent = updatedContent.replace(
			/import\s+([^'"]*)\s+from\s+["']\.\/([^'"]*?)["'];?/g,
			(...args) => {
				const [match, importPart, relativePath] = args as [
					string,
					string,
					string,
				];
				if (relativePath.startsWith("@/")) {
					return match;
				}
				return `import ${importPart} from "@/api/${currentDir}/${relativePath}";`;
			},
		);
	}

	return updatedContent;
}
