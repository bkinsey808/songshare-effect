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

export class PlaylistNotFoundError extends PlaylistError {
	override readonly _tag = "PlaylistNotFoundError";
	readonly slug: string;
	constructor(slug: string) {
		super(`Playlist not found: ${slug}`);
		this.slug = slug;
		Object.setPrototypeOf(this, PlaylistNotFoundError.prototype);
	}
}

export class NoSupabaseClientError extends PlaylistError {
	override readonly _tag = "NoSupabaseClientError";
	constructor() {
		super("No Supabase client available");
		Object.setPrototypeOf(this, NoSupabaseClientError.prototype);
	}
}

export class InvalidPlaylistDataError extends PlaylistError {
	override readonly _tag = "InvalidPlaylistDataError";
	constructor() {
		super("Invalid playlist_public data");
		Object.setPrototypeOf(this, InvalidPlaylistDataError.prototype);
	}
}

export class QueryError extends PlaylistError {
	override readonly _tag = "QueryError";
	override readonly cause?: unknown;
	constructor(message: string, cause?: unknown) {
		super(message);
		this.cause = cause;
		Object.setPrototypeOf(this, QueryError.prototype);
	}
}

export class PlaylistSaveError extends PlaylistError {
	override readonly _tag: string = "PlaylistSaveError";
	override readonly cause?: unknown;
	constructor(message: string, cause?: unknown) {
		super(message);
		this.cause = cause;
		Object.setPrototypeOf(this, PlaylistSaveError.prototype);
	}
}

export class PlaylistSaveNetworkError extends PlaylistSaveError {
	override readonly _tag = "PlaylistSaveNetworkError";
	constructor(message: string, cause?: unknown) {
		super(message, cause);
		Object.setPrototypeOf(this, PlaylistSaveNetworkError.prototype);
	}
}

export class PlaylistSaveApiError extends PlaylistSaveError {
	override readonly _tag = "PlaylistSaveApiError";
	readonly status?: number | undefined;
	constructor(message: string, status?: number, cause?: unknown) {
		super(message, cause);
		this.status = status;
		Object.setPrototypeOf(this, PlaylistSaveApiError.prototype);
	}
}

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
