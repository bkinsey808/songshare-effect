import { Schema } from "effect";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;

/**
 * Community form schema for client-side and server-side validation.
 */
export const communityFormSchema: Schema.Schema<
	{
		readonly name: string;
		readonly slug: string;
		readonly community_id?: string | undefined;
		readonly description?: string | undefined;
		readonly is_public?: boolean | undefined;
		readonly public_notes?: string | undefined;
		readonly private_notes?: string | undefined;
		readonly tags?: readonly string[] | undefined;
	},
	{
		readonly name: string;
		readonly slug: string;
		readonly community_id?: string | undefined;
		readonly description?: string | undefined;
		readonly is_public?: boolean | undefined;
		readonly public_notes?: string | undefined;
		readonly private_notes?: string | undefined;
		readonly tags?: readonly string[] | undefined;
	}
> = Schema.Struct({
	community_id: Schema.optional(Schema.String),
	name: Schema.String.pipe(Schema.minLength(MIN_NAME_LENGTH), Schema.maxLength(MAX_NAME_LENGTH)),
	slug: Schema.String.pipe(
		Schema.pattern(/^[a-z0-9-]+$/, {
			message: () => "Slug must contain only lowercase letters, numbers, and hyphens",
		}),
	),
	description: Schema.optional(Schema.String),
	is_public: Schema.optional(Schema.Boolean),
	public_notes: Schema.optional(Schema.String),
	private_notes: Schema.optional(Schema.String),
	tags: Schema.optional(Schema.Array(Schema.String)),
});

/** Payload type for the community save API endpoint. */
export type CommunityFormPayload = Schema.Schema.Type<typeof communityFormSchema>;

/**
 * Schema for adding a user to a community.
 */
export const communityUserAddSchema: Schema.Schema<
	{
		readonly community_id: string;
		readonly user_id: string;
		readonly role: "owner" | "community_admin" | "member";
		readonly status?: "invited" | "joined" | undefined;
	},
	{
		readonly community_id: string;
		readonly user_id: string;
		readonly role: "owner" | "community_admin" | "member";
		readonly status?: "invited" | "joined" | undefined;
	}
> = Schema.Struct({
	community_id: Schema.String,
	user_id: Schema.String,
	role: Schema.Literal("owner", "community_admin", "member"),
	status: Schema.optional(Schema.Literal("invited", "joined")),
});

/** Payload type for the community user add API endpoint. */
export type CommunityUserAddPayload = Schema.Schema.Type<typeof communityUserAddSchema>;

/**
 * Schema for adding an event to a community.
 */
export const communityEventAddSchema: Schema.Schema<
	{
		readonly community_id: string;
		readonly event_id: string;
	},
	{
		readonly community_id: string;
		readonly event_id: string;
	}
> = Schema.Struct({
	community_id: Schema.String,
	event_id: Schema.String,
});

/** Payload type for the community event add/remove API endpoints. */
export type CommunityEventAddPayload = Schema.Schema.Type<typeof communityEventAddSchema>;

/**
 * Schema for setting (or clearing) the active event on a community.
 * Omit `event_id` to unset the active event.
 */
export const communitySetActiveEventSchema: Schema.Schema<
	{
		readonly community_id: string;
		readonly event_id?: string | undefined;
	},
	{
		readonly community_id: string;
		readonly event_id?: string | undefined;
	}
> = Schema.Struct({
	community_id: Schema.String,
	event_id: Schema.optional(Schema.String),
});

/** Payload type for the community set-active-event API endpoint. */
export type CommunitySetActiveEventPayload = Schema.Schema.Type<typeof communitySetActiveEventSchema>;

/**
 * Schema for adding a song to a community.
 */
export const communitySongAddSchema: Schema.Schema<
	{
		readonly community_id: string;
		readonly song_id: string;
	},
	{
		readonly community_id: string;
		readonly song_id: string;
	}
> = Schema.Struct({
	community_id: Schema.String,
	song_id: Schema.String,
});

/** Payload type for the community song add/remove API endpoints. */
export type CommunitySongAddPayload = Schema.Schema.Type<typeof communitySongAddSchema>;

/**
 * Schema for adding a playlist to a community.
 */
export const communityPlaylistAddSchema: Schema.Schema<
	{
		readonly community_id: string;
		readonly playlist_id: string;
	},
	{
		readonly community_id: string;
		readonly playlist_id: string;
	}
> = Schema.Struct({
	community_id: Schema.String,
	playlist_id: Schema.String,
});

/** Payload type for the community playlist add/remove API endpoints. */
export type CommunityPlaylistAddPayload = Schema.Schema.Type<typeof communityPlaylistAddSchema>;

/**
 * Schema for creating a community share request.
 */
export const communityShareRequestCreateSchema: Schema.Schema<
	{
		readonly community_id: string;
		readonly shared_item_type: "song" | "playlist";
		readonly shared_item_id: string;
		readonly message?: string | undefined;
	},
	{
		readonly community_id: string;
		readonly shared_item_type: "song" | "playlist";
		readonly shared_item_id: string;
		readonly message?: string | undefined;
	}
> = Schema.Struct({
	community_id: Schema.String,
	shared_item_type: Schema.Literal("song", "playlist"),
	shared_item_id: Schema.String,
	message: Schema.optional(Schema.String),
});

/** Payload type for the community share-request create API endpoint. */
export type CommunityShareRequestCreatePayload = Schema.Schema.Type<typeof communityShareRequestCreateSchema>;

/**
 * Schema for updating a community share request status.
 */
export const communityShareRequestUpdateStatusSchema: Schema.Schema<
	{
		readonly request_id: string;
		readonly status: "accepted" | "rejected";
	},
	{
		readonly request_id: string;
		readonly status: "accepted" | "rejected";
	}
> = Schema.Struct({
	request_id: Schema.String,
	status: Schema.Literal("accepted", "rejected"),
});

/** Payload type for the community share-request update-status API endpoint. */
export type CommunityShareRequestUpdateStatusPayload = Schema.Schema.Type<typeof communityShareRequestUpdateStatusSchema>;

/**
 * Schema for a user leaving a community (self-remove).
 */
export const communityUserRemoveSchema: Schema.Schema<
	{ readonly community_id: string },
	{ readonly community_id: string }
> = Schema.Struct({
	community_id: Schema.String,
});

/** Payload type for the community user remove (leave) API endpoint. */
export type CommunityUserRemovePayload = Schema.Schema.Type<typeof communityUserRemoveSchema>;

/**
 * Schema for an admin kicking a user from a community.
 */
export const communityUserKickSchema: Schema.Schema<
	{ readonly community_id: string; readonly user_id: string },
	{ readonly community_id: string; readonly user_id: string }
> = Schema.Struct({
	community_id: Schema.String,
	user_id: Schema.String,
});

/** Payload type for the community user kick API endpoint. */
export type CommunityUserKickPayload = Schema.Schema.Type<typeof communityUserKickSchema>;

/**
 * Schema for a user joining a community.
 */
export const communityUserJoinSchema: Schema.Schema<
	{ readonly community_id: string },
	{ readonly community_id: string }
> = Schema.Struct({
	community_id: Schema.String,
});

/** Payload type for the community user join API endpoint. */
export type CommunityUserJoinPayload = Schema.Schema.Type<typeof communityUserJoinSchema>;
