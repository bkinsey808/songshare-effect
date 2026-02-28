import { describe, expect, it } from "vitest";

import mapCommunityInvitations from "./mapCommunityInvitations";

describe("mapCommunityInvitations", () => {
	it("maps community user data and public data correctly", () => {
		const userData = [{ community_id: "1" }, { community_id: "2" }];
		const publicData = [
			{ community_id: "1", name: "Community One", slug: "com-1" },
			{ community_id: "2", name: "Community Two", slug: "com-2" },
		];

		const result = mapCommunityInvitations(userData, publicData);

		expect(result).toStrictEqual([
			{
				community_id: "1",
				community_name: "Community One",
				community_slug: "com-1",
			},
			{
				community_id: "2",
				community_name: "Community Two",
				community_slug: "com-2",
			},
		]);
	});

	it("skips user data without corresponding public data", () => {
		const userData = [{ community_id: "1" }, { community_id: "3" }];
		const publicData = [{ community_id: "1", name: "Community One", slug: "com-1" }];

		const result = mapCommunityInvitations(userData, publicData);

		expect(result).toStrictEqual([
			{
				community_id: "1",
				community_name: "Community One",
				community_slug: "com-1",
			},
		]);
	});

	it("handles empty arrays", () => {
		expect(mapCommunityInvitations([], [])).toStrictEqual([]);
	});
});
