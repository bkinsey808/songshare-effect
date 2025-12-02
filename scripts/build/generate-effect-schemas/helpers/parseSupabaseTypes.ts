import { existsSync, readFileSync } from "node:fs";

import { warn as sWarn, error as sError } from "@/scripts/utils/scriptLogger";
import createExampleSchemas from "./createExampleSchemas";
import computeTables from "./computeTables";
import {
	type TableDefinition,
} from "./generate-effect-schemas-types";

/**
 * Parse Supabase generated TypeScript types and return simplified table/column metadata.
 */
export default function parseSupabaseTypes(filePath: string): TableDefinition[] {
	if (!existsSync(filePath)) {
		sWarn(`⚠️  Supabase types file not found: ${filePath}`);
		sWarn("🔧 Creating example schemas based on your existing codebase...");
		return createExampleSchemas();
	}

	const file = readFileSync(filePath, "utf8");

	try {
		const tables = computeTables(file);

		const NO_TABLES = 0;
		if (tables.length === NO_TABLES) {
			sWarn("⚠️  No tables found in Supabase types. Using example schemas...");
			return createExampleSchemas();
		}

		return tables;
	} catch (error) {
		sError("❌ Error parsing Supabase types:", error);
		sWarn("🔧 Falling back to example schemas...");
		return createExampleSchemas();
	}
}
