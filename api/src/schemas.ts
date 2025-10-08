import { Schema } from "effect";

import {
	ApiErrorResponseSchema,
	type ApiResponse,
	ApiResponseSchema,
} from "../../shared/generated/supabaseSchemas";
import { MUSIC_GENRES } from "../../shared/utils/constants";

// Define the schemas first
const _CreateSongRequestSchema = Schema.Struct({
	title: Schema.NonEmptyString.pipe(Schema.trimmed()),
	artist: Schema.NonEmptyString.pipe(Schema.trimmed()),
	duration: Schema.Number.pipe(Schema.positive()),
	genre: Schema.optional(Schema.Literal(...MUSIC_GENRES)),
	tags: Schema.optional(Schema.Array(Schema.NonEmptyString)),
});

const _SongSchema = Schema.Struct({
	id: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	artist: Schema.NonEmptyString,
	duration: Schema.Number.pipe(Schema.positive()),
	fileUrl: Schema.String,
	uploadedAt: Schema.DateFromSelf,
	userId: Schema.NonEmptyString,
	genre: Schema.optional(Schema.Literal(...MUSIC_GENRES)),
	tags: Schema.optional(Schema.Array(Schema.NonEmptyString)),
});

// Schema for song creation request validation
export const CreateSongRequestSchema: Schema.Schema<
	Schema.Schema.Type<typeof _CreateSongRequestSchema>,
	Schema.Schema.Encoded<typeof _CreateSongRequestSchema>,
	Schema.Schema.Context<typeof _CreateSongRequestSchema>
> = _CreateSongRequestSchema;

export type CreateSongRequest = Schema.Schema.Type<
	typeof CreateSongRequestSchema
>;

// Schema for song response
export const SongSchema: Schema.Schema<
	Schema.Schema.Type<typeof _SongSchema>,
	Schema.Schema.Encoded<typeof _SongSchema>,
	Schema.Schema.Context<typeof _SongSchema>
> = _SongSchema;

export type Song = Schema.Schema.Type<typeof SongSchema>;

// Re-export the imported types and schemas for convenience
export { ApiResponseSchema, ApiErrorResponseSchema, type ApiResponse };
