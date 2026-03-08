import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import type {
	CommunityEntry,
	CommunityEvent,
	CommunityPlaylist,
	CommunityShareRequest,
	CommunitySong,
	CommunityUser,
} from "@/react/community/community-types";
import useLoadCommunityBySlug from "@/react/community/useLoadCommunityBySlug";
import useLoadCommunityLibraries from "@/react/community/useLoadCommunityLibraries";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import type { UserSessionData } from "@/shared/userSessionData";

import type { CommunityActionState } from "./CommunityActionState.type";
import createCommunityManageHandlers from "./createCommunityManageHandlers";
import getCommunityPermissions from "./getCommunityPermissions";
import useCommunityManageSubscriptions from "./useCommunityManageSubscriptions";

export type UseCommunityManageViewReturn = {
	currentCommunity: CommunityEntry | undefined;
	members: readonly CommunityUser[];
	communityEvents: readonly CommunityEvent[];
	communitySongs: readonly CommunitySong[];
	communityPlaylists: readonly CommunityPlaylist[];
	communityShareRequests: readonly CommunityShareRequest[];
	availableSongOptions: readonly { song_id: string; song_name?: string }[];
	availablePlaylistOptions: readonly { playlist_id: string; playlist_name?: string }[];
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
	addSongIdInput: string | undefined;
	setAddSongIdInput: (songId: string) => void;
	onAddSongClick: () => void;
	onRemoveSongClick: (songId: string) => void;
	addPlaylistIdInput: string | undefined;
	setAddPlaylistIdInput: (playlistId: string) => void;
	onAddPlaylistClick: () => void;
	onRemovePlaylistClick: (playlistId: string) => void;
	onReviewShareRequestClick: (requestId: string, status: "accepted" | "rejected") => void;
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
	const communitySongs = useAppStore((state) => state.communitySongs) ?? [];
	const communityPlaylists = useAppStore((state) => state.communityPlaylists) ?? [];
	const communityShareRequests = useAppStore((state) => state.communityShareRequests) ?? [];
	const isCommunityLoading = useAppStore((state) => state.isCommunityLoading);
	const communityError = useAppStore((state) => state.communityError);
	const userSessionData = useAppStore((state) => state.userSessionData);
	const songLibraryEntries = useAppStore((state) => state.songLibraryEntries) ?? {};
	const playlistLibraryEntries = useAppStore((state) => state.playlistLibraryEntries) ?? {};
	const fetchSongLibrary = useAppStore((state) => state.fetchSongLibrary);
	const fetchPlaylistLibrary = useAppStore((state) => state.fetchPlaylistLibrary);

	const communityId = currentCommunity?.community_id;
	const activeEventId = currentCommunity?.active_event_id;

	const [inviteUserIdInput, setInviteUserIdInput] = useState<string | undefined>(undefined);
	const [addEventIdInput, setAddEventIdInput] = useState<string | undefined>(undefined);
	const [addSongIdInput, setAddSongIdInput] = useState<string | undefined>(undefined);
	const [addPlaylistIdInput, setAddPlaylistIdInput] = useState<string | undefined>(undefined);
	const [actionState, setActionState] = useState<CommunityActionState>({
		loadingKey: undefined,
		error: undefined,
		errorKey: undefined,
		success: undefined,
		successKey: undefined,
	});

	useLoadCommunityBySlug(community_slug, fetchCommunityBySlug);
	useLoadCommunityLibraries(userSessionData?.user?.user_id, fetchSongLibrary, fetchPlaylistLibrary);

	// Realtime subscriptions (community_event + community_public)
	useCommunityManageSubscriptions(communityId);

	const { canManage } = getCommunityPermissions({
		currentCommunity,
		members,
		userSessionData,
	});
	const availableSongOptions = Object.values(songLibraryEntries);
	const availablePlaylistOptions = Object.values(playlistLibraryEntries);

	const {
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
	} = createCommunityManageHandlers({
		communitySlug: community_slug,
		currentCommunity,
		members,
		langForNav,
		navigate,
		fetchCommunityBySlug,
		setActionState,
		inviteUserIdInput,
		setInviteUserIdInput,
		addEventIdInput,
		setAddEventIdInput,
		addSongIdInput,
		setAddSongIdInput,
		addPlaylistIdInput,
		setAddPlaylistIdInput,
	});

	return {
		currentCommunity,
		members,
		communityEvents,
		communitySongs,
		communityPlaylists,
		communityShareRequests,
		availableSongOptions,
		availablePlaylistOptions,
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
		addSongIdInput,
		setAddSongIdInput,
		onAddSongClick,
		onRemoveSongClick,
		addPlaylistIdInput,
		setAddPlaylistIdInput,
		onAddPlaylistClick,
		onRemovePlaylistClick,
		onReviewShareRequestClick,
		onRemoveEventClick,
		onSetActiveEventClick,
		activeEventId,
		onKickClick,
		onBackClick,
		userSessionData,
	};
}
