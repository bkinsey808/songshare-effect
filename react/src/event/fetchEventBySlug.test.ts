import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";

import makeGetStub from "@/react/event/slice/test-utils/makeGetEventSliceStub.mock";
import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/test-utils/createMinimalSupabaseClient.mock";
import forceCast from "@/react/lib/test-utils/forceCast";

import fetchEventBySlug from "./fetchEventBySlug";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

describe("fetchEventBySlug error cases", () => {
	it("throws NoSupabaseClientError when no client is available", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		const eff = fetchEventBySlug("no-client", makeGetStub());

		await expect(Effect.runPromise(eff)).rejects.toThrow(/No Supabase client available/);
	});

	it("throws EventNotFoundError when public event not found", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(
			forceCast<SupabaseClientLike | undefined>(createMinimalSupabaseClient()),
		);
		vi.mocked(callSelect).mockResolvedValue({ data: [] });

		const eff = fetchEventBySlug("missing-slug", makeGetStub());

		await expect(Effect.runPromise(eff)).rejects.toThrow(/not found/i);
	});
});

describe("fetchEventBySlug success & behavior", () => {
	it("sets current event and participants on success", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(
			forceCast<SupabaseClientLike | undefined>(createMinimalSupabaseClient()),
		);

		const pub = {
			event_id: "00000000-0000-0000-0000-000000000010",
			owner_id: "00000000-0000-0000-0000-000000000011",
			event_name: "My Event",
			event_slug: "my-event",
			is_public: true,
			created_at: "2020-01-01T00:00:00Z",
			updated_at: "2020-01-01T00:00:00Z",
		};

		const participant = {
			event_id: pub.event_id,
			user_id: "00000000-0000-0000-0000-000000000020",
			role: "member",
			joined_at: "2020-02-02T00:00:00Z",
		};

		vi.mocked(callSelect)
			.mockResolvedValueOnce({ data: [pub] })
			.mockResolvedValueOnce({ data: [participant] });

		const get = makeGetStub();
		const eff = fetchEventBySlug("slug-1", get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();

		expect(get().setCurrentEvent).toHaveBeenCalledWith(
			expect.objectContaining({ event_id: pub.event_id, private_notes: "" }),
		);
		expect(get().setParticipants).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({ user_id: participant.user_id, role: "member" }),
			]),
		);
		expect(get().setEventLoading).toHaveBeenCalledWith(true);
		expect(get().setEventLoading).toHaveBeenCalledWith(false);
	});

	it("throws InvalidEventDataError when public data fails guard", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(
			forceCast<SupabaseClientLike | undefined>(createMinimalSupabaseClient()),
		);
		// Return an invalid public row
		vi.mocked(callSelect).mockResolvedValueOnce({ data: [{}] });

		const get = makeGetStub();
		const eff = fetchEventBySlug("bad-slug", get);

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Invalid event_public data/);
		expect(get().setEventLoading).toHaveBeenCalledWith(true);
		expect(get().setEventLoading).toHaveBeenCalledWith(false);
		expect(get().setEventError).toHaveBeenCalledWith(expect.anything());
	});

	it("maps query failures to QueryError and sets error state", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		vi.mocked(callSelect).mockRejectedValue(new Error("boom"));

		const get = makeGetStub();
		const eff = fetchEventBySlug("any", get);

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Failed to query event_public/);
		expect(get().setEventError).toHaveBeenCalledWith(expect.anything());
		expect(get().setEventLoading).toHaveBeenCalledWith(false);
	});
});
