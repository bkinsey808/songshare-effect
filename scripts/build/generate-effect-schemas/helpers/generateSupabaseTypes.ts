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
	console.warn("📥 Generating Supabase TypeScript types...");
	const NO_LENGTH = 0;
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

		if (supabaseOutput.trim().length > NO_LENGTH) {
			writeFileSync(config.tempTypesPath, supabaseOutput, "utf8");
			console.warn("✅ Successfully generated Supabase types");
			return true;
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("❌ Error generating Supabase types:", message);
	}

	console.warn("⚠️  Failed to generate Supabase types from remote database");
	console.warn("This could be due to:");
	console.warn("  • Temporary Supabase API issues");
	console.warn("  • Project not found or no public schema");
	console.warn("  • Network connectivity issues");
	console.warn("");
	console.warn("🔧 Falling back to example schemas...");
	if (existsSync(config.tempTypesPath)) {
		rmSync(config.tempTypesPath);
	}
	return false;
}
