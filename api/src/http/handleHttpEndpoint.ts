import { Effect } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import { type AppError, AuthenticationError } from "@/api/api-errors";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import errorToHttpResponse from "./errorToHttpResponse";

// HTTP endpoint handler utility
// We need to accept a function that takes a Hono `Context`—it's difficult to
// express as `readonly` inside nested function signatures, so disable the
// prefer-readonly-parameter-types rule for this function.
export default function handleHttpEndpoint<SuccessData, ErrorType extends AppError>(
	// Mark the incoming function reference as `Readonly<>` so the linter
	// `prefer-readonly-parameter-types` rule recognizes it as immutable.
	effectFactory: (ctxArg: ReadonlyContext) => Effect.Effect<SuccessData, ErrorType>,
	userOnSuccess?: (data: Readonly<SuccessData>) => object | Response,
) {
	return function handleHttpEndpointRequest(ctx: ReadonlyContext): Promise<Response> {
		const effect = Effect.match(effectFactory(ctx), {
			onFailure: (error) => {
				// Log the error for debugging. For expected authentication errors
				// (401) we keep logging minimal to avoid noisy stack traces for
				// unauthenticated visitors during normal app usage.
				try {
					// If this is an AuthenticationError, log a concise message only
					if (error instanceof AuthenticationError) {
						console.warn(
							"[handleHttpEndpoint] AuthenticationError:",
							extractErrorMessage(error.message, "Unknown error"),
						);
					} else if (error instanceof Error) {
						console.error("[handleHttpEndpoint] Unhandled error:", error.stack ?? error.message);
					} else {
						console.error(
							"[handleHttpEndpoint] Unhandled error (non-Error):",
							extractErrorMessage(error, "Unknown error"),
						);
					}
				} catch (error) {
					// Swallow logging errors to avoid masking the original error
					console.error(
						"[handleHttpEndpoint] Failed to log error:",
						extractErrorMessage(error, "Unknown error"),
					);
				}
				// `error` can be unknown coming from Effect; format it with our helper
				const { status, body } = errorToHttpResponse(error);
				return Response.json(body, {
					status,
					headers: { "Content-Type": "application/json" },
				});
			},
			onSuccess: (data) => {
				// If the effect itself produced a Response (for redirects or custom headers), return it directly.
				if (data instanceof Response) {
					return data;
				}

				const result = userOnSuccess ? userOnSuccess(data) : { success: true, data };

				// If the onSuccess handler returned a Response, return it directly.
				if (result instanceof Response) {
					return result;
				}

				return ctx.json(result);
			},
		});

		return Effect.runPromise(effect);
	};
}
