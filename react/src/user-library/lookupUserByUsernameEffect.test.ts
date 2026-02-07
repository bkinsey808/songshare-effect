import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { apiUserLibraryLookupPath } from "@/shared/paths";

import lookupUserByUsernameEffect from "./lookupUserByUsernameEffect";

/** Restore global fetch safely after tests */
function restoreFetch(originalFetch: unknown): void {
	Reflect.set(globalThis, "fetch", originalFetch);
}

describe("lookupUserByUsernameEffect", () => {
	it("resolves with user data on success", async () => {
		const originalFetch = globalThis.fetch;
		const json = vi.fn().mockResolvedValue({ data: { user_id: "u1", username: "bob" } });
		const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json });
		vi.stubGlobal("fetch", fetchMock);

		const res = await Effect.runPromise(lookupUserByUsernameEffect("bob"));
		expect(res).toStrictEqual({ user_id: "u1", username: "bob" });
		expect(fetchMock).toHaveBeenCalledWith(
			apiUserLibraryLookupPath,
			expect.objectContaining({ method: "POST", body: JSON.stringify({ username: "bob" }) }),
		);

		restoreFetch(originalFetch);
	});

	it("fails with NetworkError when fetch rejects", async () => {
		const originalFetch = globalThis.fetch;
		const fetchMock = vi.fn().mockRejectedValue(new Error("net fail"));
		vi.stubGlobal("fetch", fetchMock);

		await expect(Effect.runPromise(lookupUserByUsernameEffect("bob"))).rejects.toThrow(
			/Failed to fetch user lookup/,
		);

		restoreFetch(originalFetch);
	});

	it("fails with NetworkError containing server message and status when non-ok with JSON message", async () => {
		const originalFetch = globalThis.fetch;
		const json = vi.fn().mockResolvedValue({ message: "User not found" });
		const fetchMock = vi
			.fn()
			.mockResolvedValue({ ok: false, status: 400, statusText: "Bad", json });
		vi.stubGlobal("fetch", fetchMock);

		const p1 = Effect.runPromise(lookupUserByUsernameEffect("bob"));
		await expect(p1).rejects.toThrow("User not found");

		restoreFetch(originalFetch);
	});

	it("falls back to statusText when error body json is invalid", async () => {
		const originalFetch = globalThis.fetch;
		const json = vi.fn().mockRejectedValue(new Error("invalid json"));
		const fetchMock = vi
			.fn()
			.mockResolvedValue({ ok: false, status: 500, statusText: "ServerErr", json });
		vi.stubGlobal("fetch", fetchMock);

		const p2 = Effect.runPromise(lookupUserByUsernameEffect("bob"));
		await expect(p2).rejects.toThrow("Failed to lookup user: ServerErr");

		restoreFetch(originalFetch);
	});

	it("fails with ParseError when response.json throws", async () => {
		const originalFetch = globalThis.fetch;
		const json = vi.fn().mockRejectedValue(new Error("bad json"));
		const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json });
		vi.stubGlobal("fetch", fetchMock);

		await expect(Effect.runPromise(lookupUserByUsernameEffect("bob"))).rejects.toThrow(
			/Failed to parse response/,
		);

		restoreFetch(originalFetch);
	});

	it("fails with ParseError when response shape is invalid", async () => {
		const originalFetch = globalThis.fetch;
		const json = vi.fn().mockResolvedValue({ data: { not_id: "x" } });
		const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json });
		vi.stubGlobal("fetch", fetchMock);

		await expect(Effect.runPromise(lookupUserByUsernameEffect("bob"))).rejects.toThrow(
			/Invalid response format/,
		);

		restoreFetch(originalFetch);
	});
});
