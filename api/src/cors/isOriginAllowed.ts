import getAllowedOrigins from "@/api/cors/getAllowedOrigins";
import normalizeOrigin from "@/api/cors/normalizeOrigin";
import { ZERO } from "@/shared/constants/shared-constants";

/**
 * Determine whether a request origin is allowed for the given environment.
 *
 * @param origin - The incoming request origin header value (may be null/undefined)
 * @param envLike - Environment-like bindings used to compute allowed origins
 * @returns True when the origin is allowed
 */
export default function isOriginAllowed(
	origin: string | null | undefined,

	envLike: Record<string, string | undefined>,
): boolean {
	if (typeof origin !== "string" || origin.length === ZERO) {
		return false;
	}
	const normalized = normalizeOrigin(origin);
	const allowed = getAllowedOrigins(envLike);
	return allowed.includes(normalized);
}
