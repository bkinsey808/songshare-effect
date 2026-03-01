// Lightweight typed error classes used across the API.
// These provide a typed `_tag` (used by the HTTP helpers in `api/src/http/`)
// without relying on `any` or casting. They intentionally extend `Error`
// to preserve Error semantics.

/**
 * Error thrown for request validation problems (invalid or missing fields).
 *
 * @remarks
 * Carries an optional `field` property indicating which input caused the error.
 */
export class ValidationError extends Error {
	readonly _tag = "ValidationError";
	override readonly message: string;
	readonly field: string | undefined;

	constructor(args: { readonly message: string; readonly field?: string }) {
		super(args.message);
		this.message = args.message;
		this.field = args.field;
		Object.setPrototypeOf(this, ValidationError.prototype);
	}
}

/**
 * Error indicating a resource was not found.
 *
 * @remarks
 * Includes `resource` and optional `id` to aid client-side diagnostics.
 */
export class NotFoundError extends Error {
	readonly _tag = "NotFoundError";
	override readonly message: string;
	readonly resource: string;
	readonly id: string | undefined;

	constructor(args: { readonly message: string; readonly resource: string; readonly id?: string }) {
		super(args.message);
		this.message = args.message;
		this.resource = args.resource;
		this.id = args.id;
		Object.setPrototypeOf(this, NotFoundError.prototype);
	}
}

/**
 * Error representing an unexpected database or persistence failure.
 *
 * @remarks
 * May include a `cause` with the underlying error details.
 */
export class DatabaseError extends Error {
	readonly _tag = "DatabaseError";
	override readonly message: string;
	override readonly cause?: unknown;

	constructor(args: { readonly message: string; readonly cause?: unknown }) {
		super(args.message);
		this.message = args.message;
		this.cause = args.cause;
		Object.setPrototypeOf(this, DatabaseError.prototype);
	}
}

/**
 * Generic server error for unexpected runtime failures.
 *
 * @remarks
 * Use this when there is no more specific typed error to return.
 */
export class ServerError extends Error {
	readonly _tag = "ServerError";
	override readonly message: string;
	override readonly cause?: unknown;

	constructor(args: { readonly message: string; readonly cause?: unknown }) {
		super(args.message);
		this.message = args.message;
		this.cause = args.cause;
		Object.setPrototypeOf(this, ServerError.prototype);
	}
}

/**
 * Error indicating an external provider (OAuth, etc.) is unavailable or failed.
 */
export class ProviderError extends Error {
	readonly _tag = "ProviderError";
	override readonly message: string;
	override readonly cause?: unknown;

	constructor(args: { readonly message: string; readonly cause?: unknown }) {
		super(args.message);
		this.message = args.message;
		this.cause = args.cause;
		Object.setPrototypeOf(this, ProviderError.prototype);
	}
}

/**
 * Error representing an issue during file upload/processing.
 *
 * @remarks
 * May include an optional `filename` and `cause` with underlying details.
 */
export class FileUploadError extends Error {
	readonly _tag = "FileUploadError";
	override readonly message: string;
	readonly filename: string | undefined;
	override readonly cause?: unknown;

	constructor(args: {
		readonly message: string;
		readonly filename?: string;
		readonly cause?: unknown;
	}) {
		super(args.message);
		this.message = args.message;
		this.filename = args.filename;
		this.cause = args.cause;
		Object.setPrototypeOf(this, FileUploadError.prototype);
	}
}

/**
 * Error used when authentication fails or is required.
 */
export class AuthenticationError extends Error {
	readonly _tag = "AuthenticationError";
	override readonly message: string;

	constructor(args: { readonly message: string }) {
		super(args.message);
		this.message = args.message;
		Object.setPrototypeOf(this, AuthenticationError.prototype);
	}
}

/**
 * Error used when an authenticated principal lacks permission for an action.
 *
 * @remarks
 * May include `resource` to indicate which resource the permission check failed on.
 */
export class AuthorizationError extends Error {
	readonly _tag = "AuthorizationError";
	override readonly message: string;
	readonly resource: string | undefined;

	constructor(args: { readonly message: string; readonly resource?: string }) {
		super(args.message);
		this.message = args.message;
		this.resource = args.resource;
		Object.setPrototypeOf(this, AuthorizationError.prototype);
	}
}

// Union type of all possible application errors
export type AppError =
	| ValidationError
	| NotFoundError
	| DatabaseError
	| ServerError
	| ProviderError
	| FileUploadError
	| AuthenticationError
	| AuthorizationError;
