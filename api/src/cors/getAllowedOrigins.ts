import DEFAULT_DEV_ORIGINS from "@/api/cors/defaultDevOrigins";
import normalizeOrigin from "@/api/cors/normalizeOrigin";
import { isRecord } from "@/shared/utils/typeGuards";

export default function getAllowedOrigins(envLike: unknown): string[] {
	const ZERO = 0;
	// Accept an unknown runtime env object and safely extract the
	// ALLOWED_ORIGINS binding if present and a string. This keeps callers
	// free from unsafe narrowing casts like `as unknown as Record<...>`.
	const allowedOriginsEnv =
		isRecord(envLike) &&
		Object.hasOwn(envLike, "ALLOWED_ORIGINS") &&
		typeof envLike["ALLOWED_ORIGINS"] === "string"
			? envLike["ALLOWED_ORIGINS"]
			: undefined;

	if (typeof allowedOriginsEnv === "string" && allowedOriginsEnv.length > ZERO) {
		const list = allowedOriginsEnv
			.split(",")
			.map((raw) => normalizeOrigin(raw))
			.filter(Boolean)
			// Explicitly ignore wildcard entries for credentialed requests
			.filter((origin) => origin !== "*");

		if (list.length > ZERO) {
			return list;
		}
	}

	return DEFAULT_DEV_ORIGINS;
}
