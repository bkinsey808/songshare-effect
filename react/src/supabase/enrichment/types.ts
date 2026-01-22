import type { SupabaseClientLike } from "@/react/supabase/client/SupabaseClientLike";
import type { Database } from "@/shared/generated/supabaseTypes";

/**
 * Configuration for enriching records with owner usernames.
 */
export type EnrichmentConfig<TableName extends keyof Database["public"]["Tables"] = "user_public"> =
	{
		/** Supabase client instance */
		client: SupabaseClientLike<Database>;
		/** User ID to look up */
		userId: string;
		/** Table to query (defaults to "user_public") */
		tableName?: TableName;
		/** Column name for user ID (defaults to "user_id") */
		userIdColumn?: keyof Database["public"]["Tables"][TableName]["Row"] & string;
		/** Column name for username (defaults to "username") */
		usernameColumn?: keyof Database["public"]["Tables"][TableName]["Row"] & string;
	};
