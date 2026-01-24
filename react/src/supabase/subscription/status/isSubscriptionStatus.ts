import { type SubscriptionStatus } from "../subscription-types";

/**
 * Type guard to validate that a value is a valid subscription status.
 *
 * Checks if the given value is a string and matches one of the known
 * Supabase realtime subscription status values.
 *
 * @param value - Value to check
 * @returns True if value is a valid SubscriptionStatus
 */
export default function isSubscriptionStatus(value: unknown): value is SubscriptionStatus {
	return (
		typeof value === "string" &&
		["SUBSCRIBED", "CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(value)
	);
}
