import { Effect } from "effect";

import { type AuthenticationError, type DatabaseError, ValidationError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import {
	addCommunityInviteOnShare,
	extractShareCreateRequest,
	type ShareCreateRequest,
	validateSharedItemAccess,
} from "./shareCreateHelpers";
import createShareRecord from "./shareCreateRecord";

/**
 * Server-side handler for creating a share.
 *
 * This Effect-based handler:
 * - validates the incoming request
 * - verifies user authentication
 * - validates the shared item exists and sender has access
 * - creates share records using service key (bypass RLS for trusted operation)
 *
 * @param ctx - The readonly request context provided by the server
 * @returns The created share data, or fails with an error
 */
export default function shareCreateHandler(
	ctx: ReadonlyContext,
): Effect.Effect<{ shareId: string }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* shareCreateGen($) {
		const requestBody: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		// Validate request structure
		const req: ShareCreateRequest = yield* $(
			Effect.try({
				try: () => extractShareCreateRequest(requestBody),
				catch: (error) =>
					new ValidationError({
						message: extractErrorMessage(error, "Invalid request"),
					}),
			}),
		);

		// Authenticate user
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const senderUserId = userSession.user.user_id;

		// Prevent self-sharing
		if (senderUserId === req.recipient_user_id) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Cannot share items with yourself",
					}),
				),
			);
		}

		// Get Supabase admin client (service key - allows bypassing RLS)
		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		// Validate shared item exists and sender has access
		const hasAccess = yield* $(
			validateSharedItemAccess({
				client,
				senderUserId,
				itemType: req.shared_item_type,
				itemId: req.shared_item_id,
			}),
		);

		if (!hasAccess) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: "Shared item not found or access denied",
					}),
				),
			);
		}

		// Create the share record
		const result = yield* $(createShareRecord(client, senderUserId, req));

		// When sharing a community, also add the recipient to community_user as invited
		// so they appear in Pending Invitations. Non-blocking: share succeeds even if this fails.
		if (req.shared_item_type === "community") {
			yield* $(
				addCommunityInviteOnShare(client, {
					communityId: req.shared_item_id,
					recipientUserId: req.recipient_user_id,
				}).pipe(
					Effect.tapError((err) =>
						Effect.sync(() => {
							console.error("[shareCreate] Failed to add community invitation:", err.message, {
								communityId: req.shared_item_id,
								recipientUserId: req.recipient_user_id,
							});
						}),
					),
					Effect.catchAll(() => Effect.succeed(undefined)),
				),
			);
		}

		return result;
	});
}
