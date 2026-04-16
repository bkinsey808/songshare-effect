import { ALL_ALERT_TYPES } from "@/react/pages/home/alert-keys";
import type { AlertType } from "@/react/pages/home/AlertState.type";

/**
 * Runtime type guard for alert type strings using the shared alert keys.
 *
 * @param val - candidate string
 * @returns true when `val` is a supported AlertType
 */
export default function isAlertType(val: string): val is AlertType {
	return (ALL_ALERT_TYPES as readonly string[]).includes(val);
}
