import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetches public songs from Supabase by their slugs.
 * @param supabase - The Supabase client instance
 * @param songSlugs - Array of song slugs to fetch
 * @returns Promise containing the fetched data and any error
 */
export async function fetchPublicSongsBySlugs(
	supabase: SupabaseClient,
	songSlugs: string[],
): Promise<{ data: unknown[] | undefined; error: unknown | undefined }> {
	try {
		const { data, error } = await supabase
			.from("song_public")
			.select("*")
			.in("song_slug", songSlugs);

		if (error !== null) {
			console.error("[fetchPublicSongsBySlugs] Supabase fetch error:", error);
			return { data: undefined, error };
		}

		console.warn("[fetchPublicSongsBySlugs] Fetched data:", data);
		return { data, error: undefined };
	} catch (err) {
		console.error("[fetchPublicSongsBySlugs] Unexpected fetch error:", err);
		return { data: undefined, error: err };
	}
}
