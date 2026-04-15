import { Effect as EffectRuntime } from "effect";
import { useEffect, useState } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import postJson from "@/shared/fetch/postJson";
import { apiEventUserAddPath, apiEventUserKickPath } from "@/shared/paths";

import type { ActionState } from "../ActionState.type";
import refreshEvent from "../refreshEvent";
import runAction from "../runAction";

type UseEventParticipantManagementProps = {
	readonly currentEventId: string | undefined;
	readonly event_slug: string | undefined;
	readonly fetchEventBySlug: (eventSlug: string) => EffectRuntime.Effect<void, unknown>;
	readonly setActionState: React.Dispatch<React.SetStateAction<ActionState>>;
};

type UseEventParticipantManagementReturn = {
	readonly inviteUserIdInput: string | undefined;
	readonly onInviteUserSelect: (userId: string | undefined) => void;
	readonly onInviteClick: () => void;
	readonly onKickParticipant: (userId: string) => void;
};

/**
 * Manages participant invite/kick state and handlers for event management.
 * Also loads the user library so the invite search input is populated.
 *
 * @param currentEventId - id of the event being managed (may be undefined while loading)
 * @param event_slug - slug used to refresh the event after mutations
 * @param fetchEventBySlug - store action to refresh the event by slug
 * @param setActionState - shared action state setter from the parent hook
 * @returns participant management state and handlers
 */
export default function useEventParticipantManagement({
	currentEventId,
	event_slug,
	fetchEventBySlug,
	setActionState,
}: UseEventParticipantManagementProps): UseEventParticipantManagementReturn {
	const fetchUserLibrary = useAppStore((state) => state.fetchUserLibrary);

	const [inviteUserIdInput, setInviteUserIdInput] = useState<string | undefined>(undefined);

	// Load user library on mount so the invite search input has data
	useEffect(() => {
		void (async (): Promise<void> => {
			try {
				await EffectRuntime.runPromise(fetchUserLibrary());
			} catch {
				// Keep manager usable even if user library fails to load
			}
		})();
		// oxlint-disable-next-line no-empty-function -- no cleanup for fetch; return fn for React 19 HMR
		return;
	}, [fetchUserLibrary]);

	/**
	 * Select a user id for inviting to the event.
	 *
	 * @param userId - user id or undefined to clear selection
	 * @returns void
	 */
	function onInviteUserSelect(userId: string | undefined): void {
		setInviteUserIdInput(userId);
	}

	function onInviteClick(): void {
		if (currentEventId === undefined) {
			return;
		}

		/**
		 * Click handler that sends an invite for the currently selected user id.
		 *
		 * @returns void
		 */
		const userId = inviteUserIdInput?.trim() ?? "";
		if (userId === "") {
			return;
		}
		void runAction({
			actionKey: "invite",
			successMessage: "Participant invited",
			action: async () => {
				await postJson(apiEventUserAddPath, {
					event_id: currentEventId,
					user_id: userId,
					role: "participant",
					status: "invited",
				});
				setInviteUserIdInput(undefined);
			},
			setActionState,
			refreshFn: () => refreshEvent(event_slug, fetchEventBySlug),
		});
	}

	/**
	 * Kick a participant by user id.
	 *
	 * @param userId - id of the user to remove from the event
	 * @returns void
	 */
	function onKickParticipant(userId: string): void {
		if (currentEventId === undefined) {
			return;
		}

		/**
		 * Kick a participant by user id.
		 *
		 * @param userId - id of the user to remove from the event
		 * @returns void
		 */
		void runAction({
			actionKey: `kick:${userId}`,
			successMessage: "Participant kicked",
			action: () =>
				postJson(apiEventUserKickPath, {
					event_id: currentEventId,
					user_id: userId,
				}),
			setActionState,
			refreshFn: () => refreshEvent(event_slug, fetchEventBySlug),
		});
	}

	return { inviteUserIdInput, onInviteUserSelect, onInviteClick, onKickParticipant };
}
