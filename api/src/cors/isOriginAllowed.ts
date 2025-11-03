import { getAllowedOrigins } from "./getAllowedOrigins";
import { normalizeOrigin } from "./normalizeOrigin";

export function isOriginAllowed(
	origin: string | null | undefined,
	envLike: Record<string, string | undefined>,
): boolean {
	if (typeof origin !== "string" || origin.length === 0) {
		return false;
	}
	const normalized = normalizeOrigin(origin);
	const allowed = getAllowedOrigins(envLike);
	return allowed.includes(normalized);
}
