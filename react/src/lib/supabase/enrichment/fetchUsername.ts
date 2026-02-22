import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

import callSelect from "../client/safe-query/callSelect";
import { type EnrichmentConfig } from "./EnrichmentConfig.type";

/**
 * Fetches the username for a given user ID from the user_public table.
 * Returns undefined if the username cannot be fetched or is invalid.
 *
 * @param config - Enrichment configuration
 * @returns The username string, or undefined if not found or invalid
 */
export default async function fetchUsername(config: EnrichmentConfig): Promise<string | undefined> {
	const {
		client,
		userId,
		tableName = "user_public",
		userIdColumn = "user_id",
		usernameColumn = "username",
	} = config;

	try {
		// Query user_public for the owner's username
		const queryResult = await callSelect(client, tableName, {
			cols: usernameColumn,
			eq: { col: userIdColumn, val: userId },
			single: true,
		});

		// Extract data and error using type guards
		const rawData = isRecord(queryResult) ? queryResult["data"] : undefined;
		const rawError = isRecord(queryResult) ? queryResult["error"] : undefined;
		const userData: unknown = rawData;
		const userError: unknown = rawError;

		if (
			userError !== null ||
			userData === null ||
			!isRecord(userData) ||
			!isString(userData[usernameColumn])
		) {
			console.warn(`[fetchUsername] Could not fetch username for user ${userId}:`, userError);
			return undefined;
		}

		return userData[usernameColumn];
	} catch (error) {
		console.warn(`[fetchUsername] Error fetching username for user ${userId}:`, error);
		return undefined;
	}
}
