import type { SupabaseClientLike } from "@/react/supabase/client/SupabaseClientLike";

/**
 * Configuration for enriching records with owner usernames.
 */
export type EnrichmentConfig = {
	/** Supabase client instance */
	client: SupabaseClientLike;
	/** User ID to look up */
	userId: string;
	/** Table to query (defaults to "user_public") */
	tableName?: string;
	/** Column name for user ID (defaults to "user_id") */
	userIdColumn?: string;
	/** Column name for username (defaults to "username") */
	usernameColumn?: string;
};
