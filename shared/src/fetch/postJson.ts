import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

/**
 * Perform a POST with a JSON body and throw when the response is not ok.
 *
 * @param path - Request path or full URL
 * @param body - Value to JSON.stringify and send as the request body
 * @returns - Resolves when the request succeeds; rejects with an Error when the
 *             response is not ok (uses response.text() if available)
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
