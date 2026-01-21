import type { SupabaseClient } from "@supabase/supabase-js";

import delay from "@/shared/utils/delay";

import getSupabaseAuthToken from "../auth-token/getSupabaseAuthToken";
import getSupabaseClient from "./getSupabaseClient";

// Retry and backoff constants (local to token-authenticated client helper)
const DEFAULT_RETRIES = 3;
const MAX_BACKOFF_MS = 5000;
const BACKOFF_BASE = 2;
const FIRST_ATTEMPT = 1;
const BACKOFF_EXPONENT_OFFSET = 1;
const INCREMENT = 1;
const MS_IN_SECOND = 1000;

/**
 * Gets a Supabase client with automatic token authentication.
 * This function will use the current auth token (user token if signed in, visitor token otherwise).
 * Includes retry logic for better reliability.
 *
 * @param retries - Number of retry attempts (default: 3)
 * @returns Promise that resolves to a Supabase client or undefined if setup fails
 */
export default async function getSupabaseClientWithAuth(
	retries: number = DEFAULT_RETRIES,
): Promise<SupabaseClient | undefined> {
	for (let attempt = FIRST_ATTEMPT; attempt <= retries; attempt += INCREMENT) {
		try {
			// getSupabaseAuthToken can reasonably be awaited in the retry loop
			// oxlint-disable-next-line no-await-in-loop
			const supabaseClientToken = await getSupabaseAuthToken();

			// explicitly check both undefined and empty string to satisfy strict-boolean-expressions
			if (supabaseClientToken === undefined || supabaseClientToken === "") {
				throw new Error("No auth token received");
			}

			const client = getSupabaseClient(supabaseClientToken);

			if (!client) {
				throw new Error("Failed to create Supabase client");
			}

			return client;
		} catch (error) {
			console.error(`Failed to get Supabase client (attempt ${attempt}/${retries}):`, error);

			if (attempt === retries) {
				console.error("All retry attempts failed");
				return undefined;
			}

			// Wait before retrying (exponential backoff)
			const waitMs = Math.min(
				MS_IN_SECOND * BACKOFF_BASE ** (attempt - BACKOFF_EXPONENT_OFFSET),
				MAX_BACKOFF_MS,
			);
			// use shared delay helper (keeps lint rule happy for promise creation)
			// oxlint-disable-next-line no-await-in-loop
			await delay(waitMs);
		}
	}

	return undefined;
}
