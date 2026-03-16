import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import type { SharedItem } from "../slice/share-types";
import isSharedItem from "./isSharedItem";
import expectGuardRejectsNull from "./isSharedItem.test-util";

const NON_STRING_SHARED_ITEM_TYPE = 123;

const VALID_SHARE: SharedItem = {
	share_id: "sh-1",
	sender_user_id: "s1",
	recipient_user_id: "r1",
	shared_item_type: "song",
	shared_item_id: "song-1",
	shared_item_name: "My Song",
	status: "pending",
	message: makeNull(),
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-01-01T00:00:00Z",
};

describe("isSharedItem", () => {
	it("returns true for valid SharedItem", () => {
		expect(isSharedItem(VALID_SHARE)).toBe(true);
	});

	it("returns true when message is undefined", () => {
		const share = { ...VALID_SHARE, message: undefined };
		expect(isSharedItem(share)).toBe(true);
	});

	it("returns false for null", () => {
		expectGuardRejectsNull(isSharedItem);
	});

	it("returns false for undefined", () => {
		expect(isSharedItem(undefined)).toBe(false);
	});

	it("returns false for non-object", () => {
		expect(isSharedItem("string")).toBe(false);
		expect(isSharedItem(NON_STRING_SHARED_ITEM_TYPE)).toBe(false);
	});

	it("returns false when share_id is missing", () => {
		const { share_id: _removed, ...partial } = VALID_SHARE;
		expect(isSharedItem(partial)).toBe(false);
	});

	it("returns false when shared_item_type is not string", () => {
		expect(
			isSharedItem({
				...VALID_SHARE,
				shared_item_type: NON_STRING_SHARED_ITEM_TYPE,
			}),
		).toBe(false);
	});
});
