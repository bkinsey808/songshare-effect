import { describe, expect, it } from "vitest";

import cloneCommunityRow from "./cloneCommunityRow";

describe("cloneCommunityRow", () => {
	it("returns a deep clone of the input row", () => {
		const row = { community_id: "c1", owner_id: "u1", created_at: "2024-01-01" };
		const result = cloneCommunityRow(row);
		expect(result).toStrictEqual(row);
		expect(result).not.toBe(row);
	});

	it("clones nested objects", () => {
		const row = { id: "1", nested: { value: 42 } };
		const result = cloneCommunityRow(row);
		expect(result.nested).toStrictEqual(row.nested);
		expect(result.nested).not.toBe(row.nested);
	});
});
