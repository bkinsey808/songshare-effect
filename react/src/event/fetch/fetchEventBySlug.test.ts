import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";

import makeEventSlice from "@/react/event/slice/makeEventSlice.mock";
import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/test-utils/createMinimalSupabaseClient.mock";
import forceCast from "@/react/lib/test-utils/forceCast";

import fetchEventBySlug from "./fetchEventBySlug";

const CALLED_ONCE = 1;

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

describe("fetchEventBySlug error cases", () => {
	it("throws NoSupabaseClientError when no client is available", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		const eff = fetchEventBySlug("no-client", makeEventSlice());

		await expect(Effect.runPromise(eff)).rejects.toThrow(/No Supabase client available/);
	});

	it("throws EventNotFoundError when public event not found", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(
			forceCast<SupabaseClientLike | undefined>(createMinimalSupabaseClient()),
		);
		vi.mocked(callSelect).mockResolvedValue({ data: [] });

		const eff = fetchEventBySlug("missing-slug", makeEventSlice());

		await expect(Effect.runPromise(eff)).rejects.toThrow(/not found/i);
	});
});

describe("fetchEventBySlug success & behavior", () => {
	it("falls back to plain event_public query when joined query returns invalid data shape", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(
			forceCast<SupabaseClientLike | undefined>(createMinimalSupabaseClient()),
		);

		const fallbackPub = {
			event_id: "00000000-0000-0000-0000-000000000090",
			owner_id: "00000000-0000-0000-0000-000000000091",
			event_name: "Fallback Event",
			event_slug: "my-event",
			is_public: true,
			created_at: "2020-01-01T00:00:00Z",
			updated_at: "2020-01-01T00:00:00Z",
		};

		const participant = {
			event_id: fallbackPub.event_id,
			user_id: "00000000-0000-0000-0000-000000000099",
			role: "member",
			joined_at: "2020-02-02T00:00:00Z",
			participant: {
				username: "fallback_member",
			},
		};

		vi.mocked(callSelect)
			.mockResolvedValueOnce({ data: undefined })
			.mockResolvedValueOnce({ data: [fallbackPub] })
			.mockResolvedValueOnce({ data: [participant] });

		const get = makeEventSlice();
		const eff = fetchEventBySlug("my-event", get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();
		expect(get().setCurrentEvent).toHaveBeenCalledWith(
			expect.objectContaining({ event_id: fallbackPub.event_id }),
		);
		expect(get().setParticipants).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					user_id: participant.user_id,
					username: "fallback_member",
				}),
			]),
		);
	});

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
			owner: {
				username: "owner_user",
			},
			event_user: [
				{
					event_id: "00000000-0000-0000-0000-000000000010",
					user_id: "00000000-0000-0000-0000-000000000020",
					role: "member",
					joined_at: "2020-02-02T00:00:00Z",
					participant: {
						username: "member_user",
					},
				},
			],
		};

		vi.mocked(callSelect)
			.mockResolvedValueOnce({ data: [pub] })
			.mockResolvedValueOnce({ data: [] });

		const get = makeEventSlice();
		const eff = fetchEventBySlug("slug-1", get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();

		expect(get().setCurrentEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				event_id: pub.event_id,
				private_notes: "",
				owner_username: "owner_user",
			}),
		);
		expect(get().setParticipants).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					user_id: "00000000-0000-0000-0000-000000000020",
					role: "member",
				}),
			]),
		);
		expect(vi.mocked(callSelect)).toHaveBeenCalledTimes(CALLED_ONCE);
		expect(vi.mocked(callSelect)).toHaveBeenCalledWith(
			expect.anything(),
			"event_public",
			expect.anything(),
		);
	});

	it("extracts participant username from nested user_public embed shape", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(
			forceCast<SupabaseClientLike | undefined>(createMinimalSupabaseClient()),
		);

		const pub = {
			event_id: "00000000-0000-0000-0000-000000000210",
			owner_id: "00000000-0000-0000-0000-000000000211",
			event_name: "Nested Participant Event",
			event_slug: "nested-participant-event",
			is_public: true,
			created_at: "2020-01-01T00:00:00Z",
			updated_at: "2020-01-01T00:00:00Z",
			event_user: [
				{
					event_id: "00000000-0000-0000-0000-000000000210",
					user_id: "00000000-0000-0000-0000-000000000220",
					role: "participant",
					joined_at: "2020-02-02T00:00:00Z",
					participant: {
						user_public: [{ username: "nested_user" }],
					},
				},
			],
		};

		vi.mocked(callSelect)
			.mockResolvedValueOnce({ data: [pub] })
			.mockResolvedValueOnce({ data: [] });

		const get = makeEventSlice();
		const eff = fetchEventBySlug("nested-participant-event", get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();
		expect(get().setParticipants).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					user_id: "00000000-0000-0000-0000-000000000220",
					username: "nested_user",
				}),
			]),
		);
	});

	it("hydrates missing participant usernames from user_public lookup", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(
			forceCast<SupabaseClientLike | undefined>(createMinimalSupabaseClient()),
		);

		const pub = {
			event_id: "00000000-0000-0000-0000-000000000510",
			owner_id: "00000000-0000-0000-0000-000000000511",
			event_name: "Hydrated Username Event",
			event_slug: "hydrated-username-event",
			is_public: true,
			created_at: "2020-01-01T00:00:00Z",
			updated_at: "2020-01-01T00:00:00Z",
			event_user: [
				{
					event_id: "00000000-0000-0000-0000-000000000510",
					user_id: "00000000-0000-0000-0000-000000000520",
					role: "participant",
					joined_at: "2020-02-02T00:00:00Z",
				},
			],
		};

		vi.mocked(callSelect)
			.mockResolvedValueOnce({ data: [pub] })
			.mockResolvedValueOnce({
				data: [
					{
						user_id: "00000000-0000-0000-0000-000000000520",
						username: "hydrated_user",
					},
				],
			});

		const get = makeEventSlice();
		const eff = fetchEventBySlug("hydrated-username-event", get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();
		expect(get().setParticipants).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					user_id: "00000000-0000-0000-0000-000000000520",
					username: "hydrated_user",
				}),
			]),
		);
	});

	it("adds owner to participants when owner row is missing", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(
			forceCast<SupabaseClientLike | undefined>(createMinimalSupabaseClient()),
		);

		const pub = {
			event_id: "00000000-0000-0000-0000-000000000310",
			owner_id: "00000000-0000-0000-0000-000000000311",
			event_name: "Owner Included Event",
			event_slug: "owner-included-event",
			is_public: true,
			created_at: "2020-01-01T00:00:00Z",
			updated_at: "2020-01-01T00:00:00Z",
			owner: {
				username: "owner_user",
			},
			event_user: [
				{
					event_id: "00000000-0000-0000-0000-000000000310",
					user_id: "00000000-0000-0000-0000-000000000320",
					role: "participant",
					joined_at: "2020-02-02T00:00:00Z",
					participant: {
						username: "member_user",
					},
				},
			],
		};

		vi.mocked(callSelect).mockResolvedValueOnce({ data: [pub] });

		const get = makeEventSlice();
		const eff = fetchEventBySlug("owner-included-event", get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();
		expect(get().setParticipants).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					user_id: "00000000-0000-0000-0000-000000000311",
					role: "owner",
					username: "owner_user",
				}),
			]),
		);
	});

	it("normalizes owner role when owner already exists in participants", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(
			forceCast<SupabaseClientLike | undefined>(createMinimalSupabaseClient()),
		);

		const pub = {
			event_id: "00000000-0000-0000-0000-000000000410",
			owner_id: "00000000-0000-0000-0000-000000000411",
			event_name: "Owner Normalized Event",
			event_slug: "owner-normalized-event",
			is_public: true,
			created_at: "2020-01-01T00:00:00Z",
			updated_at: "2020-01-01T00:00:00Z",
			event_user: [
				{
					event_id: "00000000-0000-0000-0000-000000000410",
					user_id: "00000000-0000-0000-0000-000000000411",
					role: "participant",
					joined_at: "2020-02-02T00:00:00Z",
				},
			],
		};

		vi.mocked(callSelect)
			.mockResolvedValueOnce({ data: [pub] })
			.mockResolvedValueOnce({ data: [] });

		const get = makeEventSlice();
		const eff = fetchEventBySlug("owner-normalized-event", get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();
		expect(get().setParticipants).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					user_id: "00000000-0000-0000-0000-000000000411",
					role: "owner",
				}),
			]),
		);
	});

	it("throws InvalidEventDataError when public data fails guard", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(
			forceCast<SupabaseClientLike | undefined>(createMinimalSupabaseClient()),
		);
		// Return an invalid public row
		vi.mocked(callSelect).mockResolvedValueOnce({ data: [{}] });

		const get = makeEventSlice();
		const eff = fetchEventBySlug("bad-slug", get);

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Invalid event_public data/);
		expect(get().setEventLoading).toHaveBeenCalledWith(true);
		expect(get().setEventLoading).toHaveBeenCalledWith(false);
		expect(get().setEventError).toHaveBeenCalledWith(expect.anything());
	});

	it("accepts nullable event_public fields returned as null", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(
			forceCast<SupabaseClientLike | undefined>(createMinimalSupabaseClient()),
		);

		const pubWithNulls: unknown = JSON.parse(`{
			"event_id": "00000000-0000-0000-0000-000000000030",
			"owner_id": "00000000-0000-0000-0000-000000000031",
			"event_name": "Fresh Event",
			"event_slug": "fresh-event",
			"is_public": false,
			"event_date": null,
			"event_description": null,
			"active_playlist_id": null,
			"active_song_id": null,
			"public_notes": null,
			"created_at": null,
			"updated_at": null
		}`);

		vi.mocked(callSelect)
			.mockResolvedValueOnce({ data: [pubWithNulls] })
			.mockResolvedValueOnce({ data: [] });

		const get = makeEventSlice();
		const eff = fetchEventBySlug("fresh-event", get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();
		expect(get().setCurrentEvent).toHaveBeenCalledWith(
			expect.objectContaining({ event_id: "00000000-0000-0000-0000-000000000030" }),
		);
	});

	it("maps query failures to QueryError and sets error state", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		vi.mocked(callSelect).mockRejectedValue(new Error("boom"));

		const get = makeEventSlice();
		const eff = fetchEventBySlug("any", get);

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Failed to query event_public/);
		expect(get().setEventError).toHaveBeenCalledWith(expect.anything());
		expect(get().setEventLoading).toHaveBeenCalledWith(false);
	});
});
