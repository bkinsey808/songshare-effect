import { useCallback } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";

/**
 * Hook to leave an event as the current user.
 *
 * @returns Function that leaves the event when called
 */
export default function useEventLeave(): (eventId: string) => void {
	const currentUserId = useCurrentUserId();
	const leaveEvent = useAppStore((state) => state.leaveEvent);

	return useCallback(
		(eventId: string) => {
			if (currentUserId === undefined || currentUserId === "") {
				console.error("[useEventLeave] No current user ID");
				return;
			}
			return leaveEvent(eventId, currentUserId);
		},
		[currentUserId, leaveEvent],
	);
}
