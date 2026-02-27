import { Effect } from "effect";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import type { CommunityEntry, CommunityUser, CommunityEvent } from "@/react/community/community-types";
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
 * Hook for managing community members and events.
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

	const isOwner =
		userSessionData?.user !== undefined &&
		currentCommunity !== undefined &&
		userSessionData.user.user_id === currentCommunity.owner_id;

	const currentMember =
		userSessionData?.user === undefined
			? undefined
			: members.find((member) => member.user_id === userSessionData.user?.user_id);

	const canManage = isOwner || currentMember?.role === "community_admin";

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
			// Refresh data if possible
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
		if (currentCommunity !== undefined && inviteUserIdInput !== undefined && inviteUserIdInput !== "") {
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
