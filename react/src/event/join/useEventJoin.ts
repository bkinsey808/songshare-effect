import { useCallback } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";

/**
 * Hook to join the current user to an event.
 *
 * @returns Function that joins the event when called
 */
export default function useEventJoin(): (eventId: string) => void {
	const currentUserId = useCurrentUserId();
	const joinEvent = useAppStore((state) => state.joinEvent);

	return useCallback(
		(eventId: string) => {
			if (currentUserId === undefined || currentUserId === "") {
				console.error("[useEventJoin] No current user ID");
				return;
			}
			return joinEvent(eventId);
		},
		[currentUserId, joinEvent],
	);
}
