import { Schema } from "effect";

import { MUSIC_GENRES } from "../../shared/utils/constants.js";

// Schema for song creation request validation
export const CreateSongRequestSchema = Schema.Struct({
	title: Schema.NonEmptyString.pipe(Schema.trimmed()),
	artist: Schema.NonEmptyString.pipe(Schema.trimmed()),
	duration: Schema.Number.pipe(Schema.positive()),
	genre: Schema.optional(Schema.Literal(...MUSIC_GENRES)),
	tags: Schema.optional(Schema.Array(Schema.NonEmptyString)),
});

export type CreateSongRequest = Schema.Schema.Type<
	typeof CreateSongRequestSchema
>;

// Schema for song response
export const SongSchema = Schema.Struct({
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

export type Song = Schema.Schema.Type<typeof SongSchema>;

// Schema for API responses
export const ApiResponseSchema = <A, I, R>(
	dataSchema: Schema.Schema<A, I, R>,
): Schema.Schema<
	{
		readonly success: true;
		readonly data?: A;
		readonly message?: string;
	},
	{
		readonly success: true;
		readonly data?: I;
		readonly message?: string;
	},
	R
> =>
	Schema.Struct({
		success: Schema.Literal(true),
		data: Schema.optional(dataSchema),
		message: Schema.optional(Schema.String),
	});

export const ApiErrorResponseSchema = Schema.Struct({
	success: Schema.Literal(false),
	error: Schema.String,
	message: Schema.optional(Schema.String),
});

// Combined API response schema
export const ApiResponseUnionSchema = <A, I, R>(
	dataSchema: Schema.Schema<A, I, R>,
): Schema.Schema.Any =>
	Schema.Union(ApiResponseSchema(dataSchema), ApiErrorResponseSchema);

export type ApiResponse<T> =
	| {
			success: true;
			data?: T;
			message?: string;
	  }
	| {
			success: false;
			error: string;
			message?: string;
	  };
