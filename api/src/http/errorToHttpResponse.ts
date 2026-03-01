import { type AppError } from "@/api/api-errors";
import { HTTP_STATUS } from "@/shared/demo/api";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

/**
 * Convert an AppError into an HTTP response payload and status.
 *
 * @param error - The application error to convert (one of the AppError variants)
 * @returns An object containing `status` and `body` suitable for use with `Response.json`
 */
export default function errorToHttpResponse(error: Readonly<AppError>): {
	status: number;
	body: object;
} {
	if (error._tag === "ValidationError") {
		const body: Record<string, unknown> = {
			success: false,
			error: extractErrorMessage(error.message, "Unknown error"),
		};

		if (error.field !== undefined && error.field !== "") {
			body.field = error.field;
		}

		return { status: HTTP_STATUS.BAD_REQUEST as number, body };
	}

	if (error._tag === "NotFoundError") {
		const body: Record<string, unknown> = {
			success: false,
			error: extractErrorMessage(error.message, "Unknown error"),
			resource: error.resource,
		};

		if (error.id !== undefined && error.id !== "") {
			body.id = error.id;
		}

		return { status: HTTP_STATUS.NOT_FOUND as number, body };
	}

	if (error._tag === "AuthenticationError") {
		return {
			status: HTTP_STATUS.UNAUTHORIZED as number,
			body: {
				success: false,
				error: extractErrorMessage(error.message, "Unknown error"),
			},
		};
	}

	if (error._tag === "AuthorizationError") {
		const body: Record<string, unknown> = {
			success: false,
			error: extractErrorMessage(error.message, "Unknown error"),
		};

		if (error.resource !== undefined && error.resource !== "") {
			body.resource = error.resource;
		}

		return { status: HTTP_STATUS.FORBIDDEN as number, body };
	}

	if (error._tag === "DatabaseError" || error._tag === "FileUploadError") {
		return {
			status: HTTP_STATUS.INTERNAL_SERVER_ERROR as number,
			body: {
				success: false,
				error: "Internal server error",
			},
		};
	}

	// Fallback for any unknown AppError variant — return generic internal server error
	return {
		status: HTTP_STATUS.INTERNAL_SERVER_ERROR as number,
		body: {
			success: false,
			error: "Internal server error",
		},
	};
}
