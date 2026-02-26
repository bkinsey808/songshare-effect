import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/generated/supabaseTypes";

/**
 * Extend a base fake Supabase client with canned song/playlist responses.
 *
 * This helper is intentionally loose and unsafe; the goal is simplicity
 * not type fidelity.  All lint errors are scoped to the body below.
 *
 * @param base - existing SupabaseClient mock
 * @param songsResult - value returned from `song_public` selects
 * @param existingLibraryResult - value returned from `song_library` select
 * @param insertResult - value returned from `song_library` insert
 * @param playlistResult - optional override for `playlist_public` query
 * @returns patched SupabaseClient usable in tests
 */
export default function extendWithSongMocks({
	base,
	songsResult,
	existingLibraryResult,
	insertResult,
	playlistResult,
}: {
	base: SupabaseClient<Database>;
	songsResult: unknown;
	existingLibraryResult: unknown;
	insertResult: unknown;
	// allow tests to override playlist_public query result (error must be null or object)
	playlistResult?: unknown;
}): SupabaseClient<Database> {
	/* oxlint-disable max-params,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion,typescript-eslint/no-misused-spread,@typescript-eslint/explicit-function-return-type,promise/prefer-await-to-then */
	return {
		...base,
		from: (table: string) => {
			if (table === "playlist_public" && playlistResult !== undefined) {
				return {
					select: (_sel: string) => ({
						eq: (_col: string, _val: unknown) => ({
							single: () => Promise.resolve(playlistResult),
						}),
					}),
				} as any;
			}

			if (table === "song_public") {
				return {
					select: (_sel: string) => ({
						in: (_col: string, _vals: unknown) => Promise.resolve(songsResult),
					}),
				} as any;
			}
			if (table === "song_library") {
				return {
					select: (_sel: string) => ({
						eq: (_col: string, _val: unknown) => Promise.resolve(existingLibraryResult),
					}),
					insert: (_entries: unknown) => Promise.resolve(insertResult),
				} as any;
			}
			// delegate to base for other tables
			// oxlint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-explicit-any
			return (base as unknown as any).from(table);
		},
	} as unknown as SupabaseClient<Database>;
	/* oxlint-enable max-params,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion,typescript-eslint/no-misused-spread,@typescript-eslint/explicit-function-return-type,promise/prefer-await-to-then */
}
