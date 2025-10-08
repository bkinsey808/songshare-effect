import { Effect } from "effect";
import { type Context } from "hono";

import { HTTP_STATUS } from "../../shared/types/api";
import type { AppError } from "./errors";

/**
 * Convert AppError to appropriate HTTP response
 */
export const errorToHttpResponse = (
	error: AppError,
): { status: number; body: object } => {
	switch (error._tag) {
		case "ValidationError": {
			return {
				status: HTTP_STATUS.BAD_REQUEST as number,
				body: {
					success: false,
					error: error.message,
					...(error.field !== undefined &&
						error.field.length > 0 && { field: error.field }),
				},
			};
		}
		case "NotFoundError": {
			return {
				status: HTTP_STATUS.NOT_FOUND as number,
				body: {
					success: false,
					error: error.message,
					resource: error.resource,
					...(error.id !== undefined &&
						error.id.length > 0 && { id: error.id }),
				},
			};
		}
		case "AuthenticationError": {
			return {
				status: HTTP_STATUS.UNAUTHORIZED as number,
				body: {
					success: false,
					error: error.message,
				},
			};
		}
		case "AuthorizationError": {
			return {
				status: HTTP_STATUS.FORBIDDEN as number,
				body: {
					success: false,
					error: error.message,
					...(error.resource !== undefined &&
						error.resource.length > 0 && { resource: error.resource }),
				},
			};
		}
		case "DatabaseError":
		case "FileUploadError":
		default: {
			return {
				status: HTTP_STATUS.INTERNAL_SERVER_ERROR as number,
				body: {
					success: false,
					error: "Internal server error",
				},
			};
		}
	}
};

// HTTP endpoint handler utility
export const handleHttpEndpoint =
	<A, E extends AppError>(
		effectFactory: (c: Context) => Effect.Effect<A, E>,
		onSuccess?: (data: A) => object,
	) =>
	async (ctx: Context): Promise<Response> => {
		const effect = Effect.match(effectFactory(ctx), {
			onFailure: (error) => {
				const { status, body } = errorToHttpResponse(error);
				return ctx.json(body, status as Parameters<typeof ctx.json>[1]);
			},
			onSuccess: (data) => {
				const successBody = onSuccess
					? onSuccess(data)
					: { success: true, data };
				return ctx.json(successBody);
			},
		});

		return Effect.runPromise(effect);
	};
