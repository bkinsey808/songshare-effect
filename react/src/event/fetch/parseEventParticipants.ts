import guardAsString from "@/shared/type-guards/guardAsString";
import isRecord from "@/shared/type-guards/isRecord";

import type { EventParticipant } from "../event-entry/EventEntry.type";
import type { ParticipantStatus } from "../participant-status/participantStatusMachine";

const ARRAY_EMPTY = 0;

/**
 * Normalizes raw participant status values into known states.
 *
 * @param value - Raw status value from event_user payload
 * @returns Parsed participant status when recognized
 */
function parseParticipantStatus(value: unknown): ParticipantStatus | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	if (value === "invited" || value === "joined" || value === "left" || value === "kicked") {
		return value;
	}

	return undefined;
}

/**
 * Converts raw event_user rows into normalized event participants.
 *
 * Supports both legacy participant payloads and nested user_public payloads.
 *
 * @param participantsData - Raw rows from event_user query/embed
 * @param eventId - Event id used to filter valid participant rows
 * @returns Normalized event participants
 */
export default function parseEventParticipants(
	participantsData: unknown[],
	eventId: string,
): EventParticipant[] {
	const participants: EventParticipant[] = [];

	for (const participant of participantsData) {
		if (
			isRecord(participant) &&
			participant["event_id"] === eventId &&
			participant["user_id"] !== undefined &&
			participant["role"] !== undefined
		) {
			const participantPayload = participant["participant"];
			let participantUser: Record<string, unknown> | undefined = undefined;
			if (isRecord(participantPayload)) {
				participantUser = participantPayload;
			} else if (
				Array.isArray(participantPayload) &&
				participantPayload.length > ARRAY_EMPTY &&
				isRecord(participantPayload[ARRAY_EMPTY])
			) {
				participantUser = participantPayload[ARRAY_EMPTY];
			} else {
				participantUser = undefined;
			}
			const legacyUsername =
				participantUser !== undefined &&
				typeof participantUser["username"] === "string" &&
				participantUser["username"] !== ""
					? participantUser["username"]
					: undefined;

			let nestedUserPublic: Record<string, unknown> | undefined = undefined;
			if (participantUser !== undefined && isRecord(participantUser["user_public"])) {
				nestedUserPublic = participantUser["user_public"];
			} else if (
				Array.isArray(participantUser?.["user_public"]) &&
				participantUser["user_public"].length > ARRAY_EMPTY &&
				isRecord(participantUser["user_public"][ARRAY_EMPTY])
			) {
				nestedUserPublic = participantUser["user_public"][ARRAY_EMPTY];
			}

			const username =
				legacyUsername ??
				(nestedUserPublic !== undefined &&
				typeof nestedUserPublic["username"] === "string" &&
				nestedUserPublic["username"] !== ""
					? nestedUserPublic["username"]
					: undefined);
			const participantStatus = parseParticipantStatus(participant["status"]);
			const status = participantStatus ?? "joined";

			participants.push({
				event_id: eventId,
				user_id: guardAsString(participant["user_id"]),
				role: guardAsString(participant["role"]),
				status,
				joined_at: guardAsString(participant["joined_at"]),
				participantStatus: status,
				...(username === undefined ? {} : { username }),
			});
		}
	}

	return participants;
}
