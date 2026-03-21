import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { TagLibrarySlice } from "../slice/TagLibrarySlice.type";
import handleTagLibrarySubscribeEvent from "./handleTagLibrarySubscribeEvent";

function makeGet(): {
	get: () => TagLibrarySlice;
	addTagLibraryEntry: ReturnType<typeof vi.fn>;
	removeTagLibraryEntry: ReturnType<typeof vi.fn>;
} {
	const addTagLibraryEntry = vi.fn();
	const removeTagLibraryEntry = vi.fn();
	const slice = forceCast<TagLibrarySlice>({ addTagLibraryEntry, removeTagLibraryEntry });
	return { get: () => slice, addTagLibraryEntry, removeTagLibraryEntry };
}

const validEntry = { user_id: "u1", tag_slug: "rock" };

describe("handleTagLibrarySubscribeEvent", () => {
	it("ignores non-realtime payloads", async () => {
		const { get, addTagLibraryEntry, removeTagLibraryEntry } = makeGet();

		await Effect.runPromise(handleTagLibrarySubscribeEvent(undefined, get));
		await Effect.runPromise(handleTagLibrarySubscribeEvent("string", get));
		await Effect.runPromise(handleTagLibrarySubscribeEvent({ eventType: "UNKNOWN" }, get));

		expect(addTagLibraryEntry).not.toHaveBeenCalled();
		expect(removeTagLibraryEntry).not.toHaveBeenCalled();
	});

	it("insert: calls addTagLibraryEntry with a valid new record", async () => {
		const { get, addTagLibraryEntry } = makeGet();
		const payload = { eventType: "INSERT", new: validEntry, old: {} };

		await Effect.runPromise(handleTagLibrarySubscribeEvent(payload, get));

		expect(addTagLibraryEntry).toHaveBeenCalledWith(validEntry);
	});

	it("insert: does nothing when new record is undefined", async () => {
		const { get, addTagLibraryEntry } = makeGet();
		const payload = { eventType: "INSERT", new: undefined, old: {} };

		await Effect.runPromise(handleTagLibrarySubscribeEvent(payload, get));

		expect(addTagLibraryEntry).not.toHaveBeenCalled();
	});

	it("insert: does nothing when new record fails isTagLibraryEntry", async () => {
		const { get, addTagLibraryEntry } = makeGet();
		const payload = { eventType: "INSERT", new: { user_id: 42, tag_slug: "rock" }, old: {} };

		await Effect.runPromise(handleTagLibrarySubscribeEvent(payload, get));

		expect(addTagLibraryEntry).not.toHaveBeenCalled();
	});

	it("update: calls addTagLibraryEntry with a valid new record", async () => {
		const { get, addTagLibraryEntry } = makeGet();
		const payload = { eventType: "UPDATE", new: validEntry, old: {} };

		await Effect.runPromise(handleTagLibrarySubscribeEvent(payload, get));

		expect(addTagLibraryEntry).toHaveBeenCalledWith(validEntry);
	});

	it("update: does nothing when new record fails isTagLibraryEntry", async () => {
		const { get, addTagLibraryEntry } = makeGet();
		const payload = { eventType: "UPDATE", new: { tag_slug: "rock" }, old: {} };

		await Effect.runPromise(handleTagLibrarySubscribeEvent(payload, get));

		expect(addTagLibraryEntry).not.toHaveBeenCalled();
	});

	it("delete: calls removeTagLibraryEntry with tag_slug from old record", async () => {
		const { get, removeTagLibraryEntry } = makeGet();
		const payload = { eventType: "DELETE", new: {}, old: { tag_slug: "rock" } };

		await Effect.runPromise(handleTagLibrarySubscribeEvent(payload, get));

		expect(removeTagLibraryEntry).toHaveBeenCalledWith("rock");
	});

	it("delete: does nothing when old record has no tag_slug", async () => {
		const { get, removeTagLibraryEntry } = makeGet();
		const payload = { eventType: "DELETE", new: {}, old: {} };

		await Effect.runPromise(handleTagLibrarySubscribeEvent(payload, get));

		expect(removeTagLibraryEntry).not.toHaveBeenCalled();
	});

	it("delete: does nothing when old record is not an object", async () => {
		const { get, removeTagLibraryEntry } = makeGet();
		const payload = { eventType: "DELETE", new: {}, old: "not-an-object" };

		await Effect.runPromise(handleTagLibrarySubscribeEvent(payload, get));

		expect(removeTagLibraryEntry).not.toHaveBeenCalled();
	});
});
