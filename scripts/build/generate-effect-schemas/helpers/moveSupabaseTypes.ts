
import { existsSync, mkdirSync, renameSync, rmSync } from "fs";
import { dirname } from "path";

export type MoveSupabaseTypesConfig = {
	tempPath: string;
	destinationPath: string;
	generated: boolean;
};

export function moveSupabaseTypes(config: Readonly<MoveSupabaseTypesConfig>): string | undefined {
	if (!config.generated || !existsSync(config.tempPath)) {
		console.log("📁 No types file to move (using fallback schemas)");
		return undefined;
	}

	console.log("📁 Moving Supabase types to shared/src/generated directory...");
	try {
		mkdirSync(dirname(config.destinationPath), { recursive: true });
		renameSync(config.tempPath, config.destinationPath);
		return config.destinationPath;
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn("Warning: could not move Supabase types:", message);
		if (existsSync(config.tempPath)) {
			rmSync(config.tempPath);
		}
		return undefined;
	}
}
