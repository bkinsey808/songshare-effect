import { Effect } from "effect";

import type { SubscriptionConfig } from "../subscription-types";

import handleSubscriptionStatus from "../status/handleSubscriptionStatus";
import isSubscriptionStatus from "../status/isSubscriptionStatus";

const DEFAULT_FIND_ERROR_DEPTH = 3;

const FIND_INNER_ERROR_MIN = 0;
const FIND_INNER_ERROR_STEP = 1;

function findInnerError(obj: unknown, depth = DEFAULT_FIND_ERROR_DEPTH): Error | undefined {
	if (obj instanceof Error) {
		return obj;
	}
	if (depth <= FIND_INNER_ERROR_MIN) {
		return undefined;
	}
	if (typeof obj !== "object" || obj === null) {
		return undefined;
	}
	/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
	const values = Object.values(obj as Record<string, unknown>);
	for (const value of values) {
		try {
			const found = findInnerError(value, depth - FIND_INNER_ERROR_STEP);
			if (found) {
				return found;
			}
		} catch {
			// ignore and continue
		}
	}
	return undefined;
}

function unwrapError(err: unknown): unknown {
	const inner = findInnerError(err);
	if (inner) {
		return inner;
	}
	// fall back to shallow unwraps for common wrapper shapes
	if (typeof err !== "object" || err === null) {
		return err;
	}
	/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
	const anyErr = err as Record<string, unknown>;
	const { cause, error: errorVal, failure } = anyErr;
	if (cause instanceof Error) {
		return cause;
	}
	if (errorVal instanceof Error) {
		return errorVal;
	}
	if (typeof failure === "object" && failure !== null) {
		/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
		const failureObj = failure as Record<string, unknown>;
		const failureCause = failureObj["cause"];
		if (failureCause instanceof Error) {
			return failureCause;
		}
	}
	return err;
}

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
export default function createRealtimeSubscription(config: SubscriptionConfig): () => void {
	const {
		client,
		tableName,
		onEvent,
		channelName = `${tableName}_changes_${Date.now()}`,
		onStatus,
	} = config;

	// Dev-only verbose logging (enable by setting VITE_DEV_VERBOSE_SUBSCRIBE=true in .env)
	const DEV_VERBOSE_SUBSCRIBE = Boolean(
		import.meta.env.DEV && import.meta.env["VITE_DEV_VERBOSE_SUBSCRIBE"],
	);

	console.warn(`[${tableName}] Initializing channel: ${channelName}`);
	const channelBuilder = client.channel(channelName);

	const postgresChanges = {
		event: "*" as const,
		schema: "public" as const,
		table: tableName,
		...(typeof config.filter === "string" && config.filter !== "" ? { filter: config.filter } : {}),
	};
	console.warn(`[${tableName}] Setting up postgres_changes listener:`, postgresChanges);

	const channel = channelBuilder
		.on("postgres_changes", postgresChanges, (payload: unknown) => {
			if (DEV_VERBOSE_SUBSCRIBE) {
				console.warn(`[${tableName}][dev] event payload raw:`, payload);
			}
			// Wrap async handlers to avoid no-misused-promises lint issues
			void (async (): Promise<void> => {
				try {
					// Run the Effect returned by onEvent
					await Effect.runPromise(onEvent(payload));
				} catch (error) {
					const errToLog = unwrapError(error);
					console.error(`[${tableName}] Error in event handler:`, errToLog);
				}
			})();
		})
		.subscribe((status: string, err: unknown) => {
			console.warn(`[${tableName}] Subscription status changed: status=${status}`, err ?? "");
			if (DEV_VERBOSE_SUBSCRIBE) {
				console.warn(`[${tableName}][dev] subscribe status=${status} err=`, err);
			}
			// Pass through the raw error payload so callers/tests receive whatever the client provided
			if (onStatus) {
				// Pass the raw error payload through to the provided handler (it accepts unknown)
				onStatus(status, err);
			} else {
				// Default status handling - validate status is a known subscription status
				const subscriberStatus = isSubscriptionStatus(status) ? status : "CHANNEL_ERROR";
				// Pass the raw error payload to the default handler (it accepts unknown)
				handleSubscriptionStatus(tableName, subscriberStatus, err);
			}
		});

	// Return cleanup function
	return (): void => {
		void client.removeChannel(channel);
	};
}
