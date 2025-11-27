import { getAllowedOrigins } from "@/api/cors/getAllowedOrigins";
import { normalizeOrigin } from "@/api/cors/normalizeOrigin";

export function isOriginAllowed(
	origin: string | null | undefined,

	envLike: Record<string, string | undefined>,
): boolean {
	const ZERO = 0;

	if (typeof origin !== "string" || origin.length === ZERO) {
		return false;
	}
	const normalized = normalizeOrigin(origin);
	const allowed = getAllowedOrigins(envLike);
	return allowed.includes(normalized);
}
