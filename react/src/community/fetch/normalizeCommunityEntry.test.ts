import { describe, expect, it } from "vitest";

import type { CommunityEntry } from "../community-types";
import normalizeCommunityEntry from "./normalizeCommunityEntry";

const baseCommunity: CommunityEntry = {
	community_id: "c1",
	owner_id: "owner1",
	name: "Test Community",
	slug: "test-community",
	description: "A test",
	is_public: true,
	public_notes: "Notes",
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-01-02T00:00:00Z",
};

describe("normalizeCommunityEntry", () => {
	it("passes through all fields when input is complete", () => {
		const result = normalizeCommunityEntry(baseCommunity);

		expect(result).toStrictEqual(baseCommunity);
	});

	it("includes active_event_id when present", () => {
		const input = { ...baseCommunity, active_event_id: "e1" };
		const result = normalizeCommunityEntry(input);

		expect(result.active_event_id).toBe("e1");
	});

	it("omits active_event_id when undefined", () => {
		const result = normalizeCommunityEntry(baseCommunity);

		expect(result).not.toHaveProperty("active_event_id");
	});

	it("provides default timestamp for created_at when empty string", () => {
		const input = { ...baseCommunity, created_at: "" };
		const before = Date.now();
		const result = normalizeCommunityEntry(input);
		const after = Date.now();

		expect(new Date(result.created_at).getTime()).toBeGreaterThanOrEqual(before);
		expect(new Date(result.created_at).getTime()).toBeLessThanOrEqual(after);
	});

	it("provides default timestamp for updated_at when empty string", () => {
		const input = { ...baseCommunity, updated_at: "" };
		const before = Date.now();
		const result = normalizeCommunityEntry(input);
		const after = Date.now();

		expect(new Date(result.updated_at).getTime()).toBeGreaterThanOrEqual(before);
		expect(new Date(result.updated_at).getTime()).toBeLessThanOrEqual(after);
	});

	it("preserves truthy timestamps", () => {
		const result = normalizeCommunityEntry(baseCommunity);

		expect(result.created_at).toBe("2024-01-01T00:00:00Z");
		expect(result.updated_at).toBe("2024-01-02T00:00:00Z");
	});
});
