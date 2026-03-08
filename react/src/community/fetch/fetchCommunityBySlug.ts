import type { PostgrestResponse } from "@supabase/postgrest-js";
import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import type { CommunityEntry } from "../community-types";
import type { CommunitySlice } from "../slice/CommunitySlice.type";
import fetchCommunityEvents from "./fetchCommunityEvents";
import fetchCommunityMembers from "./fetchCommunityMembers";
import fetchCommunityPlaylists from "./fetchCommunityPlaylists";
import fetchCommunityShareRequests from "./fetchCommunityShareRequests";
import fetchCommunitySongs from "./fetchCommunitySongs";
import normalizeCommunityEntry from "./normalizeCommunityEntry";

export default function fetchCommunityBySlug(
	slug: string,
	get: () => CommunitySlice,
	options?: { silent?: boolean },
): Effect.Effect<CommunityEntry, Error> {
	return Effect.gen(function* fetchCommunityBySlugGen($) {
		const {
			setCurrentCommunity,
			setMembers,
			setCommunityEvents,
			setCommunitySongs = (): void => undefined,
			setCommunityPlaylists = (): void => undefined,
			setCommunityShareRequests = (): void => undefined,
			setCommunityLoading,
			setCommunityError,
		} = get();

		if (options?.silent !== true) {
			setCommunityLoading(true);
		}
		setCommunityError(undefined);

		try {
			const userToken = yield* $(
				Effect.tryPromise({
					try: () => getSupabaseAuthToken(),
					catch: (err) =>
						new Error(`Failed to get auth token: ${extractErrorMessage(err, "Unknown error")}`),
				}),
			);

			const client = getSupabaseClient(userToken);
			if (!client) {
				throw new Error("Supabase client not available");
			}

			const publicRes: PostgrestResponse<CommunityEntry> = yield* $(
				Effect.tryPromise<PostgrestResponse<CommunityEntry>, Error>({
					try: () =>
						callSelect<CommunityEntry>(client, "community_public", {
							cols: "*",
							eq: { col: "slug", val: slug },
						}),
					catch: (err) =>
						new Error(
							`Failed to fetch community public data: ${extractErrorMessage(err, "Unknown error")}`,
						),
				}),
			);

			const publicData: CommunityEntry[] = publicRes.data ?? [];
			const [communityPublic] = publicData;
			if (communityPublic === undefined) {
				throw new Error("Community not found");
			}

			const members = yield* $(
				fetchCommunityMembers(client, communityPublic.community_id, communityPublic.owner_id),
			);
			const communityEvents = yield* $(fetchCommunityEvents(client, communityPublic.community_id));
			const communitySongs = yield* $(fetchCommunitySongs(client, communityPublic.community_id));
			const communityPlaylists = yield* $(
				fetchCommunityPlaylists(client, communityPublic.community_id),
			);
			const communityShareRequests = yield* $(
				Effect.tryPromise({
					try: () =>
						fetchCommunityShareRequests({
							client,
							communityId: communityPublic.community_id,
							communitySongs,
							communityPlaylists,
						}),
					catch: (err) =>
						new Error(
							`Failed to fetch community share requests: ${extractErrorMessage(err, "Unknown error")}`,
						),
				}),
			);

			const communityEntry = normalizeCommunityEntry(communityPublic);
			setCurrentCommunity(communityEntry);
			setMembers(members);
			setCommunityEvents(communityEvents);
			setCommunitySongs(communitySongs);
			setCommunityPlaylists(communityPlaylists);
			setCommunityShareRequests(communityShareRequests);
			setCommunityLoading(false);

			return communityEntry;
		} catch (error: unknown) {
			setCommunityLoading(false);
			const message = error instanceof Error ? error.message : String(error);
			setCommunityError(message);
			return yield* $(Effect.fail(new Error(message)));
		}
	});
}
