import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { clientWarn } from "@/react/lib/utils/clientLogger";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiEventLibraryRemovePath } from "@/shared/paths";

import makeEventLibrarySlice from "../slice/makeEventLibrarySlice.mock";
import removeEventFromLibraryEffect from "./removeEventFromLibraryEffect";

vi.mock(
	"@/shared/error-message/extractErrorMessage",
	(): { default: (err: unknown, fallback?: string) => string } => ({
		default: vi
			.fn<(err: unknown, fallback?: string) => string>()
			.mockImplementation((_err: unknown, fallback = "Unknown error") => fallback),
	}),
);

vi.mock("@/react/lib/utils/clientLogger", (): { clientWarn: (...args: unknown[]) => void } => ({
	clientWarn: vi.fn(),
}));

describe("removeEventFromLibraryEffect", () => {
	it("rejects on network failure and sets error message", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network fail")));
		vi.mocked(extractErrorMessage).mockReturnValue("Network error");

		const get = makeEventLibrarySlice();
		const slice = get();
		const eff = removeEventFromLibraryEffect({ event_id: "e1" }, get);
		const promise = Effect.runPromise(eff);

		await expect(promise).rejects.toThrow(/Network error/);
		expect(slice.setEventLibraryError).toHaveBeenCalledWith(undefined);
		expect(clientWarn).toHaveBeenCalledWith(
			expect.stringContaining("[removeEventFromLibrary] Failed to remove event from library:"),
			expect.any(String),
		);
		expect(slice.setEventLibraryError).toHaveBeenCalledWith("Network error");
	});

	it("rejects on non-ok response and sets the extracted message", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue(Response.json({ message: "nope" }, { status: 400, statusText: "Bad" })),
		);
		vi.mocked(extractErrorMessage).mockReturnValue("API Error");

		const get = makeEventLibrarySlice();
		const slice = get();
		const eff = removeEventFromLibraryEffect({ event_id: "e1" }, get);
		const promise = Effect.runPromise(eff);

		await expect(promise).rejects.toThrow(/API Error/);
		expect(slice.setEventLibraryError).toHaveBeenCalledWith("API Error");
		expect(clientWarn).toHaveBeenCalledWith(
			expect.stringContaining("[removeEventFromLibrary] Failed to remove event from library:"),
			expect.any(String),
		);
	});

	it("rejects when server response missing success flag", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({}, { status: 200 })));

		const get = makeEventLibrarySlice();
		const slice = get();
		const eff = removeEventFromLibraryEffect({ event_id: "e1" }, get);
		const promise = Effect.runPromise(eff);

		await expect(promise).rejects.toThrow(/Invalid server response: missing success flag/);
		const expectedCalls = 2;
		expect(slice.setEventLibraryError).toHaveBeenCalledTimes(expectedCalls);
		expect(clientWarn).toHaveBeenCalledWith(
			expect.stringContaining("[removeEventFromLibrary] Failed to remove event from library:"),
			undefined,
		);
	});

	it("rejects when success is not boolean", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(Response.json({ success: "yes" }, { status: 200 })),
		);

		const get = makeEventLibrarySlice();
		const slice = get();
		const eff = removeEventFromLibraryEffect({ event_id: "e1" }, get);
		const promise = Effect.runPromise(eff);

		await expect(promise).rejects.toThrow(/Invalid server response: success must be boolean/);
		const expectedCalls = 2;
		expect(slice.setEventLibraryError).toHaveBeenCalledTimes(expectedCalls);
		expect(clientWarn).toHaveBeenCalledWith(
			expect.stringContaining("[removeEventFromLibrary] Failed to remove event from library:"),
			undefined,
		);
	});

	it("resolves and removes library entry on success", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(Response.json({ success: true }, { status: 200 })),
		);

		const get = makeEventLibrarySlice();
		const slice = get();
		const eff = removeEventFromLibraryEffect({ event_id: "e1" }, get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();

		expect(slice.removeEventLibraryEntry).toHaveBeenCalledWith("e1");
		expect(slice.setEventLibraryError).toHaveBeenCalledWith(undefined);
		expect(globalThis.fetch).toHaveBeenCalledWith(
			apiEventLibraryRemovePath,
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ event_id: "e1" }),
			}),
		);
	});
});
