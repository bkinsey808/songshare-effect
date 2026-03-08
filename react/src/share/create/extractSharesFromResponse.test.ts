import { describe, expect, it } from "vitest";

import type { SharedItem } from "../slice/share-types";
import extractSharesFromResponse from "./extractSharesFromResponse";

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
	it("returns empty array for undefined", () => {
		expect(extractSharesFromResponse(undefined)).toStrictEqual([]);
	});

	it("returns empty array for primitives", () => {
		const numericPrimitive = 42;
		expect(extractSharesFromResponse("string")).toStrictEqual([]);
		expect(extractSharesFromResponse(numericPrimitive)).toStrictEqual([]);
		expect(extractSharesFromResponse(true)).toStrictEqual([]);
	});

	it("returns empty array for array input (not a record)", () => {
		expect(extractSharesFromResponse([])).toStrictEqual([]);
		expect(extractSharesFromResponse([validShare])).toStrictEqual([]);
	});

	it("returns empty array for empty object", () => {
		expect(extractSharesFromResponse({})).toStrictEqual([]);
	});

	it("returns empty array when shares is not an array", () => {
		expect(extractSharesFromResponse({ shares: undefined })).toStrictEqual([]);
		expect(extractSharesFromResponse({ shares: "string" })).toStrictEqual([]);
		expect(extractSharesFromResponse({ shares: {} })).toStrictEqual([]);
	});

	it("extracts from flat { shares } shape", () => {
		expect(extractSharesFromResponse({ shares: [] })).toStrictEqual([]);
		expect(extractSharesFromResponse({ shares: [validShare] })).toStrictEqual([validShare]);
	});

	it("filters out invalid items from flat shape", () => {
		const invalid = { share_id: "x", not_a_share: true };
		expect(extractSharesFromResponse({ shares: [validShare, invalid] })).toStrictEqual([
			validShare,
		]);
		expect(extractSharesFromResponse({ shares: [invalid] })).toStrictEqual([]);
	});

	it("extracts from nested { data: { shares } } shape", () => {
		expect(extractSharesFromResponse({ success: true, data: { shares: [] } })).toStrictEqual([]);
		expect(
			extractSharesFromResponse({
				success: true,
				data: { shares: [validShare] },
			}),
		).toStrictEqual([validShare]);
	});

	it("returns empty array when nested data.shares is not an array", () => {
		expect(extractSharesFromResponse({ data: {} })).toStrictEqual([]);
		expect(extractSharesFromResponse({ data: { shares: undefined } })).toStrictEqual([]);
	});

	it("filters out invalid items from nested shape", () => {
		const invalid = { share_id: "x", not_a_share: true };
		expect(
			extractSharesFromResponse({
				data: { shares: [validShare, invalid] },
			}),
		).toStrictEqual([validShare]);
	});
});
