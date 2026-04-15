import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { apiImageLibraryAddPath } from "@/shared/paths";

import type { AddImageToLibraryRequest, ImageLibraryEntry } from "../image-library-types";
import type { ImageLibrarySlice } from "../slice/ImageLibrarySlice.type";
import addImageToLibraryEffect from "./addImageToLibraryEffect";

const IMAGE_ID = "img-1";
const NOT_A_STRING = 123;
const validEntry: ImageLibraryEntry = {
	user_id: "u1",
	image_id: IMAGE_ID,
	created_at: "2026-01-01T00:00:00Z",
};

describe("addImageToLibraryEffect", () => {
	it("adds entry when API returns success", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(Response.json({ data: validEntry }, { status: 200 })),
		);

		const addImageLibraryEntry = vi.fn();
		const isInImageLibrary = vi.fn().mockReturnValue(false);
		/**
		 * Return a minimal `ImageLibrarySlice` used by this test.
		 *
		 * @returns A mocked slice with required setters and helpers.
		 */
		function get(): ImageLibrarySlice {
			return forceCast({
				setImageLibraryError: vi.fn(),
				isInImageLibrary,
				addImageLibraryEntry,
			});
		}

		await Effect.runPromise(addImageToLibraryEffect({ image_id: IMAGE_ID }, get));

		expect(addImageLibraryEntry).toHaveBeenCalledWith(validEntry);
		expect(fetch).toHaveBeenCalledWith(apiImageLibraryAddPath, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ image_id: IMAGE_ID }),
		});

		vi.unstubAllGlobals();
	});

	it("exits early when already in library", async () => {
		vi.stubGlobal("fetch", vi.fn());

		const addImageLibraryEntry = vi.fn();
		const isInImageLibrary = vi.fn().mockReturnValue(true);
		/**
		 * Return a minimal `ImageLibrarySlice` for the already-in-library case.
		 *
		 * @returns A mocked slice with `isInImageLibrary` set to true.
		 */
		function get(): ImageLibrarySlice {
			return forceCast({
				setImageLibraryError: vi.fn(),
				isInImageLibrary,
				addImageLibraryEntry,
			});
		}

		await Effect.runPromise(addImageToLibraryEffect({ image_id: IMAGE_ID }, get));

		expect(addImageLibraryEntry).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();

		vi.unstubAllGlobals();
	});

	it("fails when image_id is not a string", async () => {
		const setImageLibraryError = vi.fn();
		/**
		 * Return a minimal `ImageLibrarySlice` for invalid-request handling.
		 *
		 * @returns A mocked slice with error setter and no add behavior.
		 */
		function get(): ImageLibrarySlice {
			return forceCast({
				setImageLibraryError,
				isInImageLibrary: vi.fn(() => false),
				addImageLibraryEntry: vi.fn(),
			});
		}

		const invalidRequest = forceCast<Readonly<AddImageToLibraryRequest>>({
			image_id: NOT_A_STRING,
		});

		await expect(Effect.runPromise(addImageToLibraryEffect(invalidRequest, get))).rejects.toThrow(
			/Invalid request: image_id must be a string/,
		);
	});

	it("fails when API returns non-OK", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(Response.json({ error: "Forbidden" }, { status: 403 })),
		);

		/**
		 * Return a minimal `ImageLibrarySlice` for non-OK API response tests.
		 *
		 * @returns A mocked slice with error setter.
		 */
		function get(): ImageLibrarySlice {
			return forceCast({
				setImageLibraryError: vi.fn(),
				isInImageLibrary: vi.fn(() => false),
				addImageLibraryEntry: vi.fn(),
			});
		}

		await expect(
			Effect.runPromise(addImageToLibraryEffect({ image_id: IMAGE_ID }, get)),
		).rejects.toThrow(/Forbidden/);

		vi.unstubAllGlobals();
	});
});
