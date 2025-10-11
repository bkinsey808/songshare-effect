import { Schema } from "effect";

import {
	ApiErrorResponseSchema,
	type ApiResponse,
	ApiResponseSchema,
} from "@/shared/generated/supabaseSchemas";
import { MUSIC_GENRES } from "@/shared/utils/constants";

// Define the schemas first
export type CreateSongRequest = {
	readonly title: string;
	readonly artist: string;
	readonly duration: number;
	readonly genre?: (typeof MUSIC_GENRES)[number] | undefined;
	readonly tags?: ReadonlyArray<string> | undefined;
};

export const CreateSongRequestSchema: Schema.Schema<
	CreateSongRequest,
	CreateSongRequest,
	never
> = Schema.Struct({
	title: Schema.NonEmptyString.pipe(Schema.trimmed()),
	artist: Schema.NonEmptyString.pipe(Schema.trimmed()),
	duration: Schema.Number.pipe(Schema.positive()),
	genre: Schema.optional(Schema.Literal(...MUSIC_GENRES)),
	tags: Schema.optional(Schema.Array(Schema.NonEmptyString)),
});

export type Song = {
	readonly id: string;
	readonly title: string;
	readonly artist: string;
	readonly duration: number;
	readonly fileUrl: string;
	readonly uploadedAt: Date;
	readonly userId: string;
	readonly genre?: (typeof MUSIC_GENRES)[number] | undefined;
	readonly tags?: ReadonlyArray<string> | undefined;
};

export const SongSchema: Schema.Schema<Song, Song, never> = Schema.Struct({
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

// Export types inferred from the schemas
// (Types `CreateSongRequest` and `Song` are exported above)

// Re-export the imported types and schemas for convenience
export { ApiResponseSchema, ApiErrorResponseSchema, type ApiResponse };
