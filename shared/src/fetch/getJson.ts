import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import isRecord from "@/shared/type-guards/isRecord";

/**
 * Perform an authenticated GET request and return the JSON response.
 * If the response matches the ApiResponse<T> shape (success: true, data: ...),
 * the 'data' field is returned.
 *
 * @param path - The API endpoint path
 * @returns The parsed JSON response (unwrapped if it's an ApiResponse)
 * @throws Error if the request fails
 */
export default async function getJson<TResult>(path: string): Promise<TResult> {
	type RequestInitWithCredentials = RequestInit & { credentials?: string };
	const init: RequestInitWithCredentials = {
		method: "GET",
		headers: {
			Accept: "application/json",
		},
		// Credentials ensure session cookies are sent for authentication
		credentials: "include",
	};

	try {
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
				errorText = response.statusText || `GET request failed (${response.status})`;
			}
			throw new Error(errorText);
		}

		const result: unknown = await response.json();

		// If it's a standard ApiResponse wrapper, unwrap the data
		if (isRecord(result) && typeof result["success"] === "boolean" && result["success"]) {
			// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
			return result["data"] as TResult;
		}

		// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
		return result as TResult;
	} catch (error: unknown) {
		throw new Error(extractErrorMessage(error, `GET request failed for ${path}`), {
			cause: error,
		});
	}
}
