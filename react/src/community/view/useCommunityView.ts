import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useLoadCommunityBySlug from "@/react/community/useLoadCommunityBySlug";
import useLoadCommunityLibraries from "@/react/community/useLoadCommunityLibraries";
import useLocale from "@/react/lib/language/locale/useLocale";
import useItemTagsDisplay from "@/react/tag/useItemTagsDisplay";
import type { UserSessionData } from "@/shared/userSessionData";

import type {
	CommunityEntry,
	CommunityEvent,
	CommunityPlaylist,
	CommunitySong,
	CommunityUser,
} from "../community-types";
import createCommunityViewHandlers from "./createCommunityViewHandlers";
import useCommunityViewSubscriptions from "./useCommunityViewSubscriptions";

export type UseCommunityViewReturn = {
	currentCommunity: CommunityEntry | undefined;
	members: readonly CommunityUser[];
	selectedSongId: string;
	setSelectedSongId: (value: string) => void;
	selectedPlaylistId: string;
	setSelectedPlaylistId: (value: string) => void;
	communityEvents: readonly CommunityEvent[];
	communitySongs: readonly CommunitySong[];
	communityPlaylists: readonly CommunityPlaylist[];
	availableSongOptions: readonly { song_id: string; song_name?: string; song_slug?: string }[];
	availablePlaylistOptions: readonly {
		playlist_id: string;
		playlist_name?: string;
		playlist_slug?: string;
	}[];
	activeEventId: string | undefined;
	isCommunityLoading: boolean;
	communityError: string | undefined;
	isMember: boolean | undefined;
	isOwner: boolean | undefined;
	isJoinLoading: boolean;
	isLeaveLoading: boolean;
	canManage: boolean | undefined;
	canEdit: boolean | undefined;
	onJoinClick: () => void;
	onLeaveClick: () => void;
	onManageClick: () => void;
	onEditClick: () => void;
	onShareSongClick: (songId: string) => void;
	onSharePlaylistClick: (playlistId: string) => void;
	onRefreshCommunity: () => void;
	userSession: UserSessionData | undefined;
	tags: string[];
};

/**
 * Hook that drives data and actions for the community view page.
 *
 * Returns the current community, member list, permission flags, error/loading
 * state, and callbacks used by `CommunityView`.
 *
 * @returns state and handlers needed by the community view screen
 */
export default function useCommunityView(): UseCommunityViewReturn {
	const [isJoinLoading, setIsJoinLoading] = useState(false);
	const [isLeaveLoading, setIsLeaveLoading] = useState(false);
	const [selectedSongId, setSelectedSongId] = useState("");
	const [selectedPlaylistId, setSelectedPlaylistId] = useState("");

	const { lang } = useLocale();
	const navigate = useNavigate();
	const { community_slug } = useParams<{ community_slug: string }>();
	const fetchCommunityBySlug = useAppStore((state) => state.fetchCommunityBySlug);
	const currentCommunity = useAppStore((state) => state.currentCommunity);
	const members = useAppStore((state) => state.members);
	const communityEvents = useAppStore((state) => state.communityEvents);
	const communitySongs = useAppStore((state) => state.communitySongs) ?? [];
	const communityPlaylists = useAppStore((state) => state.communityPlaylists) ?? [];
	const isCommunityLoading = useAppStore((state) => state.isCommunityLoading);
	const communityError = useAppStore((state) => state.communityError);
	const joinCommunity = useAppStore((state) => state.joinCommunity);
	const leaveCommunity = useAppStore((state) => state.leaveCommunity);
	const userSessionData = useAppStore((state) => state.userSessionData);
	const songLibraryEntries = useAppStore((state) => state.songLibraryEntries) ?? {};
	const playlistLibraryEntries = useAppStore((state) => state.playlistLibraryEntries) ?? {};
	const fetchSongLibrary = useAppStore((state) => state.fetchSongLibrary);
	const fetchPlaylistLibrary = useAppStore((state) => state.fetchPlaylistLibrary);

	const communityId = currentCommunity?.community_id;
	const activeEventId = currentCommunity?.active_event_id;

	useLoadCommunityBySlug(community_slug, fetchCommunityBySlug);
	useLoadCommunityLibraries(userSessionData?.user?.user_id, fetchSongLibrary, fetchPlaylistLibrary);
	useCommunityViewSubscriptions(communityId);

	const tags = useItemTagsDisplay("community", communityId);

	// find the current user's membership record, if they are logged in
	const currentMember =
		userSessionData?.user === undefined
			? undefined
			: members.find((member: CommunityUser) => member.user_id === userSessionData.user?.user_id);

	// user is owner if their ID matches the community's owner_id
	const isOwner =
		userSessionData?.user !== undefined &&
		currentCommunity !== undefined &&
		userSessionData.user.user_id === currentCommunity.owner_id;

	const isMember = isOwner || currentMember?.status === "joined";

	// management rights granted to owners or community admins
	const canManage = isOwner || currentMember?.role === "community_admin";

	const canEdit = isOwner;
	const availableSongOptions = Object.values(songLibraryEntries) as readonly {
		song_id: string;
		song_name?: string;
		song_slug?: string;
	}[];
	const availablePlaylistOptions = Object.values(playlistLibraryEntries) as readonly {
		playlist_id: string;
		playlist_name?: string;
		playlist_slug?: string;
	}[];
	const {
		onJoinClick,
		onLeaveClick,
		onManageClick,
		onEditClick,
		onShareSongClick,
		onSharePlaylistClick,
		onRefreshCommunity,
	} = createCommunityViewHandlers({
		lang,
		navigate,
		communitySlug: community_slug,
		communityId,
		currentCommunity,
		fetchCommunityBySlug,
		joinCommunity,
		leaveCommunity,
		setIsJoinLoading,
		setIsLeaveLoading,
	});

	return {
		currentCommunity,
		members,
		selectedSongId,
		setSelectedSongId,
		selectedPlaylistId,
		setSelectedPlaylistId,
		communityEvents,
		communitySongs,
		communityPlaylists,
		availableSongOptions,
		availablePlaylistOptions,
		activeEventId,
		isCommunityLoading,
		communityError,
		isMember,
		isOwner,
		isJoinLoading,
		isLeaveLoading,
		canManage,
		canEdit,
		onJoinClick,
		onLeaveClick,
		onManageClick,
		onEditClick,
		onShareSongClick,
		onSharePlaylistClick,
		onRefreshCommunity,
		userSession: userSessionData,
		tags,
	};
}
