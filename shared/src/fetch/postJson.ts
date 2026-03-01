import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

/**
 * Perform an HTTP POST with a JSON body and throw when the response is not ok.
 *
 * This function performs network I/O via `fetch` and therefore is not pure.
 * It reads the response body and will attempt to parse JSON error information
 * when available.
 *
 * @param path - Request path or full URL
 * @param body - Value to JSON.stringify and send as the request body
 * @returns Resolves when the request succeeds.
 * @throws Error - When the response is not ok or the request fails. The error
 *   message prefers parsed JSON error text when available,
 *   otherwise includes the HTTP status.
 */
export default async function postJson(path: string, body: unknown): Promise<void> {
	type RequestInitWithCredentials = RequestInit & { credentials?: string };
	const init: RequestInitWithCredentials = {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify(body),
	};

	const response = await fetch(path, init);

	if (!response.ok) {
		let errorText = "";
		try {
			errorText = await response.text();
			try {
				const json: unknown = JSON.parse(errorText);
				errorText = extractErrorMessage(json, errorText);
			} catch {
				// Not JSON, use as-is
			}
		} catch {
			errorText = `Request failed (${response.status})`;
		}
		throw new Error(errorText === "" ? `Request failed (${response.status})` : errorText);
	}
}
