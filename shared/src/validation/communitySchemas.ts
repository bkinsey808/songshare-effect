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
	},
	{
		readonly name: string;
		readonly slug: string;
		readonly community_id?: string | undefined;
		readonly description?: string | undefined;
		readonly is_public?: boolean | undefined;
		readonly public_notes?: string | undefined;
		readonly private_notes?: string | undefined;
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
});

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
