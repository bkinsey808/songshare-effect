import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import makeTagLibraryGet from "../makeTagLibraryGet.test-util";
import handleTagCountsSubscribeEvent from "./handleTagCountsSubscribeEvent";

describe("handleTagCountsSubscribeEvent", () => {
	it("ignores non-realtime payloads", async () => {
		const { get, fetchTagLibraryCounts } = makeTagLibraryGet();

		await Effect.runPromise(handleTagCountsSubscribeEvent(undefined, get));
		await Effect.runPromise(handleTagCountsSubscribeEvent("string", get));
		await Effect.runPromise(handleTagCountsSubscribeEvent({ eventType: "UNKNOWN" }, get));

		expect(fetchTagLibraryCounts).not.toHaveBeenCalled();
	});

	it("ignores UPDATE events", async () => {
		const { get, fetchTagLibraryCounts } = makeTagLibraryGet();
		const payload = { eventType: "UPDATE", new: { tag_slug: "rock" }, old: {} };

		await Effect.runPromise(handleTagCountsSubscribeEvent(payload, get));

		expect(fetchTagLibraryCounts).not.toHaveBeenCalled();
	});

	it("ignores INSERT when tag_slug is absent from new record", async () => {
		const { get, fetchTagLibraryCounts } = makeTagLibraryGet();
		const payload = { eventType: "INSERT", new: {}, old: {} };

		await Effect.runPromise(handleTagCountsSubscribeEvent(payload, get));

		expect(fetchTagLibraryCounts).not.toHaveBeenCalled();
	});

	it("ignores DELETE when tag_slug is absent from old record", async () => {
		const { get, fetchTagLibraryCounts } = makeTagLibraryGet();
		const payload = { eventType: "DELETE", new: {}, old: {} };

		await Effect.runPromise(handleTagCountsSubscribeEvent(payload, get));

		expect(fetchTagLibraryCounts).not.toHaveBeenCalled();
	});

	it("ignores INSERT when slug is not in the library", async () => {
		const { get, fetchTagLibraryCounts } = makeTagLibraryGet();
		const payload = { eventType: "INSERT", new: { tag_slug: "unknown-slug" }, old: {} };

		await Effect.runPromise(handleTagCountsSubscribeEvent(payload, get));

		expect(fetchTagLibraryCounts).not.toHaveBeenCalled();
	});

	it("ignores DELETE when slug is not in the library", async () => {
		const { get, fetchTagLibraryCounts } = makeTagLibraryGet();
		const payload = { eventType: "DELETE", new: {}, old: { tag_slug: "unknown-slug" } };

		await Effect.runPromise(handleTagCountsSubscribeEvent(payload, get));

		expect(fetchTagLibraryCounts).not.toHaveBeenCalled();
	});

	it("calls fetchTagLibraryCounts when INSERT slug is in the library", async () => {
		const { get, fetchTagLibraryCounts } = makeTagLibraryGet();
		const payload = { eventType: "INSERT", new: { tag_slug: "rock" }, old: {} };

		await Effect.runPromise(handleTagCountsSubscribeEvent(payload, get));

		expect(fetchTagLibraryCounts).toHaveBeenCalledWith();
	});

	it("calls fetchTagLibraryCounts when DELETE slug is in the library", async () => {
		const { get, fetchTagLibraryCounts } = makeTagLibraryGet();
		const payload = { eventType: "DELETE", new: {}, old: { tag_slug: "jazz" } };

		await Effect.runPromise(handleTagCountsSubscribeEvent(payload, get));

		expect(fetchTagLibraryCounts).toHaveBeenCalledWith();
	});
});
