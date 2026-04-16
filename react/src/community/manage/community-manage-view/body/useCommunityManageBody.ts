import { Effect } from "effect";
import { useCallback, useEffect, useState } from "react";
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
import useLoadCommunityLibraries from "@/react/community/useLoadCommunityLibraries";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

import type { CommunityActionState } from "../CommunityActionState.type";
import createCommunityManageHandlers from "./createCommunityManageHandlers";
import useCommunityManageSubscriptions from "./useCommunityManageSubscriptions";

export type UseCommunityManageBodyReturn = {
	members: readonly CommunityUser[];
	communityEvents: readonly CommunityEvent[];
	communitySongs: readonly CommunitySong[];
	communityPlaylists: readonly CommunityPlaylist[];
	communityShareRequests: readonly CommunityShareRequest[];
	availableSongOptions: readonly { song_id: string; song_name?: string }[];
	availablePlaylistOptions: readonly { playlist_id: string; playlist_name?: string }[];
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
	onDismissInviteAlert: () => void;
};

/**
 * Hook for the community manage body content (members, events, songs, etc.).
 * Only call when `currentCommunity` is defined.
 *
 * @param currentCommunity - the current community entry the body should render for
 * @returns API surface consumed by the community manage body component
 */
export default function useCommunityManageBody(
	currentCommunity: CommunityEntry,
): UseCommunityManageBodyReturn {
	const { community_slug, lang } = useParams<{ community_slug?: string; lang?: string }>();
	const langForNav = isSupportedLanguage(lang) ? lang : defaultLanguage;
	const navigate = useNavigate();

	const members = useAppStore((state) => state.members);
	const communityEvents = useAppStore((state) => state.communityEvents);
	const communitySongs = useAppStore((state) => state.communitySongs) ?? [];
	const communityPlaylists = useAppStore((state) => state.communityPlaylists) ?? [];
	const communityShareRequests = useAppStore((state) => state.communityShareRequests) ?? [];
	const userSessionData = useAppStore((state) => state.userSessionData);
	const songLibraryEntries = useAppStore((state) => state.songLibraryEntries) ?? {};
	const playlistLibraryEntries = useAppStore((state) => state.playlistLibraryEntries) ?? {};
	const fetchCommunityBySlug = useAppStore((state) => state.fetchCommunityBySlug);
	const fetchSongLibrary = useAppStore((state) => state.fetchSongLibrary);
	const fetchPlaylistLibrary = useAppStore((state) => state.fetchPlaylistLibrary);
	const fetchUserLibrary = useAppStore((state) => state.fetchUserLibrary);

	const communityId = currentCommunity.community_id;
	const activeEventId = currentCommunity.active_event_id;

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

	useLoadCommunityLibraries(userSessionData?.user?.user_id, fetchSongLibrary, fetchPlaylistLibrary);
	useCommunityManageSubscriptions(communityId);

	// Load user library on mount so the invite search input is populated.
	// This mirrors useEventParticipantManagement and ensures the dropdown has
	// data available before the admin types into the invite field.
	useEffect(() => {
		void (async (): Promise<void> => {
			try {
				await Effect.runPromise(fetchUserLibrary());
			} catch {
				// Keep community screens usable even if user library fails to load.
			}
		})();
		// oxlint-disable-next-line no-empty-function -- no cleanup for fetch; return fn for React 19 HMR
		return;
	}, [fetchUserLibrary]);

	const availableSongOptions = Object.values(songLibraryEntries) as readonly {
		song_id: string;
		song_name?: string;
	}[];
	const availablePlaylistOptions = Object.values(playlistLibraryEntries) as readonly {
		playlist_id: string;
		playlist_name?: string;
	}[];

	const onDismissInviteAlert = useCallback(() => {
		setActionState((prev) =>
			prev.successKey === "invite" || prev.errorKey === "invite"
				? {
						...prev,
						success: undefined,
						successKey: undefined,
						error: undefined,
						errorKey: undefined,
					}
				: prev,
		);
	}, []);

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
		members,
		communityEvents,
		communitySongs,
		communityPlaylists,
		communityShareRequests,
		availableSongOptions,
		availablePlaylistOptions,
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
		onDismissInviteAlert,
	};
}
