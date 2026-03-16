import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { CommunityEntry } from "../community-types";
import type { CommunitySlice } from "../slice/CommunitySlice.type";
import handleCommunityPublicSubscribeEvent from "./handleCommunityPublicSubscribeEvent";

const CURRENT_COMMUNITY = forceCast<CommunityEntry>({
	community_id: "c1",
	owner_id: "owner-1",
	slug: "my-community",
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-01-01T00:00:00Z",
	name: "Test",
	description: undefined,
	is_public: true,
	public_notes: undefined,
});
const NEW_ACTIVE_EVENT_ID = "event-new";

describe("handleCommunityPublicSubscribeEvent", () => {
	it("does nothing when payload is not a realtime payload", async () => {
		const setCurrentCommunity = vi.fn();
		function get(): CommunitySlice {
			return forceCast({
				currentCommunity: CURRENT_COMMUNITY,
				setCurrentCommunity,
			});
		}

		await Effect.runPromise(handleCommunityPublicSubscribeEvent({ invalid: "payload" }, get));

		expect(setCurrentCommunity).not.toHaveBeenCalled();
	});

	it("does nothing when eventType is not UPDATE", async () => {
		const setCurrentCommunity = vi.fn();
		function get(): CommunitySlice {
			return forceCast({
				currentCommunity: CURRENT_COMMUNITY,
				setCurrentCommunity,
			});
		}

		await Effect.runPromise(
			handleCommunityPublicSubscribeEvent({ eventType: "INSERT", new: {}, old: undefined }, get),
		);

		expect(setCurrentCommunity).not.toHaveBeenCalled();
	});

	it("patches currentCommunity with active_event_id on UPDATE", async () => {
		const setCurrentCommunity = vi.fn();
		function get(): CommunitySlice {
			return forceCast({
				currentCommunity: CURRENT_COMMUNITY,
				setCurrentCommunity,
			});
		}

		await Effect.runPromise(
			handleCommunityPublicSubscribeEvent(
				{
					eventType: "UPDATE",
					new: { active_event_id: NEW_ACTIVE_EVENT_ID },
					old: {},
				},
				get,
			),
		);

		expect(setCurrentCommunity).toHaveBeenCalledWith({
			...CURRENT_COMMUNITY,
			active_event_id: NEW_ACTIVE_EVENT_ID,
		});
	});

	it("does not patch when currentCommunity is undefined", async () => {
		const setCurrentCommunity = vi.fn();
		function get(): CommunitySlice {
			return forceCast({
				currentCommunity: undefined,
				setCurrentCommunity,
			});
		}

		await Effect.runPromise(
			handleCommunityPublicSubscribeEvent(
				{
					eventType: "UPDATE",
					new: { active_event_id: NEW_ACTIVE_EVENT_ID },
					old: {},
				},
				get,
			),
		);

		expect(setCurrentCommunity).not.toHaveBeenCalled();
	});

	it("does not add active_event_id when new value is not a string", async () => {
		const setCurrentCommunity = vi.fn();
		function get(): CommunitySlice {
			return forceCast({
				currentCommunity: CURRENT_COMMUNITY,
				setCurrentCommunity,
			});
		}

		await Effect.runPromise(
			handleCommunityPublicSubscribeEvent(
				{
					eventType: "UPDATE",
					new: { active_event_id: 123 },
					old: {},
				},
				get,
			),
		);

		expect(setCurrentCommunity).toHaveBeenCalledWith(CURRENT_COMMUNITY);
	});

	it("does not patch when new is not a record", async () => {
		const setCurrentCommunity = vi.fn();
		function get(): CommunitySlice {
			return forceCast({
				currentCommunity: CURRENT_COMMUNITY,
				setCurrentCommunity,
			});
		}

		await Effect.runPromise(
			handleCommunityPublicSubscribeEvent({ eventType: "UPDATE", new: "not-object", old: {} }, get),
		);

		expect(setCurrentCommunity).not.toHaveBeenCalled();
	});
});
