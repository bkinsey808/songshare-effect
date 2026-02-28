import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { apiEventUserJoinPath } from "@/shared/paths";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeInvitationSlice from "../slice/makeInvitationSlice.test-util";
import acceptEventInvitation from "./acceptEventInvitation";

describe("acceptEventInvitation", () => {
	it("calls join API and optimistically updates slice", async () => {
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

		await Effect.runPromise(acceptEventInvitation(eventId, () => slice));

		expect(mockFetch).toHaveBeenCalledWith(apiEventUserJoinPath, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ event_id: eventId }),
			credentials: "include",
		});

		expect(setPendingEventInvitations).toHaveBeenCalledWith([{ ...invitation, accepted: true }]);
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

		const effect = acceptEventInvitation("e1", () => slice);
		await expect(Effect.runPromise(effect)).rejects.toThrow(
			"Failed to accept event invitation: boom",
		);

		expect(setInvitationError).toHaveBeenCalledWith("Failed to accept event invitation: boom");
	});

	it("sets error message on network failure", async () => {
		vi.stubGlobal("fetch", vi.fn());
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockRejectedValueOnce(new Error("network error"));

		const setInvitationError = vi.fn();

		const slice = makeInvitationSlice({
			setInvitationError,
		});

		const effect = acceptEventInvitation("e1", () => slice);
		await expect(Effect.runPromise(effect)).rejects.toThrow("network error");

		expect(setInvitationError).toHaveBeenCalledWith("network error");
	});
});
