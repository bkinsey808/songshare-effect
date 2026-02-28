import { Effect } from "effect";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type {
	CommunityEntry,
	CommunityEvent,
	CommunityUser,
} from "@/react/community/community-types";
import type { UserSessionData } from "@/shared/userSessionData";

import useAppStore from "@/react/app-store/useAppStore";
import postJson from "@/shared/fetch/postJson";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import {
	apiCommunityEventAddPath,
	apiCommunityEventRemovePath,
	apiCommunityUserAddPath,
	apiCommunityUserKickPath,
	communityViewPath,
} from "@/shared/paths";

export type UseCommunityManageViewReturn = {
	currentCommunity: CommunityEntry | undefined;
	members: readonly CommunityUser[];
	communityEvents: readonly CommunityEvent[];
	isCommunityLoading: boolean;
	communityError: string | undefined;
	canManage: boolean | undefined;
	actionState: {
		loadingKey: string | undefined;
		error: string | undefined;
		errorKey: string | undefined;
		success: string | undefined;
		successKey: string | undefined;
	};
	inviteUserIdInput: string | undefined;
	setInviteUserIdInput: (userId: string) => void;
	onInviteClick: () => void;
	addEventIdInput: string | undefined;
	setAddEventIdInput: (eventId: string) => void;
	onAddEventClick: () => void;
	onRemoveEventClick: (eventId: string) => void;
	onKickClick: (userId: string) => void;
	onBackClick: () => void;
	userSessionData: UserSessionData | undefined;
};

/**
 * Custom hook powering the community management screen.
 *
 * It handles fetching the current community, tracking members and events,
 * and provides a suite of callbacks used by the UI (invite/kick users,
 * add/remove events, and navigate back).  The hook also manages a simple
 * `actionState` object used for displaying success/error messages and a
 * loading indicator for individual operations.
 *
 * @returns an object containing state slices and handler functions consumed
 *   by `CommunityManageView`.
 */
export default function useCommunityManageView(): UseCommunityManageViewReturn {
	const { community_slug, lang } = useParams<{ community_slug: string; lang: string }>();
	const langForNav = isSupportedLanguage(lang) ? lang : defaultLanguage;
	const navigate = useNavigate();

	const fetchCommunityBySlug = useAppStore((state) => state.fetchCommunityBySlug);
	const currentCommunity = useAppStore((state) => state.currentCommunity);
	const members = useAppStore((state) => state.members);
	const communityEvents = useAppStore((state) => state.communityEvents);
	const isCommunityLoading = useAppStore((state) => state.isCommunityLoading);
	const communityError = useAppStore((state) => state.communityError);
	const userSessionData = useAppStore((state) => state.userSessionData);

	const [inviteUserIdInput, setInviteUserIdInput] = useState<string | undefined>(undefined);
	const [addEventIdInput, setAddEventIdInput] = useState<string | undefined>(undefined);
	const [actionState, setActionState] = useState<{
		loadingKey: string | undefined;
		error: string | undefined;
		errorKey: string | undefined;
		success: string | undefined;
		successKey: string | undefined;
	}>({
		loadingKey: undefined,
		error: undefined,
		errorKey: undefined,
		success: undefined,
		successKey: undefined,
	});

	// Fetch community data when the slug changes
	useEffect(() => {
		if (community_slug !== undefined && community_slug !== "") {
			void Effect.runPromise(fetchCommunityBySlug(community_slug));
		}
	}, [community_slug, fetchCommunityBySlug]);

	/**
	 * True when the current session user matches the community's owner_id.
	 * Used downstream to decide which management actions are allowed.
	 */
	const isOwner =
		userSessionData?.user !== undefined &&
		currentCommunity !== undefined &&
		userSessionData.user.user_id === currentCommunity.owner_id;

	const currentMember =
		userSessionData?.user === undefined
			? undefined
			: members.find((member) => member.user_id === userSessionData.user?.user_id);

	/**
	 * True when the current user is either the owner or has the
	 * `community_admin` role; controls whether management UI is shown.
	 */
	const canManage = isOwner || currentMember?.role === "community_admin";

	/**
	 * Helper that wraps a promise-returning operation and manages the
	 * `actionState` object used by the UI.  Pass a `key` to identify the
	 * action (errors/success are recorded under this key), a thunk performing
	 * the async work, and a success message displayed on completion.
	 *
	 * @param key - unique identifier for this action
	 * @param action - async work to run
	 * @param successMessage - message shown after a successful run
	 */
	async function runCommunityAction(
		key: string,
		action: () => Promise<void>,
		successMessage: string,
	): Promise<void> {
		setActionState({
			loadingKey: key,
			error: undefined,
			errorKey: undefined,
			success: undefined,
			successKey: undefined,
		});

		let success = false;
		try {
			await action();
			success = true;
		} catch (error: unknown) {
			setActionState({
				loadingKey: undefined,
				error: error instanceof Error ? error.message : String(error),
				errorKey: key,
				success: undefined,
				successKey: undefined,
			});
		}

		if (success) {
			// after a successful mutation we attempt to refresh the full community
			// payload; the silent flag prevents the global loading spinner from
			// blinking if this is just a background refresh.
			const slugToFetch =
				community_slug !== undefined && community_slug !== "" ? community_slug : undefined;

			if (slugToFetch !== undefined) {
				try {
					await Effect.runPromise(fetchCommunityBySlug(slugToFetch, { silent: true }));
				} catch {
					// Refresh failed but we still consider the primary action a success for UI purposes
				}
			}

			setActionState({
				loadingKey: undefined,
				error: undefined,
				errorKey: undefined,
				success: successMessage,
				successKey: key,
			});
		}
	}

	function onInviteClick(): void {
		if (
			currentCommunity !== undefined &&
			inviteUserIdInput !== undefined &&
			inviteUserIdInput !== ""
		) {
			void (async (): Promise<void> => {
				await runCommunityAction(
					"invite",
					() =>
						postJson(apiCommunityUserAddPath, {
							community_id: currentCommunity.community_id,
							user_id: inviteUserIdInput,
							role: "member",
							status: "invited",
						}),
					"Member invited successfully",
				);
				setInviteUserIdInput(undefined);
			})();
		}
	}

	function onAddEventClick(): void {
		if (currentCommunity !== undefined && addEventIdInput !== undefined && addEventIdInput !== "") {
			void (async (): Promise<void> => {
				await runCommunityAction(
					"add-event",
					() =>
						postJson(apiCommunityEventAddPath, {
							community_id: currentCommunity.community_id,
							event_id: addEventIdInput,
						}),
					"Event added successfully",
				);
				setAddEventIdInput(undefined);
			})();
		}
	}

	function onRemoveEventClick(eventId: string): void {
		if (currentCommunity !== undefined) {
			void runCommunityAction(
				`remove-event:${eventId}`,
				() =>
					postJson(apiCommunityEventRemovePath, {
						community_id: currentCommunity.community_id,
						event_id: eventId,
					}),
				"Event removed successfully",
			);
		}
	}

	function onKickClick(userId: string): void {
		if (currentCommunity !== undefined) {
			const isInvited = members.find((member) => member.user_id === userId)?.status === "invited";
			void runCommunityAction(
				`kick:${userId}`,
				() =>
					postJson(apiCommunityUserKickPath, {
						community_id: currentCommunity.community_id,
						user_id: userId,
					}),
				isInvited ? "Invitation cancelled" : "Member kicked successfully",
			);
		}
	}

	function onBackClick(): void {
		if (community_slug !== undefined && community_slug !== "") {
			void navigate(buildPathWithLang(`/${communityViewPath}/${community_slug}`, langForNav));
		}
	}

	return {
		currentCommunity,
		members,
		communityEvents,
		isCommunityLoading,
		communityError,
		canManage,
		actionState,
		inviteUserIdInput,
		setInviteUserIdInput,
		onInviteClick,
		addEventIdInput,
		setAddEventIdInput,
		onAddEventClick,
		onRemoveEventClick,
		onKickClick,
		onBackClick,
		userSessionData,
	};
}
