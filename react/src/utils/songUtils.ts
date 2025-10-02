/**
 * Utility functions for song operations
 */
import { getSupabaseClientWithAuth } from "../supabaseClient";
import type { Database } from "@/shared/generated/supabaseTypes";

type Song = Database["public"]["Tables"]["song_public"]["Row"];

/**
 * Simple async function for one-off data fetching
 */
export async function fetchLatestSongs(): Promise<Song[]> {
	const client = await getSupabaseClientWithAuth();

	if (!client) {
		throw new Error("Could not initialize Supabase client");
	}

	const { data, error } = await client
		.from("song_public")
		.select("*")
		.order("created_at", { ascending: false })
		.limit(5);

	if (error) {
		throw new Error(`Failed to fetch songs: ${error.message}`);
	}

	return data ?? [];
}
