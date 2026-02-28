import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import createCommunitySlice from "./createCommunitySlice";

describe("createCommunitySlice setters", () => {
	it("internal collection setters update state via set", () => {
		let state: Record<string, unknown> = {};

		function set(patch: Record<string, unknown>): void {
			state = { ...state, ...patch };
		}

		function get(): unknown {
			return state as unknown;
		}

		const api = {} as unknown;

		const slice = createCommunitySlice(forceCast(set), forceCast(get), forceCast(api));

		slice.setCurrentCommunity(forceCast({ community_id: "c1" }));
		expect(state["currentCommunity"]).toStrictEqual({ community_id: "c1" });

		slice.setCommunities(forceCast([{ community_id: "c1" }]));
		expect(state["communities"]).toStrictEqual([{ community_id: "c1" }]);

		slice.setMembers(forceCast([{ user_id: "u1" }]));
		expect(state["members"]).toStrictEqual([{ user_id: "u1" }]);

		slice.setCommunityEvents(forceCast([{ event_id: "e1" }]));
		expect(state["communityEvents"]).toStrictEqual([{ event_id: "e1" }]);
	});

	it("loading/saving setters and clearCurrentCommunity work", () => {
		let state: Record<string, unknown> = {};

		function set(patch: Record<string, unknown>): void {
			state = { ...state, ...patch };
		}

		function get(): unknown {
			return state as unknown;
		}

		const api = {} as unknown;

		const slice = createCommunitySlice(forceCast(set), forceCast(get), forceCast(api));

		slice.setCommunityLoading(true);
		expect(state["isCommunityLoading"]).toBe(true);

		slice.setCommunitySaving(true);
		expect(state["isCommunitySaving"]).toBe(true);

		slice.clearCurrentCommunity();
		expect(state["currentCommunity"]).toBeUndefined();
		expect(state["members"]).toStrictEqual([]);
		expect(state["communityEvents"]).toStrictEqual([]);
	});
});
