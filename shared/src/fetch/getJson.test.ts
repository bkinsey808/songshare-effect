import { describe, expect, it, vi } from "vitest";

import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

import getJson from "./getJson";

const PATH = "/api/test";
const STATUS_NOT_FOUND = 404;

const ITEM_A = 1;
const ITEM_B = 2;
const ITEM_C = 3;

describe("getJson", () => {
	it("returns parsed JSON when response is ok and not ApiResponse shape", async () => {
		// Arrange
		const data = { items: [ITEM_A, ITEM_B, ITEM_C] };
		const originalFetch = globalThis.fetch;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => promiseResolved(data),
			}),
		);
		try {
			// Act
			const result = await getJson<typeof data>(PATH);

			// Assert
			expect(result).toStrictEqual(data);
			expect(globalThis.fetch).toHaveBeenCalledWith(PATH, {
				method: "GET",
				headers: { Accept: "application/json" },
				credentials: "include",
			});
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("unwraps data when response matches ApiResponse shape", async () => {
		// Arrange
		const wrapped = { success: true, data: { list: [] } };
		const originalFetch = globalThis.fetch;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => promiseResolved(wrapped),
			}),
		);
		try {
			// Act
			const result = await getJson<{ list: unknown[] }>(PATH);

			// Assert
			expect(result).toStrictEqual({ list: [] });
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("throws when response is not ok", async () => {
		// Arrange
		const errorPayload = { message: "Not found" };
		const originalFetch = globalThis.fetch;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: STATUS_NOT_FOUND,
				statusText: "Not Found",
				text: () => promiseResolved(JSON.stringify(errorPayload)),
			}),
		);
		try {
			// Assert
			await expect(getJson(PATH)).rejects.toThrow("Not found");
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("throws with extracted message when fetch rejects", async () => {
		// Arrange
		const fetchError = new Error("Network error");
		const originalFetch = globalThis.fetch;
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(fetchError));
		try {
			// Assert
			await expect(getJson(PATH)).rejects.toThrow("Network error");
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});
});
