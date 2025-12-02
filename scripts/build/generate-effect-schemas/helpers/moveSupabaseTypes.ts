import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname } from "node:path";

import { warn as sWarn } from "@/scripts/utils/scriptLogger";

export type MoveSupabaseTypesConfig = {
	tempPath: string;
	destinationPath: string;
	generated: boolean;
};

export function moveSupabaseTypes(
	config: Readonly<MoveSupabaseTypesConfig>,
): string | undefined {
	if (!config.generated || !existsSync(config.tempPath)) {
		sWarn("📁 No types file to move (using fallback schemas)");
		return undefined;
	}

	sWarn("📁 Moving Supabase types to shared/src/generated directory...");
	try {
		mkdirSync(dirname(config.destinationPath), { recursive: true });
		renameSync(config.tempPath, config.destinationPath);
		return config.destinationPath;
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		sWarn("Warning: could not move Supabase types:", message);
		if (existsSync(config.tempPath)) {
			rmSync(config.tempPath);
		}
		return undefined;
	}
}
