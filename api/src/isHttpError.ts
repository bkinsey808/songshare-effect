export class HttpError extends Error {
	public readonly status: number;
	constructor(message: string, status = 500) {
		super(message);
		this.name = "HttpError";
		this.status = status;
	}
}

export function isHttpError(error: unknown): error is HttpError {
	return error instanceof HttpError;
}
