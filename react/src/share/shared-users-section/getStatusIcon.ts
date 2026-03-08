import type { ShareStatus } from "../slice/share-types";

/**
 * Returns a display icon/symbol for the share status.
 *
 * @param status - The share status (pending, accepted, rejected)
 * @returns Unicode symbol for the status
 */
export default function getStatusIcon(status: ShareStatus): string {
	switch (status) {
		case "accepted": {
			return "✓";
		}
		case "rejected": {
			return "✗";
		}
		case "pending": {
			return "⏳";
		}
		default: {
			return "?";
		}
	}
}
