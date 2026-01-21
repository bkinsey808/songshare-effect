import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

/**
 * Default handler for subscription status events with common logging patterns.
 *
 * @param tableName - Name of the table being subscribed to (for logging)
 * @param status - Subscription status from Supabase
 * @param error - Optional error object
 */
export default function handleSubscriptionStatus(
	tableName: string,
	status: string,
	error?: unknown,
): void {
	if (String(status) === String(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED)) {
		// Subscription successful - no logging needed in production
	} else if (String(status) === String(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR)) {
		console.error(`[${tableName}] Channel error:`, error);
	} else if (String(status) === String(REALTIME_SUBSCRIBE_STATES.TIMED_OUT)) {
		console.warn(`[${tableName}] Subscription timed out`);
	}
}
