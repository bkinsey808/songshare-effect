/* eslint-disable no-console */
import { relative } from "path";

export function logFinalSummary(
	params: Readonly<{
		projectRoot: string;
		schemasPath: string;
		supabaseTypesPath?: string;
	}>,
): void {
	console.log("✅ Effect-TS schemas generated successfully!");
	console.log("📁 Generated files:");
	console.log(
		`  • ${relative(params.projectRoot, params.schemasPath)} (Effect schemas)`,
	);
	if (params.supabaseTypesPath !== undefined) {
		console.log(
			`  • ${relative(params.projectRoot, params.supabaseTypesPath)} (Raw Supabase types)`,
		);
	}

	console.log("");
	console.log("Next steps:");
	console.log("  1. Review and adjust the generated schemas");
	console.log("  2. Import them in your API and frontend code");
	console.log("  3. Replace manual schema definitions where appropriate");
}
