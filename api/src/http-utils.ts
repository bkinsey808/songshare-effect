import { Effect } from "effect";
import { type Context } from "hono";

import type { AppError } from "./errors";
import { AuthenticationError } from "./errors";
import { HTTP_STATUS } from "@/shared/demo/api";

/**
 * Convert AppError to appropriate HTTP response
 */
export const errorToHttpResponse = (
	error: AppError,
): { status: number; body: object } => {
	switch (error._tag) {
		case "ValidationError": {
			const body: Record<string, unknown> = {
				success: false,
				error: String(error.message),
			};

			if (error.field !== undefined && error.field.length > 0) {
				body.field = error.field;
			}

			return { status: HTTP_STATUS.BAD_REQUEST as number, body };
		}

		case "NotFoundError": {
			const body: Record<string, unknown> = {
				success: false,
				error: String(error.message),
				resource: error.resource,
			};

			if (error.id !== undefined && error.id.length > 0) {
				body.id = error.id;
			}

			return { status: HTTP_STATUS.NOT_FOUND as number, body };
		}

		case "AuthenticationError":
			return {
				status: HTTP_STATUS.UNAUTHORIZED as number,
				body: {
					success: false,
					error: String(error.message),
				},
			};

		case "AuthorizationError": {
			const body: Record<string, unknown> = {
				success: false,
				error: String(error.message),
			};

			if (error.resource !== undefined && error.resource.length > 0) {
				body.resource = error.resource;
			}

			return { status: HTTP_STATUS.FORBIDDEN as number, body };
		}

		case "DatabaseError":
		case "FileUploadError":
		default:
			return {
				status: HTTP_STATUS.INTERNAL_SERVER_ERROR as number,
				body: {
					success: false,
					error: "Internal server error",
				},
			};
	}
};

// HTTP endpoint handler utility
export function handleHttpEndpoint<A, E extends AppError>(
	effectFactory: (c: Context) => Effect.Effect<A, E>,
	userOnSuccess?: (data: A) => object | Response,
) {
	return async function (ctx: Context): Promise<Response> {
		const effect = Effect.match(effectFactory(ctx), {
			onFailure: (error) => {
				// Log the error for debugging. For expected authentication errors
				// (401) we keep logging minimal to avoid noisy stack traces for
				// unauthenticated visitors during normal app usage.
				try {
					// If this is an AuthenticationError, log a concise message only
					if (error instanceof AuthenticationError) {
						console.debug(
							"[handleHttpEndpoint] AuthenticationError:",
							String(error.message),
						);
					} else if (error instanceof Error) {
						console.error(
							"[handleHttpEndpoint] Unhandled error:",
							error.stack ?? error.message,
						);
					} else {
						console.error(
							"[handleHttpEndpoint] Unhandled error (non-Error):",
							String(error),
						);
					}
				} catch (err) {
					// Swallow logging errors to avoid masking the original error
					console.error(
						"[handleHttpEndpoint] Failed to log error:",
						String(err),
					);
				}
				// `error` can be unknown coming from Effect; coerce to AppError for formatting
				const { status, body } = errorToHttpResponse(error as AppError);
				return ctx.json(body, status as Parameters<typeof ctx.json>[1]);
			},
			onSuccess: (data) => {
				// If the effect itself produced a Response (for redirects or custom headers), return it directly.
				if (data instanceof Response) {
					return data;
				}

				const result = userOnSuccess
					? userOnSuccess(data)
					: { success: true, data };

				// If the onSuccess handler returned a Response, return it directly.
				if (result instanceof Response) {
					return result;
				}

				return ctx.json(result as object);
			},
		});

		return Effect.runPromise(effect);
	};
}
