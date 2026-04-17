import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

/**
 * Perform an HTTP POST with a JSON body and return an Effect that resolves
 * when the request succeeds.
 *
 * This function performs network I/O via `fetch` and therefore is not pure.
 * It reads the response body and will attempt to parse JSON error information
 * when available.
 *
 * @param path - Request path or full URL
 * @param body - Value to JSON.stringify and send as the request body
 * @returns Effect that resolves when the request succeeds; fails with Error
 *   when the response is not ok or the request fails. Error message prefers
 *   parsed JSON error text when available, otherwise includes the HTTP status.
 */
export default function postJson(path: string, body: unknown): Effect.Effect<void, Error> {
	return Effect.gen(function* postJsonEffect() {
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
	});
}
