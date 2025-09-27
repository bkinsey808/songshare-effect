import { Data } from "effect";

// Define application-specific error types using Effect's Data module
// eslint-disable-next-line unicorn/throw-new-error
export class ValidationError extends Data.TaggedError("ValidationError")<{
	readonly message: string;
	readonly field?: string;
}> {}

// eslint-disable-next-line unicorn/throw-new-error
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
	readonly message: string;
	readonly resource: string;
	readonly id?: string;
}> {}

// eslint-disable-next-line unicorn/throw-new-error
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

// eslint-disable-next-line unicorn/throw-new-error
export class FileUploadError extends Data.TaggedError("FileUploadError")<{
	readonly message: string;
	readonly filename?: string;
	readonly cause?: unknown;
}> {}

// eslint-disable-next-line unicorn/throw-new-error
export class AuthenticationError extends Data.TaggedError(
	"AuthenticationError",
)<{
	readonly message: string;
}> {}

// eslint-disable-next-line unicorn/throw-new-error
export class AuthorizationError extends Data.TaggedError("AuthorizationError")<{
	readonly message: string;
	readonly resource?: string;
}> {}

// Union type of all possible application errors
export type AppError =
	| ValidationError
	| NotFoundError
	| DatabaseError
	| FileUploadError
	| AuthenticationError
	| AuthorizationError;
