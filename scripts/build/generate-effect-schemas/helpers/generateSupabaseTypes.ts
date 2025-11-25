import { execFileSync } from "child_process";
import { existsSync, rmSync, writeFileSync } from "fs";

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
	console.log("📥 Generating Supabase TypeScript types...");
	if (existsSync(config.tempTypesPath)) {
		rmSync(config.tempTypesPath);
	}

	if (config.projectRef === "") {
		console.warn(
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

		if (supabaseOutput.trim().length > 0) {
			writeFileSync(config.tempTypesPath, supabaseOutput, "utf8");
			console.log("✅ Successfully generated Supabase types");
			return true;
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("❌ Error generating Supabase types:", message);
	}

	console.log("⚠️  Failed to generate Supabase types from remote database");
	console.log("This could be due to:");
	console.log("  • Temporary Supabase API issues");
	console.log("  • Project not found or no public schema");
	console.log("  • Network connectivity issues");
	console.log("");
	console.log("🔧 Falling back to example schemas...");
	if (existsSync(config.tempTypesPath)) {
		rmSync(config.tempTypesPath);
	}
	return false;
}
