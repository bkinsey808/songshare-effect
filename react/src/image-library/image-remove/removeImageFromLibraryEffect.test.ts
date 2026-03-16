import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { apiImageLibraryRemovePath } from "@/shared/paths";

import type { ImageLibrarySlice } from "../slice/ImageLibrarySlice.type";
import removeImageFromLibraryEffect from "./removeImageFromLibraryEffect";

const IMAGE_ID = "img-1";

describe("removeImageFromLibraryEffect", () => {
	it("removes entry and calls API when successful", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({})));

		const removeImageLibraryEntry = vi.fn();
		function get(): ImageLibrarySlice {
			return forceCast({
				setImageLibraryError: vi.fn(),
				removeImageLibraryEntry,
			});
		}

		await Effect.runPromise(removeImageFromLibraryEffect({ image_id: IMAGE_ID }, get));

		expect(removeImageLibraryEntry).toHaveBeenCalledWith(IMAGE_ID);
		expect(fetch).toHaveBeenCalledWith(apiImageLibraryRemovePath, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ image_id: IMAGE_ID }),
		});

		vi.unstubAllGlobals();
	});

	it("fails when API returns non-OK", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(Response.json({ error: "Not found" }, { status: 404 })),
		);

		const removeImageLibraryEntry = vi.fn();
		function get(): ImageLibrarySlice {
			return forceCast({
				setImageLibraryError: vi.fn(),
				removeImageLibraryEntry,
			});
		}

		await expect(
			Effect.runPromise(removeImageFromLibraryEffect({ image_id: IMAGE_ID }, get)),
		).rejects.toThrow(/Not found/);

		expect(removeImageLibraryEntry).not.toHaveBeenCalled();

		vi.unstubAllGlobals();
	});
});
