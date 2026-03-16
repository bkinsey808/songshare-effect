import { describe, expect, it, vi } from "vitest";

import promiseResolved, { promiseRejected } from "@/shared/test-utils/promiseResolved.test-util";

import postJsonWithResult from "./postJsonWithResult";

const PATH = "/api/test";
const BODY = { key: "value" };
const STATUS_BAD = 400;
const STATUS_SERVER = 500;

describe("postJsonWithResult", () => {
	it("returns parsed JSON when response is ok and not ApiResponse shape", async () => {
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
			const result = await postJsonWithResult<typeof data>(PATH, BODY);
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
			const result = await postJsonWithResult<{ count: number }>(PATH, BODY);
			expect(result).toStrictEqual({ count: 3 });
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("throws with extracted message when response is not ok and body is JSON with error", async () => {
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
			await expect(postJsonWithResult(PATH, BODY)).rejects.toThrow("Bad request message");
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("throws with raw text when response is not ok and body is not JSON", async () => {
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
			await expect(postJsonWithResult(PATH, BODY)).rejects.toThrow(plainText);
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("throws with status when response is not ok and body cannot be read", async () => {
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
			await expect(postJsonWithResult(PATH, BODY)).rejects.toThrow(/Request failed \(500\)/);
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});
});
