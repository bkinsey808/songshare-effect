// Lightweight typed error classes used across the API.
// These provide a typed `_tag` (used by http-utils) and explicit properties
// without relying on `any` or casting. They intentionally extend `Error`
// to preserve Error semantics.

export class ValidationError extends Error {
	readonly _tag = "ValidationError" as const;
	override readonly message: string;
	readonly field: string | undefined;

	constructor(args: { readonly message: string; readonly field?: string }) {
		super(args.message);
		this.message = args.message;
		this.field = args.field;
		Object.setPrototypeOf(this, ValidationError.prototype);
	}
}

export class NotFoundError extends Error {
	readonly _tag = "NotFoundError" as const;
	override readonly message: string;
	readonly resource: string;
	readonly id: string | undefined;

	constructor(args: {
		readonly message: string;
		readonly resource: string;
		readonly id?: string;
	}) {
		super(args.message);
		this.message = args.message;
		this.resource = args.resource;
		this.id = args.id;
		Object.setPrototypeOf(this, NotFoundError.prototype);
	}
}

export class DatabaseError extends Error {
	readonly _tag = "DatabaseError" as const;
	override readonly message: string;
	override readonly cause: unknown | undefined;

	constructor(args: { readonly message: string; readonly cause?: unknown }) {
		super(args.message);
		this.message = args.message;
		this.cause = args.cause;
		Object.setPrototypeOf(this, DatabaseError.prototype);
	}
}

export class FileUploadError extends Error {
	readonly _tag = "FileUploadError" as const;
	override readonly message: string;
	readonly filename: string | undefined;
	override readonly cause: unknown | undefined;

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

export class AuthenticationError extends Error {
	readonly _tag = "AuthenticationError" as const;
	override readonly message: string;

	constructor(args: { readonly message: string }) {
		super(args.message);
		this.message = args.message;
		Object.setPrototypeOf(this, AuthenticationError.prototype);
	}
}

export class AuthorizationError extends Error {
	readonly _tag = "AuthorizationError" as const;
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
	| FileUploadError
	| AuthenticationError
	| AuthorizationError;
