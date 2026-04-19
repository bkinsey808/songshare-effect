/* oxlint-disable @typescript-eslint/no-unsafe-type-assertion, promise/prefer-await-to-then */

/**
 * Test helper to mock a fetch Response object.
 *
 * Localizing the ESLint disables here keeps test files clean.
 *
 * @param data - Response body returned by `json()` and optionally `text()`.
 * @param options - Partial response overrides plus optional JSON/text errors.
 * @returns A mocked `Response` object.
 */
export default function mockFetchResponse<TValue>(
	data: TValue,
	options: Partial<Response> & { jsonError?: Error; textError?: Error } = {},
): Response {
	const DEFAULT_OK_STATUS = 200;
	return {
		ok: options.ok ?? true,
		status: options.status ?? DEFAULT_OK_STATUS,
		json: () => (options.jsonError ? Promise.reject(options.jsonError) : Promise.resolve(data)),
		text: () =>
			options.textError
				? Promise.reject(options.textError)
				: Promise.resolve(typeof data === "string" ? data : JSON.stringify(data)),
		...options,
	} as Response;
}
