import { HTTP_STATUS } from "@/shared/demo/api";

export class HttpError extends Error {
	public readonly status: number;
	constructor(
		message: string,
		status = HTTP_STATUS.INTERNAL_SERVER_ERROR as number,
	) {
		super(message);
		this.name = "HttpError";
		this.status = status;
	}
}

export function isHttpError(error: unknown): error is HttpError {
	return error instanceof HttpError;
}
