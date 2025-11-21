import { getAllowedOrigins } from "@/api/cors/getAllowedOrigins";
import { normalizeOrigin } from "@/api/cors/normalizeOrigin";

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
