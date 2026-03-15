import { getEnvValueSafe } from "@/react/lib/utils/env";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

/**
 * Resolve the public web base URL for share links.
 *
 * - If running on localhost, prefer `VITE_WEB_BASE_URL` so QR codes map to staging/prod.
 * - Otherwise, use the current origin when available.
 *
 * @returns The base URL without a trailing slash, or empty string if unavailable
 */
export default function getPublicWebBaseUrl(): string {
	const envBase = getEnvValueSafe("WEB_BASE_URL");
	const hasWindow = globalThis.window !== undefined;
	const origin = hasWindow ? globalThis.window.location.origin : undefined;
	const hostname = hasWindow ? globalThis.window.location.hostname : undefined;
	const isLocalhost = hostname !== undefined && LOCAL_HOSTS.has(hostname);

	const rawBase = isLocalhost ? envBase ?? origin : origin ?? envBase;

	if (rawBase === undefined || rawBase === "") {
		return "";
	}

	return rawBase.replace(/\/+$/, "");
}
