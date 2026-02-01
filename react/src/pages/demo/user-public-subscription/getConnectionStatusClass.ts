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
