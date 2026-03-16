import { type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import { type AuthenticationError, DatabaseError, ValidationError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

type ShareListRequest = {
	view: "sent" | "received";
	status?: "pending" | "accepted" | "rejected" | undefined;
	item_type?: "song" | "playlist" | "event" | "community" | "user" | undefined;
};

type ShareItem = {
	share_id: string;
	sender_user_id: string;
	recipient_user_id: string;
	shared_item_type: string;
	shared_item_id: string;
	shared_item_name: string;
	status: string;
	message: string | null;
	created_at: string;
	updated_at: string;
	sender_username?: string;
	recipient_username?: string;
	shared_item_slug?: string;
};

/**
 * Extract and validate query parameters for listing shares.
 */
function isValidView(value: string): value is "sent" | "received" {
	return ["sent", "received"].includes(value);
}

function isValidStatus(value: string): value is "pending" | "accepted" | "rejected" {
	return ["pending", "accepted", "rejected"].includes(value);
}

function isValidItemType(
	value: string,
): value is "song" | "playlist" | "event" | "community" | "user" {
	return ["song", "playlist", "event", "community", "user"].includes(value);
}

function extractShareListRequest(url: URL): ShareListRequest {
	const view = url.searchParams.get("view");
	const status = url.searchParams.get("status");
	const item_type = url.searchParams.get("item_type");

	if (view === null || view === undefined || view === "") {
		throw new TypeError("Query parameter 'view' is required");
	}

	if (!isValidView(view)) {
		throw new TypeError(`view must be one of: sent, received`);
	}

	const result: ShareListRequest = {
		view,
	};

	if (status !== null && status !== undefined) {
		if (!isValidStatus(status)) {
			throw new TypeError(`status must be one of: pending, accepted, rejected`);
		}
		result.status = status;
	}

	if (item_type !== null && item_type !== undefined) {
		if (!isValidItemType(item_type)) {
			throw new TypeError(`item_type must be one of: song, playlist, event, community, user`);
		}
		result.item_type = item_type;
	}

	return result;
}

/**
 * Fetches slugs for shared items and enriches each share with shared_item_slug.
 */
async function enrichSharesWithSlugs(
	client: SupabaseClient<Database>,
	shares: ShareItem[],
): Promise<ShareItem[]> {
	const byType = {
		song: [] as string[],
		playlist: [] as string[],
		event: [] as string[],
		community: [] as string[],
	};
	const emptyLength = 0;
	for (const share of shares) {
		const id = share.shared_item_id;
		if (id) {
			switch (share.shared_item_type) {
				case "song": {
					byType.song.push(id);
					break;
				}
				case "playlist": {
					byType.playlist.push(id);
					break;
				}
				case "event": {
					byType.event.push(id);
					break;
				}
				case "community": {
					byType.community.push(id);
					break;
				}
			}
		}
	}

	const slugMap = new Map<string, string>();

	if (byType.song.length > emptyLength) {
		const { data } = await client
			.from("song_public")
			.select("song_id, song_slug")
			.in("song_id", byType.song);
		for (const row of data ?? []) {
			if (row.song_id && row.song_slug) {
				slugMap.set(`song:${row.song_id}`, row.song_slug);
			}
		}
	}
	if (byType.playlist.length > emptyLength) {
		const { data } = await client
			.from("playlist_public")
			.select("playlist_id, playlist_slug")
			.in("playlist_id", byType.playlist);
		for (const row of data ?? []) {
			if (row.playlist_id && row.playlist_slug) {
				slugMap.set(`playlist:${row.playlist_id}`, row.playlist_slug);
			}
		}
	}
	if (byType.event.length > emptyLength) {
		const { data } = await client
			.from("event_public")
			.select("event_id, event_slug")
			.in("event_id", byType.event);
		for (const row of data ?? []) {
			if (row.event_id && row.event_slug) {
				slugMap.set(`event:${row.event_id}`, row.event_slug);
			}
		}
	}
	if (byType.community.length > emptyLength) {
		const { data } = await client
			.from("community_public")
			.select("community_id, slug")
			.in("community_id", byType.community);
		for (const row of data ?? []) {
			if (row.community_id && row.slug) {
				slugMap.set(`community:${row.community_id}`, row.slug);
			}
		}
	}

	return shares.map((share) => {
		const slug = slugMap.get(`${share.shared_item_type}:${share.shared_item_id}`);
		return slug === undefined ? share : { ...share, shared_item_slug: slug };
	});
}

/**
 * Get shares sent by the user.
 */
function getSentShares(
	client: SupabaseClient<Database>,
	userId: string,
	filters: ShareListRequest,
): Effect.Effect<ShareItem[], DatabaseError> {
	return Effect.tryPromise({
		try: async () => {
			let query = client
				.from("share_public")
				.select(`
					share_id,
					sender_user_id,
					recipient_user_id,
					shared_item_type,
					shared_item_id,
					shared_item_name,
					status,
					message,
					created_at,
					updated_at,
					recipient_user:user_public!share_public_recipient_user_id_fkey(username)
				`)
				.eq("sender_user_id", userId)
				.order("created_at", { ascending: false });

			if (filters.status !== undefined) {
				query = query.eq("status", filters.status);
			}

			if (filters.item_type !== undefined) {
				query = query.eq("shared_item_type", filters.item_type);
			}

			const { data, error } = await query;

			if (error) {
				throw error;
			}

			return (data ?? []).map((item) => ({
				share_id: item.share_id,
				sender_user_id: item.sender_user_id,
				recipient_user_id: item.recipient_user_id,
				shared_item_type: item.shared_item_type,
				shared_item_id: item.shared_item_id,
				shared_item_name: item.shared_item_name,
				status: item.status,
				message: item.message,
				created_at: item.created_at ?? "",
				updated_at: item.updated_at ?? "",
				recipient_username: item.recipient_user?.username,
			}));
		},
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to get sent shares"),
			}),
	});
}

/**
 * Get shares received by the user.
 */
function getReceivedShares(
	client: SupabaseClient<Database>,
	userId: string,
	filters: ShareListRequest,
): Effect.Effect<ShareItem[], DatabaseError> {
	return Effect.tryPromise({
		try: async () => {
			let query = client
				.from("share_public")
				.select(`
					share_id,
					sender_user_id,
					recipient_user_id,
					shared_item_type,
					shared_item_id,
					shared_item_name,
					status,
					message,
					created_at,
					updated_at,
					sender_user:user_public!share_public_sender_user_id_fkey(username)
				`)
				.eq("recipient_user_id", userId)
				.order("created_at", { ascending: false });

			if (filters.status !== undefined) {
				query = query.eq("status", filters.status);
			}

			if (filters.item_type !== undefined) {
				query = query.eq("shared_item_type", filters.item_type);
			}

			const { data, error } = await query;

			if (error) {
				throw error;
			}

			return (data ?? []).map((item) => ({
				share_id: item.share_id,
				sender_user_id: item.sender_user_id,
				recipient_user_id: item.recipient_user_id,
				shared_item_type: item.shared_item_type,
				shared_item_id: item.shared_item_id,
				shared_item_name: item.shared_item_name,
				status: item.status,
				message: item.message,
				created_at: item.created_at ?? "",
				updated_at: item.updated_at ?? "",
				sender_username: item.sender_user?.username,
			}));
		},
		catch: (error) =>
			new DatabaseError({
				message: extractErrorMessage(error, "Failed to get received shares"),
			}),
	});
}

/**
 * Server-side handler for listing shares.
 *
 * This Effect-based handler:
 * - validates query parameters
 * - verifies user authentication
 * - returns shares sent by or received by the user based on the view parameter
 *
 * @param ctx - The readonly request context provided by the server
 * @returns Array of share items or fails with an error
 */
export default function shareListHandler(
	ctx: ReadonlyContext,
): Effect.Effect<{ shares: ShareItem[] }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* shareListGen($) {
		// Parse query parameters
		let req: ShareListRequest = { view: "received" };
		try {
			req = extractShareListRequest(new URL(ctx.req.url));
		} catch (error) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: extractErrorMessage(error, "Invalid query parameters"),
					}),
				),
			);
		}

		// Authenticate user
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		// Get Supabase admin client (service key - allows bypassing RLS)
		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		// Get shares based on view
		const rawShares =
			req.view === "sent"
				? yield* $(getSentShares(client, userId, req))
				: yield* $(getReceivedShares(client, userId, req));

		const shares = yield* $(
			Effect.tryPromise({
				try: () => enrichSharesWithSlugs(client, rawShares),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to enrich shares with slugs"),
					}),
			}),
		);

		return { shares };
	});
}
