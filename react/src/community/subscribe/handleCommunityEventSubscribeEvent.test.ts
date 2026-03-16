import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { CommunityEntry, CommunityEvent } from "../community-types";
import type { CommunitySlice } from "../slice/CommunitySlice.type";
import handleCommunityEventSubscribeEvent from "./handleCommunityEventSubscribeEvent";

const COMMUNITY_SLUG = "my-community";
const EVENT_ID_TO_REMOVE = "event-1";
const EVENT_1: CommunityEvent = {
	community_id: "c1",
	event_id: EVENT_ID_TO_REMOVE,
	created_at: "2024-01-01T00:00:00Z",
};
const EVENT_2: CommunityEvent = {
	community_id: "c1",
	event_id: "event-2",
	created_at: "2024-01-02T00:00:00Z",
};
const CURRENT_COMMUNITY = forceCast<CommunityEntry>({
	community_id: "c1",
	owner_id: "owner-1",
	slug: COMMUNITY_SLUG,
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-01-01T00:00:00Z",
	name: "Test",
	description: undefined,
	is_public: true,
	public_notes: undefined,
});

describe("handleCommunityEventSubscribeEvent", () => {
	it("does nothing when payload is not a realtime payload", async () => {
		const setCommunityEvents = vi.fn();
		const fetchCommunityBySlug = vi.fn(() => Effect.void);
		function get(): CommunitySlice {
			return forceCast({
				currentCommunity: CURRENT_COMMUNITY,
				communityEvents: [],
				setCommunityEvents,
				fetchCommunityBySlug,
			});
		}

		await Effect.runPromise(handleCommunityEventSubscribeEvent({ invalid: "payload" }, get));

		expect(fetchCommunityBySlug).not.toHaveBeenCalled();
		expect(setCommunityEvents).not.toHaveBeenCalled();
	});

	it("calls fetchCommunityBySlug on INSERT when currentCommunity exists", async () => {
		const fetchCommunityBySlug = vi.fn(() => Effect.void);
		function get(): CommunitySlice {
			return forceCast({
				currentCommunity: CURRENT_COMMUNITY,
				communityEvents: [],
				setCommunityEvents: vi.fn(),
				fetchCommunityBySlug,
			});
		}

		await Effect.runPromise(
			handleCommunityEventSubscribeEvent({ eventType: "INSERT", new: {}, old: undefined }, get),
		);

		expect(fetchCommunityBySlug).toHaveBeenCalledWith(COMMUNITY_SLUG, { silent: true });
	});

	it("does not call fetchCommunityBySlug on INSERT when currentCommunity is undefined", async () => {
		const fetchCommunityBySlug = vi.fn(() => Effect.void);
		function get(): CommunitySlice {
			return forceCast({
				currentCommunity: undefined,
				communityEvents: [],
				setCommunityEvents: vi.fn(),
				fetchCommunityBySlug,
			});
		}

		await Effect.runPromise(
			handleCommunityEventSubscribeEvent({ eventType: "INSERT", new: {}, old: undefined }, get),
		);

		expect(fetchCommunityBySlug).not.toHaveBeenCalled();
	});

	it("removes event from communityEvents on DELETE when event_id is in old payload", async () => {
		const setCommunityEvents = vi.fn();
		function get(): CommunitySlice {
			return forceCast({
				currentCommunity: CURRENT_COMMUNITY,
				communityEvents: [EVENT_1, EVENT_2],
				setCommunityEvents,
				fetchCommunityBySlug: vi.fn(() => Effect.void),
			});
		}

		await Effect.runPromise(
			handleCommunityEventSubscribeEvent(
				{
					eventType: "DELETE",
					new: undefined,
					old: { event_id: EVENT_ID_TO_REMOVE },
				},
				get,
			),
		);

		expect(setCommunityEvents).toHaveBeenCalledWith([EVENT_2]);
	});

	it("does not call setCommunityEvents on DELETE when old has no event_id", async () => {
		const setCommunityEvents = vi.fn();
		function get(): CommunitySlice {
			return forceCast({
				currentCommunity: CURRENT_COMMUNITY,
				communityEvents: [EVENT_1],
				setCommunityEvents,
				fetchCommunityBySlug: vi.fn(() => Effect.void),
			});
		}

		await Effect.runPromise(
			handleCommunityEventSubscribeEvent({ eventType: "DELETE", new: undefined, old: {} }, get),
		);

		expect(setCommunityEvents).not.toHaveBeenCalled();
	});
});
