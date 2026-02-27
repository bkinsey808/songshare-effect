import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import isRecord from "@/shared/type-guards/isRecord";

/**
 * Perform a POST with a JSON body and return the JSON response.
 * If the response matches the ApiResponse<T> shape, the 'data' field is returned.
 *
 * @param path - Request path or full URL
 * @param body - Value to JSON.stringify and send as the request body
 * @returns - Resolves with the response data (unwrapped if it's an ApiResponse);
 *             rejects with an Error when the response is not ok
 */
export default async function postJsonWithResult<TResult>(
	path: string,
	body: unknown,
): Promise<TResult> {
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

	const result: unknown = await response.json();

	// If it's a standard ApiResponse wrapper, unwrap the data
	if (isRecord(result) && typeof result["success"] === "boolean" && result["success"]) {
		// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
		return result["data"] as TResult;
	}

	// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
	return result as TResult;
}
