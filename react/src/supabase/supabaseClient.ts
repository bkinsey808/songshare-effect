// src/features/supabase/supabaseClient.ts
import { type SupabaseClient, createClient } from "@supabase/supabase-js";

import { getEnvValueSafe } from "../utils/env";
import { getSupabaseAuthToken } from "./getSupabaseAuthToken";
import type { Database } from "@/shared/generated/supabaseTypes";

// Cache Supabase clients per visitor token
const clients = new Map<string, SupabaseClient<Database>>();

/**
 * Returns a Supabase client authenticated with a Supabase client token.
 * The supabaseClientToken can be from either:
 * - A shared visitor user (for anonymous access)
 * - A specific authenticated user (after sign-in)
 */
export function getSupabaseClient(
	supabaseClientToken: string,
): SupabaseClient<Database> | undefined {
	const supabaseUrl = getEnvValueSafe("SUPABASE_URL");
	const supabaseKey = getEnvValueSafe("SUPABASE_ANON_KEY");

	if (
		supabaseUrl === undefined ||
		supabaseKey === undefined ||
		supabaseClientToken === ""
	) {
		return undefined;
	}

	// Return cached client if exists
	if (clients.has(supabaseClientToken)) {
		return clients.get(supabaseClientToken);
	}

	/**
	 * Create Supabase client with anon key, then authenticate with visitor JWT.
	 * We need the anon key to initialize the client, then we override with the JWT.
	 *
	 * Note: The type assertion is necessary due to a conflict between our strict
	 * TypeScript configuration (exactOptionalPropertyTypes: true, etc.) and
	 * Supabase's internal type definitions. This is safe because:
	 * 1. We've validated the URL and keys are strings above
	 * 2. createClient always returns a SupabaseClient
	 * 3. The Database type matches our schema
	 */
	const client = createClient(supabaseUrl, supabaseKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false,
		},
		global: {
			headers: {
				Authorization: `Bearer ${supabaseClientToken}`,
			},
		},
	}) as SupabaseClient<Database>;

	// Set the auth token for real-time WebSocket connections after client creation
	// This must be done after client creation to ensure proper binding
	void client.realtime.setAuth(supabaseClientToken);

	// Cache client for this token
	clients.set(supabaseClientToken, client);

	// Remove the cached client after token expiration
	setTimeout(() => clients.delete(supabaseClientToken), 60 * 60 * 1000);

	return client;
}

/**
 * Gets a Supabase client with automatic token authentication.
 * This function will use the current auth token (user token if signed in, visitor token otherwise).
 * Includes retry logic for better reliability.
 *
 * @param retries - Number of retry attempts (default: 3)
 * @returns Promise that resolves to a Supabase client or undefined if setup fails
 */
export async function getSupabaseClientWithAuth(
	retries: number = 3,
): Promise<SupabaseClient<Database> | undefined> {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const supabaseClientToken = await getSupabaseAuthToken();

			if (!supabaseClientToken) {
				throw new Error("No auth token received");
			}

			const client = getSupabaseClient(supabaseClientToken);

			if (!client) {
				throw new Error("Failed to create Supabase client");
			}

			return client;
		} catch (error) {
			console.error(
				`Failed to get Supabase client (attempt ${attempt}/${retries}):`,
				error,
			);

			if (attempt === retries) {
				console.error("All retry attempts failed");
				return undefined;
			}

			// Wait before retrying (exponential backoff)
			const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	return undefined;
}

/**
 * Creates a basic Supabase client with anonymous access only.
 * This uses the ANON_KEY and provides no authentication.
 * Only useful for completely public data that doesn't require RLS.
 */
export function getPublicSupabaseClient():
	| SupabaseClient<Database>
	| undefined {
	const supabaseUrl = getEnvValueSafe("SUPABASE_URL");
	const supabaseKey = getEnvValueSafe("SUPABASE_ANON_KEY");

	if (supabaseUrl === undefined || supabaseKey === undefined) {
		return undefined;
	}

	const client = createClient(supabaseUrl, supabaseKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false,
		},
	}) as SupabaseClient<Database>;

	return client;
}
