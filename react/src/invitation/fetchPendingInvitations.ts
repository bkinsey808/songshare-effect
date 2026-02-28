import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import { ZERO } from "@/shared/constants/shared-constants";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import isRecord from "@/shared/type-guards/isRecord";

import mapCommunityInvitations from "./mapCommunityInvitations";
import mapEventInvitations from "./mapEventInvitations";
import type {
	InvitationSlice,
	PendingCommunityInvitation,
	PendingEventInvitation,
} from "./slice/InvitationSlice.type";

/**
 * Fetches all pending community and event invitations for the currently
 * signed-in user and populates the invitation slice state.
 *
 * Refactored to avoid cross-table joins that fail due to missing direct
 * foreign key relationships.
 *
 * @param get - accessor for the invitation slice helpers
 * @returns Effect that completes when fetch is done
 */
export default function fetchPendingInvitations(
	get: () => InvitationSlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* fetchPendingInvitationsGen($) {
		const { setInvitationLoading, setInvitationError } = get();

		console.warn("[fetchPendingInvitations] Starting fetch...");
		setInvitationLoading(true);
		setInvitationError(undefined);

		const userToken = yield* $(
			Effect.tryPromise<string | undefined, Error>({
				try: () => getSupabaseAuthToken(),
				catch: (err) =>
					new Error(`Failed to get auth token: ${extractErrorMessage(err, "Unknown error")}`),
			}),
		);

		const client = getSupabaseClient(userToken);
		if (client === undefined) {
			console.warn("[fetchPendingInvitations] No Supabase client available.");
			setInvitationLoading(false);
			return;
		}

		// 1. Fetch pending community_user rows
		const communityUserRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect(client, "community_user", {
						cols: "*",
						eq: { col: "status", val: "invited" },
					}),
				catch: (err) =>
					new Error(
						`Failed to fetch community_user rows: ${extractErrorMessage(err, "Unknown error")}`,
					),
			}),
		);

		if (!isRecord(communityUserRes)) {
			throw new Error("Invalid response from community_user query");
		}

		const communityUserData = Array.isArray(communityUserRes["data"])
			? communityUserRes["data"]
			: [];

		let communityInvitations: PendingCommunityInvitation[] = [];

		if (communityUserData.length > ZERO) {
			const communityIds = communityUserData
				.map((row) => (isRecord(row) ? String(row["community_id"]) : ""))
				.filter(Boolean);

			const communityPublicRes = yield* $(
				Effect.tryPromise({
					try: () =>
						callSelect(client, "community_public", {
							cols: "community_id, name, slug",
							in: { col: "community_id", vals: communityIds },
						}),
					catch: (err) =>
						new Error(
							`Failed to fetch community_public rows: ${extractErrorMessage(err, "Unknown error")}`,
						),
				}),
			);

			if (isRecord(communityPublicRes) && Array.isArray(communityPublicRes["data"])) {
				communityInvitations = mapCommunityInvitations(
					communityUserData,
					communityPublicRes["data"],
				);
			}
		}

		const { setPendingCommunityInvitations } = get();
		setPendingCommunityInvitations(communityInvitations);

		// 2. Fetch pending event_user rows
		const eventUserRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect(client, "event_user", {
						cols: "*",
						eq: { col: "status", val: "invited" },
					}),
				catch: (err) =>
					new Error(
						`Failed to fetch event_user rows: ${extractErrorMessage(err, "Unknown error")}`,
					),
			}),
		);

		if (!isRecord(eventUserRes)) {
			throw new Error("Invalid response from event_user query");
		}

		const eventUserData = Array.isArray(eventUserRes["data"]) ? eventUserRes["data"] : [];

		let eventInvitations: PendingEventInvitation[] = [];

		if (eventUserData.length > ZERO) {
			const eventIds = eventUserData
				.map((row) => (isRecord(row) ? String(row["event_id"]) : ""))
				.filter(Boolean);

			const eventPublicRes = yield* $(
				Effect.tryPromise({
					try: () =>
						callSelect(client, "event_public", {
							cols: "event_id, event_name, event_slug",
							in: { col: "event_id", vals: eventIds },
						}),
					catch: (err) =>
						new Error(
							`Failed to fetch event_public rows: ${extractErrorMessage(err, "Unknown error")}`,
						),
				}),
			);

			if (isRecord(eventPublicRes) && Array.isArray(eventPublicRes["data"])) {
				eventInvitations = mapEventInvitations(eventUserData, eventPublicRes["data"]);
			}
		}

		const { setPendingEventInvitations } = get();
		setPendingEventInvitations(eventInvitations);

		console.warn("[fetchPendingInvitations] Fetch complete.");
		setInvitationLoading(false);
	}).pipe(
		Effect.tapError((err: Error) =>
			Effect.sync(() => {
				const { setInvitationLoading, setInvitationError } = get();
				console.error("[fetchPendingInvitations] Error during fetch:", err.message);
				setInvitationLoading(false);
				setInvitationError(err.message);
			}),
		),
	);
}
