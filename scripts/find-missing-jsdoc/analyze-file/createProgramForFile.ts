import path from "node:path";

import {
	createProgram,
	JsxEmit,
	ModuleKind,
	ModuleResolutionKind,
	parseJsonConfigFileContent,
	readConfigFile,
	ScriptTarget,
	sys,
	type Program,
} from "typescript";

/**
 * Create a TypeScript program for the file's project, or a standalone fallback.
 * @param filePath - File path being analyzed.
 * @param configPath - Nearest tsconfig path when available.
 * @returns Program that can answer type questions for the file.
 */
export default function createProgramForFile(filePath: string, configPath?: string): Program {
	if (configPath === undefined) {
		return createProgram({
			options: {
				jsx: JsxEmit.ReactJSX,
				module: ModuleKind.ESNext,
				moduleResolution: ModuleResolutionKind.Bundler,
				skipLibCheck: true,
				strict: true,
				target: ScriptTarget.Latest,
			},
			rootNames: [filePath],
		});
	}

	const configFile = readConfigFile(configPath, (fileName) => sys.readFile(fileName));
	const parsedConfig = parseJsonConfigFileContent(configFile.config, sys, path.dirname(configPath));
	return createProgram({
		options: parsedConfig.options,
		rootNames: parsedConfig.fileNames,
	});
}
