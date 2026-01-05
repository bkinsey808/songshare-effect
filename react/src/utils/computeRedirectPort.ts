/**
 * Compute the redirect port to include in OAuth sign-in links.
 *
 * Behavior mirrors the previous inline implementation in SignInButtons:
 * - If no location is available (SSR or missing window.location) returns "".
 * - If an explicit port is present, returns that port string.
 * - Otherwise returns the dev default of "5173" for local development hosts
 *   (localhost, 127.0.0.1, or hosts ending with `.local`).
 *
 * An optional `locationOverride` can be passed for testing or to avoid
 * accessing `globalThis.location` directly.
 */
export default function computeRedirectPort(locationOverride?: {
	hostname?: string | null | undefined;
	port?: string | number | null | undefined;
}): string {
	// SSR or when globalThis isn't present: if no override provided, omit port
	if (typeof globalThis === "undefined" && !locationOverride) {
		return "";
	}

	// prefer override when provided (makes testing deterministic)
	let runtimePort = "";
	let runtimeHostname = "";

	// Avoid unsafe any casts. Treat globalThis as unknown and narrow to a shape
	// that may include a `location` object similar to Window.location.
	if (typeof globalThis !== "undefined") {
		const maybeGlobal: unknown = globalThis;
		if (typeof maybeGlobal === "object" && maybeGlobal !== null && "location" in maybeGlobal) {
			// Access `location` carefully by treating the global object as a record
			// and doing runtime checks before asserting a narrow shape.
			const record = maybeGlobal as Record<string, unknown>;
			const locValue = record["location"];

			if (typeof locValue === "object" && locValue !== null) {
				const loc = locValue as {
					port?: string | number | null;
					hostname?: string | null;
				};
				runtimePort = String(loc?.port ?? "");
				runtimeHostname = String(loc?.hostname ?? "");
			}
		}
	}

	const port = String(locationOverride?.port ?? runtimePort ?? "");
	const hostname = String(locationOverride?.hostname ?? runtimeHostname ?? "");

	// Only include redirect_port for local/dev hosts, or when an explicit port is set.
	if (
		// explicit port
		port !== "" ||
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		hostname.endsWith(".local")
	) {
		// fall back to dev default for localhost when port missing
		return port || "5173";
	}

	// production / no explicit port -> omit param
	return "";
}
