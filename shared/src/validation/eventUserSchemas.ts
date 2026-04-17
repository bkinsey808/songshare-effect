import { Schema } from "effect";

/**
 * Schema for adding a user to an event.
 */
export const eventUserAddSchema: Schema.Schema<
	{
		readonly event_id: string;
		readonly user_id: string;
		readonly role: "participant" | "event_admin" | "event_playlist_admin";
		readonly status?: "invited" | "joined" | undefined;
	},
	{
		readonly event_id: string;
		readonly user_id: string;
		readonly role: "participant" | "event_admin" | "event_playlist_admin";
		readonly status?: "invited" | "joined" | undefined;
	}
> = Schema.Struct({
	event_id: Schema.String,
	user_id: Schema.String,
	role: Schema.Literal("participant", "event_admin", "event_playlist_admin"),
	status: Schema.optional(Schema.Literal("invited", "joined")),
});

/** Payload type for the event user add API endpoint. */
export type EventUserAddPayload = Schema.Schema.Type<typeof eventUserAddSchema>;

/**
 * Schema for kicking a user from an event.
 */
export const eventUserKickSchema: Schema.Schema<
	{ readonly event_id: string; readonly user_id: string },
	{ readonly event_id: string; readonly user_id: string }
> = Schema.Struct({
	event_id: Schema.String,
	user_id: Schema.String,
});

/** Payload type for the event user kick API endpoint. */
export type EventUserKickPayload = Schema.Schema.Type<typeof eventUserKickSchema>;
