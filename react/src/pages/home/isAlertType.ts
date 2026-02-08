import type { AlertType } from "@/react/pages/home/AlertState.type";

import { ALL_ALERT_TYPES } from "@/react/pages/home/alert-keys";

/**
 * Runtime type guard for alert type strings using the shared alert keys.
 * @param val - candidate string
 */
export default function isAlertType(val: string): val is AlertType {
	return (ALL_ALERT_TYPES as readonly string[]).includes(val);
}
