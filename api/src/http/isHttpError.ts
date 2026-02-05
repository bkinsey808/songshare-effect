import { HTTP_STATUS } from "@/shared/demo/api";

/**
 * Error class representing HTTP-level errors with an associated status code.
 */
export class HttpError extends Error {
	public readonly status: number;
	constructor(message: string, status = HTTP_STATUS.INTERNAL_SERVER_ERROR as number) {
		super(message);
		this.name = "HttpError";
		this.status = status;
	}
}

/**
 * Type guard to detect `HttpError` instances.
 *
 * @param error - Value to test
 * @returns True when `error` is an instance of HttpError
 */
export function isHttpError(error: unknown): error is HttpError {
	return error instanceof HttpError;
}
