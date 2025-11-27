#!/usr/bin/env bun
/**
 * Enhanced script to generate Effect-TS schemas from Supabase generated types
 * This version includes a proper TypeScript AST parser to extract table definitions
 */
import { existsSync, rmSync } from "fs";
import { join } from "path";

import { assertPathExists } from "./helpers/assertPathExists";
import { generateEffectSchemasFile } from "./helpers/generateEffectSchemasFile";
import { generateSupabaseTypes } from "./helpers/generateSupabaseTypes";
import { loadEnvVariables } from "./helpers/loadEnvVariables";
import { logFinalSummary } from "./helpers/logFinalSummary";
import { logGeneratedTables } from "./helpers/logGeneratedTables";
import { moveSupabaseTypes } from "./helpers/moveSupabaseTypes";
import { parseSupabaseTypes } from "./helpers/parseSupabaseTypes";
import { runEslintFix } from "./helpers/runEslintFix";
import { runPrettierWrite } from "./helpers/runPrettierWrite";

// Main execution
function main(): void {
	const projectRoot = process.cwd();
	const tempSupabaseTypesPath = join(projectRoot, "temp-supabase-types.ts");
	const sharedGeneratedDir = join(projectRoot, "shared", "src", "generated");
	const supabaseTypesDestination = join(sharedGeneratedDir, "supabaseTypes.ts");
	const schemasOutputPath = join(sharedGeneratedDir, "supabaseSchemas.ts");

	// oxlint-disable-next-line no-console
	console.log("🚀 Generating Effect-TS schemas from Supabase...");

	const envPath = join(projectRoot, ".env");
	assertPathExists({
		path: envPath,
		errorMessage:
			"❌ .env file not found. Please create one with SUPABASE_PROJECT_REF",
	});

	const supabaseCliPath = join(projectRoot, "node_modules", ".bin", "supabase");
	assertPathExists({
		path: supabaseCliPath,
		errorMessage:
			"❌ Supabase CLI not found. Install it with: npm install -D supabase",
	});

	const eslintCliPath = join(projectRoot, "node_modules", ".bin", "eslint");
	assertPathExists({
		path: eslintCliPath,
		errorMessage:
			"❌ ESLint binary not found. Install it with: npm install -D eslint",
	});

	const prettierCliPath = join(projectRoot, "node_modules", ".bin", "prettier");
	assertPathExists({
		path: prettierCliPath,
		errorMessage:
			"❌ Prettier binary not found. Install it with: npm install -D prettier",
	});

	const envFromFile = loadEnvVariables(envPath);
	const mergedEnv = { ...process.env, ...envFromFile } as NodeJS.ProcessEnv;
	const projectRef = mergedEnv["SUPABASE_PROJECT_REF"] ?? "";

	const supabaseTypesGenerated = generateSupabaseTypes({
		cliPath: supabaseCliPath,
		projectRoot,
		tempTypesPath: tempSupabaseTypesPath,
		env: mergedEnv,
		projectRef,
	});

	// oxlint-disable-next-line no-console
	console.log("⚡ Converting to Effect-TS schemas...");
	// oxlint-disable-next-line no-console
	console.log("🔄 Parsing Supabase types...");
	const tables = parseSupabaseTypes(tempSupabaseTypesPath);
	logGeneratedTables(tables);

	// oxlint-disable-next-line no-console
	console.log("⚡ Generating Effect schemas...");
	generateEffectSchemasFile(tables, schemasOutputPath);

	const supabaseTypesFinalPath = moveSupabaseTypes({
		tempPath: tempSupabaseTypesPath,
		destinationPath: supabaseTypesDestination,
		generated: supabaseTypesGenerated,
	});

	const lintTargets: ReadonlyArray<string> =
		supabaseTypesFinalPath === undefined
			? [schemasOutputPath]
			: [schemasOutputPath, supabaseTypesFinalPath];

	runEslintFix({
		projectRoot,
		files: lintTargets,
		cliPath: eslintCliPath,
	});
	runPrettierWrite({
		projectRoot,
		files: lintTargets,
		cliPath: prettierCliPath,
	});

	if (
		supabaseTypesFinalPath === undefined &&
		existsSync(tempSupabaseTypesPath)
	) {
		rmSync(tempSupabaseTypesPath);
	}

	const summaryConfig =
		supabaseTypesFinalPath === undefined
			? { projectRoot, schemasPath: schemasOutputPath }
			: {
					projectRoot,
					schemasPath: schemasOutputPath,
					supabaseTypesPath: supabaseTypesFinalPath,
				};

	logFinalSummary(summaryConfig);
}

if (import.meta.main) {
	main();
}
