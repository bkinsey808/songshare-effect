import { describe, expect, it } from "vitest";

import type { SharedItem } from "@/react/share/slice/share-types";

import extractSharesFromResponse from "./extractSharesFromResponse";

const FIRST_INDEX = 0;
const NON_RECORD_NUMBER = 42;
const ONE_LENGTH = 1;
const SECOND_INDEX = 1;
const TWO_LENGTH = 2;

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

describe("extractSharesFromResponse", () => {
	it("returns empty array when value is not a record", () => {
		expect(extractSharesFromResponse(undefined)).toStrictEqual([]);
		expect(extractSharesFromResponse(NON_RECORD_NUMBER)).toStrictEqual([]);
		expect(extractSharesFromResponse("string")).toStrictEqual([]);
		expect(extractSharesFromResponse([])).toStrictEqual([]);
	});

	it("returns valid shares from flat { shares } shape", () => {
		const result = extractSharesFromResponse({ shares: [validShare] });
		expect(result).toHaveLength(ONE_LENGTH);
		expect(result[FIRST_INDEX]).toStrictEqual(validShare);
	});

	it("returns valid shares from wrapped { success, data: { shares } } shape", () => {
		const result = extractSharesFromResponse({
			success: true,
			data: { shares: [validShare] },
		});
		expect(result).toHaveLength(ONE_LENGTH);
		expect(result[FIRST_INDEX]).toStrictEqual(validShare);
	});

	it("filters out invalid items from flat shares array", () => {
		const invalid = { share_id: "bad", foo: "bar" };
		const result = extractSharesFromResponse({
			shares: [validShare, invalid],
		});
		expect(result).toHaveLength(ONE_LENGTH);
		expect(result[FIRST_INDEX]).toStrictEqual(validShare);
	});

	it("filters out invalid items from nested shares array", () => {
		const invalid = { share_id: "bad" };
		const result = extractSharesFromResponse({
			data: { shares: [validShare, invalid] },
		});
		expect(result).toHaveLength(ONE_LENGTH);
		expect(result[FIRST_INDEX]).toStrictEqual(validShare);
	});

	it("returns empty array when shares is not an array (flat)", () => {
		expect(extractSharesFromResponse({ shares: undefined })).toStrictEqual([]);
		expect(extractSharesFromResponse({ shares: {} })).toStrictEqual([]);
		expect(extractSharesFromResponse({ shares: "not-array" })).toStrictEqual([]);
	});

	it("returns empty array when data exists but data.shares is not array", () => {
		expect(extractSharesFromResponse({ data: { shares: undefined } })).toStrictEqual([]);
		expect(extractSharesFromResponse({ data: {} })).toStrictEqual([]);
	});

	it("returns empty array when record has neither shares nor valid data", () => {
		expect(extractSharesFromResponse({ foo: "bar" })).toStrictEqual([]);
		expect(extractSharesFromResponse({ data: undefined })).toStrictEqual([]);
	});

	it("returns multiple valid shares", () => {
		const share2: SharedItem = { ...validShare, share_id: "share-2" };
		const result = extractSharesFromResponse({
			shares: [validShare, share2],
		});
		expect(result).toHaveLength(TWO_LENGTH);
		expect(result[FIRST_INDEX]).toStrictEqual(validShare);
		expect(result[SECOND_INDEX]).toStrictEqual(share2);
	});
});
