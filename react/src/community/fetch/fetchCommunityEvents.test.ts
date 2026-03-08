import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import asPostgrestResponse from "@/react/lib/test-utils/asPostgrestResponse";
import forceCast from "@/react/lib/test-utils/forceCast";
import type { Database } from "@/shared/generated/supabaseTypes";

import type { CommunityEvent } from "../community-types";
import fetchCommunityEvents from "./fetchCommunityEvents";

vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const mockedCallSelect = vi.mocked(callSelect);

const ONE_CALL = 1;
const TWO_CALLS = 2;
const SECOND_CALL = 2;
const EXPECTED_TWO_EVENTS = 2;
const EXPECTED_ONE_EVENT = 1;

describe("fetchCommunityEvents", () => {
	const fakeClient = forceCast<SupabaseClientLike<Database>>({});

	it("returns empty array when community has no events", async () => {
		vi.resetAllMocks();
		mockedCallSelect.mockResolvedValueOnce(asPostgrestResponse<CommunityEvent[]>({ data: [] }));

		const result = await Effect.runPromise(fetchCommunityEvents(fakeClient, "community-1"));

		expect(result).toStrictEqual([]);
		expect(mockedCallSelect).toHaveBeenCalledTimes(ONE_CALL);
		expect(mockedCallSelect).toHaveBeenCalledWith(
			fakeClient,
			"community_event",
			expect.objectContaining({ eq: { col: "community_id", val: "community-1" } }),
		);
	});

	it("returns enriched events with event_name and event_slug", async () => {
		vi.resetAllMocks();
		const communityEvents: CommunityEvent[] = [
			{
				community_id: "community-1",
				event_id: "event-1",
				created_at: "2024-01-01",
			},
			{
				community_id: "community-1",
				event_id: "event-2",
				created_at: "2024-01-02",
			},
		];

		const eventDetails = [
			{ event_id: "event-1", event_name: "Event One", event_slug: "event-one" },
			{ event_id: "event-2", event_name: "Event Two", event_slug: "event-two" },
		];

		mockedCallSelect
			.mockResolvedValueOnce(asPostgrestResponse<CommunityEvent[]>({ data: communityEvents }))
			.mockResolvedValueOnce(
				asPostgrestResponse<{
					event_id: string;
					event_name: string;
					event_slug: string;
				}>({
					data: eventDetails,
				}),
			);

		const result = await Effect.runPromise(fetchCommunityEvents(fakeClient, "community-1"));

		expect(result).toHaveLength(EXPECTED_TWO_EVENTS);
		const [firstEvent, secondEvent] = result;
		expect(firstEvent).toMatchObject({
			community_id: "community-1",
			event_id: "event-1",
			event_name: "Event One",
			event_slug: "event-one",
		});
		expect(secondEvent).toMatchObject({
			community_id: "community-1",
			event_id: "event-2",
			event_name: "Event Two",
			event_slug: "event-two",
		});

		expect(mockedCallSelect).toHaveBeenCalledTimes(TWO_CALLS);
		expect(mockedCallSelect).toHaveBeenNthCalledWith(
			SECOND_CALL,
			fakeClient,
			"event_public",
			expect.objectContaining({
				cols: "event_id, event_name, event_slug",
				in: { col: "event_id", vals: ["event-1", "event-2"] },
			}),
		);
	});

	it("leaves event_name and event_slug undefined when details are missing", async () => {
		vi.resetAllMocks();
		const communityEvents: CommunityEvent[] = [
			{
				community_id: "community-1",
				event_id: "event-1",
				created_at: "2024-01-01",
			},
		];

		mockedCallSelect
			.mockResolvedValueOnce(asPostgrestResponse<CommunityEvent[]>({ data: communityEvents }))
			.mockResolvedValueOnce(
				asPostgrestResponse<{
					event_id: string;
					event_name: string;
					event_slug: string;
				}>({
					data: [],
				}),
			);

		const result = await Effect.runPromise(fetchCommunityEvents(fakeClient, "community-1"));

		expect(result).toHaveLength(EXPECTED_ONE_EVENT);
		const [firstEvent] = result;
		expect(firstEvent).toMatchObject({
			community_id: "community-1",
			event_id: "event-1",
		});
		expect(firstEvent?.event_name).toBeUndefined();
		expect(firstEvent?.event_slug).toBeUndefined();
	});
});
