import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import isRecord from "@/shared/type-guards/isRecord";

/**
 * Perform a POST with a JSON body and return the JSON response.
 * If the response matches the ApiResponse<T> shape, the 'data' field is returned.
 *
 * @param path - Request path or full URL
 * @param body - Value to JSON.stringify and send as the request body
 * @returns Effect that resolves with the response data, unwrapped when it matches ApiResponse;
 *   fails with Error when the response is not ok or the request fails. Error message prefers
 *   parsed JSON error text when available, otherwise includes the HTTP status.
 */
export default function postJsonWithResult<TResult>(
	path: string,
	body: unknown,
): Effect.Effect<TResult, Error> {
	return Effect.gen(function* postJsonWithResultEffect() {
		type RequestInitWithCredentials = RequestInit & { credentials?: string };
		const init: RequestInitWithCredentials = {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(body),
		};

		const response = yield* Effect.tryPromise({
			try: () => fetch(path, init),
			catch: (reason) =>
				reason instanceof Error ? reason : new Error(String(reason)),
		});

		if (!response.ok) {
			let errorText = "";
			try {
				errorText = yield* Effect.tryPromise({
					try: () => response.text(),
					catch: () =>
						new Error(`Request failed (${response.status})`),
				});
				if (errorText) {
					try {
						const json: unknown = JSON.parse(errorText);
						errorText = extractErrorMessage(json, errorText);
					} catch {
						// Not JSON, use as-is
					}
				}
			} catch {
				errorText = `Request failed (${response.status})`;
			}
			yield* Effect.fail(
				new Error(errorText === "" ? `Request failed (${response.status})` : errorText),
			);
		}

		const result: unknown = yield* Effect.tryPromise({
			try: () => response.json(),
			catch: (reason) =>
				reason instanceof Error ? reason : new Error(String(reason)),
		});

		// If it's a standard ApiResponse wrapper, unwrap the data
		if (isRecord(result) && typeof result["success"] === "boolean" && result["success"]) {
			// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
			return result["data"] as TResult;
		}

		// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
		return result as TResult;
	});
}
