import type { Context } from "hono";

import type { Env } from "@/api/env";

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
}: {
	ctx: Context<{ Bindings: Env }>;
	url: URL;
	redirectPortStr: string;
	lang: string;
	dashboardPathLocal: string;
}): string | undefined {
	const portNum = Number(redirectPortStr);
	if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
		// eslint-disable-next-line no-console
		console.log("[oauthCallback] Invalid redirect_port, ignoring");
		return undefined;
	}

	const envRec = ctx.env as unknown as Record<string, string | undefined>;
	const allowedOriginsRaw = envRec.ALLOWED_ORIGINS ?? "";
	const allowedOrigins = allowedOriginsRaw
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);

	const headerProto = ctx.req.header("x-forwarded-proto") ?? "";
	let redirectProto = url.protocol.replace(":", "");
	if (headerProto.length > 0) {
		redirectProto = headerProto;
	}
	const forwardedHost = ctx.req.header("x-forwarded-host") ?? "";
	const hostNoPort = forwardedHost.length > 0 ? forwardedHost : url.hostname;
	const candidateOrigin = `${redirectProto}://${hostNoPort.replace(/:\\d+$/, "")}:${portNum}`;

	if (allowedOrigins.length > 0) {
		if (allowedOrigins.includes(candidateOrigin)) {
			return `${redirectProto}://${hostNoPort.replace(/:\\d+$/, "")}:${portNum}/${lang}/${dashboardPathLocal}`;
		}
		// eslint-disable-next-line no-console
		console.log(
			"[oauthCallback] Candidate origin not in ALLOWED_ORIGINS, ignoring redirect_port",
			candidateOrigin,
		);
		return undefined;
	}

	// No ALLOWED_ORIGINS configured. In non-production allow the redirect for
	// developer convenience (but log a warning). In production ALLOWED_ORIGINS
	// should be set and we will not allow arbitrary origins.
	if ((envRec.ENVIRONMENT ?? "") !== "production") {
		console.warn(
			"[oauthCallback] ALLOWED_ORIGINS not set; allowing redirect_port candidate in non-production:",
			candidateOrigin,
		);
		return `${redirectProto}://${hostNoPort.replace(/:\\d+$/, "")}:${portNum}/${lang}/${dashboardPathLocal}`;
	}

	// eslint-disable-next-line no-console
	console.log(
		"[oauthCallback] ALLOWED_ORIGINS not set and environment is production — ignoring redirect_port",
		candidateOrigin,
	);
	return undefined;
}
