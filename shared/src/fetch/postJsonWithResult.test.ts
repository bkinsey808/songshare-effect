import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import promiseResolved, { promiseRejected } from "@/shared/test-utils/promiseResolved.test-util";

import postJsonWithResult from "./postJsonWithResult";

const PATH = "/api/test";
const BODY = { key: "value" };
const STATUS_BAD = 400;
const STATUS_SERVER = 500;

describe("postJsonWithResult", () => {
	it("returns parsed JSON when response is ok and not ApiResponse shape", async () => {
		// Arrange
		const data = { id: "123", name: "test" };
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
			const result = await Effect.runPromise(postJsonWithResult<typeof data>(PATH, BODY));

			// Assert
			expect(result).toStrictEqual(data);
			expect(globalThis.fetch).toHaveBeenCalledWith(PATH, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(BODY),
			});
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("unwraps data when response matches ApiResponse shape", async () => {
		// Arrange
		const wrapped = { success: true, data: { count: 3 } };
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
			const result = await Effect.runPromise(postJsonWithResult<{ count: number }>(PATH, BODY));

			// Assert
			expect(result).toStrictEqual({ count: 3 });
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("throws with extracted message when response is not ok and body is JSON with error", async () => {
		// Arrange
		const errorPayload = { error: "Bad request message" };
		const originalFetch = globalThis.fetch;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: STATUS_BAD,
				text: () => promiseResolved(JSON.stringify(errorPayload)),
			}),
		);
		try {
			// Assert
			await expect(Effect.runPromise(postJsonWithResult(PATH, BODY))).rejects.toThrow("Bad request message");
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("throws with raw text when response is not ok and body is not JSON", async () => {
		// Arrange
		const plainText = "Plain error text";
		const originalFetch = globalThis.fetch;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: STATUS_SERVER,
				text: () => promiseResolved(plainText),
			}),
		);
		try {
			// Assert
			await expect(Effect.runPromise(postJsonWithResult(PATH, BODY))).rejects.toThrow(plainText);
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("throws with status when response is not ok and body cannot be read", async () => {
		// Arrange
		const originalFetch = globalThis.fetch;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: STATUS_SERVER,
				text: () => promiseRejected<string>(new Error("read failed")),
			}),
		);
		try {
			// Assert
			await expect(Effect.runPromise(postJsonWithResult(PATH, BODY))).rejects.toThrow(/Request failed \(500\)/);
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});
});
