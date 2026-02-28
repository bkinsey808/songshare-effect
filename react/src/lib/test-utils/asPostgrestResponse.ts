import type { PostgrestResponse } from "@supabase/postgrest-js";

/**
 * Test helper to coerce a value into the `PostgrestResponse<T>` shape expected
 * by the runtime helpers (which import the type from `@supabase/postgrest-js`).
 */
export default function asPostgrestResponse<TRows = unknown>(
	value: unknown,
): PostgrestResponse<TRows> {
	/*
	 * Construct a minimal PostgrestResponse<T>-shaped object so tests that
	 * mock the supabase response don't need to provide every field.
	 * Localized unsafe assertion is acceptable in test helpers.
	 */
	// When test author passes `undefined` explicitly we should return
	// `undefined` so that callers that assert the presence of a
	// Postgrest-shaped record will correctly detect a missing response.
	if (value === undefined) {
		// oxlint-disable-next-line typescript/no-unsafe-return -- test-only
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		return undefined as unknown as PostgrestResponse<TRows>;
	}

	const hasData = typeof value === "object" && value !== null && Object.hasOwn(value, "data");
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only narrow cast
	const data = hasData ? (value as Record<string, unknown>)["data"] : value;

	const resp = {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only narrow cast
		data: data as TRows,
		// oxlint-disable-next-line unicorn/no-null -- returned to match Postgrest shape
		error: null,
		// oxlint-disable-next-line unicorn/no-null -- returned to match Postgrest shape
		count: null,
		status: 200,
		statusText: "OK",
	};

	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test-only narrow cast
	return resp as unknown as PostgrestResponse<TRows>;
}
