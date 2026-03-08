import type { PostgrestResponse } from "@supabase/postgrest-js";

/**
 * Resolves a maybe-mocked PostgREST response. Some tests intentionally do not
 * stub newer follow-up queries; in that case we treat the missing response as
 * an empty successful result.
 *
 * @param fetcher - callback returning a PostgREST response or `undefined`
 * @returns resolved PostgREST response, or an empty success response
 */
export default async function fetchOptionalPostgrestResponse<TRow>(
	fetcher: () =>
		| Promise<PostgrestResponse<TRow> | undefined>
		| PostgrestResponse<TRow>
		| undefined,
): Promise<PostgrestResponse<TRow>> {
	const response = await Promise.resolve(fetcher());
	if (response !== undefined) {
		return response;
	}

	const emptyResponse = {
		data: [],
		// oxlint-disable-next-line unicorn/no-null -- PostgREST success shape uses null
		error: null,
		// oxlint-disable-next-line unicorn/no-null -- PostgREST success shape uses null
		count: null,
		status: 200,
		statusText: "OK",
	};

	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- centralized compatibility shim for optional mocks
	return emptyResponse as PostgrestResponse<TRow>;
}
