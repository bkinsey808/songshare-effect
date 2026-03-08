import type { Schema } from "effect";

import type { communityFormSchema } from "@/shared/validation/communitySchemas";

export type CommunityFormValues = Schema.Schema.Type<typeof communityFormSchema>;

/**
 * Public-facing community details returned by the API.
 */
export type CommunityEntry = {
	community_id: string;
	owner_id: string;
	name: string;
	slug: string;
	description: string | null;
	is_public: boolean;
	public_notes: string | null;
	private_notes?: string;
	active_event_id?: string;
	created_at: string;
	updated_at: string;
};

/**
 * Membership record representing a user's relationship to a community.
 */
export type CommunityUser = {
	community_id: string;
	user_id: string;
	role: "owner" | "community_admin" | "member";
	status: "invited" | "joined" | "left" | "kicked";
	joined_at: string;
	username?: string;
};

/**
 * Association between a community and an event from the user's library.
 */
export type CommunityEvent = {
	community_id: string;
	event_id: string;
	created_at: string;
	event_name?: string | undefined;
	event_slug?: string | undefined;
};

export type CommunitySong = {
	community_id: string;
	song_id: string;
	created_at: string;
	song_name?: string | undefined;
	song_slug?: string | undefined;
};

export type CommunityPlaylist = {
	community_id: string;
	playlist_id: string;
	created_at: string;
	playlist_name?: string | undefined;
	playlist_slug?: string | undefined;
};

export type CommunityShareRequest = {
	request_id: string;
	community_id: string;
	sender_user_id: string;
	shared_item_type: "song" | "playlist";
	shared_item_id: string;
	status: "pending" | "accepted" | "rejected";
	message?: string | null | undefined;
	created_at: string;
	updated_at: string;
	sender_username?: string | undefined;
	shared_item_name?: string | undefined;
};

export type CommunityState = {
	currentCommunity: CommunityEntry | undefined;
	communities: readonly CommunityEntry[];
	members: readonly CommunityUser[];
	communityEvents: readonly CommunityEvent[];
	communitySongs: readonly CommunitySong[];
	communityPlaylists: readonly CommunityPlaylist[];
	communityShareRequests: readonly CommunityShareRequest[];
	isCommunityLoading: boolean;
	communityError: string | undefined;
	isCommunitySaving: boolean;
};

export type SaveCommunityRequest = CommunityFormValues;
