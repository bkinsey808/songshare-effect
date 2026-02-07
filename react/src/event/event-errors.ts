/**
 * Event-related error classes for typed error handling.
 */
export class EventError extends Error {
	/**
	 * Tag identifying the error variant. Typed as `string` to allow subclasses
	 * to use a more specific literal tag while remaining assignable to the base.
	 */
	readonly _tag: string = "EventError";
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, EventError.prototype);
	}
}

/**
 * Error thrown when an event cannot be found by slug or id.
 */
export class EventNotFoundError extends EventError {
	override readonly _tag = "EventNotFoundError";
	readonly slug: string;
	constructor(slug: string) {
		super(`Event not found: ${slug}`);
		this.slug = slug;
		Object.setPrototypeOf(this, EventNotFoundError.prototype);
	}
}

/**
 * Error thrown when no Supabase client is available in the current context.
 */
export class NoSupabaseClientError extends EventError {
	override readonly _tag = "NoSupabaseClientError";
	constructor() {
		super("No Supabase client available");
		Object.setPrototypeOf(this, NoSupabaseClientError.prototype);
	}
}

/**
 * Error thrown when event data is malformed or missing required fields.
 */
export class InvalidEventDataError extends EventError {
	override readonly _tag = "InvalidEventDataError";
	constructor() {
		super("Invalid event_public data");
		Object.setPrototypeOf(this, InvalidEventDataError.prototype);
	}
}

/**
 * Error thrown when a Supabase query fails.
 */
export class QueryError extends EventError {
	override readonly _tag = "QueryError";
	readonly details: string;
	constructor(message: string, details?: string) {
		super(message);
		this.details = details ?? message;
		Object.setPrototypeOf(this, QueryError.prototype);
	}
}

/**
 * Error thrown when the user is not authorized to access the event.
 */
export class UnauthorizedError extends EventError {
	override readonly _tag = "UnauthorizedError";
	constructor() {
		super("Not authorized to access this event");
		Object.setPrototypeOf(this, UnauthorizedError.prototype);
	}
}

/**
 * Union type of all event error classes.
 */
export type EventErrorType =
	| EventNotFoundError
	| NoSupabaseClientError
	| InvalidEventDataError
	| QueryError
	| UnauthorizedError
	| EventSaveError
	| EventSaveApiError
	| EventSaveNetworkError
	| EventSaveInvalidResponseError
	| EventUserJoinError
	| EventUserJoinApiError
	| EventUserJoinNetworkError
	| EventUserLeaveError
	| EventUserLeaveApiError
	| EventUserLeaveNetworkError;

/**
 * Type alias for event errors array (for Effect error handling).
 */
export type EventErrors = readonly EventErrorType[];

/**
 * Base class for event save operation errors.
 */
export class EventSaveError extends EventError {
	override readonly _tag: string = "EventSaveError";
	override readonly cause?: unknown;
	constructor(message: string, cause?: unknown) {
		super(message);
		this.cause = cause;
		Object.setPrototypeOf(this, EventSaveError.prototype);
	}
}

/**
 * Error thrown when the save API returns a non-ok response.
 */
export class EventSaveApiError extends EventSaveError {
	override readonly _tag = "EventSaveApiError";
	readonly statusCode: number | undefined;
	constructor(message: string, statusCode?: number, cause?: unknown) {
		super(message, cause);
		this.statusCode = statusCode;
		Object.setPrototypeOf(this, EventSaveApiError.prototype);
	}
}

/**
 * Error thrown when a network error occurs during save.
 */
export class EventSaveNetworkError extends EventSaveError {
	override readonly _tag = "EventSaveNetworkError";
	constructor(message: string, cause?: unknown) {
		super(message, cause);
		Object.setPrototypeOf(this, EventSaveNetworkError.prototype);
	}
}

/**
 * Error thrown when the save API response is invalid or malformed.
 */
export class EventSaveInvalidResponseError extends EventSaveError {
	override readonly _tag = "EventSaveInvalidResponseError";
	constructor(cause?: unknown) {
		super("Invalid response from save API", cause);
		Object.setPrototypeOf(this, EventSaveInvalidResponseError.prototype);
	}
}

/**
 * Base class for event user join operation errors.
 */
export class EventUserJoinError extends EventError {
	override readonly _tag: string = "EventUserJoinError";
	override readonly cause?: unknown;
	constructor(message: string, cause?: unknown) {
		super(message);
		this.cause = cause;
		Object.setPrototypeOf(this, EventUserJoinError.prototype);
	}
}

/**
 * Error thrown when the join API returns a non-ok response.
 */
export class EventUserJoinApiError extends EventUserJoinError {
	override readonly _tag = "EventUserJoinApiError";
	readonly statusCode: number | undefined;
	constructor(message: string, statusCode?: number, cause?: unknown) {
		super(message, cause);
		this.statusCode = statusCode;
		Object.setPrototypeOf(this, EventUserJoinApiError.prototype);
	}
}

/**
 * Error thrown when a network error occurs during join.
 */
export class EventUserJoinNetworkError extends EventUserJoinError {
	override readonly _tag = "EventUserJoinNetworkError";
	constructor(message: string, cause?: unknown) {
		super(message, cause);
		Object.setPrototypeOf(this, EventUserJoinNetworkError.prototype);
	}
}

/**
 * Base class for event user leave operation errors.
 */
export class EventUserLeaveError extends EventError {
	override readonly _tag: string = "EventUserLeaveError";
	override readonly cause?: unknown;
	constructor(message: string, cause?: unknown) {
		super(message);
		this.cause = cause;
		Object.setPrototypeOf(this, EventUserLeaveError.prototype);
	}
}

/**
 * Error thrown when the leave API returns a non-ok response.
 */
export class EventUserLeaveApiError extends EventUserLeaveError {
	override readonly _tag = "EventUserLeaveApiError";
	readonly statusCode: number | undefined;
	constructor(message: string, statusCode?: number, cause?: unknown) {
		super(message, cause);
		this.statusCode = statusCode;
		Object.setPrototypeOf(this, EventUserLeaveApiError.prototype);
	}
}

/**
 * Error thrown when a network error occurs during leave.
 */
export class EventUserLeaveNetworkError extends EventUserLeaveError {
	override readonly _tag = "EventUserLeaveNetworkError";
	constructor(message: string, cause?: unknown) {
		super(message, cause);
		Object.setPrototypeOf(this, EventUserLeaveNetworkError.prototype);
	}
}
