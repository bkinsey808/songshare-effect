import { Schema } from "effect";

export const PlaylistFormField = {
	playlist_id: "playlist_id",
	playlist_name: "playlist_name",
	playlist_slug: "playlist_slug",
	public_notes: "public_notes",
	private_notes: "private_notes",
	song_order: "song_order",
} as const;

export const playlistFormFields = [
	"playlist_id",
	"playlist_name",
	"playlist_slug",
	"public_notes",
	"private_notes",
	"song_order",
] as const;

export type PlaylistFormFieldKey = (typeof playlistFormFields)[number];

export type PlaylistFormValues = {
	playlist_id?: string | undefined;
	playlist_name: string;
	playlist_slug: string;
	public_notes?: string | undefined;
	private_notes?: string | undefined;
	song_order: readonly string[];
};

export const playlistFormSchema: Schema.Schema<PlaylistFormValues> = Schema.Struct({
	[PlaylistFormField.playlist_id]: Schema.optional(Schema.String),
	[PlaylistFormField.playlist_name]: Schema.String,
	[PlaylistFormField.playlist_slug]: Schema.String,
	[PlaylistFormField.public_notes]: Schema.optional(Schema.String),
	[PlaylistFormField.private_notes]: Schema.optional(Schema.String),
	[PlaylistFormField.song_order]: Schema.Array(Schema.String),
});

export type PlaylistFormValuesFromSchema = Schema.Schema.Type<typeof playlistFormSchema>;
