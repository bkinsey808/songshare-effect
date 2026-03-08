import { Effect as EffectRuntime } from "effect";
import { useEffect, useState } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import fetchEventCommunitiesFn from "@/react/event/fetch/fetchEventCommunities";
import subscribeToCommunityEventByEvent from "@/react/event/subscribe/subscribeToCommunityEventByEvent";
import postJson from "@/shared/fetch/postJson";
import { apiCommunityEventAddPath, apiCommunityEventRemovePath } from "@/shared/paths";

import type { ActionState } from "../ActionState.type";

import refreshEvent from "../refreshEvent";
import runAction from "../runAction";

type UseEventCommunityManagementProps = {
	readonly currentEventId: string | undefined;
	readonly event_slug: string | undefined;
	readonly fetchEventBySlug: (eventSlug: string) => EffectRuntime.Effect<void, unknown>;
	readonly setActionState: React.Dispatch<React.SetStateAction<ActionState>>;
};

type UseEventCommunityManagementReturn = {
	readonly addCommunityIdInput: string | undefined;
	readonly onAddCommunityIdSelect: (communityId: string) => void;
	readonly onAddCommunityClick: () => void;
	readonly onRemoveCommunityClick: (communityId: string) => void;
};

/**
 * Manages event-community linking: loads community library, subscribes to
 * realtime `community_event` changes, and provides add/remove handlers.
 *
 * @param currentEventId - id of the event being managed (may be undefined while loading)
 * @param event_slug - slug used to refresh the event after mutations
 * @param fetchEventBySlug - store action to refresh the event by slug
 * @param setActionState - shared action state setter from the parent hook
 * @returns community management state and handlers
 */
export default function useEventCommunityManagement({
	currentEventId,
	event_slug,
	fetchEventBySlug,
	setActionState,
}: UseEventCommunityManagementProps): UseEventCommunityManagementReturn {
	const fetchCommunityLibrary = useAppStore((state) => state.fetchCommunityLibrary);

	const [addCommunityIdInput, setAddCommunityIdInput] = useState<string | undefined>(undefined);

	// Load community library so the community search input has data
	useEffect(() => {
		void (async (): Promise<void> => {
			try {
				await EffectRuntime.runPromise(fetchCommunityLibrary());
			} catch {
				// Keep manager usable even if community library fails to load
			}
		})();
		// oxlint-disable-next-line no-empty-function -- no cleanup for fetch; return fn for React 19 HMR
		return;
	}, [fetchCommunityLibrary]);

	// Fetch event communities when event becomes available
	useEffect(() => {
		if (currentEventId === undefined) {
			// oxlint-disable-next-line no-empty-function -- no fetch when undefined; return fn for React 19 HMR
			return;
		}
		void EffectRuntime.runPromise(fetchEventCommunitiesFn(currentEventId, useAppStore.getState));
		// oxlint-disable-next-line no-empty-function -- no cleanup for fetch; return fn for React 19 HMR
		return;
	}, [currentEventId]);

	// Subscribe to realtime community_event changes for this event
	useEffect(() => {
		if (currentEventId === undefined) {
			// oxlint-disable-next-line no-empty-function -- no subscription when undefined; return fn for React 19 HMR
			return;
		}
		let cleanup: (() => void) | undefined = undefined;
		void (async (): Promise<void> => {
			try {
				cleanup = await EffectRuntime.runPromise(
					subscribeToCommunityEventByEvent(currentEventId, useAppStore.getState),
				);
			} catch (error: unknown) {
				console.error(
					"[useEventCommunityManagement] subscribeToCommunityEventByEvent error:",
					error,
				);
			}
		})();
		return (): void => {
			cleanup?.();
		};
	}, [currentEventId]);

	function onAddCommunityIdSelect(communityId: string): void {
		setAddCommunityIdInput(communityId === "" ? undefined : communityId);
	}

	function onAddCommunityClick(): void {
		if (
			currentEventId === undefined ||
			addCommunityIdInput === undefined ||
			addCommunityIdInput === ""
		) {
			return;
		}
		void runAction({
			actionKey: "add-community",
			successMessage: "Community linked",
			action: async (): Promise<void> => {
				await postJson(apiCommunityEventAddPath, {
					community_id: addCommunityIdInput,
					event_id: currentEventId,
				});
				setAddCommunityIdInput(undefined);
			},
			setActionState,
			refreshFn: () => refreshEvent(event_slug, fetchEventBySlug),
		});
	}

	function onRemoveCommunityClick(communityId: string): void {
		if (currentEventId === undefined) {
			return;
		}
		void runAction({
			actionKey: `remove-community:${communityId}`,
			successMessage: "Community unlinked",
			action: () =>
				postJson(apiCommunityEventRemovePath, {
					community_id: communityId,
					event_id: currentEventId,
				}),
			setActionState,
			refreshFn: () => refreshEvent(event_slug, fetchEventBySlug),
		});
	}

	return {
		addCommunityIdInput,
		onAddCommunityIdSelect,
		onAddCommunityClick,
		onRemoveCommunityClick,
	};
}
