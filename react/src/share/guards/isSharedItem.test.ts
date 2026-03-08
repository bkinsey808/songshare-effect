import { describe, expect, it } from "vitest";

import makeNull from "@/react/lib/test-utils/makeNull.test-util";
import type { SharedItem } from "../slice/share-types";
import isSharedItem from "./isSharedItem";

const NUM = 42;
const validShare: SharedItem = {
	share_id: "share-1",
	sender_user_id: "user-a",
	recipient_user_id: "user-b",
	shared_item_type: "song",
	shared_item_id: "song-1",
	shared_item_name: "Test Song",
	status: "pending",
	message: undefined,
	created_at: "2025-01-01T00:00:00Z",
	updated_at: "2025-01-01T00:00:00Z",
};

describe("isSharedItem", () => {
	it("returns true for a valid SharedItem", () => {
		expect(isSharedItem(validShare)).toBe(true);
	});

	it("returns true for minimal required fields (no created_at/updated_at)", () => {
		const minimal = {
			share_id: "share-2",
			sender_user_id: "user-a",
			recipient_user_id: "user-b",
			shared_item_type: "playlist",
			shared_item_id: "pl-1",
			shared_item_name: "My Playlist",
			status: "accepted" as const,
			message: makeNull(),
		};
		expect(isSharedItem(minimal)).toBe(true);
	});

	it("returns true when message is a string", () => {
		expect(isSharedItem({ ...validShare, message: "Check this out!" })).toBe(true);
	});

	it.each([
		["undefined", undefined],
		["null", makeNull()],
		["number", NUM],
		["string", "not an object"],
		["array", []],
		["empty object", {}],
		["share_id number", { ...validShare, share_id: 123 } as unknown],
		[
			"share_id missing",
			((): Record<string, unknown> => {
				const obj = { ...validShare } as Record<string, unknown>;
				delete obj["share_id"];
				return obj;
			})(),
		],
		["sender_user_id number", { ...validShare, sender_user_id: 123 } as unknown],
		["recipient_user_id number", { ...validShare, recipient_user_id: 123 } as unknown],
		["shared_item_type number", { ...validShare, shared_item_type: 123 } as unknown],
		["shared_item_id number", { ...validShare, shared_item_id: 123 } as unknown],
		["shared_item_name number", { ...validShare, shared_item_name: 123 } as unknown],
		["status number", { ...validShare, status: 123 } as unknown],
		["message number", { ...validShare, message: 123 } as unknown],
		["created_at number", { ...validShare, created_at: 123 } as unknown],
		["updated_at number", { ...validShare, updated_at: 123 } as unknown],
	])("returns false for invalid input: %s", (_name, value) => {
		expect(isSharedItem(value)).toBe(false);
	});

	it("allows unknown extra fields", () => {
		expect(isSharedItem({ ...validShare, extra: true })).toBe(true);
	});
});
