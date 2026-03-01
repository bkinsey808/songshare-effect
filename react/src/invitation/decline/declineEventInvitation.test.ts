import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { apiEventUserRemovePath } from "@/shared/paths";

import makeInvitationSlice from "../slice/makeInvitationSlice.test-util";
import declineEventInvitation from "./declineEventInvitation";

describe("declineEventInvitation", () => {
	it("calls remove API and updates slice", async () => {
		vi.stubGlobal("fetch", vi.fn());
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(
			forceCast<Response>({
				ok: true,
				text: vi.fn().mockResolvedValue("ok"),
			}),
		);

		const setPendingEventInvitations = vi.fn();
		const setInvitationError = vi.fn();

		const eventId = "e1";
		const userId = "u1";
		const invitation = {
			event_id: eventId,
			event_name: "E1",
			event_slug: "e1-slug",
		};

		const slice = makeInvitationSlice({
			pendingEventInvitations: [invitation],
			setPendingEventInvitations,
			setInvitationError,
		});

		await Effect.runPromise(declineEventInvitation(eventId, userId, () => slice));

		expect(mockFetch).toHaveBeenCalledWith(apiEventUserRemovePath, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ event_id: eventId, user_id: userId }),
			credentials: "include",
		});

		expect(setPendingEventInvitations).toHaveBeenCalledWith([]);
		expect(setInvitationError).toHaveBeenCalledWith(undefined);
	});

	it("sets error message on non-ok response", async () => {
		vi.stubGlobal("fetch", vi.fn());
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(
			forceCast<Response>({
				ok: false,
				text: vi.fn().mockResolvedValue("boom"),
			}),
		);

		const setInvitationError = vi.fn();

		const slice = makeInvitationSlice({
			setInvitationError,
		});

		const effect = declineEventInvitation("e1", "u1", () => slice);
		await expect(Effect.runPromise(effect)).rejects.toThrow(
			"Failed to decline event invitation: boom",
		);

		expect(setInvitationError).toHaveBeenCalledWith("Failed to decline event invitation: boom");
	});

	it("sets error message on network failure", async () => {
		vi.stubGlobal("fetch", vi.fn());
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockRejectedValueOnce(new Error("network error"));

		const setInvitationError = vi.fn();

		const slice = makeInvitationSlice({
			setInvitationError,
		});

		const effect = declineEventInvitation("e1", "u1", () => slice);
		await expect(Effect.runPromise(effect)).rejects.toThrow("network error");

		expect(setInvitationError).toHaveBeenCalledWith("network error");
	});
});
