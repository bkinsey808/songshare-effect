import { relative } from "node:path";

import { log as sLog } from "@/scripts/utils/scriptLogger";

/**
 * Logs a summary of generated schema outputs and suggested follow-up steps.
 *
 * @param params - Project paths used to render relative output locations.
 * @returns void
 */
export default function logFinalSummary(
	params: Readonly<{
		projectRoot: string;
		schemasPath: string;
		supabaseTypesPath?: string;
	}>,
): void {
	sLog("✅ Effect-TS schemas generated successfully!");
	sLog("📁 Generated files:");
	sLog(`  • ${relative(params.projectRoot, params.schemasPath)} (Effect schemas)`);
	if (params.supabaseTypesPath !== undefined) {
		sLog(`  • ${relative(params.projectRoot, params.supabaseTypesPath)} (Raw Supabase types)`);
	}
	sLog("");
	sLog("Next steps:");
	sLog("  1. Review and adjust the generated schemas");
	sLog("  2. Import them in your API and frontend code");
	sLog("  3. Replace manual schema definitions where appropriate");
}
