import { describe, expect, it, vi } from "vitest";

import { clientWarn } from "@/react/lib/utils/clientLogger";
import makeNull from "@/shared/test-utils/makeNull.test-util";

import guardAsEventLibraryEntry from "./guardAsEventLibraryEntry";

vi.mock("@/react/lib/utils/clientLogger");

const VALID_ENTRY = {
	user_id: "u1",
	event_id: "e1",
	event_owner_id: "o1",
	created_at: "2024-01-01T00:00:00Z",
};

describe("guardAsEventLibraryEntry", () => {
	it("returns value when valid EventLibrary", () => {
		const result = guardAsEventLibraryEntry(VALID_ENTRY);
		expect(result).toStrictEqual(VALID_ENTRY);
	});

	it("throws when value is invalid", () => {
		const invalidValue = {};
		expect(() => guardAsEventLibraryEntry(invalidValue)).toThrow(
			/Expected valid EventLibrary in EventLibrary entry/,
		);
		expect(vi.mocked(clientWarn)).toHaveBeenCalledWith(
			"[guardAsEventLibraryEntry] Invalid EventLibrary entry:",
			invalidValue,
		);
	});

	it("uses custom context in error message", () => {
		const context = "server response";
		expect(() => guardAsEventLibraryEntry(makeNull(), context)).toThrow(/server response/);
	});
});
