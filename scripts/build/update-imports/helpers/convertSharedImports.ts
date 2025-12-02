/**
 * Ensures shared package imports prefer the `@/shared` alias.
 * @param content - File contents prior to transformation.
 * @returns Updated file contents with shared aliases applied.
 */
export default function convertSharedImports(content: string): string {
	// Convert any remaining ../shared/src patterns to @/shared
	// Use replaceAll to avoid mutation warnings and to make intent explicit
	return content.replaceAll(
		/from\s+["'][^"']*\/shared\/src\/([^"']*?)['"];?/g,
		'from "@/shared/$1";',
	);
}
