import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import guardAsString from "@/shared/type-guards/guardAsString";
import isRecord from "@/shared/type-guards/isRecord";

import type { EventEntry, EventUser } from "./event-types";
import type { EventSlice } from "./slice/EventSlice.type";

import {
	EventError,
	EventNotFoundError,
	InvalidEventDataError,
	NoSupabaseClientError,
	QueryError,
} from "./event-errors";
import { isEventPublic } from "./guards/guardEventTypes";

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

		// Fetch the public event data by slug
		const publicQueryRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect(client, "event_public", {
						cols: "*",
						eq: { col: "event_slug", val: eventSlug },
					}).then((res) => {
						console.warn("[fetchEventBySlug] Public query result:", JSON.stringify(res));
						return res;
					}),
				catch: (err) => {
					const errorMessage = err instanceof Error ? err.message : String(err);
					return new QueryError("Failed to query event_public", errorMessage);
				},
			}),
		);

		const publicData: unknown[] = Array.isArray(publicQueryRes["data"])
			? publicQueryRes["data"]
			: [];

		if (publicData.length === ARRAY_EMPTY) {
			return yield* $(Effect.fail(new EventNotFoundError(eventSlug)));
		}

		const [eventPublic] = publicData;
		if (!isEventPublic(eventPublic)) {
			return yield* $(Effect.fail(new InvalidEventDataError()));
		}

		// Fetch event participants
		const participantsQueryRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect(client, "event_user", {
						cols: "*",
						eq: { col: "event_id", val: eventPublic.event_id },
					}).then((res) => res),
				catch: (err) => {
					const errorMessage = err instanceof Error ? err.message : String(err);
					return new QueryError("Failed to query event_user", errorMessage);
				},
			}),
		);

		const participantsData: unknown[] = Array.isArray(participantsQueryRes["data"])
			? participantsQueryRes["data"]
			: [];

		const participants: EventUser[] = [];
		for (const participant of participantsData) {
			if (
				isRecord(participant) &&
				participant["event_id"] === eventPublic.event_id &&
				participant["user_id"] !== undefined &&
				participant["role"] !== undefined
			) {
				participants.push({
					event_id: eventPublic.event_id,
					user_id: guardAsString(participant["user_id"]),
					role: guardAsString(participant["role"]),
					joined_at: guardAsString(participant["joined_at"]),
				});
			}
		}

		// Construct the event entry
		const eventEntry: EventEntry = {
			event_id: eventPublic.event_id,
			owner_id: eventPublic.owner_id,
			private_notes: "",
			created_at: eventPublic.created_at ?? new Date().toISOString(),
			updated_at: eventPublic.updated_at ?? new Date().toISOString(),
			public: eventPublic,
			participants,
		};

		yield* $(
			Effect.sync(() => {
				console.warn("[fetchEventBySlug] Setting event:", JSON.stringify(eventEntry));
				setCurrentEvent(eventEntry);
				setParticipants(participants);
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
