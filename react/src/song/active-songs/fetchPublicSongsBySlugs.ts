import isSupabaseClientLike from "@/shared/type-guards/isSupabaseClientLike";

/**
 * Fetches public songs from Supabase by their slugs.
 *
 * Uses a minimal runtime type guard to ensure the provided `supabase`
 * object matches the small subset of the Supabase client used here.
 *
 * @param supabase - The Supabase client instance (runtime-checked)
 * @param songSlugs - Array of song slugs to fetch
 * @returns Object with `data` (array of results or undefined) and `error`
 */
export default async function fetchPublicSongsBySlugs(
	supabase: unknown,
	songSlugs: readonly string[],
): Promise<{ data: unknown[] | undefined; error: unknown }> {
	if (!isSupabaseClientLike(supabase)) {
		console.error("[fetchPublicSongsBySlugs] Supabase client does not match expected shape");
		return { data: undefined, error: new Error("Invalid Supabase client") };
	}
	try {
		// Query the public songs table for the given slugs.
		const { data, error } = await supabase
			.from("song_public")
			.select("*")
			.in("song_slug", songSlugs);

		if (error !== null) {
			console.error("[fetchPublicSongsBySlugs] Supabase fetch error:", error);
			return { data: undefined, error };
		}

		console.warn("[fetchPublicSongsBySlugs] Fetched data:", data);
		return { data: data ?? undefined, error: undefined };
	} catch (error) {
		console.error("[fetchPublicSongsBySlugs] Unexpected fetch error:", error);
		return { data: undefined, error: error };
	}
}
