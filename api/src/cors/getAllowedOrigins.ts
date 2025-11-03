import { DEFAULT_DEV_ORIGINS } from "./defaultDevOrigins";
import { normalizeOrigin } from "./normalizeOrigin";

export function getAllowedOrigins(
	envLike: Record<string, string | undefined>,
): string[] {
	const allowedOriginsEnv = envLike.ALLOWED_ORIGINS;

	if (typeof allowedOriginsEnv === "string" && allowedOriginsEnv.length > 0) {
		const list = allowedOriginsEnv
			.split(",")
			.map((raw) => normalizeOrigin(raw))
			.filter(Boolean)
			// Explicitly ignore wildcard entries for credentialed requests
			.filter((origin) => origin !== "*");

		if (list.length > 0) {
			return list;
		}
	}

	return DEFAULT_DEV_ORIGINS;
}
