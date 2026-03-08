import tw from "@/react/lib/utils/tw";

import type { ShareStatus } from "../slice/share-types";

/**
 * Returns a Tailwind text color class for the share status.
 *
 * @param status - The share status (pending, accepted, rejected)
 * @returns Tailwind text color class for the status
 */
export default function getStatusColor(status: ShareStatus): string {
	switch (status) {
		case 'pending': {
			return tw`text-yellow-400`;
		}
		case 'accepted': {
			return tw`text-green-400`;
		}
		case 'rejected': {
			return tw`text-red-400`;
		}
		default: {
			return tw`text-gray-400`;
		}
	}
}
