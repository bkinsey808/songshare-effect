import { getEnvValueSafe } from "@/react/utils/env";
import { type Database } from "@/shared/generated/supabaseTypes";
// src/features/supabase/supabaseClient.ts
import { type SupabaseClient, createClient } from "@supabase/supabase-js";

import { getSupabaseAuthToken } from "./getSupabaseAuthToken";

// Cache Supabase clients per visitor token
const clients = new Map<string, SupabaseClient<Database>>();

// Time and retry constants
const DEFAULT_RETRIES = 3;
const MS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const MAX_BACKOFF_MS = 5000;
const BACKOFF_BASE = 2;
const FIRST_ATTEMPT = 1;
const BACKOFF_EXPONENT_OFFSET = 1;
const INCREMENT = 1;

/**
 * Returns a Supabase client authenticated with a Supabase client token.
 * The supabaseClientToken can be from either:
 * - A shared visitor user (for anonymous access)
 * - A specific authenticated user (after sign-in)
 */
export function getSupabaseClient(
	supabaseClientToken?: string,
): SupabaseClient<Database> | undefined {
	const supabaseUrl = getEnvValueSafe("SUPABASE_URL");
	const supabaseKey = getEnvValueSafe("SUPABASE_ANON_KEY");

	if (
		supabaseUrl === undefined ||
		supabaseKey === undefined ||
		supabaseClientToken === undefined ||
		supabaseClientToken === ""
	) {
		return undefined;
	}

	// Return cached client if exists
	if (clients.has(supabaseClientToken)) {
		return clients.get(supabaseClientToken);
	}
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
	// supabaseClientToken is defined here (checked above)
	clients.set(supabaseClientToken, client);

	// Remove the cached client after token expiration (1 hour)
	setTimeout(
		() => clients.delete(supabaseClientToken),
		MINUTES_IN_HOUR * SECONDS_IN_MINUTE * MS_IN_SECOND,
	);

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
	retries: number = DEFAULT_RETRIES,
): Promise<SupabaseClient<Database> | undefined> {
	for (let attempt = FIRST_ATTEMPT; attempt <= retries; attempt += INCREMENT) {
		try {
			// getSupabaseAuthToken can reasonably be awaited in the retry loop
			// eslint-disable-next-line no-await-in-loop
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
			const delay = Math.min(
				MS_IN_SECOND * BACKOFF_BASE ** (attempt - BACKOFF_EXPONENT_OFFSET),
				MAX_BACKOFF_MS,
			);
			// eslint-disable-next-line no-await-in-loop
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
