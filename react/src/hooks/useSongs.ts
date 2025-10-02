/**
 * Custom hooks for song operations
 */
import { useEffect, useState } from "react";

import { getSupabaseClientWithAuth } from "../supabaseClient";
import type { Database } from "@/shared/generated/supabaseTypes";

type Song = Database["public"]["Tables"]["song_public"]["Row"];

/**
 * Example React hook for fetching songs with visitor authentication
 */
export function useSongs(): {
	songs: Song[];
	loading: boolean;
	error: string | undefined;
} {
	const [songs, setSongs] = useState<Song[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>(undefined);

	useEffect(() => {
		const loadSongs = async (): Promise<void> => {
			try {
				setLoading(true);
				setError(undefined);

				// Get authenticated Supabase client with token
				const client = await getSupabaseClientWithAuth();

				if (!client) {
					throw new Error("Could not initialize Supabase client");
				}

				// Fetch songs using RLS-protected query
				const { data, error: supabaseError } = await client
					.from("song_public")
					.select("*")
					.order("created_at", { ascending: false })
					.limit(20);

				if (supabaseError) {
					throw new Error(`Failed to fetch songs: ${supabaseError.message}`);
				}

				setSongs(data ?? []);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setLoading(false);
			}
		};

		void loadSongs();
	}, []);

	return { songs, loading, error };
}
