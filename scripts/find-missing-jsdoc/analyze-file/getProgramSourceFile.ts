import path from "node:path";

import type { Program, SourceFile } from "typescript";

/**
 * Find the program-backed source file for the provided path.
 * @param program - Program that owns the parsed source files.
 * @param filePath - Requested file path.
 * @returns Matching source file when present in the program.
 */
export default function getProgramSourceFile(
	program: Program,
	filePath: string,
): SourceFile | undefined {
	const normalizedPath = path.resolve(filePath);
	return program
		.getSourceFiles()
		.find((sourceFile) => path.resolve(sourceFile.fileName) === normalizedPath);
}
