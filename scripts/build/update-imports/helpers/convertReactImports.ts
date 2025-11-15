/**
 * Normalizes React source imports to the `@/react` alias when possible.
 * @param filePath - Absolute or relative path to the React source file.
 * @param content - File contents prior to transformation.
 * @returns Updated file contents with React aliases applied.
 */
export function convertReactImports(filePath: string, content: string): string {
	if (!filePath.includes("react/src/")) {
		return content;
	}

	let updatedContent = content;

	// Convert ../../ patterns in React files to @/react
	updatedContent = updatedContent.replace(
		/import\s+([^'"]*)\s+from\s+["'](\.\.\/)+([^'"]*?)["'];?/g,
		(...args) => {
			const [match, importPart, , relativePath] = args as [
				string,
				string,
				string,
				string,
			];
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
