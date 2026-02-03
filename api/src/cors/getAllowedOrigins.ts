import normalizeOrigin from "@/api/cors/normalizeOrigin";
import isRecord from "@/shared/type-guards/isRecord";

/** Default allowed origins used when ALLOWED_ORIGINS is not provided. */
const DEFAULT_DEV_ORIGINS: string[] = [
	"http://localhost:5173",
	"https://localhost:5173",
	"http://localhost:5174",
	"https://localhost:5174",
	"http://localhost:3000",
	"https://localhost:3000",
	"https://your-pages-domain.pages.dev",
];

/**
 * Determine the allowed CORS origins from a runtime env-like object.
 *
 * Reads the `ALLOWED_ORIGINS` binding (comma-separated string), normalizes
 * each origin, removes empty entries and the wildcard `"*"` (wildcards are
 * ignored for credentialed requests), and returns the resulting list. If no
 * valid origins are found the function falls back to
 * `DEFAULT_DEV_ORIGINS`.
 *
 * @param envLike - Runtime environment-like object to read bindings from.
 * @returns - Array of allowed origin strings for CORS configuration.
 */
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
