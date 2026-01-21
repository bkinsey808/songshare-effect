import handleSubscriptionStatus from "./handleSubscriptionStatus";
import { type SubscriptionConfig } from "./types";

/**
 * Creates and subscribes to a Supabase realtime channel with common error handling
 * and cleanup logic. Returns a cleanup function that unsubscribes the channel.
 *
 * @param config - Subscription configuration
 * @returns Cleanup function to unsubscribe and remove the channel
 */
export default function createRealtimeSubscription(config: SubscriptionConfig): () => void {
	const {
		client,
		tableName,
		filter,
		onEvent,
		channelName = `${tableName}_changes_${Date.now()}`,
		onStatus,
	} = config;

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
					// Cast is safe: Supabase realtime payload structure is validated by caller's handler
					// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
					await onEvent(payload);
				} catch (error) {
					console.error(`[${tableName}] Error in event handler:`, error);
				}
			})();
		})
		.subscribe((status: string, err: unknown) => {
			if (onStatus) {
				onStatus(status, err);
			} else {
				// Default status handling
				handleSubscriptionStatus(tableName, status, err);
			}
		});

	// Return cleanup function
	return (): void => {
		void client.removeChannel(channel);
	};
}
