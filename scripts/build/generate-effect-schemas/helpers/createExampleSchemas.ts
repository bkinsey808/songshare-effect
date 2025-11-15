import type { TableDefinition } from "./generate-effect-schemas-types";

export function createExampleSchemas(): TableDefinition[] {
	return [
		{
			name: "users",
			columns: [
				{ name: "id", type: "uuid", nullable: false, isPrimaryKey: true },
				{ name: "email", type: "string", nullable: false },
				{ name: "name", type: "string", nullable: true },
				{ name: "avatar_url", type: "string", nullable: true },
				{ name: "created_at", type: "Date", nullable: false },
				{ name: "updated_at", type: "Date", nullable: false },
			],
		},
		{
			name: "songs",
			columns: [
				{ name: "id", type: "uuid", nullable: false, isPrimaryKey: true },
				{ name: "title", type: "string", nullable: false },
				{ name: "artist", type: "string", nullable: false },
				{ name: "duration", type: "number", nullable: false },
				{ name: "file_url", type: "string", nullable: false },
				{
					name: "user_id",
					type: "uuid",
					nullable: false,
					isForeignKey: true,
					referencedTable: "users",
				},
				{ name: "genre", type: "string", nullable: true },
				{ name: "tags", type: "Json", nullable: true },
				{ name: "play_count", type: "number", nullable: true },
				{ name: "is_public", type: "boolean", nullable: false },
				{ name: "created_at", type: "Date", nullable: false },
				{ name: "updated_at", type: "Date", nullable: false },
			],
		},
		{
			name: "playlists",
			columns: [
				{ name: "id", type: "uuid", nullable: false, isPrimaryKey: true },
				{ name: "name", type: "string", nullable: false },
				{ name: "description", type: "string", nullable: true },
				{
					name: "user_id",
					type: "uuid",
					nullable: false,
					isForeignKey: true,
					referencedTable: "users",
				},
				{ name: "is_public", type: "boolean", nullable: false },
				{ name: "created_at", type: "Date", nullable: false },
				{ name: "updated_at", type: "Date", nullable: false },
			],
		},
		{
			name: "playlist_songs",
			columns: [
				{ name: "id", type: "uuid", nullable: false, isPrimaryKey: true },
				{
					name: "playlist_id",
					type: "uuid",
					nullable: false,
					isForeignKey: true,
					referencedTable: "playlists",
				},
				{
					name: "song_id",
					type: "uuid",
					nullable: false,
					isForeignKey: true,
					referencedTable: "songs",
				},
				{ name: "position", type: "number", nullable: false },
				{ name: "added_at", type: "Date", nullable: false },
			],
		},
	];
}
