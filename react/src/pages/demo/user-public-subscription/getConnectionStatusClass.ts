/**
 * Map a realtime connection status to a Tailwind CSS class for display.
 *
 * @param status - Connection status string (e.g., `SUBSCRIBED`, `CHANNEL_ERROR`)
 * @returns Tailwind CSS class to apply for the status text
 */
export default function getConnectionStatusClass(status: string): string {
	switch (status) {
		case "SUBSCRIBED": {
			return "text-green-500";
		}
		case "CHANNEL_ERROR": {
			return "text-red-500";
		}
		case "CLOSED": {
			return "text-red-400";
		}
		default: {
			return "text-yellow-500";
		}
	}
}
