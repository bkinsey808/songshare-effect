import { Effect } from "effect";
import { DatabaseError, type AppError } from "../api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "../supabase/getSupabaseServerClient";
import getVerifiedUserSession from "../user-session/getVerifiedSession";
import { type Database } from "@/shared/generated/supabaseTypes";

type CommunityPublicRow = Database["public"]["Tables"]["community_public"]["Row"];

/**
 * Frontend-compatible community entry.
 */
type CommunityEntry = {
	community_id: string;
	owner_id: string;
	name: string;
	slug: string;
	description: string | null;
	is_public: boolean;
	public_notes: string | null;
	created_at: string;
	updated_at: string;
};

const EMPTY_ARRAY_LENGTH = 0;

/**
 * Fetches the list of communities where the current user is a member.
 */
export default function communityLibrary(
	ctx: ReadonlyContext,
): Effect.Effect<readonly CommunityEntry[], AppError> {
	return Effect.gen(function* communityLibraryGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		const supabase = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		// 1. Fetch community IDs joined by the user
		const membershipQuery = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("community_user")
						.select("community_id")
						.eq("user_id", userId)
						.eq("status", "joined"),
				catch: (error) =>
					new DatabaseError({
						message: error instanceof Error ? error.message : "Failed to fetch community memberships",
					}),
			}),
		);

		if (membershipQuery.error !== null) {
			return yield* $(
				Effect.fail(new DatabaseError({ message: membershipQuery.error.message })),
			);
		}

		const communityIds = (membershipQuery.data ?? []).map((membership) => membership.community_id);

		if (communityIds.length === EMPTY_ARRAY_LENGTH) {
			return [];
		}

		// 2. Fetch details for these communities from community_public
		const communityQuery = yield* $(
			Effect.tryPromise({
				try: () => supabase.from("community_public").select("*").in("community_id", communityIds),
				catch: (error) =>
					new DatabaseError({
						message: error instanceof Error ? error.message : "Failed to fetch community details",
					}),
			}),
		);

		if (communityQuery.error !== null) {
			return yield* $(Effect.fail(new DatabaseError({ message: communityQuery.error.message })));
		}

		// 3. Map to frontend-friendly type
		const rawCommunities = (communityQuery.data ?? []) as CommunityPublicRow[];
		const communities: CommunityEntry[] = rawCommunities.map((community) => ({
			community_id: community.community_id,
			owner_id: community.owner_id,
			name: community.name,
			slug: community.slug,
			description: community.description,
			is_public: community.is_public,
			public_notes: community.public_notes,
			created_at: community.created_at ?? new Date().toISOString(),
			updated_at: community.updated_at ?? new Date().toISOString(),
		}));

		return communities;
	});
}
