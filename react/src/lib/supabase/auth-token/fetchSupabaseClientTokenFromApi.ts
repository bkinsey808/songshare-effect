import { apiAuthVisitorPath } from "@/shared/paths";

import isTokenResponse from "../token/isTokenResponse";
import { cacheSupabaseClientToken } from "../token/token-cache";

// Time constants used locally
const MS_IN_SECOND = 1000;

/**
 * Fetch a Supabase "visitor" token from the backend API.
 *
 * Calls the `/api/auth/visitor` endpoint, validates the response using
 * {@link isTokenResponse}, caches the returned token in memory, and returns
 * the `access_token` string.
 *
 * @returns The `access_token` returned by the API.
 * @throws When the network request fails, the API returns a non-OK status,
 * or the response payload is not a valid token response.
 */
export default async function fetchSupabaseClientTokenFromApi(): Promise<string> {
	try {
		const response = await fetch(apiAuthVisitorPath);

		if (!response.ok) {
			throw new Error(`Failed to fetch visitor token: ${response.status}`);
		}

		const jsonRaw: unknown = await response.json().catch(() => undefined);

		if (!isTokenResponse(jsonRaw)) {
			console.error("Invalid token response from visitor endpoint:", jsonRaw);
			throw new Error("Unable to authenticate as visitor");
		}

		const data = jsonRaw;

		// Cache the token in memory (more secure than cookies)
		const expiryTime = Date.now() + data.expires_in * MS_IN_SECOND;
		cacheSupabaseClientToken(data.access_token, expiryTime);

		return data.access_token;
	} catch (error) {
		console.error("Error fetching visitor token:", error);
		throw new Error("Unable to authenticate as visitor", { cause: error });
	}
}
