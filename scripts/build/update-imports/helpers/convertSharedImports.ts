/**
 * Ensures shared package imports prefer the `@/shared` alias.
 * @param content - File contents prior to transformation.
 * @returns Updated file contents with shared aliases applied.
 */
export function convertSharedImports(content: string): string {
	// Convert any remaining ../shared/src patterns to @/shared
	return content.replace(
		/from\s+["'][^"']*\/shared\/src\/([^"']*?)["'];?/g,
		'from "@/shared/$1";',
	);
}
