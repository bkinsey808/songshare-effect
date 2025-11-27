import { relative } from "path";

export function logFinalSummary(
	params: Readonly<{
		projectRoot: string;
		schemasPath: string;
		supabaseTypesPath?: string;
	}>,
): void {
	// oxlint-disable-next-line no-console
	console.log("✅ Effect-TS schemas generated successfully!");
	// oxlint-disable-next-line no-console
	console.log("📁 Generated files:");
	// oxlint-disable-next-line no-console
	console.log(
		`  • ${relative(params.projectRoot, params.schemasPath)} (Effect schemas)`,
	);
	if (params.supabaseTypesPath !== undefined) {
		// oxlint-disable-next-line no-console
		console.log(
			`  • ${relative(params.projectRoot, params.supabaseTypesPath)} (Raw Supabase types)`,
		);
	}

	// oxlint-disable-next-line no-console
	console.log("");
	// oxlint-disable-next-line no-console
	console.log("Next steps:");
	// oxlint-disable-next-line no-console
	console.log("  1. Review and adjust the generated schemas");
	// oxlint-disable-next-line no-console
	console.log("  2. Import them in your API and frontend code");
	// oxlint-disable-next-line no-console
	console.log("  3. Replace manual schema definitions where appropriate");
}
