import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

import { type SubscriptionStatus, type ValidTableName } from "../subscription-types";

/**
 * Default handler for subscription status events with common logging patterns.
 *
 * Logs warnings and errors for various subscription lifecycle events while remaining silent
 * on successful SUBSCRIBED state (to avoid noise in production logs).
 *
 * @param tableName - Valid database table name being subscribed to (used for log context)
 * @param status - Subscription status from Supabase realtime (SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT, CLOSED)
 * @param error - Optional error object if the status indicates an error condition
 */
export default function handleSubscriptionStatus(
	tableName: ValidTableName,
	status: SubscriptionStatus,
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
