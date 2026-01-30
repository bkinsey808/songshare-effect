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

export type PlaylistErrors =
	| PlaylistNotFoundError
	| NoSupabaseClientError
	| InvalidPlaylistDataError
	| QueryError
	| PlaylistError;
