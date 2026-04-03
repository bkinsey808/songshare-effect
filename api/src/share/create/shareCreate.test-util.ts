/**
 * Test helper for shareCreate - builds a minimal Supabase client stub for validation.
 * Returns { user_id } or { owner_id } so validateSharedItemAccess returns true.
 */
import type getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import forceCast from "@/shared/test-utils/forceCast.test-util";

/**
 * Helper to resolve a Promise with a mock Row-like object.
 * @param data - The data to resolve with.
 * @returns A promise resolving to the data and no error.
 */
function singleResolve(data: { user_id?: string; owner_id?: string }): Promise<{
	data: { user_id?: string; owner_id?: string };
	error: Error | undefined;
}> {
	return Promise.resolve({ data, error: undefined });
}

type SingleResult = Promise<{
	data: { user_id?: string; owner_id?: string };
	error: Error | undefined;
}>;

/**
 * Creates a mock Supabase client for share creation tests.
 * @param ownerId - The owner ID to return for access checks.
 * @returns A mock Supabase server client.
 */
export default function makeShareClient(
	ownerId: string,
): ReturnType<typeof getSupabaseServerClient> {
	const stub = {
		from: (
			table: string,
		): {
			select: () => { eq: () => { single: () => SingleResult } };
		} => ({
			select: (): { eq: () => { single: () => SingleResult } } => ({
				eq: (): { single: () => SingleResult } => ({
					single: (): SingleResult =>
						table === "user"
							? singleResolve({ user_id: "any" })
							: singleResolve(
									table === "event" || table === "community"
										? { owner_id: ownerId }
										: { user_id: ownerId },
								),
				}),
			}),
		}),
	};
	return forceCast<ReturnType<typeof getSupabaseServerClient>>(stub);
}
