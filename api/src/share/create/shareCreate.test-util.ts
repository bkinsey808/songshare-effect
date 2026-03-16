/**
 * Test helper for shareCreate - builds a minimal Supabase client stub for validation.
 * Returns { user_id } or { owner_id } so validateSharedItemAccess returns true.
 */
import type getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import forceCast from "@/react/lib/test-utils/forceCast";

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
