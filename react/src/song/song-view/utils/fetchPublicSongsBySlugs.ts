import { isRecord } from "@/shared/utils/typeGuards";

interface SupabaseLikeClient {
	from(table: string): {
		select(query: string): {
			in(
				column: string,
				values: ReadonlyArray<string>,
			): Promise<{ data: unknown[]; error: unknown }>;
		};
	};
}

/**
 * Fetches public songs from Supabase by their slugs.
 * @param supabase - The Supabase client instance
 * @param songSlugs - Array of song slugs to fetch
 * @returns Promise containing the fetched data and any error
 */
export async function fetchPublicSongsBySlugs(
	supabase: unknown,
	songSlugs: ReadonlyArray<string>,
): Promise<{ data: unknown[] | undefined; error: unknown }> {
	// Narrow the incoming supabase client at runtime without using `any`.
	function asSupabaseLike(x: unknown): x is SupabaseLikeClient {
		if (!isRecord(x)) return false;
		// `isRecord` has already narrowed `x` to `Record<string, unknown>` here
		const maybe = x;
		return typeof maybe["from"] === "function";
	}

	if (!asSupabaseLike(supabase)) {
		console.error(
			"[fetchPublicSongsBySlugs] Supabase client does not match expected shape",
		);
		return { data: undefined, error: new Error("Invalid Supabase client") };
	}
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
		return { data: data ?? undefined, error: undefined };
	} catch (err) {
		console.error("[fetchPublicSongsBySlugs] Unexpected fetch error:", err);
		return { data: undefined, error: err };
	}
}
