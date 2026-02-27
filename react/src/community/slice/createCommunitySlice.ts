import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import { sliceResetFns } from "@/react/app-store/slice-reset-fns";

import type {
	CommunityEntry,
	CommunityEvent,
	CommunityState,
	CommunityUser,
	SaveCommunityRequest,
} from "../community-types";
import type { CommunitySlice } from "./CommunitySlice.type";

import addEventToCommunityFn from "../event-manage/addEventToCommunity";
import removeEventFromCommunityFn from "../event-manage/removeEventFromCommunity";
import fetchCommunityBySlugFn from "../fetch/fetchCommunityBySlug";
import fetchCommunityLibraryFn from "../fetch/fetchCommunityLibrary";
import saveCommunityFn from "../form/saveCommunity";
import joinCommunityFn from "../join/joinCommunity";
import kickMemberFn from "../kick/kickMember";
import leaveCommunityFn from "../leave/leaveCommunity";
import addMemberFn from "../manage/addMember";

const communitySliceInitialState: CommunityState = {
	currentCommunity: undefined,
	communities: [],
	members: [],
	communityEvents: [],
	isCommunityLoading: false,
	communityError: undefined,
	isCommunitySaving: false,
};

export default function createCommunitySlice(
	set: Set<CommunitySlice>,
	get: Get<CommunitySlice>,
	api: Api<CommunitySlice>,
): CommunitySlice {
	void api;

	sliceResetFns.add(() => {
		set(communitySliceInitialState);
	});

	return {
		...communitySliceInitialState,

		// Public API methods
		fetchCommunityLibrary: () => fetchCommunityLibraryFn(get),
		fetchCommunityBySlug: (slug: string, options?: { silent?: boolean }) =>
			fetchCommunityBySlugFn(slug, get, options),
		saveCommunity: (request: SaveCommunityRequest) => saveCommunityFn(request, get),
		joinCommunity: (communityId: string) => joinCommunityFn(communityId, get),
		leaveCommunity: (communityId: string) => leaveCommunityFn(communityId, get),
		addMember: (communityId: string, userId: string, role: "community_admin" | "member") =>
			addMemberFn({ communityId, userId, role, get }),
		kickMember: (communityId: string, userId: string) => kickMemberFn(communityId, userId, get),
		addEventToCommunity: (communityId: string, eventId: string) =>
			addEventToCommunityFn(communityId, eventId, get),
		removeEventFromCommunity: (communityId: string, eventId: string) =>
			removeEventFromCommunityFn(communityId, eventId, get),

		// Internal state management methods
		setCurrentCommunity: (community: CommunityEntry | undefined) => {
			set({ currentCommunity: community as ReadonlyDeep<CommunityEntry> | undefined });
		},

		setCommunities: (communities: readonly CommunityEntry[]) => {
			set({ communities: communities as ReadonlyDeep<readonly CommunityEntry[]> });
		},

		setMembers: (members: readonly CommunityUser[]) => {
			set({ members: members as ReadonlyDeep<CommunityUser[]> });
		},

		setCommunityEvents: (events: readonly CommunityEvent[]) => {
			set({ communityEvents: events as ReadonlyDeep<CommunityEvent[]> });
		},

		setCommunityLoading: (loading: boolean) => {
			set({ isCommunityLoading: loading });
		},

		setCommunityError: (error: string | undefined) => {
			set({ communityError: error });
		},

		setCommunitySaving: (saving: boolean) => {
			set({ isCommunitySaving: saving });
		},

		clearCurrentCommunity: () => {
			set({
				currentCommunity: undefined,
				communityError: undefined,
				members: [],
				communityEvents: [],
			});
		},
	};
}
