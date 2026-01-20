#!/usr/bin/env bun
/**
 * Enhanced script to generate Effect-TS schemas from Supabase generated types
 * This version includes a proper TypeScript AST parser to extract table definitions
 */
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

import { log as sLog } from "../../utils/scriptLogger";
import assertPathExists from "./helpers/assertPathExists";
import generateEffectSchemasFile from "./helpers/generateEffectSchemasFile";
import { generateSupabaseTypes } from "./helpers/generateSupabaseTypes";
import loadEnvVariables from "./helpers/loadEnvVariables";
import logFinalSummary from "./helpers/logFinalSummary";
import logGeneratedTables from "./helpers/logGeneratedTables";
import { moveSupabaseTypes } from "./helpers/moveSupabaseTypes";
import parseSupabaseTypes from "./helpers/parseSupabaseTypes";
import runFormatterWrite from "./helpers/runFormatterWrite";
import runLintFix from "./helpers/runLintFix";

// Main execution
function main(): void {
	const projectRoot = process.cwd();
	const tempSupabaseTypesPath = join(projectRoot, "temp-supabase-types.ts");
	const sharedGeneratedDir = join(projectRoot, "shared", "src", "generated");
	const supabaseTypesDestination = join(sharedGeneratedDir, "supabaseTypes.ts");
	const schemasOutputPath = join(sharedGeneratedDir, "supabaseSchemas.ts");

	sLog("🚀 Generating Effect-TS schemas from Supabase...");

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

	const oxlintCliPath = join(projectRoot, "node_modules", ".bin", "oxlint");
	assertPathExists({
		path: oxlintCliPath,
		errorMessage:
			"❌ oxlint binary not found. Install it with: npm install -D oxlint",
	});

	const oxfmtCliPath = join(projectRoot, "node_modules", ".bin", "oxfmt");
	assertPathExists({
		path: oxfmtCliPath,
		errorMessage:
			"❌ oxfmt binary not found. Install it with: npm install -D oxfmt",
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

	sLog("⚡ Converting to Effect-TS schemas...");
	sLog("🔄 Parsing Supabase types...");
	const tables = parseSupabaseTypes(tempSupabaseTypesPath);
	logGeneratedTables(tables);

	sLog("⚡ Generating Effect schemas...");
	generateEffectSchemasFile(tables, schemasOutputPath);

	const supabaseTypesFinalPath = moveSupabaseTypes({
		tempPath: tempSupabaseTypesPath,
		destinationPath: supabaseTypesDestination,
		generated: supabaseTypesGenerated,
	});

	const lintTargets: readonly string[] =
		supabaseTypesFinalPath === undefined
			? [schemasOutputPath]
			: [schemasOutputPath, supabaseTypesFinalPath];

	runLintFix({
		projectRoot,
		files: lintTargets,
		cliPath: oxlintCliPath,
	});
	runFormatterWrite({
		projectRoot,
		files: lintTargets,
		cliPath: oxfmtCliPath,
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

const _importMetaMain = (import.meta as { main?: boolean | undefined }).main;
if (_importMetaMain === true) {
	main();
}
