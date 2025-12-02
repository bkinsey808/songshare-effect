/* oxlint-disable sonarjs/slow-regex */
/**
 * Normalizes React source imports to the `@/react` alias when possible.
 * @param filePath - Absolute or relative path to the React source file.
 * @param content - File contents prior to transformation.
 * @returns Updated file contents with React aliases applied.
 */
export default function convertReactImports(filePath: string, content: string): string {
	if (!filePath.includes("react/src/")) {
		return content;
	}

	let updatedContent = content;

	// Convert ../../ patterns in React files to @/react
	const MATCH_INDEX = 0;
	const IMPORT_PART_INDEX = 1;
	const RELATIVE_PATH_INDEX = 3;
	// Use `replace` with a function replacer here — `replaceAll` doesn't accept a function.
	// eslint-disable-next-line unicorn/prefer-string-replace-all
	updatedContent = updatedContent.replace(
		/import\s+([^'"]*)\s+from\s+['"](\.\.\/)+([^'"]*?)['"]?;?/g,
		(...args) => {
			const match = String(args[MATCH_INDEX] ?? "");
			const importPart = String(args[IMPORT_PART_INDEX] ?? "");
			const relativePath = String(args[RELATIVE_PATH_INDEX] ?? "");
			// Skip if already using aliases
			if (relativePath.startsWith("@/")) {
				return match;
			}

			// Skip external modules or shared imports that might not be in react/src
			if (
				relativePath.includes("node_modules") ||
				relativePath.includes("shared")
			) {
				return match;
			}

			return `import ${importPart} from "@/react/${relativePath}";`;
		},
	);

	return updatedContent;
}
