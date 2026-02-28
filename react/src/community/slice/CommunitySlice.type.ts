import type { Effect } from "effect";

import type {
	CommunityEntry,
	CommunityEvent,
	CommunityState,
	CommunityUser,
	SaveCommunityRequest,
} from "../community-types";

/**
 * Zustand slice for community state management.
 */
export type CommunitySlice = CommunityState & {
	// Public API methods
	fetchCommunityLibrary: () => Effect.Effect<readonly CommunityEntry[], Error>;
	fetchCommunityBySlug: (
		slug: string,
		options?: { silent?: boolean },
	) => Effect.Effect<CommunityEntry, Error>;
	saveCommunity: (request: SaveCommunityRequest) => Effect.Effect<CommunityEntry, Error>;
	joinCommunity: (
		communityId: string,
		options?: { silent?: boolean },
	) => Effect.Effect<void, Error>;
	leaveCommunity: (
		communityId: string,
		options?: { silent?: boolean },
	) => Effect.Effect<void, Error>;
	addMember: (
		communityId: string,
		userId: string,
		role: "community_admin" | "member",
	) => Effect.Effect<void, Error>;
	kickMember: (communityId: string, userId: string) => Effect.Effect<void, Error>;
	addEventToCommunity: (communityId: string, eventId: string) => Effect.Effect<void, Error>;
	removeEventFromCommunity: (communityId: string, eventId: string) => Effect.Effect<void, Error>;

	// Internal state management
	setCurrentCommunity: (community: CommunityEntry | undefined) => void;
	setCommunities: (communities: readonly CommunityEntry[]) => void;
	setMembers: (members: readonly CommunityUser[]) => void;
	setCommunityEvents: (events: readonly CommunityEvent[]) => void;
	setCommunityLoading: (loading: boolean) => void;
	setCommunityError: (error: string | undefined) => void;
	setCommunitySaving: (saving: boolean) => void;
	clearCurrentCommunity: () => void;
};
