/**
 * Playlist-related error classes for typed error handling.
 */
export class PlaylistError extends Error {
	/**
	 * Tag identifying the error variant. Typed as `string` to allow subclasses
	 * to use a more specific literal tag while remaining assignable to the base.
	 */
	readonly _tag: string = "PlaylistError";
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, PlaylistError.prototype);
	}
}

/**
 * Error thrown when a playlist cannot be found by slug or id.
 *
 * @param slug - The playlist slug that failed to resolve
 */
export class PlaylistNotFoundError extends PlaylistError {
	override readonly _tag = "PlaylistNotFoundError";
	readonly slug: string;
	constructor(slug: string) {
		super(`Playlist not found: ${slug}`);
		this.slug = slug;
		Object.setPrototypeOf(this, PlaylistNotFoundError.prototype);
	}
}

/**
 * Error thrown when no Supabase client is available in the current context.
 */
export class NoSupabaseClientError extends PlaylistError {
	override readonly _tag = "NoSupabaseClientError";
	constructor() {
		super("No Supabase client available");
		Object.setPrototypeOf(this, NoSupabaseClientError.prototype);
	}
}

/**
 * Error thrown when playlist data is malformed or missing required fields.
 */
export class InvalidPlaylistDataError extends PlaylistError {
	override readonly _tag = "InvalidPlaylistDataError";
	constructor() {
		super("Invalid playlist_public data");
		Object.setPrototypeOf(this, InvalidPlaylistDataError.prototype);
	}
}

/**
 * Error indicating a query failure against an external service (e.g., Supabase).
 *
 * @param message - Description of the error
 * @param cause - Optional underlying error object
 */
export class QueryError extends PlaylistError {
	override readonly _tag = "QueryError";
	override readonly cause?: unknown;
	constructor(message: string, cause?: unknown) {
		super(message);
		this.cause = cause;
		Object.setPrototypeOf(this, QueryError.prototype);
	}
}

/**
 * Error representing a failure to save a playlist (network or API error).
 *
 * @param message - Human-readable error message
 * @param cause - Optional underlying error object
 */
export class PlaylistSaveError extends PlaylistError {
	override readonly _tag: string = "PlaylistSaveError";
	override readonly cause?: unknown;
	constructor(message: string, cause?: unknown) {
		super(message);
		this.cause = cause;
		Object.setPrototypeOf(this, PlaylistSaveError.prototype);
	}
}

/**
 * Error for network-related failures during playlist save operations.
 */
export class PlaylistSaveNetworkError extends PlaylistSaveError {
	override readonly _tag = "PlaylistSaveNetworkError";
	constructor(message: string, cause?: unknown) {
		super(message, cause);
		Object.setPrototypeOf(this, PlaylistSaveNetworkError.prototype);
	}
}

/**
 * Error representing an API error when saving a playlist (contains status code).
 *
 * @param message - Error message
 * @param status - HTTP status code returned by the API
 * @param cause - Optional underlying error
 */
export class PlaylistSaveApiError extends PlaylistSaveError {
	override readonly _tag = "PlaylistSaveApiError";
	readonly status?: number | undefined;
	constructor(message: string, status?: number, cause?: unknown) {
		super(message, cause);
		this.status = status;
		Object.setPrototypeOf(this, PlaylistSaveApiError.prototype);
	}
}

/**
 * Error representing an unexpected or invalid response from the playlist save
 * API. Typically indicates the API returned malformed data or an unexpected
 * status body.
 *
 * @param cause - Optional underlying error or response payload
 */
export class PlaylistSaveInvalidResponseError extends PlaylistSaveError {
	override readonly _tag = "PlaylistSaveInvalidResponseError";
	constructor(cause?: unknown) {
		super("Invalid response from save API", cause);
		Object.setPrototypeOf(this, PlaylistSaveInvalidResponseError.prototype);
	}
}

export type PlaylistErrors =
	| PlaylistNotFoundError
	| NoSupabaseClientError
	| InvalidPlaylistDataError
	| QueryError
	| PlaylistSaveError
	| PlaylistError;
