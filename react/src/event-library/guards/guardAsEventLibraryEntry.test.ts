import { describe, expect, it, vi } from "vitest";

import type { EventLibrary } from "@/shared/generated/supabaseSchemas";

import guardAsEventLibraryEntry from "./guardAsEventLibraryEntry";

describe("guardAsEventLibraryEntry", () => {
	it("returns the value when it is a valid EventLibrary entry", () => {
		const value: EventLibrary = {
			user_id: "u1",
			event_id: "e1",
			event_owner_id: "owner-1",
			created_at: "2020-01-01T00:00:00.000Z",
		};

		const result = guardAsEventLibraryEntry(value);

		expect(result).toBe(value);

		// Clean up any spies or mocks created during the test
		vi.restoreAllMocks();
	});

	it("throws a TypeError and logs a warning when value is invalid (default context)", () => {
		const value = {} as unknown; // clearly invalid for the guard

		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
			/* stubbed */
		});

		expect(() => guardAsEventLibraryEntry(value)).toThrow(TypeError);
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining("Invalid EventLibrary entry"),
			value,
		);

		vi.restoreAllMocks();
	});

	it("includes custom context in the thrown error and warning", () => {
		const value = undefined as unknown; // use undefined instead of null

		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
			/* stubbed */
		});

		const context = "server response";

		expect(() => guardAsEventLibraryEntry(value, context)).toThrow(
			`Expected valid EventLibrary in ${context}`,
		);

		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(`Invalid ${context}:`), value);

		vi.restoreAllMocks();
	});
});
