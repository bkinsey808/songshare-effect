import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import makeTagLibraryGet from "../makeTagLibraryGet.test-util";
import handleTagLibrarySubscribeEvent from "./handleTagLibrarySubscribeEvent";

const validEntry = { user_id: "u1", tag_slug: "rock" };

describe("handleTagLibrarySubscribeEvent", () => {
	it("ignores non-realtime payloads", async () => {
			const { get, addTagLibraryEntry, removeTagLibraryEntry } = makeTagLibraryGet([
				"addTagLibraryEntry",
				"removeTagLibraryEntry",
			]);

		await Effect.runPromise(handleTagLibrarySubscribeEvent(undefined, get));
		await Effect.runPromise(handleTagLibrarySubscribeEvent("string", get));
		await Effect.runPromise(handleTagLibrarySubscribeEvent({ eventType: "UNKNOWN" }, get));

		expect(addTagLibraryEntry).not.toHaveBeenCalled();
		expect(removeTagLibraryEntry).not.toHaveBeenCalled();
	});

	it("insert: calls addTagLibraryEntry with a valid new record", async () => {
		const { get, addTagLibraryEntry } = makeTagLibraryGet(["addTagLibraryEntry"]);
		const payload = { eventType: "INSERT", new: validEntry, old: {} };

		await Effect.runPromise(handleTagLibrarySubscribeEvent(payload, get));

		expect(addTagLibraryEntry).toHaveBeenCalledWith(validEntry);
	});

	it("insert: does nothing when new record is undefined", async () => {
		const { get, addTagLibraryEntry } = makeTagLibraryGet(["addTagLibraryEntry"]);
		const payload = { eventType: "INSERT", new: undefined, old: {} };

		await Effect.runPromise(handleTagLibrarySubscribeEvent(payload, get));

		expect(addTagLibraryEntry).not.toHaveBeenCalled();
	});

	it("insert: does nothing when new record fails isTagLibraryEntry", async () => {
		const { get, addTagLibraryEntry } = makeTagLibraryGet(["addTagLibraryEntry"]);
		const payload = { eventType: "INSERT", new: { user_id: 42, tag_slug: "rock" }, old: {} };

		await Effect.runPromise(handleTagLibrarySubscribeEvent(payload, get));

		expect(addTagLibraryEntry).not.toHaveBeenCalled();
	});

	it("update: calls addTagLibraryEntry with a valid new record", async () => {
		const { get, addTagLibraryEntry } = makeTagLibraryGet(["addTagLibraryEntry"]);
		const payload = { eventType: "UPDATE", new: validEntry, old: {} };

		await Effect.runPromise(handleTagLibrarySubscribeEvent(payload, get));

		expect(addTagLibraryEntry).toHaveBeenCalledWith(validEntry);
	});

	it("update: does nothing when new record fails isTagLibraryEntry", async () => {
		const { get, addTagLibraryEntry } = makeTagLibraryGet(["addTagLibraryEntry"]);
		const payload = { eventType: "UPDATE", new: { tag_slug: "rock" }, old: {} };

		await Effect.runPromise(handleTagLibrarySubscribeEvent(payload, get));

		expect(addTagLibraryEntry).not.toHaveBeenCalled();
	});

	it("delete: calls removeTagLibraryEntry with tag_slug from old record", async () => {
		const { get, removeTagLibraryEntry } = makeTagLibraryGet(["removeTagLibraryEntry"]);
		const payload = { eventType: "DELETE", new: {}, old: { tag_slug: "rock" } };

		await Effect.runPromise(handleTagLibrarySubscribeEvent(payload, get));

		expect(removeTagLibraryEntry).toHaveBeenCalledWith("rock");
	});

	it("delete: does nothing when old record has no tag_slug", async () => {
		const { get, removeTagLibraryEntry } = makeTagLibraryGet(["removeTagLibraryEntry"]);
		const payload = { eventType: "DELETE", new: {}, old: {} };

		await Effect.runPromise(handleTagLibrarySubscribeEvent(payload, get));

		expect(removeTagLibraryEntry).not.toHaveBeenCalled();
	});

	it("delete: does nothing when old record is not an object", async () => {
		const { get, removeTagLibraryEntry } = makeTagLibraryGet(["removeTagLibraryEntry"]);
		const payload = { eventType: "DELETE", new: {}, old: "not-an-object" };

		await Effect.runPromise(handleTagLibrarySubscribeEvent(payload, get));

		expect(removeTagLibraryEntry).not.toHaveBeenCalled();
	});
});
