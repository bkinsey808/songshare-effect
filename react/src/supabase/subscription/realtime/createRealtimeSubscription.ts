import { Effect } from "effect";

import type { SubscriptionConfig } from "../subscription-types";

import handleSubscriptionStatus from "../status/handleSubscriptionStatus";
import isSubscriptionStatus from "../status/isSubscriptionStatus";

/**
 * Creates and subscribes to a Supabase realtime channel with common error handling
 * and cleanup logic. Returns a cleanup function that unsubscribes the channel.
 *
 * Sets up a postgres_changes listener on the specified table and automatically converts
 * Effect-based handlers to promises for execution. All errors are caught and logged,
 * ensuring the subscription remains stable even if event handlers fail.
 *
 * @param config - Subscription configuration object
 * @param config.client - Authenticated Supabase client instance for the subscription
 * @param config.tableName - Valid database table name (from generated schema) to subscribe to
 * @param config.filter - Optional PostgREST filter clause (e.g., "user_id=eq.123") to limit events
 * @param config.onEvent - Effect-based handler called for each INSERT/UPDATE/DELETE event. Receives the realtime payload and may fail with an Error.
 * @param config.channelName - Optional custom channel name; defaults to `${tableName}_changes_${timestamp}`
 * @param config.onStatus - Optional handler for subscription lifecycle events (SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT, CLOSED)
 * @returns Cleanup function that unsubscribes the channel and removes it from the client
 */
export default function createRealtimeSubscription({
	client,
	tableName,
	filter,
	onEvent,
	channelName = `${tableName}_changes_${Date.now()}`,
	onStatus,
}: SubscriptionConfig): () => void {
	const channelBuilder = client.channel(channelName);

	const postgresChanges = {
		event: "*" as const,
		schema: "public" as const,
		table: tableName,
		...(filter !== undefined && filter !== "" ? { filter } : {}),
	};

	const channel = channelBuilder
		.on("postgres_changes", postgresChanges, (payload: unknown) => {
			// Wrap async handlers to avoid no-misused-promises lint issues
			void (async (): Promise<void> => {
				try {
					// Run the Effect returned by onEvent
					await Effect.runPromise(onEvent(payload));
				} catch (error) {
					console.error(`[${tableName}] Error in event handler:`, error);
				}
			})();
		})
		.subscribe((status: string, err: unknown) => {
			const typedError = err instanceof Error ? err : undefined;
			if (onStatus) {
				onStatus(status, typedError);
			} else {
				// Default status handling - validate status is a known subscription status
				const subscriberStatus = isSubscriptionStatus(status) ? status : "CHANNEL_ERROR";
				handleSubscriptionStatus(tableName, subscriberStatus, typedError);
			}
		});

	// Return cleanup function
	return (): void => {
		void client.removeChannel(channel);
	};
}
