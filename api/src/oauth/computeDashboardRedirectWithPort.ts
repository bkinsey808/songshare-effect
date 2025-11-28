import { type ReadonlyContext } from "@/api/hono/hono-context";
import { getEnvString } from "@/shared/env/getEnv";
import { type ReadonlyDeep } from "@/shared/types/deep-readonly";

type ComputeDashboardRedirectWithPortParams = ReadonlyDeep<{
	// Mark each top-level property as `readonly` so the prefer-readonly rule
	// recognizes this as an immutable param type.
	readonly ctx: ReadonlyContext;
	readonly url: URL;
	readonly redirectPortStr: string;
	readonly lang: string;
	readonly dashboardPathLocal: string;
}>;

/**
 * Validate redirect_port and build an absolute dashboard URL when allowed.
 * Kept as a small pure-ish helper that still consults `ctx.env` and headers.
 */
export function computeDashboardRedirectWithPort({
	ctx,
	url,
	redirectPortStr,
	lang,
	dashboardPathLocal,
}: ComputeDashboardRedirectWithPortParams): string | undefined {
	const portNum = Number(redirectPortStr);
	const MIN_PORT = 1;
	const MAX_PORT = 65535;

	if (!Number.isInteger(portNum) || portNum < MIN_PORT || portNum > MAX_PORT) {
		// oxlint-disable-next-line no-console
		console.log("[oauthCallback] Invalid redirect_port, ignoring");
		return undefined;
	}

	// Read ALLOWED_ORIGINS string via helper to avoid unsafe casts at call
	// sites. Keep behavior identical to the previous implementation: treat
	// missing/empty ALLOWED_ORIGINS as no configured origins.
	const allowedOriginsRaw = getEnvString(ctx.env, "ALLOWED_ORIGINS") ?? "";
	const allowedOrigins = allowedOriginsRaw
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);

	const headerProto = ctx.req.header("x-forwarded-proto") ?? "";
	let redirectProto = url.protocol.replace(":", "");
	if (headerProto) {
		redirectProto = headerProto;
	}
	const forwardedHost = ctx.req.header("x-forwarded-host") ?? "";
	const hostNoPort = forwardedHost ? forwardedHost : url.hostname;
	const candidateOrigin = `${redirectProto}://${hostNoPort.replace(/:\\d+$/, "")}:${portNum}`;

	if (allowedOrigins.length) {
		if (allowedOrigins.includes(candidateOrigin)) {
			return `${redirectProto}://${hostNoPort.replace(/:\\d+$/, "")}:${portNum}/${lang}/${dashboardPathLocal}`;
		}
		// oxlint-disable-next-line no-console
		console.log(
			"[oauthCallback] Candidate origin not in ALLOWED_ORIGINS, ignoring redirect_port",
			candidateOrigin,
		);
		return undefined;
	}

	// No ALLOWED_ORIGINS configured. In non-production allow the redirect for
	// developer convenience (but log a warning). In production ALLOWED_ORIGINS
	// should be set and we will not allow arbitrary origins.
	if ((getEnvString(ctx.env, "ENVIRONMENT") ?? "") !== "production") {
		console.warn(
			"[oauthCallback] ALLOWED_ORIGINS not set; allowing redirect_port candidate in non-production:",
			candidateOrigin,
		);
		return `${redirectProto}://${hostNoPort.replace(/:\\d+$/, "")}:${portNum}/${lang}/${dashboardPathLocal}`;
	}

	// oxlint-disable-next-line no-console
	console.log(
		"[oauthCallback] ALLOWED_ORIGINS not set and environment is production — ignoring redirect_port",
		candidateOrigin,
	);
	return undefined;
}
