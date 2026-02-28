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

export type CommunityState = {
	currentCommunity: CommunityEntry | undefined;
	communities: readonly CommunityEntry[];
	members: readonly CommunityUser[];
	communityEvents: readonly CommunityEvent[];
	isCommunityLoading: boolean;
	communityError: string | undefined;
	isCommunitySaving: boolean;
};

export type SaveCommunityRequest = CommunityFormValues;
