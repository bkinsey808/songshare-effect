import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";
import makeNull from "@/shared/test-utils/makeNull.test-util";

import createSupabaseStorageAdapter from "./createSupabaseStorageAdapter";

const EMPTY_BUFFER_SIZE = 0;
const IMAGES_BUCKET = "images";
const SAMPLE_BUFFER_SIZE = 4;
const SAMPLE_CONTENT_TYPE = "image/jpeg";
const SAMPLE_KEY_WITH_PREFIX = "images/user-1/photo.jpg";
const SAMPLE_PATH_WITHOUT_PREFIX = "user-1/photo.jpg";

describe("createSupabaseStorageAdapter", () => {
	it("upload calls storage.from(images).upload with transformed path and contentType", async () => {
		const uploadSpy = vi.fn().mockResolvedValue({ error: makeNull() });

		const fromSpy = vi.fn((_bucket: string) => ({
			upload: uploadSpy,
			remove: vi.fn(),
		}));

		const supabase = forceCast<SupabaseClient>({ storage: { from: fromSpy } });
		const adapter = createSupabaseStorageAdapter(supabase);

		const data = new ArrayBuffer(SAMPLE_BUFFER_SIZE);
		await adapter.upload(SAMPLE_KEY_WITH_PREFIX, data, {
			contentType: SAMPLE_CONTENT_TYPE,
		});

		expect(fromSpy).toHaveBeenCalledWith(IMAGES_BUCKET);
		expect(uploadSpy).toHaveBeenCalledWith(SAMPLE_PATH_WITHOUT_PREFIX, data, {
			contentType: SAMPLE_CONTENT_TYPE,
			upsert: false,
		});
	});

	it("upload strips images/ prefix from key before passing to Supabase", async () => {
		const uploadSpy = vi.fn().mockResolvedValue({ error: makeNull() });

		const fakeStorage = {
			from: (): { upload: typeof uploadSpy; remove: ReturnType<typeof vi.fn> } => ({
				upload: uploadSpy,
				remove: vi.fn(),
			}),
		};

		const supabase = forceCast<SupabaseClient>({ storage: fakeStorage });
		const adapter = createSupabaseStorageAdapter(supabase);
		const data = new ArrayBuffer(EMPTY_BUFFER_SIZE);

		await adapter.upload("images/a/b/c.png", data, { contentType: "image/png" });

		expect(uploadSpy).toHaveBeenCalledWith("a/b/c.png", data, expect.any(Object));
	});

	it("upload passes key unchanged when it does not start with images/", async () => {
		const uploadSpy = vi.fn().mockResolvedValue({ error: makeNull() });

		const fakeStorage = {
			from: (): { upload: typeof uploadSpy; remove: ReturnType<typeof vi.fn> } => ({
				upload: uploadSpy,
				remove: vi.fn(),
			}),
		};

		const supabase = forceCast<SupabaseClient>({ storage: fakeStorage });
		const adapter = createSupabaseStorageAdapter(supabase);
		const keyWithoutPrefix = "other/file.jpg";
		const data = new ArrayBuffer(EMPTY_BUFFER_SIZE);

		await adapter.upload(keyWithoutPrefix, data, { contentType: "image/jpeg" });

		expect(uploadSpy).toHaveBeenCalledWith(keyWithoutPrefix, data, expect.any(Object));
	});

	it("upload throws when Supabase returns error", async () => {
		const errorMessage = "Bucket not found";
		const uploadSpy = vi.fn().mockResolvedValue({ error: { message: errorMessage } });

		const fakeStorage = {
			from: (): { upload: typeof uploadSpy; remove: ReturnType<typeof vi.fn> } => ({
				upload: uploadSpy,
				remove: vi.fn(),
			}),
		};

		const supabase = forceCast<SupabaseClient>({ storage: fakeStorage });
		const adapter = createSupabaseStorageAdapter(supabase);
		const data = new ArrayBuffer(EMPTY_BUFFER_SIZE);

		await expect(
			adapter.upload("images/k.jpg", data, { contentType: "image/jpeg" }),
		).rejects.toThrow(errorMessage);
	});

	it("remove calls storage.from(images).remove with transformed path", async () => {
		const removeSpy = vi.fn().mockResolvedValue({ error: makeNull() });

		const fromSpy = vi.fn((_bucket: string) => ({
			upload: vi.fn(),
			remove: removeSpy,
		}));

		const supabase = forceCast<SupabaseClient>({ storage: { from: fromSpy } });
		const adapter = createSupabaseStorageAdapter(supabase);

		await adapter.remove(SAMPLE_KEY_WITH_PREFIX);

		expect(fromSpy).toHaveBeenCalledWith(IMAGES_BUCKET);
		expect(removeSpy).toHaveBeenCalledWith([SAMPLE_PATH_WITHOUT_PREFIX]);
	});

	it("remove throws when Supabase returns error", async () => {
		const errorMessage = "Object not found";
		const removeSpy = vi.fn().mockResolvedValue({ error: { message: errorMessage } });

		const fakeStorage = {
			from: (): { upload: ReturnType<typeof vi.fn>; remove: typeof removeSpy } => ({
				upload: vi.fn(),
				remove: removeSpy,
			}),
		};

		const supabase = forceCast<SupabaseClient>({ storage: fakeStorage });
		const adapter = createSupabaseStorageAdapter(supabase);

		await expect(adapter.remove("images/k.jpg")).rejects.toThrow(errorMessage);
	});
});
