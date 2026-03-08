import { Effect } from "effect";

import type { CommunityEntry, CommunityUser } from "@/react/community/community-types";
import postJson from "@/shared/fetch/postJson";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import type { SupportedLanguageType } from "@/shared/language/supported-languages";
import {
	apiCommunityEventAddPath,
	apiCommunityEventRemovePath,
	apiCommunityPlaylistAddPath,
	apiCommunityPlaylistRemovePath,
	apiCommunitySetActiveEventPath,
	apiCommunityShareRequestUpdateStatusPath,
	apiCommunitySongAddPath,
	apiCommunitySongRemovePath,
	apiCommunityUserAddPath,
	apiCommunityUserKickPath,
	communityViewPath,
} from "@/shared/paths";

import type { CommunityActionState } from "../CommunityActionState.type";
import runCommunityAction from "./runCommunityAction";

type StateSetter<Value> = (value: Value | ((current: Value) => Value)) => void;

type CreateCommunityManageHandlersParams = {
	communitySlug: string | undefined;
	currentCommunity: CommunityEntry | undefined;
	members: readonly CommunityUser[];
	langForNav: SupportedLanguageType;
	navigate: (path: string) => void | Promise<void>;
	fetchCommunityBySlug: (
		slug: string,
		options?: { silent?: boolean },
	) => Effect.Effect<unknown, Error>;
	setActionState: StateSetter<CommunityActionState>;
	inviteUserIdInput: string | undefined;
	setInviteUserIdInput: StateSetter<string | undefined>;
	addEventIdInput: string | undefined;
	setAddEventIdInput: StateSetter<string | undefined>;
	addSongIdInput: string | undefined;
	setAddSongIdInput: StateSetter<string | undefined>;
	addPlaylistIdInput: string | undefined;
	setAddPlaylistIdInput: StateSetter<string | undefined>;
};

type CommunityManageHandlers = {
	onInviteClick: () => void;
	onAddEventClick: () => void;
	onRemoveEventClick: (eventId: string) => void;
	onAddSongClick: () => void;
	onRemoveSongClick: (songId: string) => void;
	onAddPlaylistClick: () => void;
	onRemovePlaylistClick: (playlistId: string) => void;
	onReviewShareRequestClick: (requestId: string, status: "accepted" | "rejected") => void;
	onSetActiveEventClick: (eventId: string | undefined) => void;
	onKickClick: (userId: string) => void;
	onBackClick: () => void;
};

/**
 * Builds the action callbacks used by the community management screen.
 *
 * @param params - current hook state and dependencies
 * @returns management callbacks consumed by the hook
 */
export default function createCommunityManageHandlers(
	params: CreateCommunityManageHandlersParams,
): CommunityManageHandlers {
	const {
		communitySlug,
		currentCommunity,
		members,
		langForNav,
		navigate,
		fetchCommunityBySlug: loadCommunityBySlug,
		setActionState,
		inviteUserIdInput,
		setInviteUserIdInput,
		addEventIdInput,
		setAddEventIdInput,
		addSongIdInput,
		setAddSongIdInput,
		addPlaylistIdInput,
		setAddPlaylistIdInput,
	} = params;

	async function refreshCommunity(): Promise<void> {
		if (communitySlug !== undefined && communitySlug !== "") {
			await Effect.runPromise(loadCommunityBySlug(communitySlug, { silent: true }));
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

	function onAddSongClick(): void {
		if (currentCommunity !== undefined && addSongIdInput !== undefined && addSongIdInput !== "") {
			void (async (): Promise<void> => {
				await runCommunityAction({
					key: "add-song",
					action: () =>
						postJson(apiCommunitySongAddPath, {
							community_id: currentCommunity.community_id,
							song_id: addSongIdInput,
						}),
					successMessage: "Song added successfully",
					setActionState,
					refreshFn: refreshCommunity,
				});
				setAddSongIdInput(undefined);
			})();
		}
	}

	function onRemoveSongClick(songId: string): void {
		if (currentCommunity !== undefined) {
			void runCommunityAction({
				key: `remove-song:${songId}`,
				action: () =>
					postJson(apiCommunitySongRemovePath, {
						community_id: currentCommunity.community_id,
						song_id: songId,
					}),
				successMessage: "Song removed successfully",
				setActionState,
				refreshFn: refreshCommunity,
			});
		}
	}

	function onAddPlaylistClick(): void {
		if (
			currentCommunity !== undefined &&
			addPlaylistIdInput !== undefined &&
			addPlaylistIdInput !== ""
		) {
			void (async (): Promise<void> => {
				await runCommunityAction({
					key: "add-playlist",
					action: () =>
						postJson(apiCommunityPlaylistAddPath, {
							community_id: currentCommunity.community_id,
							playlist_id: addPlaylistIdInput,
						}),
					successMessage: "Playlist added successfully",
					setActionState,
					refreshFn: refreshCommunity,
				});
				setAddPlaylistIdInput(undefined);
			})();
		}
	}

	function onRemovePlaylistClick(playlistId: string): void {
		if (currentCommunity !== undefined) {
			void runCommunityAction({
				key: `remove-playlist:${playlistId}`,
				action: () =>
					postJson(apiCommunityPlaylistRemovePath, {
						community_id: currentCommunity.community_id,
						playlist_id: playlistId,
					}),
				successMessage: "Playlist removed successfully",
				setActionState,
				refreshFn: refreshCommunity,
			});
		}
	}

	function onReviewShareRequestClick(requestId: string, status: "accepted" | "rejected"): void {
		void runCommunityAction({
			key: `review-share-request:${requestId}:${status}`,
			action: () =>
				postJson(apiCommunityShareRequestUpdateStatusPath, {
					request_id: requestId,
					status,
				}),
			successMessage:
				status === "accepted" ? "Share request accepted successfully" : "Share request rejected",
			setActionState,
			refreshFn: refreshCommunity,
		});
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
		if (communitySlug !== undefined && communitySlug !== "") {
			void navigate(buildPathWithLang(`/${communityViewPath}/${communitySlug}`, langForNav));
		}
	}

	return {
		onInviteClick,
		onAddEventClick,
		onRemoveEventClick,
		onAddSongClick,
		onRemoveSongClick,
		onAddPlaylistClick,
		onRemovePlaylistClick,
		onReviewShareRequestClick,
		onSetActiveEventClick,
		onKickClick,
		onBackClick,
	};
}
