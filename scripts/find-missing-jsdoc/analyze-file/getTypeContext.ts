import path from "node:path";

import { findConfigFile, sys } from "typescript";

import createProgramForFile from "./createProgramForFile";
import getProgramSourceFile from "./getProgramSourceFile";
import type { TypeContext } from "./TypeContext.type";

const typeContextCache = new Map<string, TypeContext | undefined>();

/**
 * Return the repo/program source file and checker used to inspect parameter types.
 * @param filePath - Path to the file being analyzed.
 * @returns Cached TypeScript checker context for the file, when available.
 */
export default function getTypeContext(filePath: string): TypeContext | undefined {
	const configPath = findConfigFile(
		path.dirname(filePath),
		(fileName) => sys.fileExists(fileName),
		"tsconfig.json",
	);
	const cacheKey = configPath ?? `standalone:${path.resolve(filePath)}`;
	const cached = typeContextCache.get(cacheKey);
	if (cached !== undefined) {
		return cached;
	}

	try {
		const program = createProgramForFile(filePath, configPath);
		const sourceFile = getProgramSourceFile(program, filePath);
		if (sourceFile === undefined) {
			typeContextCache.set(cacheKey, undefined);
			return undefined;
		}

		const context = {
			checker: program.getTypeChecker(),
			program,
		};
		typeContextCache.set(cacheKey, context);
		return context;
	} catch {
		typeContextCache.set(cacheKey, undefined);
		return undefined;
	}
}
