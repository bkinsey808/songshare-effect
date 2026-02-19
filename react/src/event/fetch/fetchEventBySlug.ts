import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import isRecord from "@/shared/type-guards/isRecord";

import type { EventEntry, EventParticipant } from "../event-entry/EventEntry.type";
import type { EventUser } from "../event-types";
import type { EventSlice } from "../slice/EventSlice.type";

import {
	EventError,
	EventNotFoundError,
	InvalidEventDataError,
	NoSupabaseClientError,
	QueryError,
} from "../event-errors";
import { isEventPublic } from "../guards/guardEventTypes";
import ensureOwnerParticipant from "./ensureOwnerParticipant";
import hydrateParticipantUsernames from "./hydrateParticipantUsernames";
import normalizeEventPublicRow from "./normalizeEventPublicRow";
import parseEventParticipants from "./parseEventParticipants";

const ARRAY_EMPTY = 0;

/**
 * Fetch a single event by slug (readable based on is_public + participant status).
 * Includes the event's public data and participant roster.
 *
 * @param eventSlug - The event slug (unique identifier)
 * @param get - Zustand slice getter used to access state and mutation helpers
 * @returns Effect that resolves when the event is fetched
 */
export default function fetchEventBySlug(
	eventSlug: string,
	get: () => EventSlice,
): Effect.Effect<void, EventError> {
	return Effect.gen(function* fetchEventBySlugGen($) {
		const { setCurrentEvent, setEventLoading, setEventError, setParticipants } = get();

		yield* $(
			Effect.sync(() => {
				console.warn("[fetchEventBySlug] Starting fetch for slug:", eventSlug);
				setEventLoading(true);
				setEventError(undefined);
			}),
		);

		const userToken = yield* $(
			Effect.tryPromise({
				try: () => getSupabaseAuthToken(),
				catch: (err) => {
					const errorMessage = err instanceof Error ? err.message : String(err);
					return new QueryError("Failed to get Supabase auth token", errorMessage);
				},
			}),
		);

		const client = getSupabaseClient(userToken);
		if (!client) {
			return yield* $(Effect.fail(new NoSupabaseClientError()));
		}

		// Fetch event + owner in one query (supported by event_public_owner_id_fkey).
		const publicQueryRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect(client, "event_public", {
						cols: "*, owner:user_public!event_public_owner_id_fkey(username)",
						eq: { col: "event_slug", val: eventSlug },
					}).then((res) => {
						console.warn("[fetchEventBySlug] Public query result:", JSON.stringify(res));
						return res;
					}),
				catch: (err) => {
					const errorMessage = err instanceof Error ? err.message : String(err);
					return new QueryError("Failed to query event_public", errorMessage);
				},
			}).pipe(
				// Fallback for environments where relation metadata is temporarily unavailable.
				Effect.catchAll(() => Effect.succeed(undefined)),
			),
		);

		const publicQueryData = publicQueryRes?.["data"];
		const hasPublicDataArray = Array.isArray(publicQueryData);
		let publicData: unknown[] = hasPublicDataArray ? publicQueryData : [];

		if (!hasPublicDataArray) {
			const fallbackPublicQueryRes = yield* $(
				Effect.tryPromise({
					try: () =>
						callSelect(client, "event_public", {
							cols: "*",
							eq: { col: "event_slug", val: eventSlug },
						}).then((res) => {
							console.warn("[fetchEventBySlug] Fallback public query result:", JSON.stringify(res));
							return res;
						}),
					catch: (err) => {
						const errorMessage = err instanceof Error ? err.message : String(err);
						return new QueryError("Failed to query event_public", errorMessage);
					},
				}),
			);

			publicData = Array.isArray(fallbackPublicQueryRes["data"])
				? fallbackPublicQueryRes["data"]
				: [];
		}

		if (publicData.length === ARRAY_EMPTY) {
			return yield* $(Effect.fail(new EventNotFoundError(eventSlug)));
		}

		const [rawEventPublic] = publicData;
		const eventPublic = normalizeEventPublicRow(rawEventPublic);
		if (!isEventPublic(eventPublic)) {
			return yield* $(Effect.fail(new InvalidEventDataError()));
		}

		const hasEmbeddedParticipants =
			isRecord(rawEventPublic) && Object.hasOwn(rawEventPublic, "event_user");

		let participantsData: unknown[] =
			hasEmbeddedParticipants && Array.isArray(rawEventPublic["event_user"])
				? rawEventPublic["event_user"]
				: [];

		if (!hasEmbeddedParticipants) {
			const participantsQueryRes = yield* $(
				Effect.tryPromise({
					try: () =>
						callSelect(client, "event_user", {
							cols: "*, participant:user!event_user_user_id_fkey(user_public(username))",
							eq: { col: "event_id", val: eventPublic.event_id },
						}),
					catch: (err) => {
						const errorMessage = err instanceof Error ? err.message : String(err);
						return new QueryError("Failed to query event_user", errorMessage);
					},
				}).pipe(
					// Fallback to plain rows if relation embedding fails.
					Effect.catchAll(() =>
						Effect.tryPromise({
							try: () =>
								callSelect(client, "event_user", {
									cols: "*",
									eq: { col: "event_id", val: eventPublic.event_id },
								}),
							catch: (err) => {
								const errorMessage = err instanceof Error ? err.message : String(err);
								return new QueryError("Failed to query event_user", errorMessage);
							},
						}),
					),
				),
			);

			participantsData = Array.isArray(participantsQueryRes["data"])
				? participantsQueryRes["data"]
				: [];
		}

		const participants: EventParticipant[] = parseEventParticipants(
			participantsData,
			eventPublic.event_id,
		);

		const hydratedParticipants = yield* $(hydrateParticipantUsernames(client, participants));

		const embeddedOwnerUsername =
			isRecord(rawEventPublic) &&
			isRecord(rawEventPublic["owner"]) &&
			typeof rawEventPublic["owner"]["username"] === "string" &&
			rawEventPublic["owner"]["username"] !== ""
				? rawEventPublic["owner"]["username"]
				: undefined;

		const participantOwnerUsername = hydratedParticipants.find(
			(participant) => participant.user_id === eventPublic.owner_id,
		)?.username;

		const ownerUsername = embeddedOwnerUsername ?? participantOwnerUsername;

		const participantsWithOwner = ensureOwnerParticipant({
			participants: hydratedParticipants,
			eventId: eventPublic.event_id,
			ownerId: eventPublic.owner_id,
			ownerUsername,
			ownerJoinedAt: eventPublic.created_at ?? new Date().toISOString(),
		});

		// Construct the event entry
		const eventEntry: EventEntry = {
			event_id: eventPublic.event_id,
			owner_id: eventPublic.owner_id,
			private_notes: "",
			created_at: eventPublic.created_at ?? new Date().toISOString(),
			updated_at: eventPublic.updated_at ?? new Date().toISOString(),
			public: eventPublic,
			participants: participantsWithOwner,
			...(ownerUsername === undefined ? {} : { owner_username: ownerUsername }),
		};

		yield* $(
			Effect.sync(() => {
				console.warn("[fetchEventBySlug] Setting event:", JSON.stringify(eventEntry));
				setCurrentEvent(eventEntry);
				setParticipants(participantsWithOwner as readonly EventUser[]);
			}),
		);

		console.warn("[fetchEventBySlug] Complete.");
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setEventLoading, setEventError } = get();
				setEventLoading(false);
				const msg = extractErrorMessage(err, "Failed to fetch event");
				setEventError(msg);
				console.error("[fetchEventBySlug] Error:", err);
			}),
		),
		Effect.ensuring(
			Effect.sync(() => {
				const { setEventLoading } = get();
				setEventLoading(false);
			}),
		),
		Effect.mapError((err) =>
			err instanceof EventError
				? err
				: new EventError(extractErrorMessage(err, "Failed to fetch event")),
		),
	);
}
