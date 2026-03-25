import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import { ZERO } from "@/shared/constants/shared-constants";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";
import isRecord from "@/shared/type-guards/isRecord";
import { communityFormSchema } from "@/shared/validation/communitySchemas";
import validateFormEffect from "@/shared/validation/form/validateFormEffect";
import { tagSlugSchema } from "@/shared/validation/tagSchemas";

import { type AuthenticationError, DatabaseError, ValidationError } from "../api-errors";
import getCommunityRoleCapabilities from "../community-user/getCommunityRoleCapabilities";
import getVerifiedUserSession from "../user-session/getVerifiedSession";

type CommunityFormData = Schema.Schema.Type<typeof communityFormSchema>;

/**
 * Server-side handler for saving a community.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns The public record that was created in `community_public` or a
 *   failed effect. Errors are one of {@link ValidationError},
 *   {@link DatabaseError}, or {@link AuthenticationError}.
 */
export default function communitySave(
	ctx: ReadonlyContext,
): Effect.Effect<unknown, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* communitySaveGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		const validated: CommunityFormData = yield* $(
			validateFormEffect({
				schema: communityFormSchema,
				data: body,
				i18nMessageKey: "COMMUNITY_FORM",
			}).pipe(
				Effect.mapError((errs) => {
					const first =
						Array.isArray(errs) && errs.length > ZERO ? errs.find(() => true) : undefined;
					return new ValidationError({
						message: first?.message ?? "Validation failed",
					});
				}),
			),
		);

		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		const isUpdate = validated.community_id !== undefined && validated.community_id.trim() !== "";
		const communityId = isUpdate ? validated.community_id : crypto.randomUUID();

		if (isUpdate) {
			const userRole = yield* $(
				Effect.tryPromise({
					try: () =>
						supabase
							.from("community_user")
							.select("role")
							.eq("community_id", communityId)
							.eq("user_id", userId)
							.single(),
					catch: (err) =>
						new DatabaseError({
							message: `Failed to verify community permissions: ${extractErrorMessage(err, "Unknown error")}`,
						}),
				}),
			);

			if (userRole.error) {
				return yield* $(
					Effect.fail(
						new ValidationError({
							message: "Community not found or you do not have permission to update it",
						}),
					),
				);
			}

			const roleCapabilities = getCommunityRoleCapabilities(userRole.data?.role);

			if (!roleCapabilities.canUpdateCommunityAllFields) {
				return yield* $(
					Effect.fail(
						new ValidationError({
							message: "You do not have permission to update this community",
						}),
					),
				);
			}
		}

		// Update or insert private community data
		const privateResult = yield* $(
			Effect.tryPromise({
				try: () => {
					if (isUpdate) {
						if (validated.private_notes === undefined) {
							return supabase
								.from("community")
								.select("community_id")
								.eq("community_id", communityId)
								.single();
						}

						return supabase
							.from("community")
							.update({
								private_notes: validated.private_notes,
							})
							.eq("community_id", communityId)
							.select()
							.single();
					}
					return supabase
						.from("community")
						.insert([
							{
								community_id: communityId,
								owner_id: userId,
								private_notes: validated.private_notes ?? "",
							},
						])
						.select()
						.single();
				},
				catch: (err) =>
					new DatabaseError({
						message: `Failed to ${isUpdate ? "update" : "create"} private community: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (privateResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: privateResult.error?.message ?? "Unknown DB error",
					}),
				),
			);
		}

		// Update or insert into public table (community_public)
		const publicResult = yield* $(
			Effect.tryPromise({
				try: () => {
					if (isUpdate) {
						const updateData: Record<string, unknown> = {};

						if (validated.name !== undefined) {
							updateData.community_name = validated.name;
						}
						if (validated.description !== undefined) {
							updateData.description = validated.description;
						}
						if (validated.slug !== undefined) {
							updateData.community_slug = validated.slug;
						}
						if (validated.is_public !== undefined) {
							updateData.is_public = validated.is_public;
						}
						if (validated.public_notes !== undefined) {
							updateData.public_notes = validated.public_notes;
						}

						if (Object.keys(updateData).length === ZERO) {
							return supabase
								.from("community_public")
								.select()
								.eq("community_id", communityId)
								.single();
						}

						return supabase
							.from("community_public")
							.update(updateData)
							.eq("community_id", communityId)
							.select()
							.single();
					}
					return supabase
						.from("community_public")
						.insert([
							{
								community_id: communityId,
								owner_id: userId,
								community_name: validated.name ?? "",
								community_slug: validated.slug ?? "",
								description: validated.description ?? "",
								is_public: validated.is_public ?? false,
								public_notes: validated.public_notes ?? "",
							},
						])
						.select()
						.single();
				},
				catch: (err) =>
					new DatabaseError({
						message: `Failed to ${isUpdate ? "update" : "create"} public community: ${extractErrorMessage(err, "Unknown error")}`,
					}),
			}),
		);

		if (publicResult.error) {
			if (!isUpdate) {
				try {
					void Effect.runPromise(
						Effect.tryPromise({
							try: () => supabase.from("community").delete().eq("community_id", communityId),
							catch: () => undefined,
						}),
					);
				} catch {
					// Cleanup failed but continue with error reporting
				}
			}
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: publicResult.error?.message ?? "Unknown DB error",
					}),
				),
			);
		}

		// Extract tags from body (not in communityFormSchema) and save them.
		const rawTags = isRecord(body) ? body.tags : undefined;
		if (rawTags !== undefined) {
			const tagSlugs: string[] = Array.isArray(rawTags)
				? rawTags.filter((val): val is string => typeof val === "string")
				: [];
			const validSlugs = tagSlugs.filter((slug) => Schema.is(tagSlugSchema)(slug));
			yield* $(
				Effect.tryPromise({
					try: async () => {
						if (validSlugs.length > ZERO) {
							await supabase.from("tag").upsert(
								validSlugs.map((slug) => ({ tag_slug: slug })),
								{ onConflict: "tag_slug", ignoreDuplicates: true },
							);
						}
						await supabase.from("community_tag").delete().eq("community_id", communityId);
						if (validSlugs.length > ZERO) {
							await supabase.from("community_tag").insert(
								validSlugs.map((slug) => ({
									community_id: communityId,
									tag_slug: slug,
								})),
							);
							await supabase.from("tag_library").upsert(
								validSlugs.map((slug) => ({ user_id: userId, tag_slug: slug })),
								{ onConflict: "user_id,tag_slug", ignoreDuplicates: true },
							);
						}
					},
					catch: () => new DatabaseError({ message: "Failed to save tags" }),
				}).pipe(Effect.orElse(() => Effect.void)),
			);
		}

		if (!isUpdate) {
			const communityUserResult = yield* $(
				Effect.tryPromise({
					try: () =>
						supabase.from("community_user").insert([
							{
								community_id: communityId,
								user_id: userId,
								role: "owner",
								status: "joined",
							},
						]),
					catch: (err) =>
						new DatabaseError({
							message: `Failed to create community owner entry: ${extractErrorMessage(err, "Unknown error")}`,
						}),
				}),
			);

			if (communityUserResult.error) {
				try {
					void Effect.runPromise(
						Effect.tryPromise({
							try: () => supabase.from("community").delete().eq("community_id", communityId),
							catch: () => undefined,
						}),
					);
				} catch {
					// Cleanup failed
				}

				return yield* $(
					Effect.fail(
						new DatabaseError({
							message:
								communityUserResult.error?.message ?? "Failed to create community owner entry",
						}),
					),
				);
			}

			// Automatically add newly created community to owner's library
			const communityLibraryResult = yield* $(
				Effect.tryPromise({
					try: () =>
						supabase.from("community_library").insert([
							{
								user_id: userId,
								community_id: communityId,
							},
						]),
					catch: (err) =>
						new DatabaseError({
							message: `Failed to add community to owner's library: ${extractErrorMessage(err, "Unknown error")}`,
						}),
				}),
			);

			if (communityLibraryResult.error) {
				// Non-fatal: log but don't fail the community creation
				console.warn(
					`Failed to add community ${communityId} to owner's library (non-fatal):`,
					communityLibraryResult.error.message,
				);
			}
		}

		return publicResult.data;
	});
}
