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
	apiCommunitySetActiveEventPath,
	apiCommunityUserAddPath,
	apiCommunityUserKickPath,
	communityViewPath,
} from "@/shared/paths";

import type { CommunityActionState } from "./CommunityActionState.type";

import runCommunityAction from "./runCommunityAction";
import useCommunityManageSubscriptions from "./useCommunityManageSubscriptions";
import useCommunityPermissions from "./useCommunityPermissions";

export type UseCommunityManageViewReturn = {
	currentCommunity: CommunityEntry | undefined;
	members: readonly CommunityUser[];
	communityEvents: readonly CommunityEvent[];
	isCommunityLoading: boolean;
	communityError: string | undefined;
	canManage: boolean;
	actionState: CommunityActionState;
	inviteUserIdInput: string | undefined;
	setInviteUserIdInput: (userId: string) => void;
	onInviteClick: () => void;
	addEventIdInput: string | undefined;
	setAddEventIdInput: (eventId: string) => void;
	onAddEventClick: () => void;
	onRemoveEventClick: (eventId: string) => void;
	onSetActiveEventClick: (eventId: string | undefined) => void;
	activeEventId: string | undefined;
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

	const communityId = currentCommunity?.community_id;
	const activeEventId = currentCommunity?.active_event_id;

	const [inviteUserIdInput, setInviteUserIdInput] = useState<string | undefined>(undefined);
	const [addEventIdInput, setAddEventIdInput] = useState<string | undefined>(undefined);
	const [actionState, setActionState] = useState<CommunityActionState>({
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

	// Realtime subscriptions (community_event + community_public)
	useCommunityManageSubscriptions(communityId);

	const { canManage } = useCommunityPermissions({
		currentCommunity,
		members,
		userSessionData,
	});

	async function refreshCommunity(): Promise<void> {
		if (community_slug !== undefined && community_slug !== "") {
			await Effect.runPromise(fetchCommunityBySlug(community_slug, { silent: true }));
		}
	}

	function onInviteClick(): void {
		if (
			currentCommunity !== undefined &&
			inviteUserIdInput !== undefined &&
			inviteUserIdInput !== ""
		) {
			void (async (): Promise<void> => {
				await runCommunityAction({
					key: "invite",
					action: () =>
						postJson(apiCommunityUserAddPath, {
							community_id: currentCommunity.community_id,
							user_id: inviteUserIdInput,
							role: "member",
							status: "invited",
						}),
					successMessage: "Member invited successfully",
					setActionState,
					refreshFn: refreshCommunity,
				});
				setInviteUserIdInput(undefined);
			})();
		}
	}

	function onAddEventClick(): void {
		if (currentCommunity !== undefined && addEventIdInput !== undefined && addEventIdInput !== "") {
			void (async (): Promise<void> => {
				await runCommunityAction({
					key: "add-event",
					action: () =>
						postJson(apiCommunityEventAddPath, {
							community_id: currentCommunity.community_id,
							event_id: addEventIdInput,
						}),
					successMessage: "Event added successfully",
					setActionState,
					refreshFn: refreshCommunity,
				});
				setAddEventIdInput(undefined);
			})();
		}
	}

	function onRemoveEventClick(eventId: string): void {
		if (currentCommunity !== undefined) {
			void runCommunityAction({
				key: `remove-event:${eventId}`,
				action: () =>
					postJson(apiCommunityEventRemovePath, {
						community_id: currentCommunity.community_id,
						event_id: eventId,
					}),
				successMessage: "Event removed successfully",
				setActionState,
				refreshFn: refreshCommunity,
			});
		}
	}

	function onSetActiveEventClick(eventId: string | undefined): void {
		if (currentCommunity !== undefined) {
			void runCommunityAction({
				key: `set-active-event:${eventId ?? "unset"}`,
				action: () =>
					postJson(apiCommunitySetActiveEventPath, {
						community_id: currentCommunity.community_id,
						...(eventId === undefined ? {} : { event_id: eventId }),
					}),
				successMessage:
					eventId === undefined ? "Active event cleared" : "Active event set successfully",
				setActionState,
				refreshFn: refreshCommunity,
			});
		}
	}

	function onKickClick(userId: string): void {
		if (currentCommunity !== undefined) {
			const isInvited = members.find((member) => member.user_id === userId)?.status === "invited";
			void runCommunityAction({
				key: `kick:${userId}`,
				action: () =>
					postJson(apiCommunityUserKickPath, {
						community_id: currentCommunity.community_id,
						user_id: userId,
					}),
				successMessage: isInvited ? "Invitation cancelled" : "Member kicked successfully",
				setActionState,
				refreshFn: refreshCommunity,
			});
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
		onSetActiveEventClick,
		activeEventId,
		onKickClick,
		onBackClick,
		userSessionData,
	};
}
