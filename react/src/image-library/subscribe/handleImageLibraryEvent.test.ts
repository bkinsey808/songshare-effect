import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { ImageLibraryEntry } from "../image-library-types";
import type { ImageLibrarySlice } from "../slice/ImageLibrarySlice.type";
import handleImageLibraryEvent from "./handleImageLibraryEvent";

const IMAGE_ID = "img-1";
const USER_ID = "usr-1";

const validEntry: ImageLibraryEntry = {
	user_id: USER_ID,
	image_id: IMAGE_ID,
	created_at: "2026-01-01T00:00:00Z",
};

const fakeClient = forceCast<unknown>({});

describe("handleImageLibraryEvent", () => {
	it("does nothing when payload is not a realtime payload", async () => {
		const addImageLibraryEntry = vi.fn();
		const removeImageLibraryEntry = vi.fn();

		/**
		 * Return a minimal `ImageLibrarySlice` for non-realtime payload tests.
		 *
		 * @returns A mocked slice with add/remove handlers.
		 */
		function get(): ImageLibrarySlice {
			return forceCast({
				addImageLibraryEntry,
				removeImageLibraryEntry,
			});
		}

		await Effect.runPromise(handleImageLibraryEvent({ invalid: "payload" }, fakeClient, get));

		expect(addImageLibraryEntry).not.toHaveBeenCalled();
		expect(removeImageLibraryEntry).not.toHaveBeenCalled();
	});

	it.each(["INSERT", "UPDATE"] as const)("adds entry for %s events", async (eventType) => {
		const addImageLibraryEntry = vi.fn();

		/**
		 * Return a minimal `ImageLibrarySlice` for INSERT/UPDATE event tests.
		 *
		 * @returns A mocked slice with add handler.
		 */
		function get(): ImageLibrarySlice {
			return forceCast({
				addImageLibraryEntry,
				removeImageLibraryEntry: vi.fn(),
			});
		}

		const payload = { eventType, new: validEntry, old: undefined };

		await Effect.runPromise(handleImageLibraryEvent(payload, fakeClient, get));

		expect(addImageLibraryEntry).toHaveBeenCalledWith(validEntry);
	});

	it("skips add when new record is not a valid ImageLibraryEntry", async () => {
		const addImageLibraryEntry = vi.fn();

		/**
		 * Return a minimal `ImageLibrarySlice` when new record is invalid.
		 *
		 * @returns A mocked slice with add handler.
		 */
		function get(): ImageLibrarySlice {
			return forceCast({
				addImageLibraryEntry,
				removeImageLibraryEntry: vi.fn(),
			});
		}

		const payload = {
			eventType: "INSERT" as const,
			new: { invalid: "shape" },
			old: undefined,
		};

		await Effect.runPromise(handleImageLibraryEvent(payload, fakeClient, get));

		expect(addImageLibraryEntry).not.toHaveBeenCalled();
	});

	it("skips add when extractNewRecord returns undefined", async () => {
		const addImageLibraryEntry = vi.fn();

		/**
		 * Return a minimal `ImageLibrarySlice` when extractNewRecord yields undefined.
		 *
		 * @returns A mocked slice with add/remove handlers.
		 */
		function get(): ImageLibrarySlice {
			return forceCast({
				addImageLibraryEntry,
				removeImageLibraryEntry: vi.fn(),
			});
		}

		const payload = { eventType: "INSERT" as const, new: undefined, old: undefined };

		await Effect.runPromise(handleImageLibraryEvent(payload, fakeClient, get));

		expect(addImageLibraryEntry).not.toHaveBeenCalled();
	});

	it("removes entry on DELETE when image_id in old", async () => {
		const removeImageLibraryEntry = vi.fn();

		/**
		 * Return a minimal `ImageLibrarySlice` for DELETE event tests.
		 *
		 * @returns A mocked slice with remove handler.
		 */
		function get(): ImageLibrarySlice {
			return forceCast({
				addImageLibraryEntry: vi.fn(),
				removeImageLibraryEntry,
			});
		}

		const payload = {
			eventType: "DELETE" as const,
			new: undefined,
			old: { image_id: IMAGE_ID },
		};

		await Effect.runPromise(handleImageLibraryEvent(payload, fakeClient, get));

		expect(removeImageLibraryEntry).toHaveBeenCalledWith(IMAGE_ID);
	});

	it("skips remove on DELETE when image_id missing from old", async () => {
		const removeImageLibraryEntry = vi.fn();

		/**
		 * Return a minimal `ImageLibrarySlice` used when old record lacks image_id.
		 *
		 * @returns A mocked slice with remove handler.
		 */
		function get(): ImageLibrarySlice {
			return forceCast({
				addImageLibraryEntry: vi.fn(),
				removeImageLibraryEntry,
			});
		}

		const payload = {
			eventType: "DELETE" as const,
			new: undefined,
			old: {},
		};

		await Effect.runPromise(handleImageLibraryEvent(payload, fakeClient, get));

		expect(removeImageLibraryEntry).not.toHaveBeenCalled();
	});
});
