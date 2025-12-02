import { execFileSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";

import { warn as sWarn, error as sError } from "@/scripts/utils/scriptLogger";

export type SupabaseGenerationConfig = {
	cliPath: string;
	projectRoot: string;
	tempTypesPath: string;
	env: NodeJS.ProcessEnv;
	projectRef: string;
};

// The config includes NodeJS.ProcessEnv which isn't readonly, so lint rule is disabled.
export function generateSupabaseTypes(
	config: Readonly<SupabaseGenerationConfig>,
): boolean {
	sWarn("📥 Generating Supabase TypeScript types...");
	const NO_LENGTH = 0;
	if (existsSync(config.tempTypesPath)) {
		rmSync(config.tempTypesPath);
	}

	if (config.projectRef === "") {
		sWarn(
			"⚠️  SUPABASE_PROJECT_REF not set. Skipping remote Supabase type generation.",
		);
		return false;
	}

	try {
		const supabaseOutput = execFileSync(
			config.cliPath,
			[
				"gen",
				"types",
				"typescript",
				"--project-id",
				config.projectRef,
				"--schema",
				"public",
			],
			{
				cwd: config.projectRoot,
				env: config.env,
				encoding: "utf8",
			},
		);

		if (supabaseOutput.trim().length > NO_LENGTH) {
			writeFileSync(config.tempTypesPath, supabaseOutput, "utf8");
			sWarn("✅ Successfully generated Supabase types");
			return true;
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		sError("❌ Error generating Supabase types:", message);
	}

	sWarn("⚠️  Failed to generate Supabase types from remote database");
	sWarn("This could be due to:");
	sWarn("  • Temporary Supabase API issues");
	sWarn("  • Project not found or no public schema");
	sWarn("  • Network connectivity issues");
	sWarn("");
	sWarn("🔧 Falling back to example schemas...");
	if (existsSync(config.tempTypesPath)) {
		rmSync(config.tempTypesPath);
	}
	return false;
}
