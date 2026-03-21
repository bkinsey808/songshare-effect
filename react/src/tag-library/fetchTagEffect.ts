import { Effect } from "effect";

/**
 * Performs a POST request and wraps the result in an Effect.
 *
 * Sends `body` as JSON to `path` and includes credentials for same-origin
 * or cross-site requests that require cookies.
 *
 * @param path - URL or API path to POST to
 * @param body - Plain object to be serialized as the JSON request body
 * @returns Effect that resolves to the underlying `Response` or fails with an `Error`
 */
export default function fetchTagEffect(path: string, body: object): Effect.Effect<Response, Error> {
	return Effect.tryPromise({
		try: () =>
			fetch(path, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
				credentials: "include",
			}),
		catch: (error) => new Error(String(error)),
	});
}
