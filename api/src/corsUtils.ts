// Centralized CORS helpers used by middleware and CSRF checks.
import type { Context } from "hono";

const DEFAULT_DEV_ORIGINS = [
	"http://localhost:5173",
	"http://localhost:5174",
	"http://localhost:3000",
	"https://your-pages-domain.pages.dev",
];

function normalizeOrigin(raw: string): string {
	// Trim and remove any trailing slash characters to normalize comparisons.
	// Avoids using a regex which some linters warn about for super-linear
	// backtracking in extreme cases. This uses a simple loop instead.
	const trimmed = raw.trim();
	let end = trimmed.length;
	while (end > 0 && trimmed.charAt(end - 1) === "/") {
		end -= 1;
	}
	return trimmed.slice(0, end);
}

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

export function getOriginToCheck(ctx: Context): string {
	const originHeader = ctx.req.header("Origin");
	const refererHeader = ctx.req.header("Referer");

	if (typeof originHeader === "string" && originHeader.length > 0) {
		return normalizeOrigin(originHeader);
	}

	if (typeof refererHeader === "string" && refererHeader.length > 0) {
		try {
			const parsed = new URL(refererHeader);
			return normalizeOrigin(parsed.origin);
		} catch {
			return "";
		}
	}

	return "";
}
